import React from 'react';
import { X, Volume2, Monitor, Eye, Sliders } from 'lucide-react';
import type { GameSettings, QualityPreset } from '../types.ts';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-heading font-black text-neutral-100">SYSTEM SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Graphics Quality */}
          <div>
            <label className="flex items-center gap-2 text-xs font-heading font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              <Monitor className="w-4 h-4 text-sky-400" /> GRAPHICS PRESET
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as QualityPreset[]).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ quality: q, shadows: q !== 'LOW' })}
                  className={`py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all border ${
                    settings.quality === q
                      ? 'bg-rose-600/20 border-rose-500 text-rose-400 shadow-sm shadow-rose-500/20'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1.5 font-sans">
              Low disables soft shadows and optimizes frame pacing for integrated GPUs.
            </p>
          </div>

          {/* Audio Controls */}
          <div>
            <label className="flex items-center gap-2 text-xs font-heading font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              <Volume2 className="w-4 h-4 text-emerald-400" /> PROCEDURAL AUDIO
            </label>
            <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800 mb-2">
              <span className="text-xs text-neutral-300">Sound Effects & Engines</span>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.soundEnabled ? 'bg-emerald-500' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.soundEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Controls & Camera */}
          <div>
            <label className="flex items-center gap-2 text-xs font-heading font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              <Eye className="w-4 h-4 text-amber-400" /> CAMERA CONTROLS
            </label>
            <div className="space-y-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Mouse Sensitivity</span>
                  <span className="font-mono text-neutral-400 font-bold">
                    {Math.round(settings.cameraSensitivity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.0"
                  step="0.1"
                  value={settings.cameraSensitivity}
                  onChange={(e) => onUpdateSettings({ cameraSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-xs text-neutral-300">Invert Y-Axis</span>
                <button
                  onClick={() => onUpdateSettings({ invertY: !settings.invertY })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.invertY ? 'bg-rose-500' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      settings.invertY ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-heading font-bold rounded-xl transition-all cursor-pointer"
        >
          CONFIRM & CLOSE
        </button>
      </div>
    </div>
  );
};
