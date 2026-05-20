import { useEffect, useRef } from 'react';
import type { PlayerStats, CampaignState, PartyMember } from '../types/schemas';

interface GameViewProps {
  stats: PlayerStats;
  campaign: CampaignState;
  party: PartyMember[];
}

export default function GameView({ stats, campaign, party }: GameViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const syncData = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'SYNC_PLAYER_DATA',
          data: {
            ap: stats.ap,
            level: stats.level,
            gold: stats.gold,
            campaign,
            party
          }
        }, '*');
      }
    };

    syncData();
    const timer = setInterval(syncData, 2000);
    return () => clearInterval(timer);
  }, [stats, campaign, party]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8 bg-surface-container-lowest/30 group overflow-hidden">
      {/* Immersive CRT Monitor Frame */}
      <div className="relative w-full max-w-6xl aspect-[4/3] flex items-center justify-center">
        
        {/* Physical Monitor Body / Border */}
        <div className="absolute inset-0 bg-[#1c2331] doodle-border border-[10px] md:border-[20px] border-[#2d3449] shadow-[20px_20px_0px_0px_rgba(0,0,0,0.8)] overflow-hidden rounded-lg">
           {/* Monitor Vents / Hardware Doodles */}
           <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-4 opacity-20">
              <div className="w-10 h-1 bg-surface-bright rounded-full"></div>
              <div className="w-10 h-1 bg-surface-bright rounded-full"></div>
              <div className="w-10 h-1 bg-surface-bright rounded-full"></div>
           </div>
        </div>

        {/* The Screen Surface */}
        <div className="relative w-[95%] h-[92%] overflow-hidden bg-black rounded-[40px] md:rounded-[60px] shadow-inner">
           
           {/* CRT Glass Curvature Highlight */}
           <div className="absolute inset-0 pointer-events-none z-30 opacity-30 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
           <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1),transparent_50%)]"></div>

           {/* Scanlines Effect */}
           <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] animate-pulse opacity-40"></div>

           {/* CRT Flicker & Static */}
           <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] bg-[url('https://media.giphy.com/media/oEI9uWUicKgH6/giphy.gif')] mix-blend-overlay"></div>

           {/* Actual Game Content */}
           <div className="w-full h-full relative z-10 p-2">
             <iframe
              ref={iframeRef}
              src="/game/index.html"
              title="FinJourney Visual World"
              className="w-full h-full rounded-2xl md:rounded-3xl"
              style={{ border: 'none' }}
            />
           </div>

           {/* HUD / Monitor Overlays */}
           <div className="absolute top-6 left-10 z-40 pointer-events-none flex flex-col gap-1">
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                 <span className="font-label text-[10px] uppercase font-black tracking-widest text-primary/80 drop-shadow-md">REC [LIVE]</span>
              </div>
              <span className="font-label text-[8px] uppercase font-bold text-on-surface-variant/40 tracking-[0.3em]">CH: REALM_FEED_01</span>
           </div>

           <div className="absolute bottom-8 right-12 z-40 pointer-events-none">
              <span className="font-label text-[12px] uppercase font-black text-tertiary/60 tracking-widest drop-shadow-md">AETHELGARD_OS v2.4</span>
           </div>

        </div>

        {/* Taped-on labels (External to Screen) */}
        <div className="absolute -top-6 -right-4 bg-primary text-on-primary px-4 py-1 doodle-border rotate-3 z-50 shadow-lg font-headline font-black text-xs uppercase tracking-tighter">
           Property of Ledger Archive
        </div>
        
        <div className="absolute -bottom-4 left-1/4 bg-surface-container-high px-4 py-2 doodle-border -rotate-2 z-50 shadow-xl flex items-center gap-3">
           <span className="material-symbols-outlined text-secondary text-sm animate-pulse">radar</span>
           <span className="font-label text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">Signal Locked: {campaign.currentLocation}</span>
        </div>

      </div>

      {/* Control Hint Tape */}
      <div className="mt-12 flex flex-wrap justify-center gap-4 opacity-60 group-hover:opacity-100 transition-opacity">
         <div className="bg-surface-container p-2 doodle-border border-dashed flex items-center gap-2">
            <span className="text-[10px] font-label font-black uppercase text-primary">Arrows</span>
            <span className="text-[10px] font-body text-on-surface-variant italic">Move Character</span>
         </div>
         <div className="bg-surface-container p-2 doodle-border border-dashed flex items-center gap-2">
            <span className="text-[10px] font-label font-black uppercase text-tertiary">Double Click</span>
            <span className="text-[10px] font-body text-on-surface-variant italic">Enter Region</span>
         </div>
         <div className="bg-surface-container p-2 doodle-border border-dashed flex items-center gap-2">
            <span className="text-[10px] font-label font-black uppercase text-secondary">[I] / [M]</span>
            <span className="text-[10px] font-body text-on-surface-variant italic">Vault / War Room</span>
         </div>
      </div>
    </div>
  );
}
