import test from 'node:test';
import assert from 'node:assert/strict';
import { getHelpText, parseSlashCommand } from '../../../shared/commands';

test('parses slash commands separately from room chat', () => {
  assert.deepEqual(parseSlashCommand('/help controls'), { name: 'help', args: ['controls'] });
  assert.deepEqual(parseSlashCommand('hello realm'), null);
});

test('help exposes controls and command topics', () => {
  assert.match(getHelpText('controls'), /WASD/);
  assert.match(getHelpText('commands'), /\/help/);
});
