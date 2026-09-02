import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMAND_REGISTRY, getHelpText } from '../../../shared/commands';

test('command registry describes execution and help metadata', () => {
  assert.equal(COMMAND_REGISTRY.help.id, 'help');
  assert.equal(COMMAND_REGISTRY.help.execution, 'client');
  assert.equal(COMMAND_REGISTRY.creative.execution, 'client');
  assert.equal(COMMAND_REGISTRY.survival.usage, '/survival');
  assert.match(getHelpText('commands'), /\/ai place/);
});
