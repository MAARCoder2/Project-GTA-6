import React from 'react';
import { X, Keyboard, Mouse, Car, Crosshair } from 'lucide-react';

interface ControlsModalProps {
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-heading font-black text-neutral-100">OPERATIVE CONTROLS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {/* On-Foot Section */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2.5">
            <div className="flex items-center gap-2 text-rose-400 font-heading font-bold text-sm border-b border-neutral-800 pb-1.5">
              <Crosshair className="w-4 h-4" /> ON-FOOT LOCOMOTION & COMBAT
            </div>
            <div className="grid grid-cols-2 gap-2 text-neutral-300">
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Move</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">W A S D</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Sprint</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">SHIFT</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Jump</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">SPACE</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Aim Weapon</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">RIGHT CLICK</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Fire Weapon</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">LEFT CLICK</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Reload</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">R</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Select Weapon</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">1, 2, 3</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Enter / Exit Car</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">E</span>
              </div>
            </div>
          </div>

          {/* Vehicle Section */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-heading font-bold text-sm border-b border-neutral-800 pb-1.5">
              <Car className="w-4 h-4" /> VEHICLE OPERATION
            </div>
            <div className="grid grid-cols-2 gap-2 text-neutral-300">
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Throttle</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">W / UP</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Brake / Reverse</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">S / DOWN</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Steer</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">A / D</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900/60 p-1.5 rounded px-2">
                <span className="text-neutral-400">Handbrake Drift</span>
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">SPACE</span>
              </div>
            </div>
          </div>

          {/* System Section */}
          <div className="flex justify-between items-center bg-neutral-950 p-3 rounded-xl border border-neutral-800 px-4">
            <span className="text-neutral-300">Pause / Menu</span>
            <span className="bg-neutral-800 px-2 py-0.5 rounded text-white font-bold">P or ESC</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-heading font-bold rounded-xl transition-all cursor-pointer"
        >
          GOT IT
        </button>
      </div>
    </div>
  );
};
