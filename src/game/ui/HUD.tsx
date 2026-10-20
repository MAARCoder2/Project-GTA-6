import React, { useMemo } from 'react';
import type { GameEngine } from '../GameEngine.ts';
import { WEAPON_REGISTRY } from '../rules.ts';
import { Shield, Heart, Zap, Crosshair, Star, AlertTriangle, Clock, Radio, Compass } from 'lucide-react';

interface HUDProps {
  engine: GameEngine;
}

export const HUD: React.FC<HUDProps> = ({ engine }) => {
  const player = engine.player;
  const currentVehicle = player.currentVehicle;
  const wanted = engine.policeSystem.wantedState;
  const mission = engine.missionSystem.activeMission;
  const weaponState = player.weaponState;
  const weaponDef = WEAPON_REGISTRY[weaponState.type];

  // Radar Minimap rendering
  const minimapSize = 140;
  const scale = 0.48; // meters to canvas pixels

  // Player position relative to minimap center
  const playerX = player.position.x;
  const playerZ = player.position.z;
  const playerYaw = player.yaw;

  // Radar vehicle blips
  const vehicleBlips = useMemo(() => {
    return engine.vehicleManager.vehicles.map((v) => {
      const dx = (v.position.x - playerX) * scale;
      const dz = (v.position.z - playerZ) * scale;
      return {
        id: v.id,
        dx,
        dz,
        isPolice: v.config.hasSiren,
        isDestroyed: v.isDestroyed,
        isPlayerVeh: v.id === currentVehicle?.id,
      };
    });
  }, [engine.vehicleManager.vehicles, playerX, playerZ, currentVehicle]);

  // Radar pedestrian blips
  const npcBlips = useMemo(() => {
    return engine.npcManager.npcs
      .filter((n) => n.behavior !== 'INCAPACITATED')
      .slice(0, 16)
      .map((n) => ({
        id: n.id,
        dx: (n.position.x - playerX) * scale,
        dz: (n.position.z - playerZ) * scale,
        isHostile: n.isHostile,
      }));
  }, [engine.npcManager.npcs, playerX, playerZ]);

  // Mission beacon blip
  const beaconBlip = useMemo(() => {
    if (!mission?.targetBeacon) return null;
    return {
      dx: (mission.targetBeacon.x - playerX) * scale,
      dz: (mission.targetBeacon.z - playerZ) * scale,
    };
  }, [mission?.targetBeacon, playerX, playerZ]);

  const speedKmh = currentVehicle ? Math.round(currentVehicle.speed * 3.6) : 0;
  const gear = currentVehicle
    ? currentVehicle.speed < 0.5
      ? 'N'
      : currentVehicle.isReversing
      ? 'R'
      : currentVehicle.speed < 12
      ? '1'
      : currentVehicle.speed < 22
      ? '2'
      : currentVehicle.speed < 30
      ? '3'
      : '4'
    : '';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-mono z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header: Wanted Level, Radio Scanner & Mission Banner */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Health, Armor, Stamina & Player Status */}
        <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 rounded-xl p-3 shadow-2xl flex flex-col gap-2 min-w-[210px]">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-sans border-b border-neutral-800/60 pb-1">
            <span className="font-semibold text-neutral-200 uppercase tracking-wider">APEX OPERATIVE</span>
            <span className="text-emerald-400 font-mono font-bold">${player.stats.cash.toLocaleString()}</span>
          </div>

          {/* Health Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Heart className="w-3.5 h-3.5 fill-emerald-500/20" /> VITALS
              </span>
              <span className="text-neutral-300 font-bold">{Math.round(player.stats.health)}%</span>
            </div>
            <div className="w-full bg-neutral-950/80 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, player.stats.health))}%` }}
              />
            </div>
          </div>

          {/* Armor Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-sky-400 font-semibold">
                <Shield className="w-3.5 h-3.5 fill-sky-500/20" /> KEVLAR
              </span>
              <span className="text-neutral-300 font-bold">{Math.round(player.stats.armor)}%</span>
            </div>
            <div className="w-full bg-neutral-950/80 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="bg-gradient-to-r from-sky-600 to-sky-400 h-full transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, player.stats.armor))}%` }}
              />
            </div>
          </div>

          {/* Stamina Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Zap className="w-3.5 h-3.5 fill-amber-500/20" /> STAMINA
              </span>
              <span className="text-neutral-400 text-[10px]">{Math.round(player.stats.stamina)}%</span>
            </div>
            <div className="w-full bg-neutral-950/80 h-1.5 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, player.stats.stamina))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Mission Objectives & Evasion Timer */}
        <div className="flex flex-col items-center gap-2 max-w-md w-full px-2">
          {mission && mission.status === 'ACTIVE' && (
            <div className="bg-neutral-900/90 backdrop-blur-md border border-amber-500/30 rounded-xl px-4 py-2.5 shadow-2xl w-full text-center animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-400 border-b border-neutral-800/80 pb-1 mb-1.5 font-heading uppercase tracking-wide">
                <span>{mission.def.title}</span>
                {mission.timeRemaining !== undefined && (
                  <span className={`flex items-center gap-1 font-mono font-bold ${mission.timeRemaining < 15 ? 'text-red-400 animate-pulse' : 'text-neutral-300'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {Math.ceil(mission.timeRemaining)}s
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-200 font-medium font-sans">{mission.objectiveText}</p>
            </div>
          )}

          {/* Wanted Stars Alert */}
          {wanted.level > 0 && (
            <div className="bg-red-950/80 backdrop-blur-md border border-red-500/40 rounded-xl px-4 py-1.5 shadow-2xl flex items-center gap-2 text-red-300 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold uppercase tracking-wider">PURSUIT ACTIVE</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= wanted.level
                        ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                        : 'text-neutral-700'
                    }`}
                  />
                ))}
              </div>
              {!wanted.isInSight && (
                <span className="text-[11px] text-yellow-300 font-bold ml-1">
                  EVADING: {Math.ceil(wanted.evasionCountdown)}s
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Weapon Info & Police Radio Scanner */}
        <div className="flex flex-col items-end gap-2 min-w-[190px]">
          {/* Active Weapon Card */}
          <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 rounded-xl p-3 shadow-2xl w-full">
            <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800 pb-1 mb-1 font-sans">
              <span className="font-semibold text-neutral-200 uppercase">{weaponDef.name}</span>
              <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">
                [{weaponState.type === 'PISTOL' ? '1' : weaponState.type === 'SMG' ? '2' : '3'}]
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-2xl font-bold font-mono text-neutral-100 tracking-tight">
                {weaponState.ammoInMag}
                <span className="text-sm font-normal text-neutral-500 ml-1">/ {weaponState.reserveAmmo}</span>
              </div>
              {weaponState.isReloading && (
                <span className="text-[10px] text-amber-400 font-bold animate-pulse uppercase">
                  RELOADING...
                </span>
              )}
            </div>
          </div>

          {/* Radio Transmission ticker */}
          <div className="bg-neutral-900/70 backdrop-blur-sm border border-neutral-800/60 rounded-lg px-2.5 py-1.5 text-[10px] text-neutral-400 flex items-center gap-1.5 max-w-[200px]">
            <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">METRO TAC DISPATCH: FREQ 104.8 MHZ</span>
          </div>
        </div>
      </div>

      {/* Center Aim Reticle */}
      {player.isAiming && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 border border-neutral-100/60 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_6px_#f43f5e]" />
            </div>
            <div className="absolute w-12 h-0.5 bg-neutral-300/40" />
            <div className="absolute h-12 w-0.5 bg-neutral-300/40" />
          </div>
        </div>
      )}

      {/* Bottom Area: Minimap Radar & Vehicle Telemetry */}
      <div className="flex items-end justify-between w-full">
        {/* Left: Circular Minimap Radar */}
        <div className="relative">
          <div
            className="relative rounded-full overflow-hidden border-2 border-neutral-700/80 bg-neutral-950/90 backdrop-blur-md shadow-2xl"
            style={{ width: `${minimapSize}px`, height: `${minimapSize}px` }}
          >
            {/* Compass Grid Rings */}
            <div className="absolute inset-0 rounded-full border border-neutral-800/60 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-neutral-800/40 pointer-events-none" />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-neutral-800/50 pointer-events-none" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-neutral-800/50 pointer-events-none" />

            {/* Minimap Center: Player Indicator */}
            <div
              className="absolute left-1/2 top-1/2 -ml-2 -mt-2 w-4 h-4 flex items-center justify-center"
              style={{ transform: `rotate(${playerYaw}rad)` }}
            >
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
            </div>

            {/* Vehicle Blips */}
            {vehicleBlips.map((b) => {
              if (b.isPlayerVeh) return null;
              const bx = minimapSize / 2 + b.dx;
              const by = minimapSize / 2 + b.dz;
              if (bx < 4 || bx > minimapSize - 4 || by < 4 || by > minimapSize - 4) return null;
              return (
                <div
                  key={b.id}
                  className={`absolute w-2 h-2 rounded-xs transform -translate-x-1/2 -translate-y-1/2 ${
                    b.isPolice ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'
                  }`}
                  style={{ left: `${bx}px`, top: `${by}px` }}
                />
              );
            })}

            {/* Pedestrian Dots */}
            {npcBlips.map((n) => {
              const nx = minimapSize / 2 + n.dx;
              const ny = minimapSize / 2 + n.dz;
              if (nx < 4 || nx > minimapSize - 4 || ny < 4 || ny > minimapSize - 4) return null;
              return (
                <div
                  key={n.id}
                  className={`absolute w-1 h-1 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                    n.isHostile ? 'bg-rose-500' : 'bg-neutral-300'
                  }`}
                  style={{ left: `${nx}px`, top: `${ny}px` }}
                />
              );
            })}

            {/* Mission Beacon Marker */}
            {beaconBlip && (
              <div
                className="absolute w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping transform -translate-x-1/2 -translate-y-1/2 border border-yellow-200"
                style={{
                  left: `${Math.max(6, Math.min(minimapSize - 6, minimapSize / 2 + beaconBlip.dx))}px`,
                  top: `${Math.max(6, Math.min(minimapSize - 6, minimapSize / 2 + beaconBlip.dz))}px`,
                }}
              />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-neutral-900 border border-neutral-700 text-[9px] px-1.5 py-0.5 rounded text-neutral-300 font-bold">
            GPS
          </div>
        </div>

        {/* Center: Interaction Context Prompts */}
        <div className="flex flex-col items-center gap-1.5 mb-1">
          {currentVehicle ? (
            <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-700/80 rounded-lg px-3 py-1 text-xs text-neutral-200 flex items-center gap-2">
              <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-bold text-[10px] border border-neutral-700">
                E
              </span>
              <span>Exit Vehicle</span>
              <span className="text-neutral-500">|</span>
              <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-bold text-[10px] border border-neutral-700">
                SPACE
              </span>
              <span>Handbrake</span>
            </div>
          ) : (
            <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-700/80 rounded-lg px-3 py-1 text-xs text-neutral-200 flex items-center gap-2">
              <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-bold text-[10px] border border-neutral-700">
                E
              </span>
              <span>Enter Nearby Vehicle</span>
              <span className="text-neutral-500">|</span>
              <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-bold text-[10px] border border-neutral-700">
                R-CLICK
              </span>
              <span>Aim</span>
            </div>
          )}
        </div>

        {/* Right: Vehicle Telemetry (Speedometer & Health) */}
        {currentVehicle ? (
          <div className="bg-neutral-900/85 backdrop-blur-md border border-neutral-800/80 rounded-xl p-3 shadow-2xl flex flex-col gap-1.5 min-w-[150px] animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-sans border-b border-neutral-800 pb-1">
              <span className="font-semibold text-neutral-300 uppercase truncate max-w-[90px]">
                {currentVehicle.config.name}
              </span>
              <span className="text-cyan-400 font-mono font-bold text-xs">{gear}</span>
            </div>
            <div className="flex items-baseline justify-center py-1">
              <span className="text-3xl font-extrabold font-mono text-neutral-100">{speedKmh}</span>
              <span className="text-xs text-neutral-400 font-semibold ml-1.5">KM/H</span>
            </div>
            {/* Vehicle Integrity Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>INTEGRITY</span>
                <span className="font-bold text-neutral-200">{Math.round((currentVehicle.health / currentVehicle.maxHealth) * 100)}%</span>
              </div>
              <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full transition-all duration-150 ${
                    currentVehicle.health < 40 ? 'bg-red-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, (currentVehicle.health / currentVehicle.maxHealth) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900/70 backdrop-blur-sm border border-neutral-800/60 rounded-xl px-3 py-2 text-[11px] text-neutral-400 flex items-center gap-2">
            <span>FPS: {engine.fps}</span>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-300">[P] Pause</span>
          </div>
        )}
      </div>
    </div>
  );
};
