import * as THREE from 'three';
import type { NPCBehavior, NPCInstance } from '../types.ts';
import { isSoundAudible, isTargetInSightCone } from '../rules.ts';
import { resolveSphereAABBCollision, V3, type Vec3 } from '../physics.ts';
import type { CityWaypoint, WorldCollisionData } from '../world.ts';

export class NPCManager {
  public npcs: NPCInstance[] = [];
  public npcMeshes: Map<string, THREE.Group> = new Map();
  private leftLegs: Map<string, THREE.Group> = new Map();
  private rightLegs: Map<string, THREE.Group> = new Map();
  private leftArms: Map<string, THREE.Group> = new Map();
  private rightArms: Map<string, THREE.Group> = new Map();
  private scene: THREE.Object3D;

  constructor(scene: THREE.Object3D) {
    this.scene = scene;
  }

  public spawnNPC(
    name: string,
    position: Vec3,
    sidewalkWaypoints: CityWaypoint[],
    isHostile = false,
    isPolice = false
  ): NPCInstance {
    const id = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const casualColors = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777', '#0d9488'];
    const businessColors = ['#1e293b', '#334155', '#475569', '#3b0764'];

    const archetype = isPolice
      ? 'POLICE'
      : isHostile
      ? 'HOSTILE'
      : Math.random() < 0.5
      ? 'BUSINESS'
      : 'CASUAL';

    const outfitColor =
      archetype === 'POLICE'
        ? '#1e3a8a'
        : archetype === 'HOSTILE'
        ? '#7f1d1d'
        : archetype === 'BUSINESS'
        ? businessColors[Math.floor(Math.random() * businessColors.length)]
        : casualColors[Math.floor(Math.random() * casualColors.length)];

    const targetWp = sidewalkWaypoints.length > 0 ? sidewalkWaypoints[Math.floor(Math.random() * sidewalkWaypoints.length)] : null;

    const instance: NPCInstance = {
      id,
      name,
      behavior: isHostile ? 'HOSTILE' : 'PATROL_WALK',
      archetype,
      position: { ...position },
      velocity: { x: 0, y: 0, z: 0 },
      yaw: Math.random() * Math.PI * 2,
      health: isHostile ? 80 : 50,
      maxHealth: isHostile ? 80 : 50,
      speed: 1.8,
      targetPoint: targetWp ? { x: targetWp.x, y: 0.22, z: targetWp.z } : null,
      stateTimer: 0,
      isWitnessingCrime: false,
      witnessTimer: 0,
      panicTimer: 0,
      outfitColor,
      isHostile,
      isPolice,
      animState: 'walk',
      animTime: Math.random() * 10,
    };

    const meshGroup = this.createNPCMesh(instance);
    this.npcMeshes.set(id, meshGroup);
    this.scene.add(meshGroup);

    this.npcs.push(instance);
    return instance;
  }

  private createNPCMesh(npc: NPCInstance): THREE.Group {
    const group = new THREE.Group();
    group.name = `NPC_${npc.id}`;

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 });
    const outfitMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(npc.outfitColor), roughness: 0.65 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x271810, roughness: 0.9 });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.68, 0.28);
    const torso = new THREE.Mesh(torsoGeo, outfitMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.26, 0.28, 0.26);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.52;
    head.castShadow = true;
    group.add(head);

    // Archetype-specific clothing, accessories, and headwear
    if (npc.archetype === 'POLICE') {
      // Gold chest badge
      const badge = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 })
      );
      badge.position.set(-0.14, 1.15, 0.15);
      group.add(badge);

      // Black utility duty belt
      const belt = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.1, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.5 })
      );
      belt.position.set(0, 0.68, 0);
      group.add(belt);

      // Peaked police service cap with black visor
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.1, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a })
      );
      cap.position.set(0, 1.68, 0.02);
      group.add(cap);
      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.03, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 })
      );
      visor.position.set(0, 1.64, 0.18);
      group.add(visor);
    } else if (npc.archetype === 'HOSTILE') {
      // Tactical body armor vest
      const vest = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.55, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 })
      );
      vest.position.set(0, 1.05, 0);
      group.add(vest);

      // Syndicate red/black bandana or tactical cap
      const bandana = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.12, 0.28),
        new THREE.MeshStandardMaterial({ color: 0x991b1b })
      );
      bandana.position.set(0, 1.66, 0);
      group.add(bandana);
    } else if (npc.archetype === 'BUSINESS') {
      // White shirt collar and tie
      const tie = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.35, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x991b1b })
      );
      tie.position.set(0, 1.12, 0.15);
      group.add(tie);

      // Groomed hair
      const hair = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.12, 0.28),
        hairMat
      );
      hair.position.set(0, 1.67, 0);
      group.add(hair);
    } else {
      // CASUAL: Baseball cap or hoodie
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.1, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      cap.position.set(0, 1.67, 0.04);
      group.add(cap);
    }

    // Limbs
    const armGeo = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    const legGeo = new THREE.BoxGeometry(0.2, 0.68, 0.2);
    const pantsMat = new THREE.MeshStandardMaterial({
      color: npc.archetype === 'POLICE' ? 0x1e3a8a : npc.archetype === 'BUSINESS' ? 0x1e293b : 0x334155,
      roughness: 0.8,
    });
    const shoeMat = darkMat;

    // Left Arm
    const lArmGroup = new THREE.Group();
    lArmGroup.position.set(-0.34, 1.25, 0);
    const lArm = new THREE.Mesh(armGeo, outfitMat);
    lArm.position.y = -0.28;
    lArmGroup.add(lArm);
    group.add(lArmGroup);
    this.leftArms.set(npc.id, lArmGroup);

    // Right Arm
    const rArmGroup = new THREE.Group();
    rArmGroup.position.set(0.34, 1.25, 0);
    const rArm = new THREE.Mesh(armGeo, outfitMat);
    rArm.position.y = -0.28;
    rArmGroup.add(rArm);
    group.add(rArmGroup);
    this.rightArms.set(npc.id, rArmGroup);

    // Left Leg
    const lLegGroup = new THREE.Group();
    lLegGroup.position.set(-0.14, 0.68, 0);
    const lLeg = new THREE.Mesh(legGeo, pantsMat);
    lLeg.position.y = -0.32;
    lLegGroup.add(lLeg);
    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.26), shoeMat);
    lShoe.position.set(0, -0.62, 0.03);
    lLegGroup.add(lShoe);
    group.add(lLegGroup);
    this.leftLegs.set(npc.id, lLegGroup);

    // Right Leg
    const rLegGroup = new THREE.Group();
    rLegGroup.position.set(0.14, 0.68, 0);
    const rLeg = new THREE.Mesh(legGeo, pantsMat);
    rLeg.position.y = -0.32;
    rLegGroup.add(rLeg);
    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.26), shoeMat);
    rShoe.position.set(0, -0.62, 0.03);
    rLegGroup.add(rShoe);
    group.add(rLegGroup);
    this.rightLegs.set(npc.id, rLegGroup);

    group.position.set(npc.position.x, npc.position.y, npc.position.z);
    group.rotation.y = npc.yaw;

    return group;
  }

  public notifyGunshot(shotOrigin: Vec3, playerPos: Vec3): { reportedCrime: boolean } {
    let reported = false;
    for (const npc of this.npcs) {
      if (npc.behavior === 'INCAPACITATED') continue;

      if (isSoundAudible(shotOrigin, npc.position, 'GUNSHOT')) {
        // Switch to FLEE
        npc.behavior = 'FLEE';
        npc.panicTimer = 12.0;
        npc.speed = 5.2;

        // Flee in opposite direction of gunshot
        const awayX = npc.position.x - shotOrigin.x;
        const awayZ = npc.position.z - shotOrigin.z;
        const len = Math.sqrt(awayX * awayX + awayZ * awayZ) || 1;
        npc.targetPoint = {
          x: npc.position.x + (awayX / len) * 30,
          y: npc.position.y,
          z: npc.position.z + (awayZ / len) * 30,
        };

        // If close witness, report to police
        if (V3.distance(npc.position, playerPos) < 25) {
          npc.isWitnessingCrime = true;
          npc.witnessTimer = 3.5;
          reported = true;
        }
      }
    }
    return { reportedCrime: reported };
  }

  public applyDamage(npcId: string, damage: number, knockbackDir: Vec3): { killed: boolean } {
    const npc = this.npcs.find((n) => n.id === npcId);
    if (!npc || npc.behavior === 'INCAPACITATED') return { killed: false };

    npc.health -= damage;
    npc.velocity = V3.scale(knockbackDir, 4.0);

    if (npc.health <= 0) {
      npc.health = 0;
      npc.behavior = 'INCAPACITATED';
      npc.animState = 'fall';
      
      // Lay flat on ground surface realistically without clipping
      const mesh = this.npcMeshes.get(npc.id);
      if (mesh) {
        mesh.rotation.x = Math.PI / 2;
        mesh.rotation.z = (Math.random() - 0.5) * 0.4;
        mesh.position.y = 0.22;
      }
      return { killed: true };
    } else {
      npc.behavior = 'FLEE';
      npc.panicTimer = 15.0;
      npc.speed = 5.6;
    }
    return { killed: false };
  }

  public removeNPC(id: string): void {
    const idx = this.npcs.findIndex((n) => n.id === id);
    if (idx !== -1) {
      this.npcs.splice(idx, 1);
    }
    const mesh = this.npcMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material?.dispose();
        }
      });
      this.npcMeshes.delete(id);
    }
    this.leftArms.delete(id);
    this.rightArms.delete(id);
    this.leftLegs.delete(id);
    this.rightLegs.delete(id);
  }

  public update(
    dt: number,
    collision: WorldCollisionData,
    sidewalkWaypoints: CityWaypoint[],
    playerPos: Vec3
  ): { witnessesCallingPolice: number } {
    let witnessesCallingPolice = 0;

    for (const npc of this.npcs) {
      if (npc.behavior === 'INCAPACITATED') continue;

      npc.animTime += dt * (npc.behavior === 'FLEE' ? 12 : 6);

      // Handle witness timer
      if (npc.isWitnessingCrime) {
        npc.witnessTimer -= dt;
        if (npc.witnessTimer <= 0) {
          witnessesCallingPolice++;
          npc.isWitnessingCrime = false;
        }
      }

      // Handle panic timer
      if (npc.behavior === 'FLEE') {
        npc.panicTimer -= dt;
        if (npc.panicTimer <= 0) {
          npc.behavior = 'PATROL_WALK';
          npc.speed = 1.8;
        }
      }

      // Waypoint Navigation
      if (!npc.targetPoint && sidewalkWaypoints.length > 0) {
        const wp = sidewalkWaypoints[Math.floor(Math.random() * sidewalkWaypoints.length)];
        npc.targetPoint = { x: wp.x, y: 0.22, z: wp.z };
      }

      if (npc.targetPoint) {
        const dx = npc.targetPoint.x - npc.position.x;
        const dz = npc.targetPoint.z - npc.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 1.8) {
          // Reached waypoint: pick new one
          if (sidewalkWaypoints.length > 0) {
            const wp = sidewalkWaypoints[Math.floor(Math.random() * sidewalkWaypoints.length)];
            npc.targetPoint = { x: wp.x, y: 0.22, z: wp.z };
          }
        } else {
          // Move towards target
          const normX = dx / dist;
          const normZ = dz / dist;

          const targetYaw = Math.atan2(normX, normZ);
          npc.yaw = targetYaw;

          npc.velocity.x = normX * npc.speed;
          npc.velocity.z = normZ * npc.speed;
        }
      }

      // Position step
      const nextX = npc.position.x + npc.velocity.x * dt;
      const nextZ = npc.position.z + npc.velocity.z * dt;
      const groundY = collision.groundElevation(nextX, nextZ);

      // Collision against world boxes
      let testPos = { x: nextX, y: groundY + 0.6, z: nextZ };
      for (const box of collision.boxes) {
        const res = resolveSphereAABBCollision(testPos, 0.4, box);
        if (res.collided) {
          testPos = res.position;
        }
      }

      npc.position.x = testPos.x;
      npc.position.z = testPos.z;
      npc.position.y = groundY;

      // Limb animation
      const legAngle = Math.sin(npc.animTime) * (npc.behavior === 'FLEE' ? 0.7 : 0.4);
      const lLeg = this.leftLegs.get(npc.id);
      const rLeg = this.rightLegs.get(npc.id);
      const lArm = this.leftArms.get(npc.id);
      const rArm = this.rightArms.get(npc.id);

      if (lLeg && rLeg && lArm && rArm) {
        lLeg.rotation.x = legAngle;
        rLeg.rotation.x = -legAngle;
        lArm.rotation.x = -legAngle * 0.8;
        rArm.rotation.x = legAngle * 0.8;
      }

      // Sync 3D mesh
      const mesh = this.npcMeshes.get(npc.id);
      if (mesh) {
        mesh.position.set(npc.position.x, npc.position.y, npc.position.z);
        mesh.rotation.y = npc.yaw;
      }
    }

    return { witnessesCallingPolice };
  }
}
