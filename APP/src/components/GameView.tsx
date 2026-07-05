import { AdventureWorld } from './AdventureWorld/AdventureWorld';
import type { PlayerStats, CampaignState, PartyMember, InventoryItem } from '../types/schemas';

import type { BattleResult } from '../engine/director';

interface GameViewProps {
  stats: PlayerStats;
  campaign: CampaignState;
  party: PartyMember[];
  inventory: InventoryItem[];
  onTravel: (destination: string, cost: number) => void;
  onTalk: (npcName: string, message: string) => void;
  onBattleVictory: (result: BattleResult) => void;
  onBattleDefeat: (result: BattleResult) => void;
  onBattleAction: () => void;
  onActionCost: (cost: number) => void;
  onShopPurchase: (item: any, cost: number) => void;
  onEnterTown: (name: string) => void;
  onExitTown: () => void;
}

export default function GameView({ 
  stats, 
  campaign, 
  party,
  inventory,
  onTravel,
  onTalk,
  onBattleVictory,
  onBattleDefeat,
  onBattleAction,
  onActionCost,
  onShopPurchase,
  onEnterTown,
  onExitTown
}: GameViewProps) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0a0f1a] group overflow-hidden p-2">
      
      {/* Retro TV/Monitor Enclosure — fill leftover space, then lock the TV to a
          landscape 4:3 so wide/short AND tall viewports both show the whole scene
          inside the bezel instead of cropping it (wide-viewport counterpart to the
          Phase 1 min-w-0/min-h-0 work). `container-type:size` lets the TV width
          track the available height via 100cqh, so it never spills past the frame. */}
      <div className="relative w-full flex-1 min-h-0 flex items-center justify-center lg:[container-type:size]">
       <div className="relative w-full h-full max-w-[1100px] transition-all duration-700 lg:h-auto lg:aspect-[4/3] lg:w-[min(100%,calc(100cqh*4/3))]">
        
        {/* Physical TV Chassis */}
        <div className="absolute inset-0 bg-[#333] rounded-2xl md:rounded-[40px] shadow-[inset_0_4px_15px_rgba(255,255,255,0.1),30px_30px_80px_rgba(0,0,0,0.9)] border-[4px] border-[#1a1a1a] overflow-hidden flex">
           
           {/* Left Speaker Side - hidden on small screens so the game gets the width */}
           <div className="w-[8%] h-full bg-[#2a2a2a] border-r-2 border-[#1a1a1a] hidden md:flex flex-col items-center justify-center gap-3 opacity-60">
              {[...Array(25)].map((_, i) => (
                <div key={i} className="w-full h-[2px] bg-black/50 shadow-inner"></div>
              ))}
           </div>

           {/* Main Screen Area (Center) */}
           <div className="flex-1 min-w-0 h-full relative bg-[#111] flex items-center justify-center p-1.5 md:p-3">

              {/* Bezel - thin on small screens, chunky CRT on desktop */}
              <div className="relative w-full h-full bg-[#1a1a1a] rounded-xl md:rounded-[28px] border-[6px] md:border-[8px] border-[#222] shadow-[inset_0_0_100px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-center">
                 
                 {/* Glass Curvature & Reflections */}
                 <div className="absolute inset-0 pointer-events-none z-30 opacity-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]"></div>

                 {/* Advanced Scanlines */}
                 <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] animate-pulse opacity-60"></div>

                 {/* Dynamic Static Overlay */}
                 <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.04] bg-[url('https://media.giphy.com/media/oEI9uWUicKgH6/giphy.gif')] mix-blend-overlay"></div>

                 {/* Actual Game Content */}
                 <div className="w-full h-full min-w-0 min-h-0 relative z-10 overflow-hidden flex items-center justify-center bg-[#050505]">
                    <AdventureWorld 
                      stats={stats} 
                      campaign={campaign} 
                      party={party}
                      inventory={inventory}
                      onTravel={onTravel}
                      onTalk={onTalk}
                      onBattleVictory={onBattleVictory}
                      onBattleDefeat={onBattleDefeat}
                      onBattleAction={onBattleAction}
                      onActionCost={onActionCost}
                      onShopPurchase={onShopPurchase}
                      onEnterTown={onEnterTown}
                      onExitTown={onExitTown}
                    />
                 </div>

                 {/* Retro OSD */}
                 <div className="absolute top-2 left-3 md:top-6 md:left-8 z-40 pointer-events-none opacity-80">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_red]"></div>
                       <span className="font-mono text-[10px] md:text-xs font-bold text-red-500 tracking-[0.3em] uppercase drop-shadow-lg">LIVE_SIGNAL_01</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Control Side - wide desktop only; collapses so the screen fills small viewports */}
           <div className="w-[18%] h-full bg-[#2a2a2a] border-l-2 border-[#1a1a1a] hidden 2xl:flex flex-col items-center justify-start py-12 gap-12">
              
              {/* Dial 1 */}
              <div className="flex flex-col items-center gap-3 scale-110">
                 <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-[3px] border-[#333] shadow-2xl flex items-center justify-center group/dial cursor-pointer active:rotate-45 transition-transform hover:brightness-125">
                    <div className="w-1.5 h-6 bg-[#444] -translate-y-3 rounded-full shadow-md"></div>
                 </div>
                 <span className="font-label text-[8px] text-white/40 uppercase tracking-[0.2em] font-black">Tuning</span>
              </div>

              {/* Dial 2 */}
              <div className="flex flex-col items-center gap-3 scale-110">
                 <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-[3px] border-[#333] shadow-2xl flex items-center justify-center group/dial cursor-pointer active:rotate-90 transition-transform hover:brightness-125">
                    <div className="w-1.5 h-6 bg-[#444] -translate-y-3 rounded-full shadow-md"></div>
                 </div>
                 <span className="font-label text-[8px] text-white/40 uppercase tracking-[0.2em] font-black">Volume</span>
              </div>

              {/* Power Button */}
              <div className="mt-auto mb-14 flex flex-col items-center gap-4 scale-125">
                 <div className="w-12 h-12 rounded-full bg-[#84231d] border-[3px] border-[#1a1a1a] shadow-[0_6px_15px_rgba(0,0,0,0.6),inset_0_3px_6px_rgba(255,255,255,0.2)] cursor-pointer hover:brightness-125 active:scale-90 transition-all flex items-center justify-center group">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffb4aa] animate-pulse shadow-[0_0_12px_#ffb4aa]"></div>
                 </div>
                 <span className="font-label text-[10px] text-white/50 uppercase font-black tracking-tighter">Power</span>
              </div>
           </div>
        </div>

        {/* Physical Label (Old Tape) */}
        <div className="absolute -bottom-6 right-1/4 bg-[#e5e5e5] px-8 py-2 border-2 border-gray-400 shadow-xl rotate-1 z-50 transform hover:rotate-0 transition-transform cursor-default hidden md:block">
           <span className="font-mono text-[10px] font-bold text-gray-700 uppercase tracking-[0.3em]">Channel: Ledger_RPG_PRO</span>
        </div>

       </div>

      </div>

      {/* Solid Control Key Info - wide desktop only, keeps vertical space for the screen */}
      <div className="mt-4 hidden 2xl:flex flex-wrap justify-center gap-6 opacity-40 group-hover:opacity-100 transition-all duration-500">
         <div className="px-4 py-2 flex items-center gap-3 bg-white/5 rounded-lg border border-white/10">
            <kbd className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-primary">CLICK</kbd>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black">Navigate</span>
         </div>
         <div className="px-4 py-2 flex items-center gap-3 bg-white/5 rounded-lg border border-white/10">
            <kbd className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-secondary">DBL-CLICK</kbd>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black">Enter Town</span>
         </div>
      </div>
    </div>
  );
}
