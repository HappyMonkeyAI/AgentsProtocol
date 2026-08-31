import test from 'node:test';
import assert from 'node:assert/strict';
import { makeHeightFn, heightToBiome } from '../../../shared/noiseWorld';
import { normalizeWorldSeed, randomWorldSeed } from '../../../shared/protocol';

test('seeded height is deterministic', () => {
  const a = makeHeightFn('seed-a');
  const b = makeHeightFn('seed-a');
  assert.equal(a(12.5, -3.25), b(12.5, -3.25));
});

test('height maps to biome bands', () => {
  assert.equal(heightToBiome(-5), 'deep_water');
  assert.equal(heightToBiome(1), 'grass');
  assert.equal(heightToBiome(12), 'snow');
});

test('normalizeWorldSeed collapses invite variants', () => {
  assert.equal(normalizeWorldSeed('Forest-01'), 'forest-01');
  assert.equal(normalizeWorldSeed('  Forest 01  '), 'forest-01');
  assert.equal(normalizeWorldSeed('Forest_01'), 'forest_01');
  assert.equal(normalizeWorldSeed(''), 'mrpg-realms-dev');
});

test('randomWorldSeed has realm- prefix', () => {
  const s = randomWorldSeed();
  assert.match(s, /^realm-[a-z0-9]{8}$/);
});
