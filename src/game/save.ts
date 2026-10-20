import type { SaveGameData, GameSettings, PlayerStats } from './types.ts';

export const SAVE_KEY = 'project_apex_save_v1';
export const CURRENT_SAVE_VERSION = 1;

export const DEFAULT_SETTINGS: GameSettings = {
  quality: 'HIGH',
  soundEnabled: true,
  musicEnabled: true,
  masterVolume: 0.8,
  cameraSensitivity: 1.0,
  invertY: false,
  shadows: true,
  showFps: true,
};

export const DEFAULT_STATS: PlayerStats = {
  health: 100,
  maxHealth: 100,
  armor: 50,
  maxArmor: 100,
  stamina: 100,
  maxStamina: 100,
  cash: 1250,
  reputation: 0,
  missionsCompleted: [],
};

export function createDefaultSaveData(): SaveGameData {
  return {
    version: CURRENT_SAVE_VERSION,
    stats: { ...DEFAULT_STATS },
    settings: { ...DEFAULT_SETTINGS },
    unlockedVehicles: ['APEX_SPORT', 'METRO_PATROL', 'TITAN_ENFORCER'],
    bestMissionTimes: {},
    timestamp: Date.now(),
  };
}

export function parseAndMigrateSave(rawJson: string | null): SaveGameData {
  if (!rawJson) {
    return createDefaultSaveData();
  }

  try {
    const data = JSON.parse(rawJson);
    if (!data || typeof data !== 'object') {
      return createDefaultSaveData();
    }

    // Version migration handling
    if (!data.version || data.version < CURRENT_SAVE_VERSION) {
      // Migrate from older version
      return {
        ...createDefaultSaveData(),
        ...data,
        version: CURRENT_SAVE_VERSION,
        stats: {
          ...DEFAULT_STATS,
          ...(data.stats || {}),
        },
        settings: {
          ...DEFAULT_SETTINGS,
          ...(data.settings || {}),
        },
      };
    }

    return {
      version: CURRENT_SAVE_VERSION,
      stats: {
        ...DEFAULT_STATS,
        ...(data.stats || {}),
      },
      settings: {
        ...DEFAULT_SETTINGS,
        ...(data.settings || {}),
      },
      unlockedVehicles: Array.isArray(data.unlockedVehicles) ? data.unlockedVehicles : ['APEX_SPORT', 'METRO_PATROL', 'TITAN_ENFORCER'],
      bestMissionTimes: typeof data.bestMissionTimes === 'object' ? data.bestMissionTimes : {},
      timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
    };
  } catch {
    return createDefaultSaveData();
  }
}

export function loadGameSave(): SaveGameData {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDefaultSaveData();
  }
  const raw = window.localStorage.getItem(SAVE_KEY);
  return parseAndMigrateSave(raw);
}

export function saveGameSave(data: SaveGameData): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const serialized = JSON.stringify({
      ...data,
      timestamp: Date.now(),
    });
    window.localStorage.setItem(SAVE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function clearGameSave(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(SAVE_KEY);
  }
}
