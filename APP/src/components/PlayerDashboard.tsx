import React from 'react';
import type { PlayerStats } from '../types/schemas';

interface Props {
  stats: PlayerStats;
}

const PlayerDashboard: React.FC<Props> = ({ stats }) => {
  return (
    <div className="player-dashboard">
      <h3>Player Stats</h3>
      <div className="stat-grid">
        <div className="stat">Level: {stats.level}</div>
        <div className="stat">EXP: {stats.exp}</div>
        <div className="stat">Gold: {stats.gold}</div>
        <div className="stat">Action Points (AP): {stats.ap}</div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
