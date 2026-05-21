import React, { useState } from 'react';
import type { PlayerStats } from '../../types/schemas';

interface TownSceneProps {
  name: string;
  stats: PlayerStats;
  onTalk: (npcName: string, message: string) => void;
  onShopPurchase: (item: any, cost: number) => void;
  onBattleAction: () => void;
  onExit: () => void;
  showDialogue: (msg: string) => void;
}

export const TownScene: React.FC<TownSceneProps> = ({ 
  name, 
  stats, 
  onTalk, 
  onShopPurchase, 
  onBattleAction,
  onExit,
  showDialogue 
}) => {
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [activeArea, setActiveArea] = useState<'center' | 'outskirts'>('center');

  const NPCs = [
    { 
      id: 'n1', 
      name: 'Elder Aris', 
      area: 'center',
      message: "The ledger is more than just paper, scribe. It is the anchor of our reality. Keep it steady.",
      icon: '🧙‍♂️'
    },
    { 
      id: 'n2', 
      name: 'Stablemaster', 
      area: 'center',
      message: "Looking for a faster way to travel? Keep logging those feats and maybe you'll earn a mount one day.",
      icon: '🏇'
    }
  ];

  const SHOP_ITEMS = [
    { id: 'iron-sword', name: 'Iron Sword', cost: 150, sprite: '/assets/game/weapons/gear_right_18.png', type: 'weapon' },
    { id: 'leather-tunic', name: 'Leather Tunic', cost: 100, sprite: '/assets/ui/Icon_Shield.png', type: 'armor' },
    { id: 'health-potion', name: 'Health Potion', cost: 50, sprite: '/assets/ui/Icon_Energy_Green.png', type: 'item' }
  ];

  const handleNPCInteraction = (npc: typeof NPCs[0]) => {
    onTalk(npc.name, npc.message);
  };

  return (
    <div className="relative w-full h-full bg-[#060d20] flex flex-col overflow-hidden animate-in fade-in zoom-in-125 duration-1000">
      
      {/* Background Layer (Zoomed in map area or generic town bg) */}
      <div className="absolute inset-0 opacity-40">
         <img src="/assets/game/world_map.png" className="w-full h-full object-cover scale-150" alt="Town Backdrop" />
      </div>

      {/* Header Info */}
      <div className="relative z-10 flex justify-between items-center p-6 bg-gradient-to-b from-[#0b1326] to-transparent">
        <div>
          <h2 className="font-headline text-3xl font-black text-[#ffeebb] tracking-tighter uppercase">{name}</h2>
          <span className="font-label text-[10px] text-[#f4d03f] uppercase tracking-widest">{activeArea === 'center' ? 'Town Square' : 'Outskirts'}</span>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 bg-[#171f33]/80 px-3 py-1 doodle-border border-[#f4d03f]/30">
              <img src="/assets/ui/Icon_Energy_Yellow.png" className="w-4 h-4" alt="AP" />
              <span className="font-headline text-lg font-bold text-[#f4d03f]">{stats.ap}</span>
           </div>
           <div className="flex items-center gap-2 bg-[#171f33]/80 px-3 py-1 doodle-border border-[#ffeebb]/30">
              <img src="/assets/ui/Icon_Gold.png" className="w-4 h-4" alt="Gold" />
              <span className="font-headline text-lg font-bold text-[#ffeebb]">{stats.gold}</span>
           </div>
        </div>
      </div>

      {/* Point and Click Area */}
      <div className="relative flex-1 cursor-crosshair">
        
        {activeArea === 'center' && (
          <>
            {/* NPCs */}
            {NPCs.map((npc, i) => (
              <div 
                key={npc.id} 
                className="absolute flex flex-col items-center group cursor-pointer"
                style={{ left: `${20 + i * 30}%`, top: '60%' }}
                onClick={() => handleNPCInteraction(npc)}
              >
                <div className="text-5xl mb-2 group-hover:scale-110 group-hover:-translate-y-2 transition-all drop-shadow-lg">{npc.icon}</div>
                <div className="bg-[#171f33]/90 border border-[#4c4634] px-3 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                   <span className="font-label text-[10px] uppercase font-bold text-[#ffeebb]">{npc.name}</span>
                </div>
              </div>
            ))}

            {/* Shop Gate */}
            <div 
              className="absolute left-[80%] top-[55%] flex flex-col items-center group cursor-pointer"
              onClick={() => setIsShopOpen(true)}
            >
              <div className="text-6xl mb-2 group-hover:scale-110 group-hover:-translate-y-2 transition-all">🏪</div>
              <div className="bg-[#171f33]/90 border border-[#4c4634] px-3 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                 <span className="font-label text-[10px] uppercase font-bold text-[#f4d03f]">General Store</span>
              </div>
            </div>

            {/* Move to Outskirts */}
            <div 
              className="absolute left-[50%] top-[10%] -translate-x-1/2 flex flex-col items-center group cursor-pointer"
              onClick={() => setActiveArea('outskirts')}
            >
              <span className="material-symbols-outlined text-4xl text-[#ffb4aa] animate-pulse">north</span>
              <span className="font-label text-[10px] uppercase font-bold text-[#ffb4aa] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">To The Outskirts</span>
            </div>
          </>
        )}

        {activeArea === 'outskirts' && (
          <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-10">
             <div className="bg-[#171f33]/60 p-8 doodle-border border-[#84231d]/50 text-center backdrop-blur-md">
                <h3 className="font-headline text-2xl font-black text-[#ffb4aa] mb-4 uppercase">Wilderness Boundary</h3>
                <p className="font-body text-[#dbe2fd] mb-8 max-w-md italic">Shadows of debt linger in the tall grass. Engaging in combat will drain your mental stamina (Action Points).</p>
                <div className="flex gap-6">
                  <button 
                    onClick={() => onBattleAction()}
                    className="bg-[#84231d] text-white px-8 py-3 doodle-border font-headline font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined">swords</span> Hunt For Gold
                  </button>
                  <button 
                    onClick={() => setActiveArea('center')}
                    className="bg-[#171f33] text-[#ffeebb] px-8 py-3 doodle-border font-headline font-black uppercase hover:bg-[#222a3e] transition-all"
                  >
                    Return to Safety
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Exit Button */}
      <button 
        onClick={onExit}
        className="absolute bottom-8 right-8 z-20 bg-[#0b1326] border-2 border-[#ffb4aa]/30 px-6 py-2 rounded-full font-label text-[10px] font-black text-[#ffb4aa] uppercase tracking-[0.2em] hover:bg-[#ffb4aa] hover:text-black transition-all shadow-2xl active:scale-90"
      >
        [ Back to Map ]
      </button>

      {/* Shop Overlay */}
      {isShopOpen && (
        <div className="absolute inset-0 z-[100] bg-[#060d20]/95 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in-95">
          <div className="w-full max-w-2xl bg-[#171f33] border-4 border-[#4c4634] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative flex flex-col max-h-[80%]">
            <button 
              onClick={() => setIsShopOpen(false)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#0b1326] border-2 border-[#ffb4aa] text-[#ffb4aa] flex items-center justify-center hover:scale-110 transition-all z-[110]"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="font-headline text-3xl font-black text-[#f4d03f] text-center mb-10 uppercase tracking-tighter italic doodle-underline inline-block mx-auto">Town Armory</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar p-2">
              {SHOP_ITEMS.map(item => (
                <div 
                  key={item.id}
                  className="flex flex-col p-4 bg-[#0b1326] border-2 border-[#4c4634]/50 hover:border-[#f4d03f] transition-all group cursor-pointer shadow-md"
                  onClick={() => {
                    if (stats.gold >= item.cost) {
                      onShopPurchase(item, item.cost);
                      setIsShopOpen(false);
                    } else {
                      showDialogue("YOU LACK THE NECESSARY CAPITAL FOR THIS ACQUISITION.");
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white/5 rounded p-2 border border-white/10 group-hover:scale-110 transition-transform">
                       <img src={item.sprite} className="w-full h-full object-contain" alt={item.name} />
                    </div>
                    <span className="font-headline text-xl font-black text-[#f4d03f]">${item.cost}</span>
                  </div>
                  <span className="font-label text-sm font-bold text-[#ffeebb] uppercase tracking-widest">{item.name}</span>
                  <span className="font-body text-[8px] text-on-surface-variant uppercase mt-1 italic">{item.type}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-between items-center bg-[#0b1326] p-4 border-t-2 border-[#4c4634]">
              <span className="font-label text-[10px] uppercase text-[#4c4634] tracking-widest font-black">Treasury Balance</span>
              <span className="font-headline text-2xl font-black text-[#ffeebb]">${stats.gold} G</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
