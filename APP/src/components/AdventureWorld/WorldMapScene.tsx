import React, { useState } from 'react';
import type { PlayerStats, CampaignState } from '../../types/schemas';

interface WorldMapSceneProps {
  stats: PlayerStats;
  campaign: CampaignState;
  onTravel: (destination: string, cost: number) => void;
  onEnterTown: (name: string) => void;
  showDialogue: (msg: string) => void;
}

const LOCATIONS = [
  { name: 'Starting Village', x: 180, y: 480, description: 'A humble beginning for a grand ledger.' },
  { name: 'Copper Town', x: 580, y: 420, description: 'The hub of base metal trade.' },
  { name: 'Silver City', x: 720, y: 220, description: 'Glistening spires of high-yield capital.' },
  { name: 'Iron Citadel', x: 400, y: 120, description: 'The fortress of impenetrable savings.' }
];

export const WorldMapScene: React.FC<WorldMapSceneProps> = ({ 
  stats, 
  campaign, 
  onTravel, 
  onEnterTown,
  showDialogue 
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLocationClick = (name: string) => {
    const now = Date.now();
    const diff = now - lastClickTime;
    setLastClickTime(now);

    if (diff < 350 && name === campaign.currentLocation) {
      onEnterTown(name);
      return;
    }

    if (name === campaign.currentLocation) {
      showDialogue(`You are already at ${name}.`);
      return;
    }

    const cost = 20; // Default travel cost
    if (stats.ap >= cost) {
      onTravel(name, cost);
    } else {
      showDialogue('INSUFFICIENT ACTION POINTS FOR TRAVEL.');
    }
  };

  return (
    <div className="relative w-[800px] h-[600px] overflow-hidden bg-[#060d20]">
      {/* World Map Image */}
      <img 
        src="/assets/game/world_map.png" 
        className="absolute inset-0 w-full h-full object-cover opacity-70"
        alt="World Map"
      />
      
      {/* Overlay for dark mood */}
      <div className="absolute inset-0 bg-[#060d20]/30 pointer-events-none" />

      {/* Connection Paths (Simplified as SVG lines) */}
      <svg className="absolute inset-0 pointer-events-none">
        <polyline
          points={LOCATIONS.map(l => `${l.x},${l.y}`).join(' ')}
          fill="none"
          stroke="#f4d03f66"
          strokeWidth="3"
        />
      </svg>

      {/* Location Nodes */}
      {LOCATIONS.map((loc) => (
        <div 
          key={loc.name}
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          style={{ left: loc.x, top: loc.y }}
          onClick={() => handleLocationClick(loc.name)}
          onMouseEnter={() => setSelectedLocation(loc.name)}
          onMouseLeave={() => setSelectedLocation(null)}
        >
          {/* Glow Effect */}
          <div className={`absolute inset-0 -m-6 rounded-full bg-[#f4d03f]/20 blur-xl transition-all duration-500 ${selectedLocation === loc.name ? 'scale-150 opacity-40' : 'scale-100 opacity-20'}`} />
          
          {/* Map Pin Icon (Using a CSS circle/dot for now, could use image) */}
          <div className={`w-6 h-6 rounded-full border-2 border-[#f4d03f] flex items-center justify-center transition-transform ${selectedLocation === loc.name ? 'scale-125' : 'scale-100'} ${campaign.currentLocation === loc.name ? 'bg-[#f4d03f]' : 'bg-[#171f33]'}`}>
            {campaign.currentLocation === loc.name && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
          </div>

          {/* Name Tag */}
          <div className={`absolute top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#171f33]/90 border border-[#4c4634] whitespace-nowrap transition-all ${selectedLocation === loc.name ? 'opacity-100 scale-110' : 'opacity-80 scale-100'}`}>
            <span className={`font-label text-[10px] uppercase font-bold ${selectedLocation === loc.name ? 'text-[#f4d03f]' : 'text-[#ffeebb]'}`}>
              {loc.name}
            </span>
          </div>
        </div>
      ))}

      {/* Hero Icon (Placeholder character) */}
      {/* We could place the hero at the current location */}
      {LOCATIONS.filter(l => l.name === campaign.currentLocation).map(loc => (
        <div 
          key="hero-marker"
          className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-1000 ease-in-out z-50"
          style={{ left: loc.x, top: loc.y - 15 }}
        >
          <img 
            src="/assets/game/hero.png" 
            className="w-16 h-16 animate-bounce" 
            style={{ animationDuration: '2s' }}
            alt="Hero"
          />
        </div>
      ))}
    </div>
  );
};
