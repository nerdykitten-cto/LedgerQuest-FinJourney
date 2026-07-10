import { describe, it, expect } from 'vitest';
import { equipSlotOf, planEquip, planUnequip, planHeal } from './equipment';
import type { InventoryItem, PartyMember } from '../types/schemas';

const mkItem = (over: Partial<InventoryItem> = {}): InventoryItem => ({
  id: 'i1', templateId: 't1', name: 'Item', type: 'Equipment',
  icon: 'inventory', description: '', weight: 1, quantity: 1, ...over,
});

const sword = (over: Partial<InventoryItem> = {}): InventoryItem =>
  mkItem({ id: 'w1', name: 'Blade', icon: 'swords', statBonus: { attack: 10 }, ...over });

const shield = (over: Partial<InventoryItem> = {}): InventoryItem =>
  mkItem({ id: 'a1', name: 'Aegis', icon: 'shield', statBonus: { defense: 8 }, ...over });

const potion = (over: Partial<InventoryItem> = {}): InventoryItem =>
  mkItem({ id: 'p1', name: 'Health Potion', type: 'Consumable', icon: 'science', statBonus: { hpHeal: 40 }, quantity: 3, ...over });

const mkMember = (over: Partial<PartyMember> = {}): PartyMember => ({
  id: 'm1', name: 'Althea', avatar: '', role: 'Leader',
  level: 1, hp: 100, maxHp: 100, mp: 20, maxMp: 20, equipment: {}, ...over,
});

describe('equipSlotOf', () => {
  it('classifies swords/attack items as weapon', () => {
    expect(equipSlotOf(sword())).toBe('weapon');
    expect(equipSlotOf(mkItem({ icon: 'axe', statBonus: { attack: 5 } }))).toBe('weapon');
  });
  it('classifies everything else as armor', () => {
    expect(equipSlotOf(shield())).toBe('armor');
    expect(equipSlotOf(mkItem({ icon: 'shield_person', statBonus: { defense: 4 } }))).toBe('armor');
  });
});

describe('planEquip', () => {
  it('equips an item onto a member with no prior item in that slot', () => {
    const d = planEquip(sword(), 'm1', [sword()]);
    expect(d.slot).toBe('weapon');
    expect(d.memberId).toBe('m1');
    expect(d.itemId).toBe('w1');
    expect(d.displayName).toBe('Blade');
    expect(d.unequipItemId).toBeUndefined();
  });

  it('unequips the prior same-slot item on that member first', () => {
    const oldSword = sword({ id: 'w0', name: 'Old', equippedTo: 'm1' });
    const newSword = sword({ id: 'w1', name: 'New' });
    const d = planEquip(newSword, 'm1', [oldSword, newSword]);
    expect(d.unequipItemId).toBe('w0');
  });

  it('ignores items in a different slot when finding the prior item', () => {
    const armorOn = shield({ id: 'a0', equippedTo: 'm1' });
    const d = planEquip(sword(), 'm1', [armorOn, sword()]);
    expect(d.unequipItemId).toBeUndefined();
  });

  it('ignores same-slot items equipped on a different member', () => {
    const otherSword = sword({ id: 'w9', equippedTo: 'm2' });
    const d = planEquip(sword(), 'm1', [otherSword, sword()]);
    expect(d.unequipItemId).toBeUndefined();
  });

  it('does not treat the item itself as the prior item', () => {
    const s = sword({ id: 'w1', equippedTo: 'm1' });
    const d = planEquip(s, 'm1', [s]);
    expect(d.unequipItemId).toBeUndefined();
  });
});

describe('planUnequip', () => {
  it('returns the member and slot to clear', () => {
    const d = planUnequip(sword({ equippedTo: 'm1' }));
    expect(d).toEqual({ slot: 'weapon', memberId: 'm1', itemId: 'w1' });
  });
  it('returns null for an item that is not equipped', () => {
    expect(planUnequip(sword())).toBeNull();
  });
});

describe('planHeal', () => {
  it('heals up to maxHp and decrements a stacked potion', () => {
    const d = planHeal(potion(), mkMember({ hp: 30, maxHp: 100 }));
    expect(d).not.toBeNull();
    expect(d!.newHp).toBe(70);
    expect(d!.removeItem).toBe(false);
    expect(d!.newQuantity).toBe(2);
  });
  it('caps HP at maxHp (never overheals)', () => {
    const d = planHeal(potion(), mkMember({ hp: 90, maxHp: 100 }));
    expect(d!.newHp).toBe(100);
  });
  it('removes the potion when the last one is used', () => {
    const d = planHeal(potion({ quantity: 1 }), mkMember({ hp: 10 }));
    expect(d!.removeItem).toBe(true);
    expect(d!.newQuantity).toBe(0);
  });
  it('falls back to 40 HP when hpHeal is unset', () => {
    const d = planHeal(potion({ statBonus: {} }), mkMember({ hp: 0, maxHp: 100 }));
    expect(d!.newHp).toBe(40);
  });
  it('returns null for a non-consumable item', () => {
    expect(planHeal(sword(), mkMember())).toBeNull();
  });
});


// ── Phase 5.5: 5-slot, data-driven slotting ──────────────────────────────────
const gear = (slot: any, over: Partial<InventoryItem> = {}): InventoryItem =>
  mkItem({ id: 'g_' + slot, name: slot + ' gear', slot, statBonus: { defense: 5 }, ...over });

describe('equipSlotOf — data-driven slot', () => {
  it('reads item.slot for all five slots', () => {
    expect(equipSlotOf(gear('weapon'))).toBe('weapon');
    expect(equipSlotOf(gear('armor'))).toBe('armor');
    expect(equipSlotOf(gear('helmet'))).toBe('helmet');
    expect(equipSlotOf(gear('shield'))).toBe('shield');
    expect(equipSlotOf(gear('gloves'))).toBe('gloves');
  });
  it('prefers item.slot over the legacy heuristic', () => {
    // a sword-iconed/attack item explicitly slotted as gloves stays gloves
    expect(equipSlotOf(mkItem({ icon: 'swords', statBonus: { attack: 9 }, slot: 'gloves' }))).toBe('gloves');
  });
  it('falls back to the heuristic for legacy items with no slot', () => {
    expect(equipSlotOf(sword())).toBe('weapon');           // no slot -> attack heuristic
    expect(equipSlotOf(shield())).toBe('armor');           // no slot -> else = armor
  });
});

describe('planEquip — per-slot swap across five slots', () => {
  const slots = ['weapon', 'armor', 'helmet', 'shield', 'gloves'] as const;
  it('swaps the prior item in the SAME slot on that member', () => {
    for (const slot of slots) {
      const prior = gear(slot, { id: slot + '-old', equippedTo: 'm1' });
      const next = gear(slot, { id: slot + '-new' });
      const d = planEquip(next, 'm1', [prior, next]);
      expect(d.slot).toBe(slot);
      expect(d.unequipItemId).toBe(slot + '-old');
    }
  });
  it('does NOT swap when the prior item is a DIFFERENT slot', () => {
    const helmetOn = gear('helmet', { id: 'h-old', equippedTo: 'm1' });
    const glovesNew = gear('gloves', { id: 'g-new' });
    const d = planEquip(glovesNew, 'm1', [helmetOn, glovesNew]);
    expect(d.unequipItemId).toBeUndefined();
  });
  it('lets one member hold one item in every slot at once', () => {
    const worn = slots.map(s => gear(s, { id: s + '-worn', equippedTo: 'm1' }));
    // equipping a new gloves only displaces the worn gloves, nothing else
    const d = planEquip(gear('gloves', { id: 'g2' }), 'm1', [...worn, gear('gloves', { id: 'g2' })]);
    expect(d.unequipItemId).toBe('gloves-worn');
  });
});
