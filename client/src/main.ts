import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import {
  JoinResponse,
  PlayerRole,
  PlayerState,
  StructureState,
  ROLE_STATS,
  WORLD,
  normalizeWorldSeed,
  randomWorldSeed,
} from '../../shared/protocol';
import { makeHeightFn, heightToBiome, biomeColor, isWalkable } from '../../shared/noiseWorld';
import { createStylizedMaterial } from './stylizedMaterials';

const app = document.getElementById('app')!;
const menu = document.getElementById('menu')!;
const statsEl = document.getElementById('stats')!;
const hintEl = document.getElementById('hint')!;
const invitePanel = document.getElementById('invite')!;
const inviteSeedEl = document.getElementById('invite-seed')!;
const inviteLinkEl = document.getElementById('invite-link')!;
const copyInviteBtn = document.getElementById('copy-invite') as HTMLButtonElement;
const nameInput = document.getElementById('name') as HTMLInputElement;
const roleSelect = document.getElementById('role') as HTMLSelectElement;
const seedInput = document.getElementById('seed') as HTMLInputElement;
const rollSeedBtn = document.getElementById('roll-seed') as HTMLButtonElement;
const enterBtn = document.getElementById('enter') as HTMLButtonElement;

const socketUrl = import.meta.env.VITE_SOCKET_URL || `http://${location.hostname}:9402`;

function seedFromUrl(): string {
  const q = new URLSearchParams(location.search);
  return normalizeWorldSeed(q.get('seed') || q.get('invite') || '', '');
}

const urlSeed = seedFromUrl();
if (urlSeed) seedInput.value = urlSeed;
else seedInput.value = '';

rollSeedBtn.addEventListener('click', () => {
  seedInput.value = randomWorldSeed();
});

let socket: Socket | null = null;
let self: PlayerState | null = null;
let worldSeed = urlSeed || 'mrpg-realms-dev';
let heightAt = makeHeightFn(worldSeed);
let inviteCode = worldSeed;
let playerCount = 1;

function inviteUrlFor(code: string): string {
  const u = new URL(location.href);
  u.searchParams.set('seed', code);
  return u.toString();
}

function showInvite(code: string) {
  inviteCode = code;
  invitePanel.hidden = false;
  inviteSeedEl.textContent = code;
  inviteLinkEl.textContent = inviteUrlFor(code);
  // Keep URL shareable without reload spam
  const next = new URL(location.href);
  next.searchParams.set('seed', code);
  history.replaceState(null, '', next.toString());
}

copyInviteBtn.addEventListener('click', async () => {
  const link = inviteUrlFor(inviteCode);
  try {
    await navigator.clipboard.writeText(link);
    copyInviteBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyInviteBtn.textContent = 'Copy invite link';
    }, 1500);
  } catch {
    prompt('Copy invite link:', link);
  }
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b5e0);
scene.fog = new THREE.Fog(0x87b5e0, 40, 140);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xddeeff, 0x334422, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2cc, 1.05);
sun.position.set(30, 50, 10);
sun.castShadow = true;
scene.add(sun);

const worldRoot = new THREE.Group();
scene.add(worldRoot);

const playersGroup = new THREE.Group();
scene.add(playersGroup);
const structuresGroup = new THREE.Group();
scene.add(structuresGroup);

const remoteMeshes = new Map<string, THREE.Object3D>();
const structureMeshes = new Map<string, THREE.Object3D>();
const chunkMeshes = new Map<string, THREE.Mesh>();

const keys = new Set<string>();
let pointerLocked = false;
let yaw = 0;
let pitch = -0.25;
const velocity = new THREE.Vector3();
let verticalV = 0;
let grounded = false;

window.addEventListener('keydown', (e) => keys.add(e.code));
window.addEventListener('keyup', (e) => keys.delete(e.code));
renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
});
document.addEventListener('mousemove', (e) => {
  if (!pointerLocked) return;
  yaw -= e.movementX * 0.0022;
  pitch -= e.movementY * 0.0022;
  pitch = Math.max(-1.2, Math.min(0.35, pitch));
});

function makePlayerMesh(p: PlayerState): THREE.Object3D {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.7, 4, 8),
    createStylizedMaterial(p.color),
  );
  body.castShadow = true;
  body.position.y = 0.9;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 12),
    createStylizedMaterial(0xffe0bd),
  );
  head.position.y = 1.7;
  head.castShadow = true;
  g.add(head);
  g.userData.playerId = p.id;
  return g;
}

function makeStructureMesh(s: StructureState): THREE.Object3D {
  const color =
    s.kind === 'campfire' ? 0xff6a00 :
    s.kind === 'wall' ? 0x8b7355 :
    s.kind === 'hut' ? 0xb08968 :
    0x6c757d;
  const mesh = new THREE.Mesh(
    s.kind === 'wall' ? new THREE.BoxGeometry(2.2, 1.6, 0.35) :
    s.kind === 'tower' ? new THREE.CylinderGeometry(0.6, 0.8, 3.2, 8) :
    s.kind === 'hut' ? new THREE.ConeGeometry(1.4, 2.2, 5) :
    new THREE.CylinderGeometry(0.35, 0.55, 0.6, 8),
    createStylizedMaterial(color),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(s.position.x, s.position.y, s.position.z);
  return mesh;
}

function chunkKey(cx: number, cz: number) {
  return `${cx},${cz}`;
}

function buildChunk(cx: number, cz: number) {
  const key = chunkKey(cx, cz);
  if (chunkMeshes.has(key)) return;
  const size = WORLD.chunkSize;
  const tile = WORLD.tileSize;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let v = 0;
  const c = new THREE.Color();

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const wx = (cx * size + x) * tile;
      const wz = (cz * size + z) * tile;
      const h00 = heightAt(wx, wz);
      const h10 = heightAt(wx + tile, wz);
      const h01 = heightAt(wx, wz + tile);
      const h11 = heightAt(wx + tile, wz + tile);
      const biome = heightToBiome((h00 + h10 + h01 + h11) * 0.25);
      c.setHex(biomeColor(biome));

      positions.push(wx, h00, wz, wx + tile, h10, wz, wx, h01, wz + tile, wx + tile, h11, wz + tile);
      for (let i = 0; i < 4; i++) colors.push(c.r, c.g, c.b);
      indices.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
      v += 4;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = createStylizedMaterial(0xffffff, { vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.userData.chunk = key;
  worldRoot.add(mesh);
  chunkMeshes.set(key, mesh);
}

function ensureChunksAround(px: number, pz: number) {
  const tile = WORLD.tileSize;
  const size = WORLD.chunkSize;
  const cx = Math.floor(px / (size * tile));
  const cz = Math.floor(pz / (size * tile));
  const r = WORLD.loadRadius;
  const keep = new Set<string>();
  for (let z = -r; z <= r; z++) {
    for (let x = -r; x <= r; x++) {
      const k = chunkKey(cx + x, cz + z);
      keep.add(k);
      buildChunk(cx + x, cz + z);
    }
  }
  for (const [k, mesh] of chunkMeshes) {
    if (!keep.has(k)) {
      worldRoot.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      chunkMeshes.delete(k);
    }
  }
}

function syncRemote(p: PlayerState) {
  let m = remoteMeshes.get(p.id);
  if (!m) {
    m = makePlayerMesh(p);
    remoteMeshes.set(p.id, m);
    playersGroup.add(m);
  }
  m.position.set(p.position.x, p.position.y - 0.9, p.position.z);
  m.rotation.y = p.yaw;
}

function removeRemote(id: string) {
  const m = remoteMeshes.get(id);
  if (!m) return;
  playersGroup.remove(m);
  remoteMeshes.delete(id);
}

function groundHeight(x: number, z: number) {
  return heightAt(x, z);
}

function updateStats() {
  if (!self) return;
  statsEl.hidden = false;
  hintEl.hidden = false;
  statsEl.innerHTML = [
    `<strong>${self.name}</strong> · ${self.role}`,
    `HP ${self.hp}/${self.maxHp}`,
    `pos ${self.position.x.toFixed(1)}, ${self.position.z.toFixed(1)}`,
    `chunks ${chunkMeshes.size} · players ${playerCount} (peers ${remoteMeshes.size})`,
    `seed <code>${worldSeed}</code>`,
  ].join('<br/>');
}

function tryAttack() {
  if (!self || !socket || self.role === 'builder') return;
  let best: { id: string; d: number } | null = null;
  for (const [id, mesh] of remoteMeshes) {
    const d = mesh.position.distanceTo(new THREE.Vector3(self.position.x, self.position.y - 0.9, self.position.z));
    if (!best || d < best.d) best = { id, d };
  }
  if (best && best.d < 14) socket.emit('combat:hit', { targetId: best.id });
}

function placeStructure() {
  if (!self || !socket || self.role !== 'builder') return;
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const pos = {
    x: self.position.x + forward.x * 2.5,
    y: groundHeight(self.position.x + forward.x * 2.5, self.position.z + forward.z * 2.5) + 0.8,
    z: self.position.z + forward.z * 2.5,
  };
  socket.emit('structure:place', { kind: 'hut', position: pos });
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyB') placeStructure();
});
window.addEventListener('mousedown', (e) => {
  if (e.button === 0 && pointerLocked) tryAttack();
});

enterBtn.addEventListener('click', () => {
  const role = roleSelect.value as PlayerRole;
  const name = nameInput.value;
  const chosenSeed = seedInput.value.trim()
    ? normalizeWorldSeed(seedInput.value)
    : randomWorldSeed();
  seedInput.value = chosenSeed;

  // Rebuild terrain if seed changed from menu preview
  if (chosenSeed !== worldSeed) {
    for (const [, mesh] of chunkMeshes) worldRoot.remove(mesh);
    chunkMeshes.clear();
    worldSeed = chosenSeed;
    heightAt = makeHeightFn(worldSeed);
  }

  enterBtn.disabled = true;
  enterBtn.textContent = 'Connecting…';

  socket = io(socketUrl, { transports: ['websocket', 'polling'] });
  socket.on('connect_error', (err) => {
    enterBtn.disabled = false;
    enterBtn.textContent = 'Enter Realm';
    alert(`Cannot reach multiplayer server at ${socketUrl}\n${err.message}`);
  });
  socket.on('connect', () => {
    socket!.emit(
      'join',
      { name, role, worldSeed: chosenSeed },
      (res: JoinResponse | { error: string }) => {
        if (!res || 'error' in res) {
          enterBtn.disabled = false;
          enterBtn.textContent = 'Enter Realm';
          alert(('error' in (res || {}) && (res as { error: string }).error) || 'join failed');
          return;
        }
        const ok = res as JoinResponse;
        self = ok.self;
        worldSeed = ok.worldSeed;
        heightAt = makeHeightFn(worldSeed);
        playerCount = ok.playerCount ?? ok.players.length;
        menu.hidden = true;
        showInvite(ok.inviteCode || ok.worldSeed);
        for (const p of ok.players) {
          if (p.id !== self.id) syncRemote(p);
        }
        for (const s of ok.structures) {
          const m = makeStructureMesh(s);
          structureMeshes.set(s.id, m);
          structuresGroup.add(m);
        }
        ensureChunksAround(self.position.x, self.position.z);
        updateStats();
      },
    );
  });
  socket.on('player:join', (p: PlayerState) => {
    if (self && p.id !== self.id) {
      syncRemote(p);
      playerCount = 1 + remoteMeshes.size;
      updateStats();
    }
  });
  socket.on('player:leave', (id: string) => {
    removeRemote(id);
    playerCount = 1 + remoteMeshes.size;
    updateStats();
  });
  socket.on('player:update', (data: { id: string; position: PlayerState['position']; yaw: number }) => {
    const m = remoteMeshes.get(data.id);
    if (!m) return;
    m.position.set(data.position.x, data.position.y - 0.9, data.position.z);
    m.rotation.y = data.yaw;
  });
  socket.on('player:hp', (data: { id: string; hp: number }) => {
    if (self && data.id === self.id) {
      self.hp = data.hp;
      updateStats();
    }
  });
  socket.on('player:respawn', (data: { id: string; position: PlayerState['position']; hp: number }) => {
    if (self && data.id === self.id) {
      self.position = data.position;
      self.hp = data.hp;
    }
  });
  socket.on('structure:add', (s: StructureState) => {
    if (structureMeshes.has(s.id)) return;
    const m = makeStructureMesh(s);
    structureMeshes.set(s.id, m);
    structuresGroup.add(m);
  });
});

const clock = new THREE.Clock();
let netAcc = 0;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, clock.getDelta());
  if (self) {
    const stats = ROLE_STATS[self.role];
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    velocity.set(0, 0, 0);
    if (keys.has('KeyW')) velocity.add(forward);
    if (keys.has('KeyS')) velocity.sub(forward);
    if (keys.has('KeyD')) velocity.add(right);
    if (keys.has('KeyA')) velocity.sub(right);
    if (velocity.lengthSq() > 0) velocity.normalize().multiplyScalar(stats.speed * dt);

    self.position.x += velocity.x;
    self.position.z += velocity.z;

    const gh = groundHeight(self.position.x, self.position.z);
    const biome = heightToBiome(gh);
    if (!isWalkable(biome)) {
      self.position.x -= velocity.x;
      self.position.z -= velocity.z;
    }

    const targetY = groundHeight(self.position.x, self.position.z) + 1.0;
    if (keys.has('Space') && grounded) {
      verticalV = 7.5;
      grounded = false;
    }
    verticalV -= 18 * dt;
    self.position.y += verticalV * dt;
    if (self.position.y <= targetY) {
      self.position.y = targetY;
      verticalV = 0;
      grounded = true;
    }
    self.yaw = yaw;

    ensureChunksAround(self.position.x, self.position.z);

    const camDist = 7.5;
    const camHeight = 3.2;
    camera.position.set(
      self.position.x + Math.sin(yaw) * camDist,
      self.position.y + camHeight + Math.sin(pitch) * 2,
      self.position.z + Math.cos(yaw) * camDist,
    );
    camera.lookAt(self.position.x, self.position.y + 1.2, self.position.z);

    netAcc += dt;
    if (socket && netAcc > 0.05) {
      netAcc = 0;
      socket.emit('player:update', { position: self.position, yaw: self.yaw });
    }
    updateStats();
  } else {
    camera.position.set(18, 14, 18);
    camera.lookAt(0, 0, 0);
    ensureChunksAround(0, 0);
  }
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

tick();
