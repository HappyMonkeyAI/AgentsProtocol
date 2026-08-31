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
import { createChestModel, createPlayerModel } from './assets/factories';
import { buildLandscapeChunk, createGrass, createTree } from './landscape';

const app = document.getElementById('app')!;
const menu = document.getElementById('menu')!;
const statsEl = document.getElementById('stats')!;
const hintEl = document.getElementById('hint')!;
const crosshairEl = document.getElementById('crosshair')!;
const hotbarEl = document.getElementById('hotbar')!;
const consoleEl = document.getElementById('console')!;
const consoleInput = document.getElementById('console-input') as HTMLInputElement;
const consoleOutput = document.getElementById('console-output')!;
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
let starterChest: THREE.Group | null = null;
let starterLandscape: THREE.Group | null = null;

const remoteMeshes = new Map<string, THREE.Object3D>();
const structureMeshes = new Map<string, THREE.Object3D>();
const chunkMeshes = new Map<string, THREE.InstancedMesh>();
const landscapeChunks = new Map<string, THREE.Group>();
const blockEdits = new Map<string, 'removed' | 'grass' | 'dirt' | 'stone'>();
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);
let selectedBlock: 'grass' | 'dirt' | 'stone' = 'grass';
let creativeMode = false;
let consoleOpen = false;

const keys = new Set<string>();
let pointerLocked = false;
let yaw = 0;
let pitch = -0.25;
const velocity = new THREE.Vector3();
let verticalV = 0;
let grounded = false;

const BLOCK_SIZE = WORLD.tileSize;
const MIN_BLOCK_Y = -3;

function blockKey(x: number, y: number, z: number) {
  return `${x},${y},${z}`;
}

function blockColor(kind: 'grass' | 'dirt' | 'stone', topBiome: ReturnType<typeof heightToBiome>): number {
  if (kind === 'grass') return biomeColor(topBiome);
  if (kind === 'stone') return 0x777777;
  return 0x8d6e53;
}

function setConsole(open: boolean) {
  consoleOpen = open;
  consoleEl.hidden = !open;
  if (open) {
    document.exitPointerLock();
    consoleInput.value = '';
    consoleInput.focus();
  } else if (self) {
    renderer.domElement.focus();
  }
}

function runConsoleCommand(raw: string) {
  const command = raw.trim().toLowerCase();
  if (command === '/creative') {
    creativeMode = true;
    consoleOutput.textContent = 'creative mode enabled · fly with WASD + Space/Ctrl';
  } else if (command === '/survival') {
    creativeMode = false;
    consoleOutput.textContent = 'survival mode enabled';
  } else if (command) {
    consoleOutput.textContent = `unknown command: ${command}`;
  }
  updateStats();
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Backquote') {
    e.preventDefault();
    setConsole(!consoleOpen);
    return;
  }
  if (!consoleOpen) keys.add(e.code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
consoleInput.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') {
    runConsoleCommand(consoleInput.value);
    consoleInput.value = '';
  } else if (e.key === 'Escape') {
    setConsole(false);
  }
});
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
  pitch = Math.max(-1.45, Math.min(1.45, pitch));
});

function makePlayerMesh(p: PlayerState): THREE.Object3D {
  const g = createPlayerModel(p.role, p.color).group;
  g.userData.playerId = p.id;
  return g;
}

function showStarterChest(p: PlayerState) {
  if (starterChest) worldRoot.remove(starterChest);
  if (starterLandscape) worldRoot.remove(starterLandscape);
  starterChest = createChestModel().group;
  starterChest.position.set(p.position.x + 2, groundHeight(p.position.x + 2, p.position.z), p.position.z);
  worldRoot.add(starterChest);
  starterLandscape = new THREE.Group();
  starterLandscape.name = 'landscape-starter-showcase';
  const treeX = p.position.x + 1.2;
  const treeZ = p.position.z;
  const tree = createTree(0.9);
  tree.position.set(treeX, groundHeight(treeX, treeZ), treeZ);
  starterLandscape.add(tree);
  for (const offset of [-1.2, 0, 1.2]) {
    const grass = createGrass(0.9);
    const grassX = p.position.x + 1.2 + offset;
    const grassZ = p.position.z;
    grass.position.set(grassX, groundHeight(grassX, grassZ), grassZ);
    starterLandscape.add(grass);
  }
  worldRoot.add(starterLandscape);
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
  const blocks: Array<{ x: number; y: number; z: number; kind: 'grass' | 'dirt' | 'stone' }> = [];

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const bx = cx * size + x;
      const bz = cz * size + z;
      const wx = bx * tile;
      const wz = bz * tile;
      const topY = Math.floor(heightAt(wx, wz) / tile);
      const biome = heightToBiome((topY + 0.5) * tile);
      for (let by = MIN_BLOCK_Y; by <= topY; by++) {
        const override = blockEdits.get(blockKey(bx, by, bz));
        if (override === 'removed') continue;
        const kind = override || (by === topY ? 'grass' : by < topY - 2 ? 'stone' : 'dirt');
        blocks.push({ x: bx, y: by, z: bz, kind });
      }
    }
  }

  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(tile, tile, tile),
    createStylizedMaterial(0xffffff),
    size * size * (Math.ceil(20 / tile) + 1),
  );
  const transform = new THREE.Object3D();
  const color = new THREE.Color();
  blocks.forEach((block, index) => {
    transform.position.set((block.x + 0.5) * tile, (block.y + 0.5) * tile, (block.z + 0.5) * tile);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
    const topBiome = heightToBiome(heightAt(block.x * tile, block.z * tile));
    color.setHex(blockColor(block.kind, topBiome));
    mesh.setColorAt(index, color);
  });
  mesh.count = blocks.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.receiveShadow = true;
  mesh.userData.chunk = key;
  mesh.userData.blocks = blocks;
  worldRoot.add(mesh);
  chunkMeshes.set(key, mesh);
  const landscape = buildLandscapeChunk(cx, cz, size, tile, groundHeight, (height) => isWalkable(heightToBiome(height)));
  worldRoot.add(landscape);
  landscapeChunks.set(key, landscape);
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
      const landscape = landscapeChunks.get(k);
      if (landscape) {
        worldRoot.remove(landscape);
        landscapeChunks.delete(k);
      }
    }
  }
}

function rebuildChunk(cx: number, cz: number) {
  const key = chunkKey(cx, cz);
  const mesh = chunkMeshes.get(key);
  if (!mesh) {
    buildChunk(cx, cz);
    return;
  }
  worldRoot.remove(mesh);
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
  chunkMeshes.delete(key);
  const landscape = landscapeChunks.get(key);
  if (landscape) {
    worldRoot.remove(landscape);
    landscapeChunks.delete(key);
  }
  buildChunk(cx, cz);
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
  const bx = Math.floor(x / BLOCK_SIZE);
  const bz = Math.floor(z / BLOCK_SIZE);
  const baseTop = Math.floor(heightAt(bx * BLOCK_SIZE, bz * BLOCK_SIZE) / BLOCK_SIZE);
  let highest = MIN_BLOCK_Y - 1;
  for (let by = MIN_BLOCK_Y; by <= baseTop; by += 1) {
    if (blockEdits.get(blockKey(bx, by, bz)) !== 'removed') highest = by;
  }
  for (const [key, override] of blockEdits) {
    if (override === 'removed') continue;
    const [ex, ey, ez] = key.split(',').map(Number);
    if (ex === bx && ez === bz) highest = Math.max(highest, ey);
  }
  return (highest + 1) * BLOCK_SIZE;
}

function targetBlock() {
  raycaster.setFromCamera(screenCenter, camera);
  const hit = raycaster.intersectObjects([...chunkMeshes.values()], false)[0];
  if (!hit || hit.instanceId === undefined) return null;
  const blocks = hit.object.userData.blocks as Array<{ x: number; y: number; z: number }> | undefined;
  const block = blocks?.[hit.instanceId];
  if (!block) return null;
  return { block, normal: hit.face?.normal.clone() || new THREE.Vector3(0, 1, 0) };
}

function rebuildBlockChunk(x: number, z: number) {
  rebuildChunk(Math.floor(x / WORLD.chunkSize), Math.floor(z / WORLD.chunkSize));
}

function mineBlock() {
  if (!self) return;
  const target = targetBlock();
  if (!target) return;
  const { x, y, z } = target.block;
  blockEdits.set(blockKey(x, y, z), 'removed');
  rebuildBlockChunk(x, z);
}

function placeBlock() {
  if (!self) return;
  const target = targetBlock();
  if (!target) return;
  const x = target.block.x + Math.round(target.normal.x);
  const y = target.block.y + Math.round(target.normal.y);
  const z = target.block.z + Math.round(target.normal.z);
  const key = blockKey(x, y, z);
  if (blockEdits.get(key) !== 'removed' && blockEdits.has(key)) return;
  if (new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5).distanceTo(self.position) < 1.8) return;
  blockEdits.set(key, selectedBlock);
  rebuildBlockChunk(x, z);
}

function selectBlock(index: number) {
  selectedBlock = index === 1 ? 'dirt' : index === 2 ? 'stone' : 'grass';
  hotbarEl.textContent = `Selected: ${selectedBlock} · [1] grass [2] dirt [3] stone`;
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
    `mode ${creativeMode ? 'creative · fly' : 'survival'}`,
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
  if (e.code === 'Digit1') selectBlock(0);
  if (e.code === 'Digit2') selectBlock(1);
  if (e.code === 'Digit3') selectBlock(2);
  if (e.code === 'KeyF') tryAttack();
  if (e.code === 'KeyB') placeStructure();
});
window.addEventListener('mousedown', (e) => {
  if (!pointerLocked) return;
  if (e.button === 0) mineBlock();
  if (e.button === 2) placeBlock();
});
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

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
        crosshairEl.hidden = false;
        hotbarEl.hidden = false;
        selectBlock(0);
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
        showStarterChest(self);
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
    const sprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const moveSpeed = creativeMode ? (sprinting ? 24 : 14) : stats.speed * (sprinting ? 1.65 : 1);
    if (velocity.lengthSq() > 0) velocity.normalize().multiplyScalar(moveSpeed * dt);

    if (creativeMode) {
      velocity.y = (keys.has('Space') ? 1 : 0) - (keys.has('ControlLeft') || keys.has('ControlRight') ? 1 : 0);
      if (velocity.y !== 0) velocity.y *= moveSpeed * dt;
      self.position.x += velocity.x;
      self.position.y += velocity.y;
      self.position.z += velocity.z;
      verticalV = 0;
      grounded = false;
    } else {
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
    }
    self.yaw = yaw;

    ensureChunksAround(self.position.x, self.position.z);

    if (pointerLocked) {
      camera.position.set(self.position.x, self.position.y + 0.55, self.position.z);
      camera.rotation.order = 'YXZ';
      camera.rotation.set(pitch, yaw, 0);
    } else {
      const camDist = 7.5;
      const camHeight = 3.2;
      camera.position.set(
        self.position.x + Math.sin(yaw) * camDist,
        self.position.y + camHeight + Math.sin(pitch) * 2,
        self.position.z + Math.cos(yaw) * camDist,
      );
      camera.lookAt(self.position.x, self.position.y + 1.2, self.position.z);
    }

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
