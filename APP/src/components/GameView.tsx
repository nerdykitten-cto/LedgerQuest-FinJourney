import { AdventureWorld } from './AdventureWorld/AdventureWorld';
import type { PlayerStats, CampaignState, PartyMember } from '../types/schemas';

interface GameViewProps {
  stats: PlayerStats;
  campaign: CampaignState;
  party: PartyMember[];
  onTravel: (destination: string, cost: number) => void;
  onTalk: (npcName: string, message: string) => void;
  onBattleVictory: () => void;
  onBattleDefeat: () => void;
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
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0a0f1a] group overflow-hidden">
      
      {/* Retro TV/Monitor Enclosure */}
      <div className="relative w-full h-full aspect-square flex items-center justify-center transition-all duration-700">
        
        {/* Physical TV Chassis */}
        <div className="absolute inset-0 bg-[#2b2b2b] rounded-[10px] shadow-[inset_0_4px_10px_rgba(255,255,255,0.1),20px_20px_60px_rgba(0,0,0,0.8)] border-[1px] border-[#1a1a1a] overflow-hidden">
           
           {/* Top Ventilation Grille */}
           <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-30">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-6 h-0.5 bg-black rounded-full"></div>
              ))}
           </div>

           {/* speaker/controls simplified to maximize screen */}
           <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-4 items-center opacity-40">
              <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#333] shadow-lg flex items-center justify-center cursor-pointer active:rotate-45 transition-transform">
                 <div className="w-0.5 h-2 bg-[#444] -translate-y-1 rounded-full"></div>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#84231d] border border-[#1a1a1a] shadow-inner cursor-pointer hover:brightness-125 transition-all"></div>
           </div>
        </div>

        {/* The Glass Bezel - Expands to fill chassis */}
        <div className="relative w-[94%] h-[94%] bg-[#1a1a1a] rounded-[30px] shadow-[inset_0_0_80px_rgba(0,0,0,1)] border-[8px] border-[#333] overflow-hidden flex items-center justify-center">
           
           {/* Glass Curvature & Reflections */}
           <div className="absolute inset-0 pointer-events-none z-30 opacity-30 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]"></div>

           {/* Advanced Scanlines */}
           <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_3px,2px_100%] animate-pulse opacity-50"></div>

           {/* Dynamic Static Overlay */}
           <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] bg-[url('https://media.giphy.com/media/oEI9uWUicKgH6/giphy.gif')] mix-blend-overlay"></div>

           {/* Actual Game Content */}
           <div className="w-full h-full relative z-10 overflow-hidden flex items-center justify-center bg-[#050505]">
             <div className="w-full h-full transform scale-[1.01]">
               <AdventureWorld 
                 stats={stats} 
                 campaign={campaign} 
                 party={party}
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
           </div>

           {/* Retro OSD */}
           <div className="absolute top-4 left-6 z-40 pointer-events-none opacity-60">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                 <span className="font-mono text-[10px] font-bold text-red-500 tracking-[0.1em]">LIVE</span>
              </div>
           </div>
        </div>

      </div>

      {/* Modern Control Key Info */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 opacity-30 group-hover:opacity-100 transition-all duration-500 pb-2">
         <div className="px-3 py-1 flex items-center gap-2">
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] font-bold text-primary">CLICK</kbd>
            <span className="text-[8px] text-on-surface-variant uppercase tracking-widest">Travel</span>
         </div>
         <div className="px-3 py-1 flex items-center gap-2">
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] font-bold text-secondary">DBL-CLICK</kbd>
            <span className="text-[8px] text-on-surface-variant uppercase tracking-widest">Town</span>
         </div>
      </div>
    </div>
  );
}
