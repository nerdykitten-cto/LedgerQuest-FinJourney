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

  const handleTalkToDaniel = () => {
    const msg = "WELCOME, SCRIBE. TO CLEAR THE FOG OF DEBT, ONE MUST FIRST DOCUMENT THE FLOW. LOG YOUR EXPENSES TO EARN THE ACTION POINTS NEEDED TO PROCEED.";
    onTalk('Chronicler Daniel', msg);
  };

  const handleBattleTrigger = () => {
    showDialogue("HEADING TO THE UNCHARTED TERRITORIES? ENSURE YOUR HP RESERVE IS OPTIMAL.");
    setTimeout(() => {
      onBattleAction();
    }, 2000);
  };

  const SHOP_ITEMS = [
    { id: 'bat-debt', name: 'Bat of Debt', cost: 200, sprite: '/assets/game/ui/Icon_Bag.png' }, // Placeholder sprite path
    { id: 'gear-slicer', name: 'Gear Slicer', cost: 500, sprite: '/assets/game/ui/Icon_GearWheels.png' }
  ];

  return (
    <div className="relative w-[800px] h-[600px] bg-gradient-to-b from-[#171f33] to-[#060d20] flex flex-col items-center p-8 overflow-hidden">
      {/* Ground */}
      <div className="absolute bottom-0 left-0 w-full h-[30%] bg-[#0b1326] border-t-2 border-[#4c4634]" />

      <h2 className="font-headline text-4xl font-black text-[#ffeebb] tracking-tighter mb-2 animate-in slide-in-from-top-4 uppercase">{name} ENCLAVE</h2>
      
      {/* Header Info */}
      <div className="flex gap-10 bg-[#0b1326]/80 px-6 py-2 border border-[#4c4634] rounded-full mb-10">
        <div className="flex items-center gap-2">
           <img src="/assets/ui/Icon_Energy_Yellow.png" className="w-5 h-5" alt="AP" />
           <span className="font-label text-sm text-[#f4d03f] font-bold uppercase">AP: {stats.ap}</span>
        </div>
        <div className="flex items-center gap-2">
           <img src="/assets/ui/Icon_Gold.png" className="w-5 h-5" alt="Gold" />
           <span className="font-label text-sm text-[#ffeebb] font-bold uppercase">{stats.gold} G</span>
        </div>
      </div>

      {/* NPCs */}
      <div className="relative w-full h-full flex justify-around items-end pb-16 px-20">
        {name === 'Starting Village' && (
          <div className="flex flex-col items-center group cursor-pointer" onClick={handleTalkToDaniel}>
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform animate-bounce" style={{ animationDuration: '3s' }}>🧙‍♂️</div>
            <div className="bg-[#171f33] border border-[#4c4634] px-4 py-1 rounded shadow-lg">
               <span className="font-label text-[10px] uppercase font-bold text-[#ffeebb] group-hover:text-[#f4d03f]">Chronicler Daniel</span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center group cursor-pointer" onClick={() => setIsShopOpen(true)}>
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform animate-bounce" style={{ animationDuration: '2.5s' }}>🛒</div>
          <div className="bg-[#171f33] border border-[#4c4634] px-4 py-1 rounded shadow-lg">
             <span className="font-label text-[10px] uppercase font-bold text-[#ffeebb] group-hover:text-[#f4d03f]">Ledger Merchant</span>
          </div>
        </div>

        <div className="flex flex-col items-center group cursor-pointer" onClick={handleBattleTrigger}>
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform animate-bounce" style={{ animationDuration: '4s' }}>🌲</div>
          <div className="bg-[#171f33] border border-[#4c4634] px-4 py-1 rounded shadow-lg">
             <span className="font-label text-[10px] uppercase font-bold text-[#ffeebb] group-hover:text-[#f4d03f]">To The Wild Logs</span>
          </div>
        </div>
      </div>

      {/* Exit Button */}
      <button 
        onClick={onExit}
        className="absolute top-10 right-10 font-label text-sm font-black text-[#ffb4aa] uppercase tracking-[0.2em] hover:text-white transition-colors"
      >
        [ EXIT TOWN ]
      </button>

      {/* Shop Overlay */}
      {isShopOpen && (
        <div className="absolute inset-0 z-[3000] bg-[#060d20]/90 backdrop-blur-sm flex items-center justify-center p-10 animate-in fade-in zoom-in-95">
          <div className="w-full max-w-xl bg-[#0b1326] border-4 border-[#4c4634] p-8 relative">
            <button 
              onClick={() => setIsShopOpen(false)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#171f33] border-2 border-[#4c4634] text-[#ffb4aa] flex items-center justify-center hover:scale-110 transition-transform"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="font-headline text-3xl font-black text-[#f4d03f] text-center mb-8 uppercase">Ledger Merchant</h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {SHOP_ITEMS.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-[#171f33] border-2 border-[#4c4634] hover:bg-[#222a3e] transition-colors group cursor-pointer"
                  onClick={() => {
                    if (stats.gold >= item.cost) {
                      onShopPurchase(item, item.cost);
                      setIsShopOpen(false);
                    } else {
                      showDialogue("INSUFFICIENT GOLD FOR THIS TRANSACTION.");
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <img src={item.sprite} className="w-10 h-10 object-contain" alt={item.name} />
                    <span className="font-label text-lg font-bold text-[#ffeebb] group-hover:text-[#f4d03f]">{item.name}</span>
                  </div>
                  <span className="font-headline text-xl font-black text-[#f4d03f]">{item.cost} G</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center text-[#4c4634] font-label text-[10px] uppercase tracking-widest">
              Available Gold: <span className="text-[#ffeebb]">{stats.gold} G</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
