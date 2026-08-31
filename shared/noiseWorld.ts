import alea from 'alea';
import { createNoise2D } from 'simplex-noise';
import type { Biome } from './protocol';

export function makeHeightFn(seed: string) {
  const n1 = createNoise2D(alea(seed + '-h1'));
  const n2 = createNoise2D(alea(seed + '-h2'));
  return (wx: number, wz: number): number => {
    const a = n1(wx * 0.012, wz * 0.012);
    const b = n2(wx * 0.04, wz * 0.04) * 0.35;
    return a * 8 + b * 4;
  };
}

export function heightToBiome(h: number): Biome {
  if (h < -3.5) return 'deep_water';
  if (h < -1.2) return 'water';
  if (h < 0.2) return 'sand';
  if (h < 3.5) return 'grass';
  if (h < 6.5) return 'forest';
  if (h < 9.5) return 'rock';
  return 'snow';
}

export function biomeColor(b: Biome): number {
  switch (b) {
    case 'deep_water': return 0x0b3d5c;
    case 'water': return 0x1f6f9f;
    case 'sand': return 0xc2b280;
    case 'grass': return 0x3f7d3a;
    case 'forest': return 0x2f5d2c;
    case 'rock': return 0x6e6e6e;
    case 'snow': return 0xe8eef5;
  }
}

export function isWalkable(b: Biome): boolean {
  return b !== 'deep_water' && b !== 'water';
}
