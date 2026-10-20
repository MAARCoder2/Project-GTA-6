import type { WantedState, CrimeType } from '../types.ts';
import { getCrimeEscalation, updateWantedState, isTargetInSightCone } from '../rules.ts';
import { V3, type Vec3 } from '../physics.ts';
import type { VehicleManager, VehicleInstance } from './VehicleManager.ts';
import type { CityWaypoint } from '../world.ts';
import { gameAudio } from '../audio.ts';

export class PoliceSystem {
  public wantedState: WantedState;
  public policeVehicles: VehicleInstance[] = [];
  private spawnCooldown = 0;

  constructor() {
    this.wantedState = {
      level: 0,
      lastCrimeTime: 0,
      isInSight: false,
      sightTimer: 0,
      evasionCountdown: 12.0,
      lastKnownPosition: null,
      activePursuitCount: 0,
    };
  }

  public reportCrime(crime: CrimeType, position: Vec3, witnessed: boolean): void {
    if (!witnessed && this.wantedState.level === 0) {
      // Unwitnessed crimes with 0 stars don't trigger police dispatch immediately
      return;
    }

    const stars = getCrimeEscalation(crime);
    const prevLevel = this.wantedState.level;
    this.wantedState.level = Math.min(5, Math.max(this.wantedState.level, stars));
    this.wantedState.lastCrimeTime = Date.now();
    this.wantedState.lastKnownPosition = { ...position };
    this.wantedState.evasionCountdown = 14.0;

    if (this.wantedState.level > prevLevel) {
      gameAudio.playUIBlip('ALERT');
    }
  }

  public update(
    dt: number,
    playerPosition: Vec3,
    roadWaypoints: CityWaypoint[],
    vehicleManager: VehicleManager
  ): void {
    if (this.wantedState.level === 0) {
      // Deactivate sirens on remaining police vehicles
      for (const pv of this.policeVehicles) {
        pv.sirenActive = false;
      }
      gameAudio.updateSirenSound(false);
      this.policeVehicles = [];
      return;
    }

    this.spawnCooldown -= dt;

    // Dispatch police vehicles based on wanted level
    const maxCruisers = Math.min(4, Math.max(1, this.wantedState.level));
    // Clean up destroyed vehicles
    this.policeVehicles = this.policeVehicles.filter((v) => !v.isDestroyed);

    if (this.policeVehicles.length < maxCruisers && this.spawnCooldown <= 0) {
      this.spawnCooldown = 6.0;

      // Find road waypoint far from player (approx 60-90m away)
      const validWps = roadWaypoints.filter((wp) => {
        const d = Math.hypot(wp.x - playerPosition.x, wp.z - playerPosition.z);
        return d > 45 && d < 95;
      });

      const spawnWp = validWps.length > 0 ? validWps[Math.floor(Math.random() * validWps.length)] : null;
      if (spawnWp) {
        const cruiser = vehicleManager.spawnVehicle(
          'METRO_PATROL',
          { x: spawnWp.x, y: 0.1, z: spawnWp.z },
          0
        );
        cruiser.sirenActive = true;
        this.policeVehicles.push(cruiser);
      }
    }

    // Police pursuit & AI navigation
    let spottedByAnyPolice = false;
    let closestSirenDist = Infinity;

    for (const cruiser of this.policeVehicles) {
      if (cruiser.isDestroyed) continue;
      cruiser.sirenActive = true;

      const distToPlayer = V3.distance(cruiser.position, playerPosition);
      if (distToPlayer < closestSirenDist) {
        closestSirenDist = distToPlayer;
      }

      // Sight check: within 50m and within vision cone
      const hasSight = isTargetInSightCone(cruiser.position, cruiser.yaw, playerPosition, 140, 55);
      if (hasSight) {
        spottedByAnyPolice = true;
      }

      // Pursuit navigation: steer towards player (when in sight) or last known position (via road waypoints)
      let targetPos = hasSight || !this.wantedState.lastKnownPosition
        ? playerPosition
        : this.wantedState.lastKnownPosition;

      // When line of sight is lost and distance is large, pick intermediate road waypoint
      if (!hasSight && roadWaypoints.length > 0 && distToPlayer > 35) {
        let bestWp = roadWaypoints[0];
        let bestDist = Infinity;
        for (const wp of roadWaypoints) {
          const dToCruiser = Math.hypot(wp.x - cruiser.position.x, wp.z - cruiser.position.z);
          const dToTarget = Math.hypot(wp.x - targetPos.x, wp.z - targetPos.z);
          if (dToCruiser > 12 && dToTarget < bestDist) {
            bestDist = dToTarget;
            bestWp = wp;
          }
        }
        targetPos = { x: bestWp.x, y: 0.1, z: bestWp.z };
      }

      const toTargetX = targetPos.x - cruiser.position.x;
      const toTargetZ = targetPos.z - cruiser.position.z;
      const targetYaw = Math.atan2(toTargetX, toTargetZ);

      // Compute steering difference
      let yawDiff = targetYaw - cruiser.yaw;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;

      // Steering input for authoritative vehicle physics
      const steering = Math.max(-1, Math.min(1, yawDiff * 1.6));
      cruiser.frontWheelSteer = steering * 0.4;

      // Throttle and handbrake control
      const distToTarget = Math.hypot(toTargetX, toTargetZ);
      const throttle = distToTarget > 5 ? 1.0 : 0.2;
      const handbrake = Math.abs(yawDiff) > 1.2 && cruiser.speed > 16;

      cruiser.driverId = 'police';
      cruiser.controls = { throttle, steering, handbrake };
    }

    // Update audio siren
    gameAudio.updateSirenSound(this.wantedState.level > 0, closestSirenDist);

    // Update wanted evasion / cooldown state
    this.wantedState = updateWantedState(this.wantedState, spottedByAnyPolice, playerPosition, dt, 14.0);
    this.wantedState.activePursuitCount = this.policeVehicles.length;
  }
}
