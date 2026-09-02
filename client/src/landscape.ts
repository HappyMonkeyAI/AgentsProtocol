import * as THREE from 'three';
import { createStylizedMaterial } from './stylizedMaterials';

function hash(x: number, z: number, salt: number) {
  const value = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function addWindData(group: THREE.Group, phase = 0, amplitude = 0.04) {
  group.userData.windPhase = phase;
  group.userData.windAmplitude = amplitude;
  group.userData.windBaseRotationX = 0;
  group.userData.windBaseRotationZ = 0;
}

export function createTree(scale: number) {
  const group = new THREE.Group();
  group.name = 'landscape-tree';
  addWindData(group, 0, 0.025 + scale * 0.012);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 1.7 * scale, 6),
    createStylizedMaterial(0x765035),
  );
  trunk.position.y = 0.85 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  const foliage = [createStylizedMaterial(0x4f9b4b), createStylizedMaterial(0x347a42), createStylizedMaterial(0x286337)];
  for (const [index, [y, radius, height]] of [[0, [1.75, 1.1, 1.7]], [1, [2.55, 0.82, 1.35]], [2, [3.15, 0.48, 0.95]]] as const) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(radius * scale, height * scale, 7), foliage[index]);
    crown.position.y = y * scale;
    crown.castShadow = true;
    crown.receiveShadow = true;
    group.add(crown);
  }
  return group;
}

export function createGrass(scale: number) {
  const group = new THREE.Group();
  group.name = 'landscape-grass';
  addWindData(group, 0, 0.07 + scale * 0.025);
  const blade = createStylizedMaterial(0x78b957);
  blade.side = THREE.DoubleSide;
  for (const angle of [0, Math.PI / 2]) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.45 * scale, 0.75 * scale), blade);
    mesh.position.y = 0.37 * scale;
    mesh.rotation.y = angle;
    mesh.rotation.x = -0.12;
    mesh.castShadow = true;
    group.add(mesh);
  }
  return group;
}

export function tickLandscapeChunk(group: THREE.Group, elapsedSeconds: number) {
  group.children.forEach((plant, index) => {
    const data = plant.userData as { windPhase?: number; windAmplitude?: number; windBaseRotationX?: number; windBaseRotationZ?: number };
    if (typeof data.windAmplitude !== 'number') return;
    const phase = (data.windPhase || 0) + elapsedSeconds * 1.4 + index * 0.17;
    const gust = Math.sin(phase) * 0.65 + Math.sin(phase * 0.43 + 1.7) * 0.35;
    plant.rotation.x = (data.windBaseRotationX || 0) + gust * data.windAmplitude;
    plant.rotation.z = (data.windBaseRotationZ || 0) + Math.cos(phase * 0.9) * data.windAmplitude * 0.7;
  });
}

export function buildLandscapeChunk(
  cx: number,
  cz: number,
  chunkSize: number,
  tileSize: number,
  groundHeight: (x: number, z: number) => number,
  isWalkable: (height: number) => boolean,
) {
  const group = new THREE.Group();
  group.name = `landscape-chunk-${cx},${cz}`;
  const originX = cx * chunkSize * tileSize;
  const originZ = cz * chunkSize * tileSize;
  const span = chunkSize * tileSize;

  for (let i = 0; i < 5; i += 1) {
    const x = originX + (0.12 + hash(cx * 11 + i, cz * 7, 1) * 0.76) * span;
    const z = originZ + (0.12 + hash(cx * 5 + i, cz * 13, 2) * 0.76) * span;
    const h = groundHeight(x, z);
    if (!isWalkable(h)) continue;
    const tree = createTree(0.82 + hash(cx + i, cz - i, 3) * 0.42);
    tree.position.set(x, h, z);
    tree.rotation.y = hash(cx + i, cz + i, 4) * Math.PI * 2;
    tree.userData.windPhase = hash(cx * 19 + i, cz * 23 + i, 9) * Math.PI * 2;
    group.add(tree);
  }

  for (let i = 0; i < 26; i += 1) {
    const x = originX + hash(cx * 17 + i, cz * 3, 5) * span;
    const z = originZ + hash(cx * 2 + i, cz * 19, 6) * span;
    const h = groundHeight(x, z);
    if (!isWalkable(h)) continue;
    const grass = createGrass(0.65 + hash(cx - i, cz + i, 7) * 0.55);
    grass.position.set(x, h, z);
    grass.rotation.y = hash(cx + i, cz - i, 8) * Math.PI * 2;
    grass.userData.windPhase = hash(cx * 29 + i, cz * 31 + i, 10) * Math.PI * 2;
    group.add(grass);
  }

  return group;
}
