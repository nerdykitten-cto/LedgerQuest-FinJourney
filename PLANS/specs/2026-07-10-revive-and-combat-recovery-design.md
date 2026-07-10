# Revive Item + Post-Battle Recovery + Combat Balance — Design

Date: 2026-07-10
Status: Approved (design), pending implementation plan
Scope: LedgerQuest demo (`APP/`). One implementation cycle.

## Problem

1. Defeated party members (0 HP) have no reliable recovery path. Today the only
   heal-a-corpse route is an unintended side effect: the War Room "Use" button on a
   Health Potion is gated only by `hp >= maxHp`, so it heals a 0-HP member `+40`.
   In-combat potions correctly exclude the dead (`m.hp > 0`), and there is **no revive
   item** at all (`grep revive` = 0 hits).
2. Post-battle there is no recovery rule: a **won** fight only full-heals the party
   when it also produced a level-up (`applyLevelUps` sets `hp = maxHp`); a win without
   a level-up leaves fallen members at 0. A **lost** fight (`handleBattleDefeat`) just
   flips `worldState:'peace'` with no heal — a party wiped to 0 HP with no potions is a
   **soft-lock** (can't STRIKE with `hp <= 0`, nothing restores HP).
3. The party is effectively unkillable in normal play, so the above can't be
   playtested: each strike out-DPSes the enemy (enemy counters only once per strike),
   party HP (80–120) dwarfs per-battle enemy output, and a fresh player's low
   `skillScore` scales enemies **down** to ~0.7×.

## Goals

- Add a proper **revive item** and a **post-battle recovery rule** (win + loss).
- Make potions vs. revive a clean, mutually exclusive mechanic (potion = living only,
  revive = fallen only).
- Fix the party-wipe soft-lock.
- Buff enemies so death (and therefore revive/recovery) is reachable in real play,
  without breaking the adaptive-difficulty design.

## Non-goals (out of scope)

- In-combat revive (needs new dead-ally targeting UI). Revive is **War Room only**.
- Multi-target revive, revive animations, dedicated revive art (uses the existing
  consumable SVG placeholder; real art later via the single `ItemIcon` swap-point).
- Reworking the adaptive-difficulty philosophy (55–65% win-rate band, pity system stay).
- Rebalancing party attack, MP/abilities, or enemy HP.

## Locked decisions (user, 2026-07-10)

- Revive restores **50% of maxHp**.
- Revive usable in the **War Room only**.
- Won fight: **survivors partial-heal (30% maxHp); fallen stay down.** A level-up win
  still full-heals all (today's behavior, unchanged).
- Lost fight: **revive exactly one member to 30% maxHp** (anti-soft-lock).
- Balance lever: **buff enemies** (roster attack ~+50% + lift the difficulty floor).

## Constants

```
REVIVE_ITEM_PCT   = 0.5   // revive item restores 50% of maxHp
WIN_RECOVERY_PCT  = 0.3   // survivors heal 30% of maxHp on a won fight (no level-up)
DEFEAT_REVIVE_PCT = 0.3   // one member revived to 30% of maxHp on a lost fight
```

## Design

### 1. Schema (`types/schemas.ts`)

Add one optional field to `InventoryItem.statBonus`:

```ts
statBonus?: {
  attack?: number;
  defense?: number;
  hpHeal?: number;
  revive?: number;   // NEW: fraction of maxHp restored; presence marks a revive item
};
```

A revive item is any `type:'Consumable'` with `statBonus.revive` set. No other schema
change; `PartyMember` is untouched.

### 2. Engine — pure functions (TDD)

**`engine/equipment.ts`**

- **`planRevive(item, member): HealDecision | null`** — returns null unless the item is a
  Consumable with `statBonus.revive != null` **and** `member.hp <= 0` (revive the fallen
  only). Otherwise:
  `newHp = min(maxHp, ceil(maxHp * (item.statBonus.revive ?? REVIVE_ITEM_PCT)))`,
  `quantity - 1`, `removeItem` at 0. Reuses the existing `HealDecision` shape.
- **Tighten `planHeal`** — additionally return null when `member.hp <= 0` (can't potion a
  corpse) or when the item is a revive item (`statBonus.revive != null`). Living, damaged
  members with an `hpHeal` potion behave exactly as today. `planHeal` and `planRevive` are
  mutually exclusive.

**`engine/rewardEngine.ts`** (next to `applyLevelUps`)

- **`applyWinRecovery(party): PartyMember[]`** — each member with `hp > 0` heals
  `+ceil(maxHp * WIN_RECOVERY_PCT)` capped at maxHp; members with `hp <= 0` are returned
  unchanged (stay fallen). Pure, no mutation.
- **`applyDefeatRecovery(party): PartyMember[]`** — revive exactly one member to
  `ceil(maxHp * DEFEAT_REVIVE_PCT)`: the member with the highest `maxHp`, ties broken by
  array order (leader first). All other members unchanged. Empty party → returned as-is.

### 3. Post-battle wiring (`App.tsx`)

- **`handleBattleVictory`** — in the `battle-reward` branch:
  - If `a.levelsGained > 0`: persist `a.party` as today (already full-healed by
    `applyLevelUps`).
  - Else: `const recovered = applyWinRecovery(a.party)`; persist each member's `hp`
    (level/maxHp unchanged from `a.party`). Notify mentions survivors recovering.
- **`handleBattleDefeat`** — `const revived = applyDefeatRecovery(party)`; persist the
  member(s) whose `hp` changed; notify e.g. `"<name> was revived to fight another day."`
  before `worldState:'peace'`.

Persistence via the existing `updatePartyMemberDB`. `party` in the defeat handler is the
post-wipe subscribed state (all `hp <= 0`).

### 4. War Room UI (`WarRoom.tsx` + `App.tsx`)

The consumables list branches per item on `item.statBonus?.revive`:

- **Revive item** → button label **"Revive"**, `onClick={onRevive(selected.id, item.id)}`,
  `disabled={selected.hp > 0}` (can't revive the living).
- **Health Potion** → button **"Use"**, `onClick={onHeal(...)}`,
  `disabled={selected.hp <= 0 || selected.hp >= selected.maxHp}` (potion the living only;
  closes the accidental corpse-heal).

New prop `onRevive(memberId, itemId)` → App **`handleWarRevive`**, mirroring
`handleWarHeal` but calling `planRevive`; notify `"<name> is revived (<newHp> HP)"`.

### 5. Content — "Revive Tonic"

`type:'Consumable'`, `statBonus:{ revive: 0.5 }`, `icon:'cardiology'`, `stats:'Revive 50% HP'`,
`description:'Revives a fallen ally to 50% health.'`, no `sprite` → renders the existing
consumable SVG placeholder (no new art, no 404 risk). Added to:

- **Seed inventory** (`persistenceService.ts` `initialItems`): quantity 1.
- **Town shop** (`AdventureWorld/TownScene.tsx` `SHOP_ITEMS`): cost ~120 gold.
- **App template map** (`App.tsx` `ITEM_TEMPLATES`): for quest-reward/template resolution.

### 6. Combat balance — buff enemies

- **Roster attack ~+50%** (`engine/enemyAI.ts` `BESTIARY`, HP unchanged):
  debt-gnome 5→8, interest-imp 6→9, ledger-wraith 7→11, overdraft-ogre 8→12,
  inflation-djinn 10→15, compound-golem 12→18.
- **Lift the difficulty floor** (`engine/difficultyEngine.ts` `difficultyMultiplier`):
  - base band `0.7 + score*0.6` → `0.9 + score*0.5` (0.9–1.4 from skill alone),
  - final clamp `(0.5, 1.6)` → `(0.8, 1.6)`,
  - update the rationale string to match the new numbers.
  - Net: a fresh fight scales ~0.9× (was 0.7×); with the roster bump the Ogre lands
    ~11–15/hit and can drop the 80hp Arcanist over a battle. The win-rate band and
    loss-streak pity still self-correct over time.

## Testing

New/updated unit tests (Vitest, pure functions — no jsdom):

- **`equipment.test.ts`**
  - `planRevive`: fallen member + revive item → `ceil(maxHp*0.5)`, cap at maxHp,
    `quantity` decrement / remove at 0; alive member → null; non-revive consumable → null;
    non-consumable → null.
  - `planHeal` guards: `hp <= 0` member → null; revive item → null; existing living-heal
    cases stay green.
- **`rewardEngine.test.ts`**
  - `applyWinRecovery`: survivor heals 30% capped at maxHp; already-full survivor
    unchanged; fallen (0 HP) stays 0.
  - `applyDefeatRecovery`: all-0 party → highest-maxHp member to `ceil(maxHp*0.3)`, others
    0; tie broken by first; empty party safe.
- **`difficultyEngine.test.ts`**: existing relational/bounds tests stay green; tighten the
  clamp-floor assertion to pin the new **0.8** floor.
- **`enemyAI.test.ts`**: no change (BESTIARY test pins names/count/HP relations, not
  attack values).
- Confirm **`director.test.ts`** stays green (it calls `scaleEnemy`); update only if it
  pins a multiplier/attack value.

Manual/browser verification (preview_eval, battle seeded via `player/campaign` +
localStorage HP edits, per the Phase 6 recipe):

- War Room: select a fallen member → "Revive" enabled, "Use" (potion) disabled → revive to
  50% maxHp, tonic quantity −1. Select a living hurt member → "Use" enabled, "Revive"
  disabled.
- Won fight (no level-up): survivors gain ~30% maxHp; a fallen member stays at 0.
- Lost fight (party wiped): exactly one member returns at ~30% maxHp; no soft-lock.
- Balance: with buffed enemies, drive a battle and confirm a member can actually reach 0.

Gates: `npm test` + `npx tsc -b` + `npm run build` green; commit locally (no push).

## Files touched

- `APP/src/types/schemas.ts` — `statBonus.revive`.
- `APP/src/engine/equipment.ts` (+ `.test.ts`) — `planRevive`, `planHeal` guards.
- `APP/src/engine/rewardEngine.ts` (+ `.test.ts`) — `applyWinRecovery`, `applyDefeatRecovery`.
- `APP/src/engine/enemyAI.ts` — roster attack bump.
- `APP/src/engine/difficultyEngine.ts` (+ `.test.ts`) — floor lift.
- `APP/src/App.tsx` — victory/defeat recovery wiring, `handleWarRevive`, `ITEM_TEMPLATES`,
  WarRoom `onRevive` prop.
- `APP/src/components/WarRoom.tsx` — revive vs. use branch.
- `APP/src/persistenceService.ts` — seed Revive Tonic.
- `APP/src/components/AdventureWorld/TownScene.tsx` — shop Revive Tonic.

## Risks / notes

- `planHeal` now refuses `hp <= 0`. Verify no existing caller depends on corpse-healing
  (in-combat already excludes the dead; War Room button will be re-gated).
- Buffing enemies interacts with adaptive difficulty; the change lifts the floor only, so
  strong players are unaffected at the top of the band. If early play feels too punishing,
  `WIN_RECOVERY_PCT`, `DEFEAT_REVIVE_PCT`, roster values, and the floor are all single-knob
  tunables.
- This is combat-logic tuning — a deliberate, user-approved exception to the Phase 6
  "layout-only, don't rebalance" rule.
