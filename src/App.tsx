import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine.ts';
import { HUD } from './game/ui/HUD.tsx';
import { TitleScreen } from './game/ui/TitleScreen.tsx';
import { PauseMenu } from './game/ui/PauseMenu.tsx';
import { SettingsModal } from './game/ui/SettingsModal.tsx';
import { ControlsModal } from './game/ui/ControlsModal.tsx';
import { MissionSelectModal } from './game/ui/MissionSelectModal.tsx';
import type { GameMode, GameSettings, MissionId, PlayerStats } from './game/types.ts';
import { saveGameSave } from './game/save.ts';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Throttled UI state synchronization
  const [gameMode, setGameMode] = useState<GameMode>('TITLE');
  const [stats, setStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100,
    stamina: 100,
    maxStamina: 100,
    cash: 1250,
    reputation: 0,
    missionsCompleted: [],
  });
  const [settings, setSettings] = useState<GameSettings>({
    quality: 'HIGH',
    soundEnabled: true,
    musicEnabled: true,
    masterVolume: 0.8,
    cameraSensitivity: 1.0,
    invertY: false,
    shadows: true,
    showFps: true,
  });

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showMissions, setShowMissions] = useState(false);

  // State sync helper
  const syncUiState = useRef(() => {
    if (!engineRef.current) return;
    const eng = engineRef.current;
    setGameMode(eng.mode);
    setStats({ ...eng.player.stats });
    setSettings({ ...eng.settings });
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Check ?autostart=1 query parameter for automated testing
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';

    // Mount engine once
    const engine = new GameEngine(containerRef.current, autostart);
    engineRef.current = engine;

    engine.onStateChange = () => {
      syncUiState.current();
    };

    // Initial state sync
    syncUiState.current();

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.startGame();
      syncUiState.current();
    }
  };

  const handleResume = () => {
    if (engineRef.current && engineRef.current.mode === 'PAUSED') {
      engineRef.current.togglePause();
      syncUiState.current();
    }
  };

  const handleReturnToTitle = () => {
    if (engineRef.current) {
      engineRef.current.mode = 'TITLE';
      syncUiState.current();
    }
  };

  const handleSelectMission = (id: MissionId) => {
    if (engineRef.current) {
      engineRef.current.selectMission(id);
      syncUiState.current();
    }
  };

  const handleUpdateSettings = (partial: Partial<GameSettings>) => {
    if (!engineRef.current) return;
    const newSettings = { ...engineRef.current.settings, ...partial };
    engineRef.current.settings = newSettings;
    if (partial.quality) {
      engineRef.current.setQuality(partial.quality);
    }
    setSettings(newSettings);
    engineRef.current.saveData.settings = newSettings;
    saveGameSave(engineRef.current.saveData);
  };

  return (
    <div
      id="game-root"
      data-state={gameMode.toLowerCase()}
      data-testid="game-root"
      className="relative w-screen h-screen overflow-hidden bg-black select-none"
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        data-testid="game-canvas"
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />

      {/* In-Game HUD Overlay */}
      {engineRef.current && gameMode === 'PLAYING' && (
        <HUD engine={engineRef.current} />
      )}

      {/* Title Screen */}
      {gameMode === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenMissions={() => setShowMissions(true)}
          onOpenControls={() => setShowControls(true)}
          onOpenSettings={() => setShowSettings(true)}
          stats={stats}
        />
      )}

      {/* In-Game Pause Menu */}
      {gameMode === 'PAUSED' && (
        <PauseMenu
          onResume={handleResume}
          onRestartMission={
            engineRef.current?.missionSystem.activeMission
              ? () => handleSelectMission(engineRef.current!.missionSystem.activeMission!.def.id)
              : undefined
          }
          onOpenMissions={() => setShowMissions(true)}
          onOpenSettings={() => setShowSettings(true)}
          onReturnToTitle={handleReturnToTitle}
          activeMissionTitle={engineRef.current?.missionSystem.activeMission?.def.title}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Controls Guide Modal */}
      {showControls && (
        <ControlsModal onClose={() => setShowControls(false)} />
      )}

      {/* Mission Dossier Modal */}
      {showMissions && (
        <MissionSelectModal
          onSelectMission={handleSelectMission}
          onClose={() => setShowMissions(false)}
          completedMissions={stats.missionsCompleted}
        />
      )}
    </div>
  );
};

export default App;
