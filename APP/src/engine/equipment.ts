/**
 * Pure equipment & heal decisions for party management. These functions take the
 * current inventory/party snapshot and return a plain "decision" describing what
 * should change — the caller (War Room, Grand Vault) applies it via the
 * persistence API. Source of truth for what is equipped is
 * `InventoryItem.equippedTo`; combat reads that. `PartyMember.equipment` only
 * stores a display name.
 *
 * Scope: 5 slots — weapon / armor / helmet / shield / gloves (Phase 5.5).
 */

import type { EquipSlot, InventoryItem, PartyMember } from '../types/schemas';

export type { EquipSlot };

/** Default HP restored by a potion with no explicit `hpHeal`. */
export const DEFAULT_HP_HEAL = 40;

/** Which slot an equippable item occupies. Prefers the explicit data-driven
 *  `item.slot`; falls back to the legacy heuristic (swords/attack = weapon, else
 *  armor) only for old saves whose items predate the `slot` field. */
export const equipSlotOf = (item: InventoryItem): EquipSlot =>
  item.slot ??
  ((item.icon === 'swords' || item.statBonus?.attack !== undefined) ? 'weapon' : 'armor');

export interface EquipDecision {
  slot: EquipSlot;
  memberId: string;
  itemId: string;
  displayName: string;
  /** A same-slot item already on this member that must be unequipped first. */
  unequipItemId?: string;
}

/** Plan equipping `item` onto `memberId`, clearing any prior same-slot item. */
export function planEquip(
  item: InventoryItem,
  memberId: string,
  inventory: InventoryItem[],
): EquipDecision {
  const slot = equipSlotOf(item);
  const prior = inventory.find(
    i => i.id !== item.id && i.equippedTo === memberId && equipSlotOf(i) === slot,
  );
  return {
    slot,
    memberId,
    itemId: item.id,
    displayName: item.name,
    unequipItemId: prior?.id,
  };
}

export interface UnequipDecision {
  slot: EquipSlot;
  memberId: string;
  itemId: string;
}

/** Plan unequipping `item`; null when it is not currently equipped. */
export function planUnequip(item: InventoryItem): UnequipDecision | null {
  if (!item.equippedTo) return null;
  return { slot: equipSlotOf(item), memberId: item.equippedTo, itemId: item.id };
}

export interface HealDecision {
  memberId: string;
  itemId: string;
  newHp: number;
  removeItem: boolean;
  newQuantity: number;
}

/** Plan using a consumable on `member`: HP up (capped at maxHp), quantity down,
 *  remove at 0. Null when the item is not a consumable. */
export function planHeal(item: InventoryItem, member: PartyMember): HealDecision | null {
  if (item.type !== 'Consumable') return null;
  if (member.hp <= 0) return null;                 // corpses need a revive, not a potion
  if (item.statBonus?.revive != null) return null; // revive items are handled by planRevive
  const hpHeal = item.statBonus?.hpHeal ?? DEFAULT_HP_HEAL;
  const newHp = Math.min(member.maxHp, member.hp + hpHeal);
  const newQuantity = item.quantity - 1;
  return {
    memberId: member.id,
    itemId: item.id,
    newHp,
    removeItem: newQuantity <= 0,
    newQuantity: Math.max(0, newQuantity),
  };
}

/** Default fraction of maxHp restored by a revive item with no explicit `revive`. */
export const DEFAULT_REVIVE_PCT = 0.5;

/** Plan reviving a FALLEN member (hp <= 0) with a revive consumable: HP set to
 *  ceil(maxHp * pct), quantity down, remove at 0. Null unless the item is a
 *  revive consumable and the member is actually down. */
export function planRevive(item: InventoryItem, member: PartyMember): HealDecision | null {
  if (item.type !== 'Consumable') return null;
  if (item.statBonus?.revive == null) return null;
  if (member.hp > 0) return null;
  const pct = item.statBonus.revive ?? DEFAULT_REVIVE_PCT;
  const newHp = Math.min(member.maxHp, Math.ceil(member.maxHp * pct));
  const newQuantity = item.quantity - 1;
  return {
    memberId: member.id,
    itemId: item.id,
    newHp,
    removeItem: newQuantity <= 0,
    newQuantity: Math.max(0, newQuantity),
  };
}
