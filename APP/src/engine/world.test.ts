import { describe, it, expect } from 'vitest';
import { LOCATIONS, LOCATION_ICON, type LocationType } from './world';

const TYPES: LocationType[] = ['village', 'town', 'city', 'citadel'];

describe('world LOCATIONS typing', () => {
  it('tags every location with a valid settlement type', () => {
    expect(LOCATIONS).toHaveLength(4);
    for (const loc of LOCATIONS) {
      expect(TYPES).toContain(loc.type);
    }
  });

  it('assigns the canonical type per location', () => {
    const byName = Object.fromEntries(LOCATIONS.map(l => [l.name, l.type]));
    expect(byName['Starting Village']).toBe('village');
    expect(byName['Copper Town']).toBe('town');
    expect(byName['Silver City']).toBe('city');
    expect(byName['Iron Citadel']).toBe('citadel');
  });

  it('has a pointer glyph for every settlement type', () => {
    for (const t of TYPES) {
      expect(LOCATION_ICON[t]).toBeTruthy();
    }
  });
});
