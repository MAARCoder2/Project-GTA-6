import * as THREE from 'three';
import { buildCityDistrict, type CityDistrict } from './world.ts';
import { PlayerController } from './entities/PlayerController.ts';
import { VehicleManager } from './entities/VehicleManager.ts';
import { NPCManager } from './entities/NPCManager.ts';
import { PoliceSystem } from './entities/PoliceSystem.ts';
import { MissionSystem } from './missions/MissionSystem.ts';
import { gameAudio } from './audio.ts';
import type { GameMode, GameSettings, PlayerStats, SaveGameData, WeaponType, MissionId } from './types.ts';
import { loadGameSave, saveGameSave } from './save.ts';
import { computeBulletDamage, WEAPON_REGISTRY } from './rules.ts';
import { queryRaycastIntersection, type Ray3D, V3, type Vec3 } from './physics.ts';

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public district: CityDistrict;
  public player: PlayerController;
  public vehicleManager: VehicleManager;
  public npcManager: NPCManager;
  public policeSystem: PoliceSystem;
  public missionSystem: MissionSystem;

  public mode: GameMode = 'TITLE';
  public settings: GameSettings;
  public saveData: SaveGameData;
  public fps = 60;

  private isRunning = false;
  private animationFrameId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDt = 1 / 60; // 60 Hz physics

  // Input states
  private keys: Record<string, boolean> = {};
  private mouseMoveX = 0;
  private mouseMoveY = 0;
  private isMouseDown = false;
  private isRightMouseDown = false;
  private interactPressed = false;

  // React state synchronization callback
  public onStateChange?: () => void;

  constructor(container: HTMLElement, autostart = false) {
    this.container = container;
    this.saveData = loadGameSave();
    this.settings = { ...this.saveData.settings };

    // Detect headless test runner
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (Boolean(navigator.webdriver) || /HeadlessChrome/i.test(navigator.userAgent));

    // Three.js Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16); // Cinematic night/twilight blue
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.007);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 400);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isHeadless,
      stencil: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 1.5));
    if (this.settings.shadows && !isHeadless) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    container.appendChild(this.renderer.domElement);

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0x64748b, 1.8);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.0);
    sunLight.position.set(60, 100, 40);
    if (this.settings.shadows && !isHeadless) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 250;
      sunLight.shadow.camera.left = -90;
      sunLight.shadow.camera.right = 90;
      sunLight.shadow.camera.top = 90;
      sunLight.shadow.camera.bottom = -90;
      sunLight.shadow.bias = -0.0005;
    }
    this.scene.add(sunLight);

    // City street level fill light to illuminate characters and vehicle details
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-40, 30, -30);
    this.scene.add(fillLight);

    // World & Systems
    this.district = buildCityDistrict();
    this.scene.add(this.district.sceneGroup);

    this.player = new PlayerController(this.scene, this.saveData.stats);
    this.vehicleManager = new VehicleManager(this.scene);
    this.npcManager = new NPCManager(this.scene);
    this.policeSystem = new PoliceSystem();
    this.missionSystem = new MissionSystem(this.scene);

    // Seed City Vehicles
    this.seedVehicles();

    // Seed Pedestrians
    this.seedPedestrians();

    // Event Listeners
    this.setupInputs();
    window.addEventListener('resize', this.onResize);

    if (autostart) {
      this.startGame();
    }
  }

  private seedVehicles(): void {
    // Player start vehicle: Apex Sport parked nearby on the avenue
    this.vehicleManager.spawnVehicle('APEX_SPORT', { x: 5, y: 0.1, z: 12 }, Math.PI / 2);
    // Police Cruiser parked at police precinct
    this.vehicleManager.spawnVehicle('METRO_PATROL', { x: 105, y: 0.1, z: -10 }, 0);
    // Titan Tactical SUV parked near construction site
    this.vehicleManager.spawnVehicle('TITAN_ENFORCER', { x: 35, y: 0.1, z: 80 }, 0);
    // Civilian vehicles parked along blocks
    this.vehicleManager.spawnVehicle('APEX_SPORT', { x: -35, y: 0.1, z: -10 }, Math.PI);
    this.vehicleManager.spawnVehicle('TITAN_ENFORCER', { x: -105, y: 0.1, z: 10 }, Math.PI / 2);
  }

  private seedPedestrians(): void {
    const names = [
      'Marcus Cole', 'Elena Vance', 'Darius Reed', 'Chloe Bennett',
      'Victor Vance', 'Maya Lin', 'Jackson Cross', 'Sasha Thorne',
      'Arthur Pendelton', 'Lucia Santos', 'Zane Mercer', 'Nadia Drake',
      'Roman Sterling', 'Kira Scott', 'Caleb Vance', 'Samira Khan',
    ];

    for (let i = 0; i < names.length; i++) {
      if (this.district.sidewalkWaypoints.length > 0) {
        const wp = this.district.sidewalkWaypoints[i % this.district.sidewalkWaypoints.length];
        this.npcManager.spawnNPC(
          names[i],
          { x: wp.x + (Math.random() - 0.5) * 4, y: 0.22, z: wp.z + (Math.random() - 0.5) * 4 },
          this.district.sidewalkWaypoints
        );
      }
    }
  }

  private setupInputs(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Handle direct key triggers
      if (e.code === 'KeyE') {
        this.interactPressed = true;
      }
      if (e.code === 'KeyR') {
        this.player.triggerReload();
      }
      if (e.code === 'Digit1') {
        this.player.setWeapon('PISTOL');
      }
      if (e.code === 'Digit2') {
        this.player.setWeapon('SMG');
      }
      if (e.code === 'Digit3') {
        this.player.setWeapon('SHOTGUN');
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.container.addEventListener('mousedown', (e) => {
      gameAudio.init();
      if (e.button === 0) this.isMouseDown = true;
      if (e.button === 2) this.isRightMouseDown = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isMouseDown = false;
      if (e.button === 2) this.isRightMouseDown = false;
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mode !== 'PLAYING') return;

      const sens = 0.0024 * this.settings.cameraSensitivity;
      this.player.cameraYaw -= e.movementX * sens;
      const invert = this.settings.invertY ? -1 : 1;
      this.player.cameraPitch = Math.max(
        -0.25,
        Math.min(0.85, this.player.cameraPitch + e.movementY * sens * invert)
      );
    });
  }

  private onResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public startGame(): void {
    gameAudio.init();
    this.mode = 'PLAYING';
    this.lastTime = performance.now();
    this.isRunning = true;
    this.loop(this.lastTime);
    if (this.onStateChange) this.onStateChange();
  }

  public togglePause(): void {
    if (this.mode === 'PLAYING') {
      this.mode = 'PAUSED';
      gameAudio.setMuted(true);
    } else if (this.mode === 'PAUSED') {
      this.mode = 'PLAYING';
      gameAudio.setMuted(!this.settings.soundEnabled);
      this.lastTime = performance.now();
    }
    if (this.onStateChange) this.onStateChange();
  }

  public selectMission(id: MissionId): void {
    this.missionSystem.startMission(id, this.vehicleManager, this.npcManager);
    if (this.mode !== 'PLAYING') {
      this.startGame();
    }
  }

  public setQuality(preset: 'LOW' | 'MEDIUM' | 'HIGH'): void {
    this.settings.quality = preset;
    if (preset === 'LOW') {
      this.settings.shadows = false;
      this.renderer.shadowMap.enabled = false;
    } else {
      this.settings.shadows = true;
      this.renderer.shadowMap.enabled = true;
    }
    this.saveData.settings = { ...this.settings };
    saveGameSave(this.saveData);
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    const frameTime = (currentTime - this.lastTime) * 0.001;
    this.lastTime = currentTime;

    // Estimate FPS
    if (frameTime > 0) {
      this.fps = Math.round(1 / frameTime);
    }

    if (this.mode === 'PLAYING') {
      // Fixed timestep accumulation
      this.accumulator += Math.min(frameTime, 0.1);
      while (this.accumulator >= this.fixedDt) {
        this.fixedUpdate(this.fixedDt);
        this.accumulator -= this.fixedDt;
      }
    }

    // Render pass
    this.player.updateCamera(this.camera, this.district.collision);
    this.renderer.render(this.scene, this.camera);
  };

  private fixedUpdate(dt: number): void {
    // Gather Input
    let moveForward = 0;
    let moveRight = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;

    const sprint = Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const jump = Boolean(this.keys['Space']);
    const aim = this.isRightMouseDown;
    const fire = this.isMouseDown;
    const interact = this.interactPressed;
    this.interactPressed = false;

    // Update Player
    const playerResult = this.player.update(
      dt,
      { moveForward, moveRight, sprint, jump, aim, fire, interact },
      this.district.collision,
      this.vehicleManager
    );

    // If player fired weapon: check unobstructed 3D raycast hits against world blockers, vehicles, and NPCs
    if (playerResult.shotFired && playerResult.shotOrigin && playerResult.shotDirection) {
      const ray: Ray3D = {
        origin: playerResult.shotOrigin,
        direction: playerResult.shotDirection,
      };

      // Pass true weapon muzzle sound origin to police and pedestrians
      this.policeSystem.reportCrime('FIREARM_DISCHARGE', playerResult.shotOrigin, true);
      this.npcManager.notifyGunshot(playerResult.shotOrigin, this.player.position);

      const def = WEAPON_REGISTRY[this.player.weaponState.type];

      // Prepare vehicle collision bounding boxes
      const vehicleTargets = this.vehicleManager.vehicles
        .filter((v) => !v.isDestroyed)
        .map((v) => {
          const halfW = v.config.dimensions.width * 0.5;
          const halfL = v.config.dimensions.length * 0.5;
          const cosY = Math.abs(Math.cos(v.yaw));
          const sinY = Math.abs(Math.sin(v.yaw));
          const extX = halfW * cosY + halfL * sinY;
          const extZ = halfW * sinY + halfL * cosY;
          return {
            id: v.id,
            box: {
              min: { x: v.position.x - extX, y: v.position.y, z: v.position.z - extZ },
              max: { x: v.position.x + extX, y: v.position.y + v.config.dimensions.height, z: v.position.z + extZ },
            },
          };
        });

      // Prepare active NPCs
      const npcTargets = this.npcManager.npcs
        .filter((n) => n.behavior !== 'INCAPACITATED')
        .map((n) => ({ id: n.id, position: n.position }));

      // Unobstructed 3D raycast hit query (nearest target selected; world blockers occlude)
      const hitResult = queryRaycastIntersection(
        ray,
        def.range,
        this.district.collision.boxes,
        npcTargets,
        vehicleTargets
      );

      if (hitResult.hit) {
        if (hitResult.targetType === 'NPC' && hitResult.targetId) {
          const hitNpc = this.npcManager.npcs.find((n) => n.id === hitResult.targetId);
          const isHeadshot = hitResult.hitPoint
            ? hitResult.hitPoint.y >= (hitNpc?.position.y || 0) + 1.35
            : Math.random() < 0.25;
          const dmg = computeBulletDamage(def, hitResult.distance, isHeadshot);
          const res = this.npcManager.applyDamage(hitResult.targetId, dmg, playerResult.shotDirection);
          this.policeSystem.reportCrime('ASSAULT', hitNpc?.position || this.player.position, true);
          if (res.killed) {
            this.saveData.stats.cash += 150;
          }
        } else if (hitResult.targetType === 'VEHICLE' && hitResult.targetId) {
          const veh = this.vehicleManager.vehicles.find((v) => v.id === hitResult.targetId);
          if (veh && !veh.isDestroyed) {
            veh.health = Math.max(0, veh.health - def.damage);
            gameAudio.playCollisionImpact(14);
            if (veh.health <= 0) {
              veh.isDestroyed = true;
              this.vehicleManager.onVehicleDestroyed(veh);
              this.policeSystem.reportCrime('VEHICLE_DESTRUCTION', veh.position, true);
            }
          }
        } else if (hitResult.targetType === 'WORLD') {
          // Bullet struck world wall/geometry: play impact sound
          gameAudio.playCollisionImpact(8);
        }
      }
    }

    // Update Vehicles
    const drivingId = this.player.currentVehicle ? this.player.currentVehicle.id : null;
    this.vehicleManager.update(dt, this.district.collision, drivingId);
    if (this.player.currentVehicle) {
      this.player.position = { ...this.player.currentVehicle.position };
    }

    // Update NPCs
    const npcResults = this.npcManager.update(
      dt,
      this.district.collision,
      this.district.sidewalkWaypoints,
      this.player.position
    );
    if (npcResults.witnessesCallingPolice > 0) {
      this.policeSystem.reportCrime('ASSAULT', this.player.position, true);
    }

    // Update Police
    this.policeSystem.update(
      dt,
      this.player.position,
      this.district.roadWaypoints,
      this.vehicleManager
    );

    // Update Missions
    this.missionSystem.update(
      dt,
      this.player.position,
      this.npcManager,
      this.policeSystem,
      (reward) => {
        this.saveData.stats.cash += reward;
        this.saveData.stats.reputation += 100;
        this.saveData.stats.missionsCompleted.push(this.missionSystem.activeMission?.def.id || '');
        saveGameSave(this.saveData);
        if (this.onStateChange) this.onStateChange();
      }
    );

    // Periodic state notification to React UI (every few ticks)
    if (this.onStateChange && Math.random() < 0.2) {
      this.onStateChange();
    }
  }

  public dispose(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
