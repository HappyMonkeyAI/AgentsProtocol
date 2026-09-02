import * as THREE from 'three';

export interface SlashEffect {
  kind: 'slash';
  group: THREE.Group;
  age: number;
  duration: number;
}

export interface ImpactEffect {
  kind: 'impact';
  group: THREE.Group;
  age: number;
  duration: number;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
    else if (material) material.dispose();
  });
}

function fadeEffect(group: THREE.Group, opacity: number) {
  group.traverse((child) => {
    const material = (child as THREE.Mesh).material;
    if (Array.isArray(material)) material.forEach((entry) => { entry.opacity = opacity; });
    else if (material) material.opacity = opacity;
  });
}

export function createSlashEffect(
  attacker: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
): SlashEffect {
  const group = new THREE.Group();
  group.name = 'combat-slash-effect';

  const dx = target.x - attacker.x;
  const dz = target.z - attacker.z;
  const distance = Math.max(0.001, Math.hypot(dx, dz));
  const reach = Math.min(distance * 0.55, 1.25);
  group.position.set(attacker.x + (dx / distance) * reach, attacker.y + 0.8, attacker.z + (dz / distance) * reach);
  group.rotation.y = Math.atan2(dx, dz);
  group.scale.setScalar(0.25);

  const material = new THREE.MeshBasicMaterial({
    color: 0xfff1b0,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.075, 6, 24, Math.PI * 0.95), material);
  arc.rotation.z = -0.35;
  group.add(arc);

  const edgeMaterial = material.clone();
  edgeMaterial.color.setHex(0xff7a3d);
  edgeMaterial.opacity = 0.65;
  const edge = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.035, 5, 20, Math.PI * 0.8), edgeMaterial);
  edge.rotation.z = -0.2;
  group.add(edge);

  return { kind: 'slash', group, age: 0, duration: 0.42 };
}

export function createImpactEffect(target: { x: number; y: number; z: number }): ImpactEffect {
  const group = new THREE.Group();
  group.name = 'combat-impact-effect';
  group.position.set(target.x, target.y + 0.6, target.z);
  group.scale.setScalar(0.2);

  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x8fd8ff,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), coreMaterial));

  const ringMaterial = coreMaterial.clone();
  ringMaterial.color.setHex(0x6b5cff);
  ringMaterial.opacity = 0.7;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.055, 6, 20), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  return { kind: 'impact', group, age: 0, duration: 0.5 };
}

function tickEffect(effect: SlashEffect | ImpactEffect, dt: number): boolean {
  effect.age += dt;
  const progress = Math.min(1, effect.age / effect.duration);
  if (effect.kind === 'slash') {
    const eased = 1 - (1 - progress) ** 2;
    effect.group.scale.setScalar(0.25 + eased * 1.0);
    effect.group.rotation.z = -0.18 + eased * 0.7;
  } else {
    effect.group.scale.setScalar(0.2 + progress * 1.1);
    effect.group.rotation.y += dt * 4;
    effect.group.rotation.z += dt * 2;
  }
  fadeEffect(effect.group, 0.95 * (1 - progress));
  if (progress < 1) return false;
  effect.group.removeFromParent();
  disposeObject(effect.group);
  return true;
}

export function tickSlashEffect(effect: SlashEffect | ImpactEffect, dt: number): boolean {
  return tickEffect(effect, dt);
}
