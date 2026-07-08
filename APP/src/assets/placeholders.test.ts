import { describe, it, expect } from 'vitest';
import {
  isAssetPath,
  partyArt,
  enemyArt,
  itemArtKind,
  isBakedItemArt,
  PARTY_ART,
  ENEMY_ART,
  DEFAULT_ENEMY_ART,
} from './placeholders';
import type { InventoryItem } from '../types/schemas';

const item = (over: Partial<InventoryItem>): InventoryItem => ({
  id: 'x',
  templateId: 't',
  name: 'n',
  type: 'Equipment',
  icon: '',
  description: '',
  weight: 1,
  quantity: 1,
  ...over,
});

describe('isAssetPath', () => {
  it('is true for absolute + http asset paths', () => {
    expect(isAssetPath('/assets/game/characters/p1.png')).toBe(true);
    expect(isAssetPath('https://cdn/x.png')).toBe(true);
  });
  it('is false for emoji / plain strings / empty', () => {
    expect(isAssetPath('🧝🏻‍♀️')).toBe(false);
    expect(isAssetPath('')).toBe(false);
    expect(isAssetPath('swords')).toBe(false);
  });
});

describe('partyArt', () => {
  it('passes real asset paths straight through (swap-point)', () => {
    expect(partyArt('/assets/game/characters/p1.png')).toBe('/assets/game/characters/p1.png');
  });
  it('maps known seed ids to their emoji', () => {
    expect(partyArt('p1')).toBe(PARTY_ART.p1);
    expect(partyArt('p2')).toBe(PARTY_ART.p2);
    expect(partyArt('p3')).toBe(PARTY_ART.p3);
  });
  it('the 3 starting members are visually distinct', () => {
    const set = new Set([PARTY_ART.p1, PARTY_ART.p2, PARTY_ART.p3]);
    expect(set.size).toBe(3);
  });
  it('seed members now point at baked character art', () => {
    for (const id of ['p1', 'p2', 'p3'] as const) {
      expect(PARTY_ART[id]).toMatch(/^\/assets\/game\/characters\/.+\.png$/);
      expect(isAssetPath(PARTY_ART[id])).toBe(true);
    }
  });
  it('returns a non-empty emoji fallback for unknown ids', () => {
    expect(partyArt('nobody')).not.toBe('');
    expect(isAssetPath(partyArt('nobody'))).toBe(false);
  });
});

describe('enemyArt', () => {
  it('maps every bestiary id to a creepy emoji', () => {
    for (const id of Object.keys(ENEMY_ART)) {
      expect(enemyArt(id)).toBe(ENEMY_ART[id]);
      expect(enemyArt(id)).not.toBe('');
    }
  });
  it('falls back to an oni mask for unknown enemies', () => {
    expect(enemyArt('gorgos')).toBe(DEFAULT_ENEMY_ART);
  });
  it('never leaks a .png path', () => {
    for (const v of [...Object.values(ENEMY_ART), DEFAULT_ENEMY_ART]) {
      expect(v).not.toMatch(/\.png|\.svg|\/assets/);
    }
  });
});

describe('itemArtKind', () => {
  it('classifies weapons', () => {
    expect(itemArtKind(item({ icon: 'swords' }))).toBe('sword');
    expect(itemArtKind(item({ statBonus: { attack: 10 } }))).toBe('sword');
  });
  it('classifies shields / armor', () => {
    expect(itemArtKind(item({ icon: 'shield' }))).toBe('shield');
    expect(itemArtKind(item({ statBonus: { defense: 5 } }))).toBe('armor');
  });
  it('classifies consumables as potion', () => {
    expect(itemArtKind(item({ type: 'Consumable', icon: 'science' }))).toBe('potion');
    expect(itemArtKind(item({ type: 'Consumable', statBonus: { hpHeal: 40 } }))).toBe('potion');
  });
  it('classifies quest items', () => {
    expect(itemArtKind(item({ type: 'Quest', icon: 'inventory_2' }))).toBe('quest');
  });
});

describe('isBakedItemArt', () => {
  it('matches baked equipment/consumable dirs only', () => {
    expect(isBakedItemArt('/assets/game/equipment/iron-sword.png')).toBe(true);
    expect(isBakedItemArt('/assets/game/consumables/x.png')).toBe(true);
  });
  it('rejects legacy / non-baked sprite paths (no 404 leak)', () => {
    expect(isBakedItemArt('/assets/game/weapons/bat_1.png')).toBe(false);
    expect(isBakedItemArt('/assets/ui/Icon_Shield.png')).toBe(false);
    expect(isBakedItemArt(undefined)).toBe(false);
    expect(isBakedItemArt('')).toBe(false);
  });
});
