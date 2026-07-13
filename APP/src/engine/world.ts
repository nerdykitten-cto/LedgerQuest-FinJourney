/**
 * Canonical world model. WorldMapScene renders from LOCATIONS; questForge
 * validates objective targets against it; the director derives travel costs
 * from the coordinates.
 */

export type LocationType = 'village' | 'town' | 'city' | 'citadel';

export interface WorldLocation {
  name: string;
  x: number; // percentage coords on the world map
  y: number;
  description: string;
  type: LocationType;
}

export const LOCATIONS: WorldLocation[] = [
  { name: 'Starting Village', x: 26, y: 40, type: 'village', description: 'A humble beginning for a grand ledger.' },
  { name: 'Copper Town', x: 83, y: 66, type: 'town', description: 'The hub of base metal trade.' },
  { name: 'Silver City', x: 60, y: 12, type: 'city', description: 'Glistening spires of high-yield capital.' },
  { name: 'Iron Citadel', x: 58, y: 62, type: 'citadel', description: 'The fortress of impenetrable savings.' },
];

/** Per-settlement-type map pointer glyph (emoji placeholder — no new map art). */
export const LOCATION_ICON: Record<LocationType, string> = {
  village: '🛖',
  town: '🏘️',
  city: '🏙️',
  citadel: '🏰',
};

export const TOWN_NPCS: Record<string, string[]> = {
  'Starting Village': ['Chronicler Daniel', 'Stablemaster'],
  'Copper Town': ['Copper Smith', 'Market Overseer'],
  'Silver City': ['High Banker', 'Guild Master'],
  'Iron Citadel': ['Commander Fortis', 'Grand Archivist'],
};

/** Story bosses referenced by manifest quests but absent from the bestiary. */
export const BOSSES = ['Debt Gnomes', 'Gorgos'];
