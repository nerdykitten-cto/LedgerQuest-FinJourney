import { useEffect, useRef } from 'react';
import type { PlayerStats } from '../types/schemas';

interface GameViewProps {
  stats: PlayerStats;
}

export default function GameView({ stats }: GameViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const syncData = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'SYNC_PLAYER_DATA',
          data: {
            ap: stats.ap,
            level: stats.level,
            gold: stats.gold
          }
        }, '*');
      }
    };

    // Send data initially and whenever stats change
    syncData();
    
    // Also send on a slight delay to ensure game is ready
    const timer = setTimeout(syncData, 2000);
    return () => clearTimeout(timer);
  }, [stats]);

  return (
    <div className="game-container">
      <iframe
        ref={iframeRef}
        src="/game/index.html" // This assumes the game is served at /game/
        title="FinJourney Game World"
        width="800"
        height="600"
        style={{ border: 'none', borderRadius: '8px', background: '#1a1a1a' }}
      />
      <div className="game-hint">
        <p>Visual Game World (Phaser Engine)</p>
      </div>
    </div>
  );
}
