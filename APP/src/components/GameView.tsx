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
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8 bg-[#0a0f1a] group overflow-hidden">
      
      {/* Retro TV/Monitor Enclosure */}
      <div className="relative w-full max-w-[850px] aspect-square flex items-center justify-center transition-all duration-700">
        
        {/* Physical TV Chassis */}
        <div className="absolute inset-0 bg-[#2b2b2b] rounded-[20px] shadow-[inset_0_4px_10px_rgba(255,255,255,0.1),20px_20px_60px_rgba(0,0,0,0.8)] border-[2px] border-[#1a1a1a] overflow-hidden">
           
           {/* Top Ventilation Grille */}
           <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-40">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-8 h-1 bg-black rounded-full shadow-inner"></div>
              ))}
           </div>

           {/* Speaker Grille Area (Left) */}
           <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-1/2 flex flex-col gap-1 opacity-30">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-full h-1 bg-black rounded-full"></div>
              ))}
           </div>

           {/* Controls Area (Right) */}
           <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-8 items-center">
              {/* Dial 1 */}
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border-2 border-[#333] shadow-lg flex items-center justify-center group/dial cursor-pointer active:rotate-45 transition-transform">
                 <div className="w-1 h-4 bg-[#444] -translate-y-2 rounded-full"></div>
              </div>
              {/* Dial 2 */}
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border-2 border-[#333] shadow-lg flex items-center justify-center group/dial cursor-pointer active:rotate-90 transition-transform">
                 <div className="w-1 h-4 bg-[#444] -translate-y-2 rounded-full"></div>
              </div>
              {/* Power Button */}
              <div className="mt-12 flex flex-col items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-[#84231d] border-2 border-[#1a1a1a] shadow-inner cursor-pointer hover:brightness-125 active:scale-95 transition-all flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#ffb4aa] animate-pulse"></div>
                 </div>
                 <span className="font-label text-[6px] text-white/20 uppercase tracking-tighter">Power</span>
              </div>
           </div>
        </div>

        {/* The Glass Bezel */}
        <div className="relative w-[82%] h-[82%] bg-[#1a1a1a] rounded-[60px] shadow-[inset_0_0_100px_rgba(0,0,0,1),0_0_20px_rgba(0,0,0,0.5)] border-[12px] border-[#333] overflow-hidden group-hover:border-[#3a3a3a] transition-colors flex items-center justify-center">
           
           {/* Glass Curvature & Reflections */}
           <div className="absolute inset-0 pointer-events-none z-30 opacity-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
           <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 opacity-20 bg-[linear-gradient(135deg,rgba(255,255,255,0.2),transparent_40%,transparent_60%,rgba(0,0,0,0.3))]"></div>

           {/* Advanced Scanlines */}
           <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.02),rgba(0,0,255,0.04))] bg-[length:100%_3px,2px_100%] animate-pulse opacity-60"></div>

           {/* Dynamic Static/Flicker Overlay */}
           <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.04] bg-[url('https://media.giphy.com/media/oEI9uWUicKgH6/giphy.gif')] mix-blend-overlay"></div>

           {/* Actual Game Content */}
           <div className="w-full h-full relative z-10 overflow-hidden flex items-center justify-center bg-[#050505]">
             <div className="w-full h-full transform transition-transform duration-1000 scale-[1.02]">
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

           {/* Retro OSD (On Screen Display) */}
           <div className="absolute top-8 left-12 z-40 pointer-events-none opacity-80">
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-red-600 animate-jiggle shadow-[0_0_10px_red]"></div>
                 <span className="font-mono text-xs font-bold text-red-500 tracking-[0.2em] drop-shadow-lg">RECORDING...</span>
              </div>
           </div>

           <div className="absolute bottom-8 right-12 z-40 pointer-events-none opacity-40">
              <span className="font-mono text-[10px] text-green-500/80 tracking-widest uppercase">AV-1 / 60Hz</span>
           </div>

        </div>

        {/* Physical Label (Old Tape) */}
        <div className="absolute -bottom-2 left-1/4 bg-[#e5e5e5] px-4 py-1 border border-gray-400 shadow-md -rotate-1 z-50 transform hover:rotate-0 transition-transform cursor-default">
           <span className="font-mono text-[8px] font-bold text-gray-600 uppercase tracking-widest">Property of Aethelgard Media</span>
        </div>

      </div>

      {/* Modern Control Key Info (Solid, No Doodles) */}
      <div className="mt-12 flex flex-wrap justify-center gap-6 opacity-40 group-hover:opacity-100 transition-all duration-500">
         <div className="bg-white/5 border border-white/10 px-4 py-2 rounded flex items-center gap-3">
            <kbd className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-primary">CLICK</kbd>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Navigate / Action</span>
         </div>
         <div className="bg-white/5 border border-white/10 px-4 py-2 rounded flex items-center gap-3">
            <kbd className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-secondary">DBL-CLICK</kbd>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Enter Region</span>
         </div>
         <div className="bg-white/5 border border-white/10 px-4 py-2 rounded flex items-center gap-3">
            <kbd className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-tertiary">M / I</kbd>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Tactics / Vault</span>
         </div>
      </div>
    </div>
  );
}
