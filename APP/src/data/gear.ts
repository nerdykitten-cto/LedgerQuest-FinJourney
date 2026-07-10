import type { EquipSlot, InventoryItem } from '../types/schemas';

/**
 * Single source of truth for the demo's equippable gear (Phase 5.5). Feeds the
 * fresh-save seed (`persistenceService`), the Town Armory shop (`TownScene`) and
 * the quest-reward template map (`App`). Every entry carries an explicit `slot`
 * so slotting is data-driven (the engine's icon/attack heuristic is a legacy
 * fallback only). Scope = 5 slots: weapon / armor (body) / helmet / shield /
 * gloves — boots & back are intentionally out.
 *
 * Art note: only a few baked PNGs exist per non-weapon slot, so several items in
 * the same slot reuse one sprite (they still differ by name / stats). The shield
 * sprite is a whitelisted copy of the old UI shield (`equipment/tower-shield.png`).
 */

export interface GearTemplate {
  templateId: string;
  name: string;
  slot: EquipSlot;
  icon: string;
  sprite: string;
  stats: string;
  statBonus: { attack?: number; defense?: number };
  weight: number;
  cost: number;
  description: string;
}

export const GEAR_CATALOG: GearTemplate[] = [
  // ── Weapons (attack) ──────────────────────────────────────────────
  { templateId: 'iron-sword', name: 'Budget Slicer', slot: 'weapon', icon: 'swords',
    sprite: '/assets/game/weapons/gear_right_26.png', stats: '+10 Attack',
    statBonus: { attack: 10 }, weight: 3.0, cost: 150,
    description: 'A keen blade used to trim unnecessary expenses.' },
  { templateId: 'oak-club', name: 'Oak Cudgel', slot: 'weapon', icon: 'swords',
    sprite: '/assets/game/equipment/oak-club.png', stats: '+7 Attack',
    statBonus: { attack: 7 }, weight: 2.5, cost: 90,
    description: 'A blunt reminder that debts must be paid.' },
  { templateId: 'war-axe', name: 'Deficit Cleaver', slot: 'weapon', icon: 'swords',
    sprite: '/assets/game/equipment/war-axe.png', stats: '+15 Attack',
    statBonus: { attack: 15 }, weight: 5.0, cost: 260,
    description: 'Splits overspending in a single swing.' },
  { templateId: 'flintlock', name: 'Interest Piercer', slot: 'weapon', icon: 'swords',
    sprite: '/assets/game/equipment/flintlock.png', stats: '+18 Attack',
    statBonus: { attack: 18 }, weight: 2.0, cost: 340,
    description: 'A ranged bite for compounding threats.' },

  // ── Body armor (defense) ──────────────────────────────────────────
  { templateId: 'leather-tunic', name: 'Leather Tunic', slot: 'armor', icon: 'shield',
    sprite: '/assets/game/equipment/leather-tunic.png', stats: '+8 Defense',
    statBonus: { defense: 8 }, weight: 5.0, cost: 100,
    description: 'Supple padding against small overruns.' },
  { templateId: 'padded-gambeson', name: 'Padded Gambeson', slot: 'armor', icon: 'shield',
    sprite: '/assets/game/equipment/leather-tunic.png', stats: '+5 Defense',
    statBonus: { defense: 5 }, weight: 4.0, cost: 70,
    description: 'Quilted layers that soften every hit.' },
  { templateId: 'travelers-vest', name: "Traveler's Vest", slot: 'armor', icon: 'shield',
    sprite: '/assets/game/equipment/wanderer-pack.png', stats: '+10 Defense',
    statBonus: { defense: 10 }, weight: 6.0, cost: 160,
    description: 'Reinforced canvas built for the long road.' },
  { templateId: 'iron-cuirass', name: 'Iron Cuirass', slot: 'armor', icon: 'shield',
    sprite: '/assets/game/equipment/leather-tunic.png', stats: '+14 Defense',
    statBonus: { defense: 14 }, weight: 9.0, cost: 300,
    description: 'A solid breastplate for a solid budget.' },

  // ── Helmets (defense) ─────────────────────────────────────────────
  { templateId: 'iron-helm', name: 'Iron Helm', slot: 'helmet', icon: 'shield',
    sprite: '/assets/game/equipment/iron-helm.png', stats: '+6 Defense',
    statBonus: { defense: 6 }, weight: 3.0, cost: 120,
    description: 'Keeps a clear head when the numbers spike.' },
  { templateId: 'leather-cap', name: 'Leather Cap', slot: 'helmet', icon: 'shield',
    sprite: '/assets/game/equipment/iron-helm.png', stats: '+3 Defense',
    statBonus: { defense: 3 }, weight: 1.5, cost: 55,
    description: 'Light headgear for cautious scribes.' },
  { templateId: 'scholars-spectacles', name: "Scholar's Spectacles", slot: 'helmet', icon: 'shield',
    sprite: '/assets/game/equipment/spectacles.png', stats: '+2 Defense',
    statBonus: { defense: 2 }, weight: 0.5, cost: 80,
    description: 'See the fine print before it bites.' },
  { templateId: 'steel-barbute', name: 'Steel Barbute', slot: 'helmet', icon: 'shield',
    sprite: '/assets/game/equipment/iron-helm.png', stats: '+9 Defense',
    statBonus: { defense: 9 }, weight: 4.0, cost: 220,
    description: 'Full-face steel for the fiscally fearless.' },

  // ── Shields (defense) ─────────────────────────────────────────────
  { templateId: 'buckler', name: 'Buckler', slot: 'shield', icon: 'shield',
    sprite: '/assets/game/equipment/tower-shield.png', stats: '+4 Defense',
    statBonus: { defense: 4 }, weight: 2.0, cost: 60,
    description: 'A small guard for quick deflections.' },
  { templateId: 'kite-shield', name: 'Kite Shield', slot: 'shield', icon: 'shield',
    sprite: '/assets/game/equipment/tower-shield.png', stats: '+8 Defense',
    statBonus: { defense: 8 }, weight: 5.0, cost: 140,
    description: 'Balanced cover from crown to shin.' },
  { templateId: 'tower-shield', name: 'Tower Shield', slot: 'shield', icon: 'shield',
    sprite: '/assets/game/equipment/tower-shield.png', stats: '+12 Defense',
    statBonus: { defense: 12 }, weight: 8.0, cost: 280,
    description: 'A wall of wood and iron against ruin.' },
  { templateId: 'ledger-shield', name: 'Ledger Shield', slot: 'shield', icon: 'shield',
    sprite: '/assets/game/equipment/tower-shield.png', stats: '+10 Defense',
    statBonus: { defense: 10 }, weight: 6.0, cost: 200,
    description: 'Protects against sudden market crashes.' },

  // ── Gloves (defense) ──────────────────────────────────────────────
  { templateId: 'leather-gloves', name: 'Leather Gloves', slot: 'gloves', icon: 'shield',
    sprite: '/assets/game/equipment/leather-gloves.png', stats: '+2 Defense',
    statBonus: { defense: 2 }, weight: 0.8, cost: 45,
    description: 'A steady grip on the coin purse.' },
  { templateId: 'padded-mitts', name: 'Padded Mitts', slot: 'gloves', icon: 'shield',
    sprite: '/assets/game/equipment/leather-gloves.png', stats: '+3 Defense',
    statBonus: { defense: 3 }, weight: 1.0, cost: 65,
    description: 'Thick mitts that blunt careless spending.' },
  { templateId: 'thiefs-gloves', name: "Thief's Gloves", slot: 'gloves', icon: 'shield',
    sprite: '/assets/game/equipment/leather-gloves.png', stats: '+4 Defense',
    statBonus: { defense: 4 }, weight: 0.6, cost: 110,
    description: 'Nimble fingers that never miss a discount.' },
  { templateId: 'ironclad-gauntlets', name: 'Ironclad Gauntlets', slot: 'gloves', icon: 'shield',
    sprite: '/assets/game/equipment/leather-gloves.png', stats: '+5 Defense',
    statBonus: { defense: 5 }, weight: 2.5, cost: 170,
    description: 'Plated fists for an iron-clad ledger.' },
];

/** A ready InventoryItem template map keyed by display name (quest rewards). */
export const GEAR_BY_NAME: Record<string, Partial<InventoryItem>> = Object.fromEntries(
  GEAR_CATALOG.map(g => [g.name, {
    templateId: g.templateId, name: g.name, type: 'Equipment' as const,
    slot: g.slot, icon: g.icon, sprite: g.sprite, stats: g.stats,
    statBonus: g.statBonus, weight: g.weight, description: g.description,
  }]),
);
