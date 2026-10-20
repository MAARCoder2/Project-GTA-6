import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCrimeEscalation,
  isSoundAudible,
  isTargetInSightCone,
  updateWantedState,
  applyDamageWithArmor,
  computeBulletDamage,
  WEAPON_REGISTRY,
} from './rules.ts';

test('Crime escalation star levels', () => {
  assert.equal(getCrimeEscalation('RECKLESS_DRIVING'), 1);
  assert.equal(getCrimeEscalation('VEHICLE_THEFT'), 2);
  assert.equal(getCrimeEscalation('ASSAULT'), 2);
  assert.equal(getCrimeEscalation('FIREARM_DISCHARGE'), 3);
  assert.equal(getCrimeEscalation('OFFICER_ATTACK'), 4);
});

test('Acoustic sound perception radius', () => {
  const origin = { x: 0, y: 0, z: 0 };
  const nearListener = { x: 20, y: 0, z: 0 };
  const farListener = { x: 70, y: 0, z: 0 };

  assert.equal(isSoundAudible(origin, nearListener, 'GUNSHOT'), true);
  assert.equal(isSoundAudible(origin, farListener, 'GUNSHOT'), false);
});

test('Visual field of view sight cone test', () => {
  const watcherPos = { x: 0, y: 0, z: 0 };
  const watcherYaw = 0; // Facing positive Z

  // Target right in front
  const frontTarget = { x: 0, y: 0, z: 20 };
  assert.equal(isTargetInSightCone(watcherPos, watcherYaw, frontTarget), true);

  // Target behind watcher
  const behindTarget = { x: 0, y: 0, z: -15 };
  assert.equal(isTargetInSightCone(watcherPos, watcherYaw, behindTarget), false);

  // Target too far away (> 38m)
  const distantTarget = { x: 0, y: 0, z: 50 };
  assert.equal(isTargetInSightCone(watcherPos, watcherYaw, distantTarget), false);
});

test('Wanted state evasion countdown and stars decay', () => {
  const initial = {
    level: 2,
    lastCrimeTime: 1000,
    isInSight: true,
    sightTimer: 0,
    evasionCountdown: 12.0,
    lastKnownPosition: { x: 10, y: 0, z: 10 },
    activePursuitCount: 1,
  };

  // Frame where player is out of sight: countdown ticks down
  const frame1 = updateWantedState(initial, false, { x: 20, y: 0, z: 20 }, 2.0, 12.0);
  assert.equal(frame1.isInSight, false);
  assert.equal(frame1.evasionCountdown, 10.0);
  assert.equal(frame1.level, 2);

  // Countdown reaches 0: star level drops by 1
  const frameFinished = updateWantedState(
    { ...frame1, evasionCountdown: 0.1 },
    false,
    { x: 30, y: 0, z: 30 },
    0.2,
    12.0
  );
  assert.equal(frameFinished.level, 1);
});

test('Armor damage absorption calculations', () => {
  // Target with 50 health and 50 armor takes 40 damage
  const res = applyDamageWithArmor(50, 50, 40);
  // 70% absorbed by armor = 28 armor loss (50 - 28 = 22)
  // 30% to health = 12 health loss (50 - 12 = 38)
  assert.equal(res.newArmor, 22);
  assert.equal(res.newHealth, 38);
});

test('Weapon damage calculation and headshot multiplier', () => {
  const pistol = WEAPON_REGISTRY.PISTOL;
  const bodyDamageClose = computeBulletDamage(pistol, 10, false);
  assert.equal(bodyDamageClose, pistol.damage);

  const headDamageClose = computeBulletDamage(pistol, 10, true);
  assert.equal(headDamageClose, pistol.damage * 2);

  const outOfRange = computeBulletDamage(pistol, 60, false);
  assert.equal(outOfRange, 0);
});
