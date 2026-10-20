import React from 'react';
import { X, Flag, Clock, DollarSign, ChevronRight, CheckCircle2 } from 'lucide-react';
import { MISSIONS } from '../missions/MissionSystem.ts';
import type { MissionId } from '../types.ts';

interface MissionSelectModalProps {
  onSelectMission: (id: MissionId) => void;
  onClose: () => void;
  completedMissions: string[];
}

export const MissionSelectModal: React.FC<MissionSelectModalProps> = ({
  onSelectMission,
  onClose,
  completedMissions,
}) => {
  const missionList = Object.values(MISSIONS);

  return (
    <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-heading font-black text-neutral-100">OPERATION DOSSIER</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {missionList.map((m) => {
            const isCompleted = completedMissions.includes(m.id);

            return (
              <div
                key={m.id}
                className="bg-neutral-950 border border-neutral-800/90 hover:border-neutral-700 rounded-xl p-4 transition-all flex flex-col gap-3 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-base text-neutral-100 group-hover:text-rose-400 transition-colors">
                        {m.title}
                      </h3>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> COMPLETED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">{m.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>+{m.reward.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 font-sans leading-relaxed">{m.briefing}</p>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs text-neutral-400 font-mono">
                  <div className="flex items-center gap-4">
                    {m.timeLimit && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> {m.timeLimit}s Time Window
                      </span>
                    )}
                    <span>{m.steps.length} Objectives</span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectMission(m.id);
                      onClose();
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-heading font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    DEPLOY OPERATION <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
