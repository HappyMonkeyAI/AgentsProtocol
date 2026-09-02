import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSocketUrl } from '../../../shared/socket';

test('uses configured Socket.IO URL when present', () => {
  assert.equal(resolveSocketUrl('https://game.example', 'https://other.example', 'https:', 'other.example'), 'https://game.example');
});

test('uses same-origin secure transport in HTTPS production', () => {
  assert.equal(resolveSocketUrl(undefined, 'https://game.example', 'https:', 'game.example'), 'https://game.example');
});

test('uses the local server port for HTTP development', () => {
  assert.equal(resolveSocketUrl(undefined, 'http://localhost:9401', 'http:', 'localhost'), 'http://localhost:9402');
});
