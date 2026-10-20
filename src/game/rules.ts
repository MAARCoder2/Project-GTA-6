import type { CrimeType, WeaponDef, WeaponType, WantedState } from './types.ts';
import { V3, type Vec3 } from './physics.ts';

export const WEAPON_REGISTRY: Record<WeaponType, WeaponDef> = {
  PISTOL: {
    id: 'PISTOL',
    name: 'Tactical 9mm',
    damage: 34,
    fireRate: 4.0,
    magazineSize: 15,
    reloadTime: 1.4,
    range: 45,
    spread: 0.015,
    pellets: 1,
    automatic: false,
  },
  SMG: {
    id: 'SMG',
    name: 'Apex Vector SMG',
    damage: 22,
    fireRate: 11.0,
    magazineSize: 30,
    reloadTime: 1.8,
    range: 35,
    spread: 0.045,
    pellets: 1,
    automatic: true,
  },
  SHOTGUN: {
    id: 'SHOTGUN',
    name: 'Breacher 12G',
    damage: 18,
    fireRate: 1.2,
    magazineSize: 6,
    reloadTime: 2.4,
    range: 22,
    spread: 0.09,
    pellets: 6,
    automatic: false,
  },
};

/**
 * Determine wanted star level addition based on crime type.
 */
export function getCrimeEscalation(crime: CrimeType): number {
  switch (crime) {
    case 'RECKLESS_DRIVING':
      return 1;
    case 'VEHICLE_THEFT':
      return 2;
    case 'ASSAULT':
      return 2;
    case 'FIREARM_DISCHARGE':
      return 3;
    case 'VEHICLE_DESTRUCTION':
      return 3;
    case 'OFFICER_ATTACK':
      return 4;
    default:
      return 1;
  }
}

/**
 * Check if a sound (e.g. gunshot or crash) is heard at a listener's position.
 */
export function isSoundAudible(soundOrigin: Vec3, listenerPos: Vec3, soundType: 'GUNSHOT' | 'IMPACT' | 'ENGINE'): boolean {
  const distSq = V3.distanceSq(soundOrigin, listenerPos);
  let maxRadius = 15;
  if (soundType === 'GUNSHOT') maxRadius = 45;
  else if (soundType === 'IMPACT') maxRadius = 25;
  return distSq <= maxRadius * maxRadius;
}

/**
 * Check if a target is within a watcher's visual field of view (cone check).
 */
export function isTargetInSightCone(
  watcherPos: Vec3,
  watcherYaw: number,
  targetPos: Vec3,
  fovDegrees = 135,
  maxDistance = 38
): boolean {
  const dist = V3.distance(watcherPos, targetPos);
  if (dist > maxDistance) return false;
  if (dist < 2.0) return true; // Close proximity detection

  // Forward vector of watcher
  const forwardX = Math.sin(watcherYaw);
  const forwardZ = Math.cos(watcherYaw);

  // Direction to target
  const toTargetX = (targetPos.x - watcherPos.x) / dist;
  const toTargetZ = (targetPos.z - watcherPos.z) / dist;

  const dot = forwardX * toTargetX + forwardZ * toTargetZ;
  const minDot = Math.cos(((fovDegrees / 2) * Math.PI) / 180);

  return dot >= minDot;
}

/**
 * Update wanted state over delta time.
 * Handles evasion countdown when out of sight, and clears stars when evasion completes.
 */
export function updateWantedState(
  state: WantedState,
  spottedThisFrame: boolean,
  playerPosition: Vec3,
  dt: number,
  evasionDuration = 12.0
): WantedState {
  if (state.level <= 0) {
    return {
      level: 0,
      lastCrimeTime: state.lastCrimeTime,
      isInSight: false,
      sightTimer: 0,
      evasionCountdown: evasionDuration,
      lastKnownPosition: null,
      activePursuitCount: 0,
    };
  }

  const newState = { ...state };

  if (spottedThisFrame) {
    newState.isInSight = true;
    newState.sightTimer += dt;
    newState.evasionCountdown = evasionDuration; // Reset evasion timer
    newState.lastKnownPosition = { ...playerPosition };
  } else {
    newState.isInSight = false;
    newState.sightTimer = 0;
    newState.evasionCountdown = Math.max(0, newState.evasionCountdown - dt);

    // If evasion countdown expired, reduce wanted level
    if (newState.evasionCountdown <= 0) {
      newState.level = Math.max(0, newState.level - 1);
      newState.evasionCountdown = evasionDuration * 0.75; // Shorter timer for next star drop
      if (newState.level === 0) {
        newState.lastKnownPosition = null;
      }
    }
  }

  return newState;
}

/**
 * Calculate damage applied to a target with armor absorption.
 */
export function applyDamageWithArmor(
  currentHealth: number,
  currentArmor: number,
  incomingDamage: number
): { newHealth: number; newArmor: number; damageDealt: number } {
  let health = currentHealth;
  let armor = currentArmor;

  if (armor > 0) {
    const armorAbsorption = Math.min(armor, incomingDamage * 0.7);
    const healthDamage = incomingDamage - armorAbsorption;

    armor = Math.max(0, armor - armorAbsorption);
    health = Math.max(0, health - healthDamage);
  } else {
    health = Math.max(0, health - incomingDamage);
  }

  return {
    newHealth: Math.round(health),
    newArmor: Math.round(armor),
    damageDealt: Math.round(incomingDamage),
  };
}

/**
 * Calculate effective weapon damage with distance falloff and headshot multiplier.
 */
export function computeBulletDamage(
  weapon: WeaponDef,
  distance: number,
  isHeadshot = false
): number {
  if (distance > weapon.range) return 0;

  // Linear falloff between 50% range and 100% range
  let falloffFactor = 1.0;
  const halfRange = weapon.range * 0.5;
  if (distance > halfRange) {
    falloffFactor = 1.0 - ((distance - halfRange) / halfRange) * 0.45;
  }

  let finalDamage = weapon.damage * falloffFactor;
  if (isHeadshot) {
    finalDamage *= 2.0;
  }

  return Math.max(1, Math.round(finalDamage));
}
