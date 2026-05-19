import type { CampaignState } from '../types/schemas';

interface WorldMapProps {
  campaign: CampaignState;
  onTravel: (location: string) => void;
}

const LOCATIONS = [
  { name: 'Start Town', minProgress: 0, x: 20, y: 80 },
  { name: 'Deep Woods', minProgress: 5, x: 40, y: 60 },
  { name: 'Copper Town', minProgress: 10, x: 60, y: 70 },
  { name: 'Silver City', minProgress: 40, x: 80, y: 30 },
  { name: 'Iron Citadel', minProgress: 75, x: 50, y: 20 },
];

export default function WorldMap({ campaign, onTravel }: WorldMapProps) {
  return (
    <div className="world-map">
      <div className="map-container">
        {LOCATIONS.map(loc => {
          const isUnlocked = campaign.progressPercentage >= loc.minProgress;
          const isCurrent = campaign.currentLocation === loc.name;
          
          return (
            <div 
              key={loc.name}
              className={'map-point ' + (isUnlocked ? 'unlocked ' : 'locked ') + (isCurrent ? 'current' : '')}
              style={{ left: loc.x + '%', top: loc.y + '%' }}
              onClick={() => isUnlocked && !isCurrent && onTravel(loc.name)}
              title={loc.name + (isUnlocked ? '' : ' (Locked)')}
            >
              <div className="point-icon">{isCurrent ? '📍' : '⚪'}</div>
              <span className="point-label">{loc.name}</span>
            </div>
          );
        })}
        <svg className="map-lines">
          {/* Simple lines connecting points if needed */}
        </svg>
      </div>
      <div className="map-legend">
        <p>Current Progress: {campaign.progressPercentage}%</p>
      </div>
    </div>
  );
}
