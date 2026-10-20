export type GameMode = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'MISSION_COMPLETE';

export type QualityPreset = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GameSettings {
  quality: QualityPreset;
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;
  cameraSensitivity: number;
  invertY: boolean;
  shadows: boolean;
  showFps: boolean;
}

export type WeaponType = 'PISTOL' | 'SMG' | 'SHOTGUN';

export interface WeaponDef {
  id: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // shots per second
  magazineSize: number;
  reloadTime: number; // seconds
  range: number;
  spread: number;
  pellets: number;
  automatic: boolean;
}

export interface WeaponState {
  type: WeaponType;
  ammoInMag: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadTimer: number;
  lastFireTime: number;
}

export type VehicleType = 'APEX_SPORT' | 'METRO_PATROL' | 'TITAN_ENFORCER';

export interface VehicleConfig {
  type: VehicleType;
  name: string;
  mass: number;
  maxSpeed: number; // m/s
  acceleration: number; // m/s^2
  brakeForce: number;
  reverseSpeed: number;
  turnSpeed: number;
  health: number;
  dimensions: { width: number; height: number; length: number };
  color: string;
  accentColor: string;
  hasSiren?: boolean;
}

export interface VehicleInstance {
  id: string;
  config: VehicleConfig;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  yaw: number;
  pitch: number;
  roll: number;
  velocity: { x: number; y: number; z: number };
  speed: number; // current scalar speed
  steering: number; // current steering angle
  health: number;
  maxHealth: number;
  isEngineRunning: boolean;
  isBraking: boolean;
  isReversing: boolean;
  sirenActive: boolean;
  isDestroyed: boolean;
  driverId: string | null; // 'player' or NPC id or null
  wheelRotation: number;
  frontWheelSteer: number;
}

export type NPCBehavior = 'IDLE' | 'PATROL_WALK' | 'FLEE' | 'WITNESS_ALERT' | 'HOSTILE' | 'INCAPACITATED';

export interface NPCInstance {
  id: string;
  name: string;
  behavior: NPCBehavior;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  yaw: number;
  health: number;
  maxHealth: number;
  speed: number;
  targetPoint: { x: number; y: number; z: number } | null;
  stateTimer: number;
  isWitnessingCrime: boolean;
  witnessTimer: number;
  panicTimer: number;
  outfitColor: string;
  isHostile?: boolean;
  isPolice?: boolean;
  isInVehicle?: string | null;
  animState: 'idle' | 'walk' | 'run' | 'flee' | 'fall';
  animTime: number;
}

export type CrimeType = 
  | 'RECKLESS_DRIVING'
  | 'VEHICLE_THEFT'
  | 'ASSAULT'
  | 'FIREARM_DISCHARGE'
  | 'OFFICER_ATTACK'
  | 'VEHICLE_DESTRUCTION';

export interface CrimeEvent {
  id: string;
  type: CrimeType;
  position: { x: number; y: number; z: number };
  timestamp: number;
  witnessed: boolean;
  escalation: number; // wanted stars added
}

export interface WantedState {
  level: number; // 0 to 5
  lastCrimeTime: number;
  isInSight: boolean;
  sightTimer: number;
  evasionCountdown: number; // countdown until stars drop when lost sight
  lastKnownPosition: { x: number; y: number; z: number } | null;
  activePursuitCount: number;
}

export type MissionId = 'MISSION_1_DELIVERY' | 'MISSION_2_INTERCEPTION' | 'MISSION_3_EXTRACTION';

export interface MissionStep {
  id: string;
  description: string;
  targetPosition?: { x: number; y: number; z: number };
  targetRadius?: number;
  completed: boolean;
}

export interface MissionDef {
  id: MissionId;
  title: string;
  subtitle: string;
  briefing: string;
  timeLimit?: number; // seconds
  reward: number; // cash / reputation
  steps: MissionStep[];
}

export interface ActiveMissionState {
  def: MissionDef;
  currentStepIndex: number;
  timeRemaining?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  objectiveText: string;
  targetBeacon?: { x: number; y: number; z: number } | null;
  targetVehicleId?: string | null;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  stamina: number;
  maxStamina: number;
  cash: number;
  reputation: number;
  missionsCompleted: string[];
}

export interface SaveGameData {
  version: number;
  stats: PlayerStats;
  settings: GameSettings;
  unlockedVehicles: string[];
  bestMissionTimes: Record<string, number>;
  timestamp: number;
}

export interface BoundingBox3D {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

export interface Ray3D {
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
}

export interface RayHit {
  hit: boolean;
  point: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  distance: number;
  entityId?: string;
  entityType?: 'WORLD' | 'VEHICLE' | 'NPC';
}
