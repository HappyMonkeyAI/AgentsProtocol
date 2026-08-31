import * as THREE from 'three';
import { createStylizedMaterial } from '../stylizedMaterials';
import type { PlayerRole } from '../../../shared/protocol';

export type AssetVisual = {
  assetId: string;
  group: THREE.Group;
};

function material(color: THREE.ColorRepresentation) {
  return createStylizedMaterial(color);
}

export function createChestModel(): AssetVisual {
  const group = new THREE.Group();
  group.name = 'asset-chest-blockout';

  const wood = material(0x8b5a35);
  const darkWood = material(0x5a351f);
  const metal = material(0xc39b3f);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.15), wood);
  base.position.y = 0.4;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.38, 1.17), wood);
  lid.position.y = 0.99;
  lid.castShadow = true;
  group.add(lid);

  const band = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 1.2), darkWood);
  band.position.set(0, 0.55, 0);
  band.castShadow = true;
  group.add(band);

  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.08), metal);
  latch.position.set(0, 0.72, 0.61);
  latch.castShadow = true;
  group.add(latch);

  return { assetId: 'chest-authored-blockout-v1', group };
}

export function createSwordModel(): AssetVisual {
  const group = new THREE.Group();
  group.name = 'asset-sword-blockout';
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 0.32), material(0xd9e1e8));
  blade.position.y = 0.9;
  blade.castShadow = true;
  group.add(blade);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.18), material(0xc39b3f));
  guard.position.y = 0.25;
  guard.castShadow = true;
  group.add(guard);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 0.16), material(0x5a351f));
  grip.position.y = -0.05;
  grip.castShadow = true;
  group.add(grip);
  group.rotation.z = -0.18;
  return { assetId: 'sword-authored-blockout-v1', group };
}

export function createPlayerModel(role: PlayerRole, color: number): AssetVisual {
  const group = new THREE.Group();
  group.name = `asset-player-${role}-blockout`;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.9, 0.42), material(color));
  body.position.y = 0.95;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), material(0xffd4b3));
  head.position.y = 1.68;
  head.castShadow = true;
  group.add(head);

  const legs = material(0x28344f);
  for (const x of [-0.17, 0.17]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.3), legs);
    leg.position.set(x, 0.25, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  if (role === 'warrior') {
    const sword = createSwordModel().group;
    sword.scale.setScalar(0.62);
    sword.position.set(0.52, 0.85, 0.05);
    sword.rotation.z += -0.45;
    group.add(sword);
  } else if (role === 'ranger') {
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 6, 12, Math.PI), material(0x8b5a35));
    bow.position.set(-0.44, 1.05, 0);
    bow.rotation.y = Math.PI / 2;
    group.add(bow);
  } else if (role === 'mage') {
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.5, 4), material(0x4f3d9c));
    hood.position.y = 2.08;
    hood.castShadow = true;
    group.add(hood);
  } else if (role === 'healer') {
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 6), material(0x8b5a35));
    staff.position.set(-0.5, 0.7, 0);
    staff.castShadow = true;
    group.add(staff);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.08), material(0x8de2d4));
    cross.position.set(-0.5, 1.35, 0);
    group.add(cross);
  } else {
    const tool = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), material(0x8b5a35));
    tool.position.set(0.48, 0.75, 0);
    tool.rotation.z = -0.4;
    tool.castShadow = true;
    group.add(tool);
  }

  return { assetId: `player-${role}-authored-blockout-v1`, group };
}
