import * as THREE from 'three';
import type { PlayerStats, WeaponState, WeaponType } from '../types.ts';
import { WEAPON_REGISTRY } from '../rules.ts';
import { resolveSphereAABBCollision, updateVehiclePhysics, computeMovementVector, isPointInsideAABB, V3, type Vec3 } from '../physics.ts';
import type { WorldCollisionData } from '../world.ts';
import { gameAudio } from '../audio.ts';
import type { VehicleInstance, VehicleManager } from './VehicleManager.ts';

export class PlayerController {
  public position: Vec3 = { x: 0, y: 0.5, z: 15 };
  public velocity: Vec3 = { x: 0, y: 0, z: 0 };
  public yaw = 0;
  public isGrounded = true;
  public isSprinting = false;
  public isAiming = false;
  public isFiring = false;
  public currentVehicle: VehicleInstance | null = null;
  public stats: PlayerStats;
  public weaponState: WeaponState;
  
  // Camera angles
  public cameraPitch = 0.2; // radians
  public cameraYaw = 0;
  public cameraDistance = 4.6;
  public targetCameraPos = new THREE.Vector3();

  // 3D Visual Mesh
  public meshGroup: THREE.Group;
  private headMesh: THREE.Mesh;
  private torsoMesh: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private gunMesh: THREE.Mesh;
  private muzzleFlash: THREE.PointLight;

  private animCycle = 0;
  private footstepTimer = 0;
  private recoilKick = 0;

  constructor(scene: THREE.Object3D, initialStats: PlayerStats) {
    this.stats = { ...initialStats };
    this.weaponState = {
      type: 'PISTOL',
      ammoInMag: WEAPON_REGISTRY.PISTOL.magazineSize,
      reserveAmmo: 60,
      isReloading: false,
      reloadTimer: 0,
      lastFireTime: 0,
    };

    this.meshGroup = new THREE.Group();
    this.meshGroup.name = 'PlayerCharacter';

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }); // Dark stealth jacket
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.3 });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.32);
    this.torsoMesh = new THREE.Mesh(torsoGeo, jacketMat);
    this.torsoMesh.position.y = 1.05;
    this.torsoMesh.castShadow = true;
    this.meshGroup.add(this.torsoMesh);

    // Head
    const headGeo = new THREE.BoxGeometry(0.28, 0.32, 0.3);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.y = 1.62;
    this.headMesh.castShadow = true;
    this.meshGroup.add(this.headMesh);

    // Hair / Cap
    const capGeo = new THREE.BoxGeometry(0.3, 0.12, 0.35);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 1.78, 0.02);
    this.meshGroup.add(cap);

    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.38, 1.35, 0);
    const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
    const lArmMesh = new THREE.Mesh(armGeo, jacketMat);
    lArmMesh.position.y = -0.3;
    lArmMesh.castShadow = true;
    this.leftArm.add(lArmMesh);
    this.meshGroup.add(this.leftArm);

    // Right Arm (holds weapon)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.38, 1.35, 0);
    const rArmMesh = new THREE.Mesh(armGeo, jacketMat);
    rArmMesh.position.y = -0.3;
    rArmMesh.castShadow = true;
    this.rightArm.add(rArmMesh);

    // Gun attached to right hand
    const gunGeo = new THREE.BoxGeometry(0.1, 0.14, 0.32);
    this.gunMesh = new THREE.Mesh(gunGeo, gunMat);
    this.gunMesh.position.set(0, -0.58, 0.15);
    this.rightArm.add(this.gunMesh);

    // Muzzle Flash
    this.muzzleFlash = new THREE.PointLight(0xffedd5, 0, 8);
    this.muzzleFlash.position.set(0, -0.58, 0.38);
    this.rightArm.add(this.muzzleFlash);

    this.meshGroup.add(this.rightArm);

    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.72, 0);
    const legGeo = new THREE.BoxGeometry(0.22, 0.72, 0.22);
    const lLegMesh = new THREE.Mesh(legGeo, pantsMat);
    lLegMesh.position.y = -0.34;
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);

    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.3), bootMat);
    lBoot.position.set(0, -0.65, 0.04);
    this.leftLeg.add(lBoot);
    this.meshGroup.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.72, 0);
    const rLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rLegMesh.position.y = -0.34;
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);

    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.3), bootMat);
    rBoot.position.set(0, -0.65, 0.04);
    this.rightLeg.add(rBoot);
    this.meshGroup.add(this.rightLeg);

    scene.add(this.meshGroup);
  }

  public setWeapon(type: WeaponType): void {
    if (this.weaponState.type === type) return;
    const def = WEAPON_REGISTRY[type];
    this.weaponState = {
      type,
      ammoInMag: def.magazineSize,
      reserveAmmo: type === 'PISTOL' ? 60 : type === 'SMG' ? 120 : 36,
      isReloading: false,
      reloadTimer: 0,
      lastFireTime: 0,
    };
    gameAudio.playUIBlip('SELECT');
  }

  public triggerReload(): void {
    if (this.weaponState.isReloading) return;
    const def = WEAPON_REGISTRY[this.weaponState.type];
    if (this.weaponState.ammoInMag >= def.magazineSize || this.weaponState.reserveAmmo <= 0) return;

    this.weaponState.isReloading = true;
    this.weaponState.reloadTimer = def.reloadTime;
    gameAudio.playUIBlip('CONFIRM');
  }

  public update(
    dt: number,
    input: {
      moveForward: number; // -1 to 1
      moveRight: number; // -1 to 1
      sprint: boolean;
      jump: boolean;
      aim: boolean;
      fire: boolean;
      interact: boolean;
    },
    collision: WorldCollisionData,
    vehicleManager: VehicleManager
  ): { shotFired: boolean; shotOrigin?: Vec3; shotDirection?: Vec3; hitPoint?: Vec3 } {
    let shotFired = false;
    let hitPoint: Vec3 | undefined;
    let shotOrigin: Vec3 | undefined;
    let shotDirection: Vec3 | undefined;

    // Handle weapon reload timer
    if (this.weaponState.isReloading) {
      this.weaponState.reloadTimer -= dt;
      if (this.weaponState.reloadTimer <= 0) {
        this.weaponState.isReloading = false;
        const def = WEAPON_REGISTRY[this.weaponState.type];
        const needed = def.magazineSize - this.weaponState.ammoInMag;
        const available = Math.min(needed, this.weaponState.reserveAmmo);
        this.weaponState.ammoInMag += available;
        this.weaponState.reserveAmmo -= available;
      }
    }

    // Muzzle flash decay
    if (this.muzzleFlash.intensity > 0) {
      this.muzzleFlash.intensity = Math.max(0, this.muzzleFlash.intensity - dt * 25);
    }

    // Vehicle Driving State
    if (this.currentVehicle) {
      this.meshGroup.visible = false;
      this.position = { ...this.currentVehicle.position };

      // Handle vehicle driving input: positive input.moveRight steers right
      const throttle = input.moveForward;
      const steering = input.moveRight;
      const handbrake = input.jump;

      // Assign controls for authoritative VehicleManager update
      this.currentVehicle.controls = { throttle, steering, handbrake };
      this.currentVehicle.frontWheelSteer = steering * 0.42;

      // Update audio
      gameAudio.updateEngineSound(this.currentVehicle.speed / this.currentVehicle.config.maxSpeed, true);
      if (handbrake && this.currentVehicle.speed > 5) {
        gameAudio.playTireScreech();
      }

      // Exit Vehicle
      if (input.interact) {
        this.exitVehicle(collision);
      }

      return { shotFired: false };
    }

    // On-Foot Locomotion
    this.meshGroup.visible = true;
    gameAudio.updateEngineSound(0, false);

    // Enter Vehicle check
    if (input.interact) {
      const nearVeh = vehicleManager.getNearestVehicle(this.position, 3.8);
      if (nearVeh && !nearVeh.isDestroyed) {
        this.enterVehicle(nearVeh);
        return { shotFired: false };
      }
    }

    this.isSprinting = input.sprint && !input.aim && this.stats.stamina > 10;
    this.isAiming = input.aim;

    const moveSpeed = this.isAiming ? 2.5 : this.isSprinting ? 8.2 : 4.4;

    // Movement direction relative to camera yaw using validated basis
    const moveVec = computeMovementVector(input.moveForward, input.moveRight, this.cameraYaw);
    const moveLen = Math.sqrt(moveVec.x * moveVec.x + moveVec.z * moveVec.z);

    if (moveLen > 0.05) {
      // Face direction of movement, unless aiming (face camera forward)
      if (this.isAiming) {
        this.yaw = this.cameraYaw;
      } else {
        const targetYaw = Math.atan2(moveVec.x, moveVec.z);
        // Smooth rotation
        let diff = targetYaw - this.yaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.yaw += diff * Math.min(1, dt * 14);
      }

      this.velocity.x = moveVec.x * moveSpeed;
      this.velocity.z = moveVec.z * moveSpeed;

      // Stamina drain
      if (this.isSprinting) {
        this.stats.stamina = Math.max(0, this.stats.stamina - dt * 18);
      }

      // Walk/Sprint animation cycles
      const animSpeed = this.isSprinting ? 14 : 8;
      this.animCycle += dt * animSpeed;
      const legSwing = Math.sin(this.animCycle) * (this.isSprinting ? 0.75 : 0.45);
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      if (!this.isAiming) {
        this.leftArm.rotation.x = -legSwing * 0.8;
        this.rightArm.rotation.x = legSwing * 0.8;
      }

      // Footstep audio
      this.footstepTimer += dt * (this.isSprinting ? 4.5 : 2.5);
      if (this.footstepTimer >= 1.0) {
        this.footstepTimer = 0;
        if (this.isGrounded) gameAudio.playFootstep();
      }
    } else {
      // Decelerate
      this.velocity.x *= Math.max(0, 1 - dt * 12);
      this.velocity.z *= Math.max(0, 1 - dt * 12);

      // Return limbs to idle
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      if (!this.isAiming) {
        this.leftArm.rotation.x *= 0.8;
        this.rightArm.rotation.x *= 0.8;
      }

      // Stamina regen
      this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + dt * 25);
    }

    // Decay recoil kick smoothly
    if (this.recoilKick > 0) {
      this.recoilKick = Math.max(0, this.recoilKick - dt * 3.5);
    }

    // Two-handed tactical aiming posture with pitch alignment and upward recoil kick
    if (this.isAiming) {
      this.yaw = this.cameraYaw;
      this.rightArm.rotation.x = -Math.PI / 2 + this.cameraPitch - this.recoilKick;
      this.rightArm.rotation.y = -0.15;
      this.leftArm.rotation.x = -Math.PI / 2 + this.cameraPitch * 0.9 - this.recoilKick * 0.5;
      this.leftArm.rotation.y = 0.35;
    } else {
      this.rightArm.rotation.y = 0;
      this.leftArm.rotation.y = 0;
    }

    // Jump
    const gravity = -18.0;
    if (input.jump && this.isGrounded) {
      this.velocity.y = 7.5;
      this.isGrounded = false;
      gameAudio.playFootstep();
    }

    // Apply gravity
    this.velocity.y += gravity * dt;

    // Next position
    const nextX = this.position.x + this.velocity.x * dt;
    const nextY = this.position.y + this.velocity.y * dt;
    const nextZ = this.position.z + this.velocity.z * dt;

    // Ground elevation snapping
    const groundY = collision.groundElevation(nextX, nextZ);
    if (nextY <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = nextY;
      this.isGrounded = false;
    }

    // Solve wall collision against world AABBs
    const playerRadius = 0.45;
    let testPos: Vec3 = { x: nextX, y: this.position.y + 0.8, z: nextZ };
    for (const box of collision.boxes) {
      const res = resolveSphereAABBCollision(testPos, playerRadius, box);
      if (res.collided) {
        testPos = res.position;
      }
    }
    this.position.x = testPos.x;
    this.position.z = testPos.z;

    // Sync 3D Mesh
    this.meshGroup.position.set(this.position.x, this.position.y, this.position.z);
    this.meshGroup.rotation.y = this.yaw;

    // Fire Weapon
    const now = Date.now() * 0.001;
    const def = WEAPON_REGISTRY[this.weaponState.type];
    const canFire =
      input.fire &&
      !this.weaponState.isReloading &&
      this.weaponState.ammoInMag > 0 &&
      now - this.weaponState.lastFireTime >= 1 / def.fireRate;

    if (canFire) {
      this.weaponState.lastFireTime = now;
      this.weaponState.ammoInMag--;
      gameAudio.playGunshot(this.weaponState.type);
      this.muzzleFlash.intensity = 3.5;
      this.recoilKick = 0.28; // Visible upward firing recoil kick
      shotFired = true;

      // Calculate shot raycast along camera aim direction with pitch scaling
      const cosPitch = Math.cos(this.cameraPitch);
      const aimDirX = Math.sin(this.cameraYaw) * cosPitch;
      const aimDirY = -Math.sin(this.cameraPitch);
      const aimDirZ = Math.cos(this.cameraYaw) * cosPitch;
      shotDirection = { x: aimDirX, y: aimDirY, z: aimDirZ };

      const forwardX = Math.sin(this.cameraYaw);
      const forwardZ = Math.cos(this.cameraYaw);
      const rightX = forwardZ;
      const rightZ = -forwardX;

      shotOrigin = {
        x: this.position.x + forwardX * 0.5 + rightX * 0.35,
        y: this.position.y + 1.35 - Math.sin(this.cameraPitch) * 0.3,
        z: this.position.z + forwardZ * 0.5 + rightZ * 0.35,
      };

      hitPoint = {
        x: shotOrigin.x + aimDirX * def.range,
        y: shotOrigin.y + aimDirY * def.range,
        z: shotOrigin.z + aimDirZ * def.range,
      };

      if (this.weaponState.ammoInMag === 0) {
        this.triggerReload();
      }
    }

    return { shotFired, shotOrigin, shotDirection, hitPoint };
  }

  public isNearVehicle(vehicleManager: VehicleManager): boolean {
    if (this.currentVehicle) return true;
    const nearVeh = vehicleManager.getNearestVehicle(this.position, 3.8);
    return Boolean(nearVeh && !nearVeh.isDestroyed);
  }

  public enterVehicle(vehicle: VehicleInstance): void {
    this.currentVehicle = vehicle;
    vehicle.driverId = 'player';
    vehicle.isEngineRunning = true;
    gameAudio.playUIBlip('CONFIRM');
  }

  public exitVehicle(collision?: WorldCollisionData): void {
    if (!this.currentVehicle) return;
    const v = this.currentVehicle;
    const yaw = v.yaw;
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);
    const rightX = forwardZ;
    const rightZ = -forwardX;

    const sideDist = v.config.dimensions.width * 0.5 + 1.2;
    const backDist = v.config.dimensions.length * 0.5 + 1.2;

    // 4 candidate positions: Driver side (car left: -right), Passenger side (car right: +right), Rear (-forward), Front (+forward)
    const candidates: Vec3[] = [
      { x: v.position.x - rightX * sideDist, y: v.position.y, z: v.position.z - rightZ * sideDist }, // Driver side (car left)
      { x: v.position.x + rightX * sideDist, y: v.position.y, z: v.position.z + rightZ * sideDist }, // Passenger side (car right)
      { x: v.position.x - forwardX * backDist, y: v.position.y, z: v.position.z - forwardZ * backDist }, // Rear
      { x: v.position.x + forwardX * backDist, y: v.position.y, z: v.position.z + forwardZ * backDist }, // Front
    ];

    let chosenPos = candidates[0];
    if (collision) {
      for (const cand of candidates) {
        let blocked = false;
        for (const box of collision.boxes) {
          if (isPointInsideAABB(cand, box)) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          chosenPos = cand;
          break;
        }
      }
    }

    this.position.x = chosenPos.x;
    this.position.z = chosenPos.z;
    this.position.y = v.position.y;
    this.velocity = { x: 0, y: 0, z: 0 };
    v.driverId = null;
    v.isEngineRunning = false;
    this.currentVehicle = null;
    this.meshGroup.visible = true;
    gameAudio.playUIBlip('CONFIRM');
  }

  public updateCamera(camera: THREE.PerspectiveCamera, collision: WorldCollisionData): void {
    if (this.currentVehicle) {
      // Vehicle driving camera: higher distance, smooth follow behind car yaw
      const dist = 7.0;
      const height = 3.2;
      const backX = -Math.sin(this.currentVehicle.yaw) * dist;
      const backZ = -Math.cos(this.currentVehicle.yaw) * dist;

      const targetCamX = this.currentVehicle.position.x + backX;
      const targetCamY = this.currentVehicle.position.y + height;
      const targetCamZ = this.currentVehicle.position.z + backZ;

      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.15);
      const lookTarget = new THREE.Vector3(
        this.currentVehicle.position.x + Math.sin(this.currentVehicle.yaw) * 4,
        this.currentVehicle.position.y + 1.2,
        this.currentVehicle.position.z + Math.cos(this.currentVehicle.yaw) * 4
      );
      camera.lookAt(lookTarget);
    } else {
      // Third-person shoulder / orbit camera
      const shoulderOffsetX = this.isAiming ? 0.65 : 0.25;
      const targetHeight = this.position.y + 1.5;

      const camDist = this.isAiming ? 2.4 : this.cameraDistance;
      const cosPitch = Math.cos(this.cameraPitch);
      const sinPitch = Math.sin(this.cameraPitch);

      const offsetX = -Math.sin(this.cameraYaw) * cosPitch * camDist + Math.cos(this.cameraYaw) * shoulderOffsetX;
      const offsetY = sinPitch * camDist;
      const offsetZ = -Math.cos(this.cameraYaw) * cosPitch * camDist - Math.sin(this.cameraYaw) * shoulderOffsetX;

      const idealPos = new THREE.Vector3(
        this.position.x + offsetX,
        targetHeight + offsetY,
        this.position.z + offsetZ
      );

      // Camera collision check against world boxes: pull in if hitting wall
      let finalCamPos = idealPos;
      for (const box of collision.boxes) {
        if (
          finalCamPos.x >= box.min.x &&
          finalCamPos.x <= box.max.x &&
          finalCamPos.y >= box.min.y &&
          finalCamPos.y <= box.max.y &&
          finalCamPos.z >= box.min.z &&
          finalCamPos.z <= box.max.z
        ) {
          // Pulled towards player head
          finalCamPos = new THREE.Vector3(
            this.position.x,
            targetHeight + 0.3,
            this.position.z
          );
          break;
        }
      }

      camera.position.lerp(finalCamPos, 0.35);
      const lookAtPoint = new THREE.Vector3(
        this.position.x + Math.sin(this.cameraYaw) * 10,
        targetHeight - Math.sin(this.cameraPitch) * 10,
        this.position.z + Math.cos(this.cameraYaw) * 10
      );
      camera.lookAt(lookAtPoint);
    }
  }
}
