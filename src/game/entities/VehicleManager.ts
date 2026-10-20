import * as THREE from 'three';
import type { VehicleConfig, VehicleInstance, VehicleType } from '../types.ts';
export type { VehicleInstance };
import { updateVehiclePhysics, calculateCollisionImpulse, resolveSphereAABBCollision, resolveVehicleAABBCollision, V3, type Vec3 } from '../physics.ts';
import type { WorldCollisionData } from '../world.ts';
import { gameAudio } from '../audio.ts';

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  APEX_SPORT: {
    type: 'APEX_SPORT',
    name: 'Apex GT-R',
    mass: 1400,
    maxSpeed: 38.0, // ~137 km/h
    acceleration: 19.0,
    brakeForce: 28.0,
    reverseSpeed: 10.0,
    turnSpeed: 2.8,
    health: 120,
    dimensions: { width: 2.0, height: 1.3, length: 4.4 },
    color: '#e11d48', // crimson red
    accentColor: '#111827',
  },
  METRO_PATROL: {
    type: 'METRO_PATROL',
    name: 'Metro Police Cruiser',
    mass: 1850,
    maxSpeed: 34.0, // ~122 km/h
    acceleration: 16.0,
    brakeForce: 26.0,
    reverseSpeed: 9.0,
    turnSpeed: 2.5,
    health: 160,
    dimensions: { width: 2.1, height: 1.5, length: 4.8 },
    color: '#0f172a', // midnight black & white
    accentColor: '#ffffff',
    hasSiren: true,
  },
  TITAN_ENFORCER: {
    type: 'TITAN_ENFORCER',
    name: 'Titan Tactical SUV',
    mass: 2500,
    maxSpeed: 28.0, // ~100 km/h
    acceleration: 13.0,
    brakeForce: 24.0,
    reverseSpeed: 8.0,
    turnSpeed: 2.1,
    health: 240,
    dimensions: { width: 2.3, height: 1.9, length: 5.2 },
    color: '#334155', // tactical slate
    accentColor: '#1e293b',
  },
};

export class VehicleManager {
  public vehicles: VehicleInstance[] = [];
  public vehicleMeshes: Map<string, THREE.Group> = new Map();
  public wheelMeshes: Map<string, THREE.Mesh[]> = new Map();
  public sirenLights: Map<string, { red: THREE.PointLight; blue: THREE.PointLight; meshRed: THREE.Mesh; meshBlue: THREE.Mesh }> = new Map();
  private scene: THREE.Object3D;
  private smokeParticles: THREE.Points | null = null;
  private smokePositions: Float32Array = new Float32Array(300 * 3);
  private smokeCount = 0;

  constructor(scene: THREE.Object3D) {
    this.scene = scene;
    this.initSmokeParticles();
  }

  private initSmokeParticles(): void {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x64748b,
      size: 0.8,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.smokeParticles = new THREE.Points(geo, mat);
    this.scene.add(this.smokeParticles);
  }

  public spawnVehicle(
    type: VehicleType,
    position: { x: number; y: number; z: number },
    yaw = 0,
    customId?: string
  ): VehicleInstance {
    const config = VEHICLE_CONFIGS[type];
    const id = customId || `veh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const instance: VehicleInstance = {
      id,
      config,
      position: { ...position },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      yaw,
      pitch: 0,
      roll: 0,
      velocity: { x: 0, y: 0, z: 0 },
      speed: 0,
      steering: 0,
      health: config.health,
      maxHealth: config.health,
      isEngineRunning: false,
      isBraking: false,
      isReversing: false,
      sirenActive: false,
      isDestroyed: false,
      driverId: null,
      wheelRotation: 0,
      frontWheelSteer: 0,
    };

    const meshGroup = this.createVehicleMesh(instance);
    this.vehicleMeshes.set(id, meshGroup);
    this.scene.add(meshGroup);

    this.vehicles.push(instance);
    return instance;
  }

  private createVehicleMesh(instance: VehicleInstance): THREE.Group {
    const group = new THREE.Group();
    group.name = `Vehicle_${instance.id}`;
    const cfg = instance.config;

    // Body material
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.color),
      roughness: 0.25,
      metalness: 0.7,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.accentColor),
      roughness: 0.4,
      metalness: 0.4,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });

    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.8,
    });

    // Lower chassis
    const chassisGeo = new THREE.BoxGeometry(cfg.dimensions.width, cfg.dimensions.height * 0.45, cfg.dimensions.length);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = cfg.dimensions.height * 0.35;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Cabin / Greenhouse
    const cabinLen = cfg.dimensions.length * 0.52;
    const cabinWidth = cfg.dimensions.width * 0.88;
    const cabinHeight = cfg.dimensions.height * 0.48;
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLen);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, cfg.dimensions.height * 0.75, -cfg.dimensions.length * 0.08);
    cabin.castShadow = true;
    group.add(cabin);

    // Roof
    const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.95, 0.08, cabinLen * 0.95);
    const roof = new THREE.Mesh(roofGeo, cfg.hasSiren ? accentMat : bodyMat);
    roof.position.set(0, cfg.dimensions.height * 0.99, -cfg.dimensions.length * 0.08);
    group.add(roof);

    // Police decals & Siren Lightbar
    if (cfg.hasSiren) {
      // White door side panels
      const doorPanelGeo = new THREE.BoxGeometry(cfg.dimensions.width + 0.02, cfg.dimensions.height * 0.4, cfg.dimensions.length * 0.4);
      const doorPanel = new THREE.Mesh(doorPanelGeo, accentMat);
      doorPanel.position.set(0, cfg.dimensions.height * 0.35, -0.2);
      group.add(doorPanel);

      // Lightbar base
      const barGeo = new THREE.BoxGeometry(cfg.dimensions.width * 0.65, 0.15, 0.35);
      const barMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(0, cfg.dimensions.height * 1.06, -cfg.dimensions.length * 0.08);
      group.add(bar);

      // Red and Blue siren lens meshes
      const lensGeo = new THREE.BoxGeometry(cfg.dimensions.width * 0.28, 0.14, 0.3);
      const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const blueMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });

      const redLens = new THREE.Mesh(lensGeo, redMat);
      redLens.position.set(-cfg.dimensions.width * 0.16, cfg.dimensions.height * 1.06, -cfg.dimensions.length * 0.08);
      group.add(redLens);

      const blueLens = new THREE.Mesh(lensGeo, blueMat);
      blueLens.position.set(cfg.dimensions.width * 0.16, cfg.dimensions.height * 1.06, -cfg.dimensions.length * 0.08);
      group.add(blueLens);

      const redLight = new THREE.PointLight(0xef4444, 0, 15);
      redLight.position.set(-cfg.dimensions.width * 0.2, cfg.dimensions.height * 1.1, -cfg.dimensions.length * 0.08);
      group.add(redLight);

      const blueLight = new THREE.PointLight(0x3b82f6, 0, 15);
      blueLight.position.set(cfg.dimensions.width * 0.2, cfg.dimensions.height * 1.1, -cfg.dimensions.length * 0.08);
      group.add(blueLight);

      this.sirenLights.set(instance.id, {
        red: redLight,
        blue: blueLight,
        meshRed: redLens,
        meshBlue: blueLens,
      });
    }

    // Headlights and Taillights
    const headLightGeo = new THREE.BoxGeometry(0.35, 0.18, 0.1);
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const hlLeft = new THREE.Mesh(headLightGeo, headLightMat);
    hlLeft.position.set(-cfg.dimensions.width * 0.36, cfg.dimensions.height * 0.35, cfg.dimensions.length * 0.5);
    group.add(hlLeft);

    const hlRight = new THREE.Mesh(headLightGeo, headLightMat);
    hlRight.position.set(cfg.dimensions.width * 0.36, cfg.dimensions.height * 0.35, cfg.dimensions.length * 0.5);
    group.add(hlRight);

    const tailLightGeo = new THREE.BoxGeometry(0.38, 0.15, 0.1);
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const tlLeft = new THREE.Mesh(tailLightGeo, tailLightMat);
    tlLeft.position.set(-cfg.dimensions.width * 0.36, cfg.dimensions.height * 0.4, -cfg.dimensions.length * 0.5);
    group.add(tlLeft);

    const tlRight = new THREE.Mesh(tailLightGeo, tailLightMat);
    tlRight.position.set(cfg.dimensions.width * 0.36, cfg.dimensions.height * 0.4, -cfg.dimensions.length * 0.5);
    group.add(tlRight);

    // 4 Wheels
    const wheelRadius = cfg.dimensions.height * 0.26;
    const wheelWidth = 0.32;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheels: THREE.Mesh[] = [];
    const wheelX = cfg.dimensions.width * 0.48;
    const wheelZFront = cfg.dimensions.length * 0.32;
    const wheelZRear = -cfg.dimensions.length * 0.32;
    const wheelY = wheelRadius;

    const wheelOffsets = [
      [-wheelX, wheelY, wheelZFront], // Front Left
      [wheelX, wheelY, wheelZFront],  // Front Right
      [-wheelX, wheelY, wheelZRear],  // Rear Left
      [wheelX, wheelY, wheelZRear],   // Rear Right
    ];

    for (const [wx, wy, wz] of wheelOffsets) {
      const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wheelMesh.position.set(wx, wy, wz);
      wheelMesh.castShadow = true;

      // Rim center
      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, wheelWidth + 0.02, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelMesh.add(rim);

      group.add(wheelMesh);
      wheels.push(wheelMesh);
    }
    this.wheelMeshes.set(instance.id, wheels);

    group.position.set(instance.position.x, instance.position.y, instance.position.z);
    group.rotation.y = instance.yaw;

    return group;
  }

  public update(dt: number, collision: WorldCollisionData, playerDrivingId: string | null): void {
    const sirenTime = Date.now() * 0.008;

    for (const veh of this.vehicles) {
      if (veh.isDestroyed) continue;

      // Authoritative physics integration when controls are provided (by player or AI)
      if (veh.controls) {
        const nextState = updateVehiclePhysics(
          {
            position: veh.position,
            velocity: veh.velocity,
            yaw: veh.yaw,
            speed: veh.speed,
          },
          veh.controls,
          {
            acceleration: veh.config.acceleration,
            maxSpeed: veh.config.maxSpeed,
            reverseSpeed: veh.config.reverseSpeed,
            brakeForce: veh.config.brakeForce,
            turnSpeed: veh.config.turnSpeed,
            drag: 1.2,
            grip: 0.95,
          },
          dt
        );

        veh.position = nextState.position;
        veh.velocity = nextState.velocity;
        veh.yaw = nextState.yaw;
        veh.speed = nextState.speed;
      }

      // Ground elevation snapping
      const groundY = collision.groundElevation(veh.position.x, veh.position.z);
      veh.position.y = groundY;

      // Animate wheels
      const wheels = this.wheelMeshes.get(veh.id);
      if (wheels && wheels.length === 4) {
        veh.wheelRotation += (veh.speed * dt) / (veh.config.dimensions.height * 0.26);
        for (const w of wheels) {
          w.rotation.x = veh.wheelRotation;
        }
        // Front wheels steering angle
        wheels[0].rotation.y = veh.frontWheelSteer;
        wheels[1].rotation.y = veh.frontWheelSteer;
      }

      // Flashing siren lightbars
      if (veh.config.hasSiren) {
        const siren = this.sirenLights.get(veh.id);
        if (siren) {
          if (veh.sirenActive) {
            const cycle = Math.sin(sirenTime);
            const redOn = cycle > 0;
            siren.red.intensity = redOn ? 2.5 : 0.1;
            siren.blue.intensity = redOn ? 0.1 : 2.5;
            (siren.meshRed.material as THREE.MeshBasicMaterial).color.setHex(redOn ? 0xff0000 : 0x550000);
            (siren.meshBlue.material as THREE.MeshBasicMaterial).color.setHex(redOn ? 0x000055 : 0x0066ff);
          } else {
            siren.red.intensity = 0;
            siren.blue.intensity = 0;
            (siren.meshRed.material as THREE.MeshBasicMaterial).color.setHex(0x330000);
            (siren.meshBlue.material as THREE.MeshBasicMaterial).color.setHex(0x000033);
          }
        }
      }

      // Multi-point collision check with static world boxes (front, center, rear)
      for (const box of collision.boxes) {
        const res = resolveVehicleAABBCollision(veh.position, veh.yaw, veh.config.dimensions, box);
        if (res.collided) {
          // Calculate collision impulse
          const impulse = calculateCollisionImpulse(veh.velocity, res.normal, 0.3);
          veh.velocity = impulse.reflectedVelocity;
          veh.position = res.position;

          if (impulse.damage > 0) {
            veh.health = Math.max(0, veh.health - impulse.damage);
            gameAudio.playCollisionImpact(impulse.impactSpeed);
            if (veh.health <= 0) {
              veh.isDestroyed = true;
              this.onVehicleDestroyed(veh);
            }
          }
        }
      }

      // Sync 3D Mesh
      const mesh = this.vehicleMeshes.get(veh.id);
      if (mesh) {
        mesh.position.set(veh.position.x, veh.position.y, veh.position.z);
        mesh.rotation.y = veh.yaw;
      }
    }

    // Vehicle-to-vehicle collision
    for (let i = 0; i < this.vehicles.length; i++) {
      for (let j = i + 1; j < this.vehicles.length; j++) {
        const vA = this.vehicles[i];
        const vB = this.vehicles[j];
        if (vA.isDestroyed || vB.isDestroyed) continue;

        const dist = V3.distance(vA.position, vB.position);
        const minDist = (vA.config.dimensions.length + vB.config.dimensions.length) * 0.38;

        if (dist < minDist && dist > 0.001) {
          // Push apart
          const normal = V3.normalize(V3.sub(vA.position, vB.position));
          const overlap = minDist - dist;
          vA.position = V3.add(vA.position, V3.scale(normal, overlap * 0.5));
          vB.position = V3.sub(vB.position, V3.scale(normal, overlap * 0.5));

          // Velocity deflection
          const relVel = V3.sub(vA.velocity, vB.velocity);
          const impact = calculateCollisionImpulse(relVel, normal, 0.4);
          vA.velocity = V3.add(vA.velocity, V3.scale(normal, impact.impactSpeed * 0.5));
          vB.velocity = V3.sub(vB.velocity, V3.scale(normal, impact.impactSpeed * 0.5));

          if (impact.damage > 0) {
            vA.health = Math.max(0, vA.health - Math.round(impact.damage * 0.6));
            vB.health = Math.max(0, vB.health - Math.round(impact.damage * 0.6));
            gameAudio.playCollisionImpact(impact.impactSpeed);
          }
        }
      }
    }
  }

  public onVehicleDestroyed(veh: VehicleInstance): void {
    const mesh = this.vehicleMeshes.get(veh.id);
    if (mesh) {
      // Darken materials to charred black
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x18181b,
            roughness: 0.95,
          });
        }
      });
    }
    gameAudio.playCollisionImpact(35);
  }

  public removeVehicle(id: string): void {
    const idx = this.vehicles.findIndex((v) => v.id === id);
    if (idx !== -1) {
      this.vehicles.splice(idx, 1);
    }
    const mesh = this.vehicleMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material?.dispose();
        }
      });
      this.vehicleMeshes.delete(id);
    }
    this.wheelMeshes.delete(id);
    this.sirenLights.delete(id);
  }

  public getNearestVehicle(pos: Vec3, maxDist = 4.0): VehicleInstance | null {
    let nearest: VehicleInstance | null = null;
    let minDist = maxDist;

    for (const veh of this.vehicles) {
      if (veh.isDestroyed) continue;
      const d = V3.distance(pos, veh.position);
      if (d < minDist) {
        minDist = d;
        nearest = veh;
      }
    }

    return nearest;
  }
}
