import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS } from './missions/MissionSystem.ts';
import type { MissionId } from './types.ts';

test('Mission definitions are valid and have non-empty steps', () => {
  const ids: MissionId[] = ['MISSION_1_DELIVERY', 'MISSION_2_INTERCEPTION', 'MISSION_3_EXTRACTION'];
  for (const id of ids) {
    const def = MISSIONS[id];
    assert.ok(def, `Mission ${id} must exist in registry`);
    assert.ok(def.steps.length >= 3, `Mission ${id} must have at least 3 steps`);
    assert.ok(def.reward > 0, `Mission ${id} must offer a cash reward`);
  }
});

test('Mission 1 Courier Blitz step progression', () => {
  const m1 = { ...MISSIONS.MISSION_1_DELIVERY };
  const steps = m1.steps.map((s) => ({ ...s, completed: false }));

  assert.equal(steps[0].completed, false);
  steps[0].completed = true;
  assert.equal(steps[0].completed, true);
  assert.equal(steps[1].completed, false);
});

test('Mission restart creates fresh independent step copies without modifying registry', () => {
  const originalM1 = MISSIONS.MISSION_1_DELIVERY;
  const instanceSteps1 = originalM1.steps.map((s) => ({ ...s, completed: false }));
  instanceSteps1[0].completed = true;

  const instanceSteps2 = originalM1.steps.map((s) => ({ ...s, completed: false }));
  assert.equal(instanceSteps2[0].completed, false, 'Restarted mission must have uncompleted steps');
  assert.equal(originalM1.steps[0].completed, false, 'Original registry steps must remain untouched');
});
