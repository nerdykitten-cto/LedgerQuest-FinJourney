import React from 'react';
import type { PartyMember } from '../types/schemas';

interface Props {
  party: PartyMember[];
  onClose: () => void;
  onAddMember: () => void;
  onRemoveMember: (id: string) => void;
}

const WarRoom: React.FC<Props> = ({ party, onClose, onAddMember, onRemoveMember }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-surface-dim/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-surface-container border-4 border-on-surface-variant shadow-[8px_8px_0px_0px_rgba(0,0,0,0.6)] rounded-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-8 py-6 bg-surface-container-high border-b-4 border-double border-outline">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-4xl">swords</span>
            <h1 className="font-headline text-2xl font-black text-primary uppercase tracking-tighter">War Room: Tactical Formation</h1>
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-error hover:rotate-90 transition-all text-3xl" onClick={onClose}>close</button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {/* Row 1: Front Line */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-label text-[10px] uppercase text-secondary tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">shield</span>
                Front Line (Melee & Tanks)
              </h3>
              <div className="h-[2px] flex-1 bg-outline-variant ml-4 opacity-30"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {party.slice(0, 2).map(m => (
                 <div key={m.id} className="bg-surface doodle-border p-4 relative group hover:jiggle border-primary/40">
                    <div className="flex flex-col items-center gap-3">
                       <div className="w-24 h-24 rounded-full border-4 border-primary shadow-lg overflow-hidden bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-5xl text-primary">person</span>
                       </div>
                       <span className="font-headline text-lg font-bold text-primary">{m.name}</span>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onRemoveMember(m.id)} className="bg-error text-on-error px-3 py-1 rounded-full text-[10px] font-bold uppercase hover:scale-110 transition-transform">Remove</button>
                       </div>
                    </div>
                 </div>
               ))}
               {party.length < 2 && (
                 <button onClick={onAddMember} className="bg-surface-container-low doodle-border p-4 border-dashed border-outline-variant flex items-center justify-center hover:bg-surface-variant cursor-pointer transition-colors group h-[180px]">
                    <div className="text-center">
                       <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2 group-hover:scale-125 transition-transform">add_circle</span>
                       <p className="font-label text-[10px] uppercase text-on-surface-variant tracking-widest">Add Frontliner</p>
                    </div>
                 </button>
               )}
            </div>
          </div>

          {/* Row 2: Mid Row */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <h3 className="font-label text-[10px] uppercase text-tertiary tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">auto_fix_normal</span>
                Mid Row (Ranged & Spells)
              </h3>
              <div className="h-[2px] flex-1 bg-outline-variant ml-4 opacity-30"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {party.slice(2, 4).map(m => (
                 <div key={m.id} className="bg-surface doodle-border p-4 relative group hover:jiggle border-tertiary/40">
                    <div className="flex flex-col items-center gap-3">
                       <div className="w-24 h-24 rounded-full border-4 border-tertiary shadow-lg overflow-hidden bg-tertiary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-5xl text-tertiary">auto_awesome</span>
                       </div>
                       <span className="font-headline text-lg font-bold text-tertiary">{m.name}</span>
                       <button onClick={() => onRemoveMember(m.id)} className="bg-error text-on-error px-3 py-1 rounded-full text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                    </div>
                 </div>
               ))}
               {party.length < 4 && (
                 <button onClick={onAddMember} className="bg-surface-container-low doodle-border p-4 border-dashed border-outline-variant flex items-center justify-center hover:bg-surface-variant cursor-pointer transition-colors group h-[180px]">
                    <div className="text-center">
                       <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2 group-hover:scale-125 transition-transform">add_circle</span>
                       <p className="font-label text-[10px] uppercase text-on-surface-variant tracking-widest">Add Ranged</p>
                    </div>
                 </button>
               )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 bg-surface-container-high border-t-4 border-outline flex justify-end gap-6">
          <button className="px-8 py-3 text-on-surface font-label text-[10px] uppercase tracking-widest hover:text-primary transition-colors font-bold" onClick={onClose}>Close</button>
          <button onClick={onClose} className="bg-primary-container text-on-primary-container px-10 py-4 doodle-border border-on-primary-container font-headline font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-3 group">
            CONFIRM FORMATION
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarRoom;
