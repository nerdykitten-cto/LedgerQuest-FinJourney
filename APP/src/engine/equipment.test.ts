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
