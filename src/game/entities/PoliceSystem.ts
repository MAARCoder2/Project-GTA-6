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

      // Pursuit navigation: steer towards player (or last known position)
      const targetPos = hasSight || !this.wantedState.lastKnownPosition
        ? playerPosition
        : this.wantedState.lastKnownPosition;

      const toTargetX = targetPos.x - cruiser.position.x;
      const toTargetZ = targetPos.z - cruiser.position.z;
      const targetYaw = Math.atan2(toTargetX, toTargetZ);

      // Smooth steering
      let yawDiff = targetYaw - cruiser.yaw;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;

      cruiser.yaw += Math.sign(yawDiff) * Math.min(Math.abs(yawDiff), cruiser.config.turnSpeed * dt * 1.5);
      cruiser.frontWheelSteer = Math.max(-0.4, Math.min(0.4, yawDiff));

      // Acceleration: accelerate aggressively towards target
      const forwardX = Math.sin(cruiser.yaw);
      const forwardZ = Math.cos(cruiser.yaw);

      const targetSpeed = distToPlayer > 8 ? cruiser.config.maxSpeed * 0.9 : 10;
      if (cruiser.speed < targetSpeed) {
        cruiser.speed += cruiser.config.acceleration * dt;
      }

      cruiser.velocity.x = forwardX * cruiser.speed;
      cruiser.velocity.z = forwardZ * cruiser.speed;

      cruiser.position.x += cruiser.velocity.x * dt;
      cruiser.position.z += cruiser.velocity.z * dt;
    }

    // Update audio siren
    gameAudio.updateSirenSound(this.wantedState.level > 0, closestSirenDist);

    // Update wanted evasion / cooldown state
    this.wantedState = updateWantedState(this.wantedState, spottedByAnyPolice, playerPosition, dt, 14.0);
    this.wantedState.activePursuitCount = this.policeVehicles.length;
  }
}
