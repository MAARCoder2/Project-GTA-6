import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultSaveData,
  parseAndMigrateSave,
  CURRENT_SAVE_VERSION,
  DEFAULT_STATS,
} from './save.ts';

test('createDefaultSaveData produces valid schema', () => {
  const save = createDefaultSaveData();
  assert.equal(save.version, CURRENT_SAVE_VERSION);
  assert.equal(save.stats.health, 100);
  assert.equal(save.stats.cash, 1250);
  assert.ok(save.unlockedVehicles.includes('APEX_SPORT'));
});

test('parseAndMigrateSave safely handles null or corrupted data', () => {
  const fromNull = parseAndMigrateSave(null);
  assert.equal(fromNull.version, CURRENT_SAVE_VERSION);

  const fromJunk = parseAndMigrateSave('{ bad json');
  assert.equal(fromJunk.version, CURRENT_SAVE_VERSION);

  const fromEmpty = parseAndMigrateSave('{}');
  assert.equal(fromEmpty.version, CURRENT_SAVE_VERSION);
  assert.equal(fromEmpty.stats.health, DEFAULT_STATS.health);
});

test('parseAndMigrateSave preserves existing progress', () => {
  const validSaved = JSON.stringify({
    version: CURRENT_SAVE_VERSION,
    stats: {
      health: 85,
      maxHealth: 100,
      armor: 20,
      maxArmor: 100,
      stamina: 90,
      maxStamina: 100,
      cash: 5400,
      reputation: 300,
      missionsCompleted: ['MISSION_1_DELIVERY'],
    },
    settings: {
      quality: 'MEDIUM',
      soundEnabled: true,
      musicEnabled: true,
      masterVolume: 0.8,
      cameraSensitivity: 1.2,
      invertY: false,
      shadows: true,
      showFps: true,
    },
    unlockedVehicles: ['APEX_SPORT'],
    bestMissionTimes: { MISSION_1_DELIVERY: 54.2 },
    timestamp: 123456789,
  });

  const parsed = parseAndMigrateSave(validSaved);
  assert.equal(parsed.stats.cash, 5400);
  assert.equal(parsed.stats.missionsCompleted[0], 'MISSION_1_DELIVERY');
  assert.equal(parsed.settings.quality, 'MEDIUM');
});
