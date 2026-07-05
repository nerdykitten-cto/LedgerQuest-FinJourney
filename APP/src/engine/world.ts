/**
 * Canonical world model. WorldMapScene renders from LOCATIONS; questForge
 * validates objective targets against it; the director derives travel costs
 * from the coordinates.
 */

export interface WorldLocation {
  name: string;
  x: number; // percentage coords on the world map
  y: number;
  description: string;
}

export const LOCATIONS: WorldLocation[] = [
  { name: 'Starting Village', x: 22.5, y: 80, description: 'A humble beginning for a grand ledger.' },
  { name: 'Copper Town', x: 72.5, y: 70, description: 'The hub of base metal trade.' },
  { name: 'Silver City', x: 90, y: 36.6, description: 'Glistening spires of high-yield capital.' },
  { name: 'Iron Citadel', x: 50, y: 20, description: 'The fortress of impenetrable savings.' },
];

export const TOWN_NPCS: Record<string, string[]> = {
  'Starting Village': ['Chronicler Daniel', 'Stablemaster'],
  'Copper Town': ['Copper Smith', 'Market Overseer'],
  'Silver City': ['High Banker', 'Guild Master'],
  'Iron Citadel': ['Commander Fortis', 'Grand Archivist'],
};

/** Story bosses referenced by manifest quests but absent from the bestiary. */
export const BOSSES = ['Debt Gnomes', 'Gorgos'];
