import React from 'react';
import { Play, Flag, Settings as SettingsIcon, HelpCircle, Shield, Award, DollarSign } from 'lucide-react';
import type { PlayerStats } from '../types.ts';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenMissions: () => void;
  onOpenControls: () => void;
  onOpenSettings: () => void;
  stats: PlayerStats;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenMissions,
  onOpenControls,
  onOpenSettings,
  stats,
}) => {
  return (
    <div className="absolute inset-0 bg-radial from-neutral-900/90 via-neutral-950/95 to-black z-30 flex flex-col justify-between p-6 sm:p-12 overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20">
            <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center font-heading font-black text-rose-500 text-lg">
              A
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block">
              AUTONOMOUS 3D URBAN BENCHMARK
            </span>
            <span className="text-sm font-heading font-bold text-neutral-200">PROJECT APEX v1.0.4</span>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-emerald-400">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${stats.cash.toLocaleString()}</span>
          </div>
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-sky-400">
            <Award className="w-3.5 h-3.5" />
            <span>{stats.missionsCompleted.length} MISSIONS</span>
          </div>
        </div>
      </div>

      {/* Hero Title & Primary Action */}
      <div className="max-w-4xl mx-auto w-full my-auto py-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-medium mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>CITY RESPONSE PROTOCOL READY</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-100 to-neutral-400 drop-shadow-sm mb-4">
          PROJECT APEX
        </h1>
        <p className="text-lg sm:text-xl font-heading tracking-wide text-neutral-400 font-medium max-w-2xl mb-8">
          CITY RESPONSE
        </p>
        <p className="text-sm text-neutral-400 max-w-xl mb-10 leading-relaxed font-sans">
          Navigate a compact, living 3D urban district. Commandeer vehicles, engage in tactical combat, navigate dynamic police pursuits, and complete high-stakes operations.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center">
          <button
            onClick={onStartGame}
            className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-heading font-bold rounded-xl transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            LAUNCH PATROL
          </button>

          <button
            onClick={onOpenMissions}
            className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 active:scale-95 text-neutral-200 font-heading font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flag className="w-4 h-4 text-amber-400" />
            MISSION BRIEF
          </button>
        </div>

        <div className="flex items-center gap-6 mt-6">
          <button
            onClick={onOpenControls}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Controls Guide
          </button>
          <span className="text-neutral-700">•</span>
          <button
            onClick={onOpenSettings}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
          >
            <SettingsIcon className="w-3.5 h-3.5" /> Graphics & Sound
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 max-w-6xl mx-auto w-full border-t border-neutral-900 pt-4">
        <span>Desktop Browser Recommended (Keyboard & Mouse)</span>
        <span>Built with TypeScript, Three.js & WebGL</span>
      </div>
    </div>
  );
};
