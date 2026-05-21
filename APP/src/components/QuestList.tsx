import React from 'react';
import type { Quest } from '../types/schemas';

interface Props {
  quests: Quest[];
  onStartQuest?: (id: string) => void;
  onClaimReward?: (id: string) => void;
}

const QuestList: React.FC<Props> = ({ quests, onStartQuest, onClaimReward }) => {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-headline text-lg font-bold flex items-center justify-between px-2">
        <span className="doodle-underline text-tertiary">Active Chronicles</span>
        <span className="font-label text-[10px] uppercase text-on-surface-variant font-normal tracking-widest">
          {quests.length} Quests
        </span>
      </h3>
      
      {quests.length === 0 ? (
        <div className="doodle-border border-dashed border-outline/20 p-8 text-center bg-surface-container-low">
          <p className="font-body text-sm text-on-surface-variant italic">No tales are being told in this region...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {quests.map((q) => (
            <div key={q.id} className={`tape-accent doodle-border p-5 relative overflow-hidden group transition-all ${q.status === 'completed' ? 'opacity-60 bg-surface-container-low' : 'bg-surface-container shadow-lg hover:translate-y-[-2px]'}`}>
              {/* Type Icon Overlay */}
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-tertiary/5 rounded-full flex items-center justify-center doodle-border border-dashed border-tertiary/20">
                 <span className="material-symbols-outlined text-tertiary/40 text-2xl">
                    {q.type === 'main' ? 'auto_awesome' : 'assignment'}
                 </span>
              </div>

              <header className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-label text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm 
                      ${q.status === 'active' ? 'bg-primary text-on-primary font-black animate-pulse' : 
                        q.status === 'ready' ? 'bg-tertiary text-on-tertiary font-black' :
                        'bg-surface-container-high text-on-surface-variant'}`}>
                      {q.status.toUpperCase()}
                    </span>
                    <span className="font-label text-[9px] text-on-surface-variant uppercase">Lv.{q.difficulty}</span>
                  </div>
                  <h4 className={`font-headline text-lg font-bold ${q.status === 'completed' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                    {q.title}
                  </h4>
                </div>
              </header>

              <p className="font-body text-xs text-on-surface-variant mb-4 italic line-clamp-2">
                "{q.description}"
              </p>

              {/* Objective Progress */}
              {(q.status === 'active' || q.status === 'ready') && q.objectives && (
                <div className="mb-4 space-y-2 relative z-10">
                   {q.objectives.map(obj => (
                     <div key={obj.id} className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-xs ${obj.isCompleted ? 'text-primary' : 'text-on-surface-variant opacity-30'}`}>
                           {obj.isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={`text-[10px] font-label uppercase ${obj.isCompleted ? 'text-on-surface line-through' : 'text-on-surface-variant'}`}>
                           {obj.text}
                        </span>
                     </div>
                   ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-outline/10 relative z-10">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="font-label text-[8px] uppercase text-on-surface-variant">Reward</span>
                    <span className="font-headline text-sm text-primary-container font-bold">{q.reward.gold}g / {q.reward.exp}xp</span>
                  </div>
                </div>

                <div className="flex items-center">
                  {q.status === 'available' && onStartQuest && (
                    <button 
                      onClick={() => onStartQuest(id_fix(q.id))} 
                      className="doodle-btn bg-tertiary/10 hover:bg-tertiary/20 text-tertiary text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 flex items-center gap-2"
                    >
                      Accept <span className="material-symbols-outlined text-xs">edit_square</span>
                    </button>
                  )}
                  {q.status === 'ready' && onClaimReward && (
                    <button 
                      onClick={() => onClaimReward(id_fix(q.id))} 
                      className="doodle-btn bg-[#f4d03f] text-black text-[10px] font-black uppercase tracking-[0.1em] px-5 py-2 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    >
                      Claim Rewards <span className="material-symbols-outlined text-sm">redeem</span>
                    </button>
                  )}
                  {q.status === 'completed' && (
                    <span className="material-symbols-outlined text-tertiary">check_circle</span>
                  )}
                  {q.status === 'active' && (
                    <span className="font-label text-[8px] uppercase text-on-surface-variant italic">Objectives Pending...</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper for TS string safety
const id_fix = (id: any): string => String(id);

export default QuestList;
