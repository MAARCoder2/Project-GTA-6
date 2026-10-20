import * as THREE from 'three';
import type { ActiveMissionState, MissionDef, MissionId } from '../types.ts';
import { V3, type Vec3 } from '../physics.ts';
import { gameAudio } from '../audio.ts';
import type { VehicleManager, VehicleInstance } from '../entities/VehicleManager.ts';
import type { NPCManager } from '../entities/NPCManager.ts';
import type { PoliceSystem } from '../entities/PoliceSystem.ts';

export const MISSIONS: Record<MissionId, MissionDef> = {
  MISSION_1_DELIVERY: {
    id: 'MISSION_1_DELIVERY',
    title: 'Courier Blitz',
    subtitle: 'High Priority Urban Transit',
    briefing: 'Deliver urgent telemetry drive packages across 4 district drop-off points before the security protocol window expires.',
    timeLimit: 85,
    reward: 2500,
    steps: [
      { id: 's1', description: 'Drop package at Financial Plaza Atrium', targetPosition: { x: -35, y: 0.22, z: -35 }, targetRadius: 4.5, completed: false },
      { id: 's2', description: 'Deliver payload to Transit Hub Station', targetPosition: { x: 105, y: 0.22, z: 35 }, targetRadius: 4.5, completed: false },
      { id: 's3', description: 'Pickup encrypted chip at Residential Heights', targetPosition: { x: -35, y: 0.22, z: 35 }, targetRadius: 4.5, completed: false },
      { id: 's4', description: 'Return to Apex Safehouse depot', targetPosition: { x: -105, y: 0.22, z: 105 }, targetRadius: 5.0, completed: false },
    ],
  },
  MISSION_2_INTERCEPTION: {
    id: 'MISSION_2_INTERCEPTION',
    title: 'Interception Protocol',
    subtitle: 'Rogue Syndicate Takedown',
    briefing: 'A high-value syndicate courier is speeding through the district. Intercept, ram, and disable their vehicle.',
    timeLimit: 110,
    reward: 4500,
    steps: [
      { id: 's1', description: 'Locate and chase the syndicate runner car', completed: false },
      { id: 's2', description: 'Ram and disable the suspect vehicle', completed: false },
      { id: 's3', description: 'Secure the disabled vehicle area', completed: false },
    ],
  },
  MISSION_3_EXTRACTION: {
    id: 'MISSION_3_EXTRACTION',
    title: 'District Extraction',
    subtitle: 'Infiltration & High-Heat Escape',
    briefing: 'Infiltrate the Industrial Freight Depot, neutralize hostile syndicate guards, retrieve the cargo, and lose the ensuing police search.',
    reward: 7500,
    steps: [
      { id: 's1', description: 'Infiltrate Freight Depot warehouse back alley', targetPosition: { x: -35, y: 0.22, z: 115 }, targetRadius: 5.0, completed: false },
      { id: 's2', description: 'Neutralize the 3 hostile syndicate guards', completed: false },
      { id: 's3', description: 'Retrieve the tactical payload container', targetPosition: { x: -35, y: 0.22, z: 118 }, targetRadius: 3.5, completed: false },
      { id: 's4', description: 'Evade high-heat police search and reach safehouse', targetPosition: { x: 105, y: 0.22, z: -35 }, targetRadius: 6.0, completed: false },
    ],
  },
};

export class MissionSystem {
  public activeMission: ActiveMissionState | null = null;
  public completedMissionIds: string[] = [];
  private beaconGroup: THREE.Group;
  private beaconBeam: THREE.Mesh;
  private beaconRing: THREE.Mesh;
  private targetVehicle: VehicleInstance | null = null;
  private missionEnemies: string[] = [];

  constructor(scene: THREE.Object3D) {
    this.beaconGroup = new THREE.Group();
    this.beaconGroup.name = 'MissionBeacon';

    // Glowing vertical light cylinder
    const beamGeo = new THREE.CylinderGeometry(0.8, 0.8, 60, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.beaconBeam = new THREE.Mesh(beamGeo, beamMat);
    this.beaconBeam.position.y = 30;
    this.beaconGroup.add(this.beaconBeam);

    // Glowing ground ring
    const ringGeo = new THREE.RingGeometry(2.5, 3.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.beaconRing = new THREE.Mesh(ringGeo, ringMat);
    this.beaconRing.rotation.x = -Math.PI / 2;
    this.beaconRing.position.y = 0.15;
    this.beaconGroup.add(this.beaconRing);

    this.beaconGroup.visible = false;
    scene.add(this.beaconGroup);
  }

  public startMission(
    id: MissionId,
    vehicleManager: VehicleManager,
    npcManager: NPCManager
  ): void {
    const def = MISSIONS[id];
    if (!def) return;

    // Deep copy steps
    const steps = def.steps.map((s) => ({ ...s, completed: false }));

    this.activeMission = {
      def: { ...def, steps },
      currentStepIndex: 0,
      timeRemaining: def.timeLimit,
      status: 'ACTIVE',
      objectiveText: steps[0].description,
      targetBeacon: steps[0].targetPosition || null,
      targetVehicleId: null,
    };

    // Mission specific setups
    if (id === 'MISSION_2_INTERCEPTION') {
      // Spawn suspect vehicle at far avenue
      const rogue = vehicleManager.spawnVehicle(
        'APEX_SPORT',
        { x: 70, y: 0.1, z: -70 },
        Math.PI,
        'rogue_courier_car'
      );
      rogue.speed = 22;
      this.targetVehicle = rogue;
      this.activeMission.targetVehicleId = rogue.id;
    } else if (id === 'MISSION_3_EXTRACTION') {
      // Spawn 3 hostile syndicate operatives at the warehouse alley
      this.missionEnemies = [];
      const hostilePositions = [
        { x: -32, y: 0.22, z: 114 },
        { x: -38, y: 0.22, z: 116 },
        { x: -35, y: 0.22, z: 120 },
      ];
      for (let i = 0; i < hostilePositions.length; i++) {
        const enemy = npcManager.spawnNPC(
          `Syndicate Operative #${i + 1}`,
          hostilePositions[i],
          [],
          true
        );
        this.missionEnemies.push(enemy.id);
      }
    }

    this.updateBeacon();
    gameAudio.playUIBlip('CONFIRM');
  }

  public update(
    dt: number,
    playerPos: Vec3,
    npcManager: NPCManager,
    policeSystem: PoliceSystem,
    onMissionCompleted: (reward: number) => void
  ): void {
    if (!this.activeMission || this.activeMission.status !== 'ACTIVE') {
      this.beaconGroup.visible = false;
      return;
    }

    // Animate beacon pulse & rotation
    const time = Date.now() * 0.003;
    this.beaconRing.scale.setScalar(1 + Math.sin(time * 3) * 0.12);
    this.beaconBeam.rotation.y = time;

    // Time limit countdown
    if (this.activeMission.timeRemaining !== undefined) {
      this.activeMission.timeRemaining -= dt;
      if (this.activeMission.timeRemaining <= 0) {
        this.activeMission.status = 'FAILED';
        this.activeMission.objectiveText = 'MISSION FAILED: Time Expired';
        this.beaconGroup.visible = false;
        gameAudio.playUIBlip('ALERT');
        return;
      }
    }

    const currentStep = this.activeMission.def.steps[this.activeMission.currentStepIndex];

    // Check step completion criteria
    if (this.activeMission.def.id === 'MISSION_1_DELIVERY') {
      if (currentStep && currentStep.targetPosition) {
        const d = V3.distance(playerPos, currentStep.targetPosition);
        if (d <= (currentStep.targetRadius || 4.5)) {
          this.advanceStep(onMissionCompleted);
        }
      }
    } else if (this.activeMission.def.id === 'MISSION_2_INTERCEPTION') {
      if (this.activeMission.currentStepIndex === 0) {
        // Step 1: get close to rogue car
        if (this.targetVehicle) {
          const d = V3.distance(playerPos, this.targetVehicle.position);
          this.activeMission.targetBeacon = { ...this.targetVehicle.position };
          if (d < 18) {
            this.advanceStep(onMissionCompleted);
          }
        }
      } else if (this.activeMission.currentStepIndex === 1) {
        // Step 2: disable vehicle
        if (this.targetVehicle) {
          this.activeMission.targetBeacon = { ...this.targetVehicle.position };
          if (this.targetVehicle.isDestroyed || this.targetVehicle.health <= 0) {
            this.advanceStep(onMissionCompleted);
          }
        }
      } else if (this.activeMission.currentStepIndex === 2) {
        // Step 3: secure area
        if (this.targetVehicle) {
          const d = V3.distance(playerPos, this.targetVehicle.position);
          if (d < 6.0) {
            this.advanceStep(onMissionCompleted);
          }
        }
      }
    } else if (this.activeMission.def.id === 'MISSION_3_EXTRACTION') {
      if (this.activeMission.currentStepIndex === 0) {
        // Infiltrate warehouse
        if (currentStep && currentStep.targetPosition) {
          const d = V3.distance(playerPos, currentStep.targetPosition);
          if (d <= 5.0) {
            this.advanceStep(onMissionCompleted);
          }
        }
      } else if (this.activeMission.currentStepIndex === 1) {
        // Neutralize 3 guards
        const aliveCount = npcManager.npcs.filter(
          (n) => this.missionEnemies.includes(n.id) && n.behavior !== 'INCAPACITATED'
        ).length;
        if (aliveCount === 0) {
          // Trigger police wanted search for phase 4!
          policeSystem.reportCrime('FIREARM_DISCHARGE', playerPos, true);
          policeSystem.wantedState.level = 3;
          this.advanceStep(onMissionCompleted);
        }
      } else if (this.activeMission.currentStepIndex === 2) {
        // Retrieve package
        if (currentStep && currentStep.targetPosition) {
          const d = V3.distance(playerPos, currentStep.targetPosition);
          if (d <= 3.5) {
            this.advanceStep(onMissionCompleted);
          }
        }
      } else if (this.activeMission.currentStepIndex === 3) {
        // Escape wanted search and reach safehouse
        if (currentStep && currentStep.targetPosition) {
          const d = V3.distance(playerPos, currentStep.targetPosition);
          if (d <= 6.0 && policeSystem.wantedState.level === 0) {
            this.advanceStep(onMissionCompleted);
          }
        }
      }
    }

    this.updateBeacon();
  }

  private advanceStep(onMissionCompleted: (reward: number) => void): void {
    if (!this.activeMission) return;
    this.activeMission.def.steps[this.activeMission.currentStepIndex].completed = true;
    this.activeMission.currentStepIndex++;

    if (this.activeMission.currentStepIndex >= this.activeMission.def.steps.length) {
      // Mission Complete!
      this.activeMission.status = 'COMPLETED';
      this.activeMission.objectiveText = 'MISSION ACCOMPLISHED';
      this.beaconGroup.visible = false;
      this.completedMissionIds.push(this.activeMission.def.id);
      gameAudio.playUIBlip('SUCCESS');
      onMissionCompleted(this.activeMission.def.reward);
    } else {
      // Next Step
      const nextStep = this.activeMission.def.steps[this.activeMission.currentStepIndex];
      this.activeMission.objectiveText = nextStep.description;
      this.activeMission.targetBeacon = nextStep.targetPosition || null;
      gameAudio.playUIBlip('CONFIRM');
    }
  }

  private updateBeacon(): void {
    if (!this.activeMission || this.activeMission.status !== 'ACTIVE' || !this.activeMission.targetBeacon) {
      this.beaconGroup.visible = false;
      return;
    }

    this.beaconGroup.visible = true;
    this.beaconGroup.position.set(
      this.activeMission.targetBeacon.x,
      this.activeMission.targetBeacon.y,
      this.activeMission.targetBeacon.z
    );
  }
}
