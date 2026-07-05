import React from 'react';
import type { PartyMember } from '../types/schemas';

interface Props {
  party: PartyMember[];
  recruitCost: number;
  onClose: () => void;
  onAddMember: (slot: 'front' | 'support') => void;
  onRemoveMember: (id: string) => void;
}

const WarRoom: React.FC<Props> = ({ party, recruitCost, onClose, onAddMember, onRemoveMember }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-surface-dim/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-surface-container border-4 border-on-surface-variant shadow-[12px_12px_0px_0px_rgba(0,0,0,0.6)] rounded-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-8 py-6 bg-surface-container-high border-b-4 border-double border-outline">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-4xl">swords</span>
            <h1 className="font-headline text-2xl font-black text-primary uppercase tracking-tighter italic">War Room: Tactical Formation</h1>
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-error hover:rotate-90 transition-all text-3xl" onClick={onClose}>close</button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          
          {/* Row 1: Front Line */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-label text-xs uppercase text-secondary tracking-[0.2em] font-black flex items-center gap-2 bg-secondary/10 px-3 py-1 rounded">
                <span className="material-symbols-outlined text-sm">shield</span>
                Front Line (Melee & Tanks)
              </h3>
              <div className="h-[1px] flex-1 bg-outline-variant ml-6 opacity-20"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {party.filter(p => p.role === 'Leader' || p.role === 'Vanguard').map(m => (
                 <div key={m.id} className="bg-surface-container-low border-2 border-primary/20 p-6 relative group hover:jiggle transition-all duration-300">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-28 h-28 rounded-full border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-primary/5">
                          <img src={m.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={m.name} />
                       </div>
                       <div className="text-center">
                          <span className="font-headline text-xl font-black text-primary block uppercase tracking-tighter">{m.name}</span>
                          <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">{m.role} • LV.{m.level}</span>
                       </div>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onRemoveMember(m.id)} className="bg-error text-on-error px-4 py-1 rounded-full text-[10px] font-black uppercase hover:scale-110 transition-transform">Dismiss</button>
                       </div>
                    </div>
                 </div>
               ))}
               {party.filter(p => p.role === 'Leader' || p.role === 'Vanguard').length < 2 && (
                 <button onClick={() => onAddMember('front')} className="bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex items-center justify-center hover:bg-surface-variant cursor-pointer transition-colors group h-[200px]">
                    <div className="text-center">
                       <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 group-hover:scale-125 group-hover:text-primary transition-all">add_circle</span>
                       <p className="font-label text-[10px] uppercase text-on-surface-variant/60 tracking-widest">Recruit Tank</p>
                       <p className="font-label text-[10px] text-primary/70 mt-1">{recruitCost}g signing fee</p>
                    </div>
                 </button>
               )}
            </div>
          </div>

          {/* Row 2: Mid & Back Row */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-label text-xs uppercase text-tertiary tracking-[0.2em] font-black flex items-center gap-2 bg-tertiary/10 px-3 py-1 rounded">
                <span className="material-symbols-outlined text-sm">auto_fix_normal</span>
                Support & Ranged (Mid/Back)
              </h3>
              <div className="h-[1px] flex-1 bg-outline-variant ml-6 opacity-20"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {party.filter(p => p.role !== 'Leader' && p.role !== 'Vanguard').map(m => (
                 <div key={m.id} className="bg-surface-container-low border-2 border-tertiary/20 p-6 relative group hover:jiggle transition-all duration-300">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-28 h-28 rounded-full border-4 border-tertiary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-tertiary/5">
                          <img src={m.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={m.name} />
                       </div>
                       <div className="text-center">
                          <span className="font-headline text-xl font-black text-tertiary block uppercase tracking-tighter">{m.name}</span>
                          <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">{m.role} • LV.{m.level}</span>
                       </div>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onRemoveMember(m.id)} className="bg-error text-on-error px-4 py-1 rounded-full text-[10px] font-black uppercase hover:scale-110 transition-transform">Dismiss</button>
                       </div>
                    </div>
                 </div>
               ))}
               {party.filter(p => p.role !== 'Leader' && p.role !== 'Vanguard').length < 3 && (
                 <button onClick={() => onAddMember('support')} className="bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex items-center justify-center hover:bg-surface-variant cursor-pointer transition-colors group h-[200px]">
                    <div className="text-center">
                       <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 group-hover:scale-125 group-hover:text-tertiary transition-all">add_circle</span>
                       <p className="font-label text-[10px] uppercase text-on-surface-variant/60 tracking-widest">Recruit Support</p>
                       <p className="font-label text-[10px] text-tertiary/70 mt-1">{recruitCost}g signing fee</p>
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
