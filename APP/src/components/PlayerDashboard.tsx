import React from 'react';
import type { PlayerStats } from '../types/schemas';

interface Props {
  stats: PlayerStats;
}

const PlayerDashboard: React.FC<Props> = ({ stats }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-6 px-4">
      {/* AP Badge - The Central Bridge */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-primary/20 rounded-full blur group-hover:bg-primary/30 transition"></div>
        <div className="relative doodle-border bg-surface-container-high px-8 py-3 flex flex-col items-center min-w-[120px] hover:jiggle">
          <span className="font-label text-xs uppercase tracking-widest text-primary/60">Action Points</span>
          <span className="font-headline text-3xl font-bold text-primary">{stats.ap} AP</span>
        </div>
      </div>

      {/* Other Stats */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="doodle-border bg-surface-container px-4 py-2 flex flex-col items-center min-w-[80px]">
          <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Level</span>
          <span className="font-headline text-xl font-bold text-tertiary">{stats.level}</span>
        </div>

        <div className="doodle-border bg-surface-container px-4 py-2 flex flex-col items-center min-w-[100px]">
          <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">EXP</span>
          <span className="font-headline text-xl font-bold text-tertiary">{stats.exp}</span>
        </div>

        <div className="doodle-border bg-surface-container px-4 py-2 flex flex-col items-center min-w-[100px]">
          <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Gold</span>
          <span className="font-headline text-xl font-bold text-primary-container">{stats.gold}g</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
