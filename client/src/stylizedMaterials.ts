import * as THREE from 'three';

const TOON_BAND_COUNT = 4;

/**
 * A nearest-filtered ramp makes Three.js toon lighting resolve into four
 * deliberate value bands instead of a continuous Lambert response.
 */
export function createStylizedGradientMap(): THREE.DataTexture {
  const data = new Uint8Array(TOON_BAND_COUNT * 4);
  const values = [72, 124, 184, 255];
  values.forEach((value, index) => {
    const offset = index * 4;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
    data[offset + 3] = 255;
  });

  const texture = new THREE.DataTexture(data, TOON_BAND_COUNT, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export const stylizedGradientMap = createStylizedGradientMap();

type StylizedMaterialOptions = {
  vertexColors?: boolean;
};

export function createStylizedMaterial(
  color: THREE.ColorRepresentation = 0xffffff,
  options: StylizedMaterialOptions = {},
): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: stylizedGradientMap,
    vertexColors: options.vertexColors ?? false,
  });
}
