# Combat Stat Foundation + Revive Item + Post-Battle Recovery + Enemy Buff — Design

Date: 2026-07-10
Status: Approved (design), pending implementation plan
Scope: LedgerQuest demo (`APP/`). One spec, implemented in two phases (stat
foundation, then revive/recovery/balance on top).

## Problem

1. **No competent stat system.** `PartyMember` carries only `level, hp, maxHp, mp,
   maxMp, role, equipment{5 slots}` — **no base attributes**. Offense is `level*10 +
   weapon.attack + rand`; defense is only `Σ gear.defense`. Several stats are dead:
   - `enemy.defense` is **never applied** — player strike damage does not subtract it;
     `scaleEnemy` doesn't even scale it. Purely decorative.
   - `mp/maxMp` back **no ability/mana system** (only an AI targeting hint). Out of scope
     to fix here.
   Result: battles are a damage-trade loop, not stats management. The only genuine
   player-tweakable lever is equipment attack/defense.
2. Defeated members (0 HP) have **no reliable recovery**. The only corpse-heal today is
   an unintended side effect (War Room "Use" on a Health Potion is gated only by
   `hp >= maxHp`, so it heals a 0-HP member `+40`). In-combat potions correctly exclude
   the dead. There is **no revive item** (`grep revive` = 0 hits).
3. **No post-battle recovery rule.** A won fight only full-heals when it produced a
   level-up (`applyLevelUps` sets `hp = maxHp`); otherwise fallen members stay at 0. A
   lost fight just flips `worldState:'peace'` — a party wiped to 0 HP with no potions is
   a **soft-lock** (can't STRIKE with `hp <= 0`, nothing restores HP).
4. The party is effectively **unkillable in normal play**, so #2/#3 can't be
   playtested: the player out-DPSes the enemy, party HP (80–120) dwarfs enemy output,
   and a fresh player's low `skillScore` scales enemies **down** to ~0.7×.

## Goals

- Give characters and enemies an **honest, minimal stat model** the player can review
  and tweak with equipment: base **attack** + **defense** on characters (gear augments a
  real stat instead of being the whole thing), and make **`enemy.defense` live** in
  player damage.
- Extract the combat damage formulas into a **pure, tested module** so the math is
  reviewable and unit-covered.
- Add a proper **revive item** and a **post-battle recovery rule** (win + loss); fix the
  wipe soft-lock; make potion-vs-revive mutually exclusive (potion = living only, revive
  = fallen only).
- **Buff enemies** so death (and therefore revive/recovery) is reachable in real play,
  without breaking the adaptive-difficulty design.

## Non-goals (out of scope)

- New primary attributes beyond attack/defense (no speed/initiative, crit-rate, evasion,
  elements, resistances, status effects).
- MP/mana/ability system (MP stays a dead resource / AI hint for now).
- In-combat revive (needs dead-ally targeting UI). Revive is **War Room only**.
- Multi-target revive, revive animations, dedicated revive art (uses the existing
  consumable SVG placeholder; real art later via the single `ItemIcon` swap-point).
- Reworking the adaptive-difficulty philosophy (55–65% win-rate band, pity system stay).

## Locked decisions (user, 2026-07-10)

- Stat system depth: **make existing stats honest (light)** — base attack/defense on
  characters + activate `enemy.defense`; no full attribute/ability overhaul.
- Revive restores **50% of maxHp**, **War Room only**.
- Won fight: **survivors partial-heal (30% maxHp); fallen stay down.** A level-up win
  still full-heals all (unchanged).
- Lost fight: **revive exactly one member to 30% maxHp** (anti-soft-lock).
- Balance lever: **buff enemies** (roster attack ~+50% + lift the difficulty floor).

## Constants

```
// Base combat stat growth (per level, applied by applyLevelUps + recruitment)
ATTACK_PER_LEVEL   = 2
DEFENSE_PER_LEVEL  = 1
MAX_HP_PER_LEVEL   = 10   // existing

// Recovery / revive
REVIVE_ITEM_PCT    = 0.5  // revive item restores 50% of maxHp
WIN_RECOVERY_PCT   = 0.3  // survivors heal 30% of maxHp on a won fight (no level-up)
DEFEAT_REVIVE_PCT  = 0.3  // one member revived to 30% of maxHp on a lost fight
```

---

## Phase A — Combat stat foundation (light)

### A1. Schema (`types/schemas.ts`)

- `PartyMember`: add base primary stats `attack: number;` and `defense: number;`.
- `InventoryItem.statBonus`: add `revive?: number;` (used in Phase B; see below).
- `Candidate` (recruitment): add `baseAttack: number;` and `baseDefense: number;`.

Note: making `attack`/`defense` required on `PartyMember` means every `PartyMember`
test fixture (`equipment.test.ts`, `enemyAI.test.ts`, `recruitment.test.ts`) must add the
two fields — a compile-driven checklist.

### A2. Pure combat math (`engine/combat.ts`, NEW, TDD)

Extract the two formulas out of `CombatScene` so they are pure and testable. RNG + crit
roll stay in the component; the math is pure.

```ts
// player strike (enemy.defense now LIVE)
strikeDamage({ attack, weaponAttack, enemyDefense, roll, crit }): number
  = max(1, round((attack + weaponAttack - enemyDefense + roll) * (crit ? 1.5 : 1)))
  // roll = rand(0..9)

// enemy counter (member base defense + gear defense)
counterDamage({ enemyAttack, defense, roll }): number
  = max(1, enemyAttack - defense + roll)
  // roll = rand(0..4); defense = member.defense + Σ gear.defense
```

This replaces the old `level*10` offense term: offense now comes from `member.attack`
(seeded + grown by level), not a raw `level*10`. Early-game numbers stay close (a level-1
attacker ≈ 10–15 before gear, vs. 10–19 today).

### A3. Combat wiring (`CombatScene.tsx`)

- Player strike → `strikeDamage({ attack: member.attack, weaponAttack, enemyDefense:
  enemy.defense, roll: rand(0..9), crit })`.
- Enemy counter → `counterDamage({ enemyAttack: enemy.attack, defense: target.defense +
  Σgear.defense, roll: rand(0..4) })`.
- **Defense badge** now shows **total** mitigation = `member.defense + Σ gear.defense`,
  tooltip breakdown `"base N + gear M (P pieces)"`. Weapon badge unchanged.

### A4. Seed base stats (`persistenceService.ts`)

Per role (tank = high defense, striker = high attack, support = low):

- Althea (Leader): `attack 12, defense 8`
- Kael (Vanguard): `attack 15, defense 5`
- Elora (Arcanist): `attack 10, defense 3`

### A5. Recruitment (`engine/recruitment.ts`)

Each `Candidate` gains `baseAttack`/`baseDefense`; the built member gets
`attack = baseAttack + ATTACK_PER_LEVEL*(level-1)`,
`defense = baseDefense + DEFENSE_PER_LEVEL*(level-1)` (mirrors the existing
`maxHp = baseHp + 10*(level-1)` pattern).

### A6. Leveling (`engine/rewardEngine.ts` `applyLevelUps`)

Alongside `maxHp += MAX_HP_PER_LEVEL*levelsGained`, also
`attack += ATTACK_PER_LEVEL*levelsGained` and
`defense += DEFENSE_PER_LEVEL*levelsGained`. HP still heals to full on level-up.

### A7. Enemy defense in adaptive difficulty (`engine/difficultyEngine.ts` `scaleEnemy`)

Now also scale defense: `defense = max(0, round(base.defense * multiplier))` so the
newly-live enemy defense participates in scaling.

---

## Phase B — Revive item + post-battle recovery + enemy buff

### B1. Engine — pure functions (TDD)

**`engine/equipment.ts`**

- **`planRevive(item, member): HealDecision | null`** — null unless the item is a
  Consumable with `statBonus.revive != null` **and** `member.hp <= 0`. Otherwise
  `newHp = min(maxHp, ceil(maxHp * (item.statBonus.revive ?? REVIVE_ITEM_PCT)))`,
  `quantity - 1`, `removeItem` at 0. Reuses `HealDecision`.
- **Tighten `planHeal`** — additionally return null when `member.hp <= 0` (can't potion a
  corpse) or the item is a revive item. `planHeal`/`planRevive` mutually exclusive.

**`engine/rewardEngine.ts`**

- **`applyWinRecovery(party): PartyMember[]`** — members with `hp > 0` heal
  `+ceil(maxHp * WIN_RECOVERY_PCT)` capped at maxHp; `hp <= 0` members unchanged. Pure.
- **`applyDefeatRecovery(party): PartyMember[]`** — revive exactly one member to
  `ceil(maxHp * DEFEAT_REVIVE_PCT)`: highest `maxHp`, ties by array order (leader first);
  all others unchanged. Empty party → returned as-is.

### B2. Post-battle wiring (`App.tsx`)

- **`handleBattleVictory`**: if `a.levelsGained > 0` persist `a.party` as today
  (full-healed by `applyLevelUps`); else persist `applyWinRecovery(a.party)` (survivors
  30%, fallen stay). Notify mentions survivors recovering.
- **`handleBattleDefeat`**: persist `applyDefeatRecovery(party)` (one member to 30%),
  notify `"<name> was revived to fight another day."`, then `worldState:'peace'`.

### B3. War Room UI (`WarRoom.tsx` + `App.tsx`)

Consumable list branches on `item.statBonus?.revive`:

- **Revive item** → **"Revive"**, `onClick={onRevive(...)}`, `disabled={selected.hp > 0}`.
- **Health Potion** → **"Use"**, `onClick={onHeal(...)}`,
  `disabled={selected.hp <= 0 || selected.hp >= selected.maxHp}` (closes the accidental
  corpse-heal).

New prop `onRevive(memberId,itemId)` → App **`handleWarRevive`** (mirrors
`handleWarHeal`, uses `planRevive`); notify `"<name> is revived (<newHp> HP)"`.

### B4. Content — "Revive Tonic"

`type:'Consumable'`, `statBonus:{ revive: 0.5 }`, `icon:'cardiology'`,
`stats:'Revive 50% HP'`, `description:'Revives a fallen ally to 50% health.'`, no
`sprite` → existing consumable SVG placeholder (no new art, no 404). Added to: seed
inventory (`persistenceService.ts`, qty 1), Town shop (`TownScene.tsx` `SHOP_ITEMS`,
cost ~120 gold), App template map (`App.tsx` `ITEM_TEMPLATES`).

### B5. Combat balance — buff enemies

- **Roster attack ~+50%** (`engine/enemyAI.ts` `BESTIARY`, HP unchanged):
  debt-gnome 5→8, interest-imp 6→9, ledger-wraith 7→11, overdraft-ogre 8→12,
  inflation-djinn 10→15, compound-golem 12→18.
- **Lift the difficulty floor** (`engine/difficultyEngine.ts` `difficultyMultiplier`):
  base band `0.7 + score*0.6` → `0.9 + score*0.5`; final clamp `(0.5, 1.6)` → `(0.8, 1.6)`;
  update the rationale string. Fresh fight ≈ 0.9× (was 0.7×).
- Net with live enemy defense + base member defense: e.g. buffed Ogre (attack 12) vs.
  Elora (base defense 3, no gear) → counter ~9–13, dropping her 80hp over a battle;
  gearing Elora's defense to ~20 floors the counter toward 1 — **exactly the review/tweak
  loop** (base stat + gear + enemy stat all now matter). Win-rate band + pity self-correct.

---

## Testing

Pure-function unit tests (Vitest, no jsdom):

- **`combat.test.ts` (NEW)** — `strikeDamage`: base+weapon−enemyDef+roll, crit ×1.5, min 1,
  and that a higher `enemyDefense` lowers damage (defense now live). `counterDamage`:
  `enemyAttack − defense + roll`, min 1, higher `defense` lowers damage.
- **`rewardEngine.test.ts`** — `applyLevelUps` now also raises `attack`/`defense` (extend
  existing assertion). `applyWinRecovery`: survivor heals 30% capped; full survivor
  unchanged; fallen stays 0. `applyDefeatRecovery`: all-0 party → highest-maxHp member to
  `ceil(maxHp*0.3)`, others 0; tie → first; empty safe.
- **`equipment.test.ts`** — `planRevive` (fallen→50%/cap/qty; alive→null; non-revive→null;
  non-consumable→null); `planHeal` guards (`hp<=0`→null; revive item→null; living cases
  green). Add `attack`/`defense` to the member fixture.
- **`difficultyEngine.test.ts`** — `scaleEnemy` now scales `defense` (add assertion);
  tighten the clamp-floor assertion to pin **0.8**; existing relational tests stay green.
- **`recruitment.test.ts`** / **`enemyAI.test.ts`** — add `attack`/`defense` to
  `PartyMember` fixtures; assert a recruit gets `attack`/`defense` set. `enemyAI` BESTIARY
  test needs no value change (pins names/count/HP relations, not attack values).
- Confirm **`director.test.ts`** stays green (calls `scaleEnemy`); update only if it pins a
  multiplier/attack/defense value.

Manual/browser verification (preview_eval; battle seeded via `player/campaign` +
localStorage HP edits, per the Phase 6 recipe):

- Stat model: a party card's total-defense badge = base + gear (tooltip breakdown);
  equipping a defensive piece raises it and visibly lowers the enemy counter; equipping a
  weapon raises strike damage; a higher-defense enemy visibly reduces player strike damage.
- War Room: fallen member → "Revive" enabled, "Use" disabled → revive to 50% maxHp,
  tonic −1. Living hurt member → "Use" enabled, "Revive" disabled.
- Won fight (no level-up): survivors +30% maxHp; fallen stays 0. Lost fight (wipe): one
  member returns at ~30% maxHp; no soft-lock.
- Balance: with buffed enemies a member can actually reach 0 in a driven battle.

Gates: `npm test` + `npx tsc -b` + `npm run build` green; commit locally (no push).

## Files touched

Phase A: `types/schemas.ts` (PartyMember attack/defense, Candidate base stats, statBonus.revive),
`engine/combat.ts` (+`.test.ts`, NEW), `engine/rewardEngine.ts` (+`.test.ts`),
`engine/recruitment.ts` (+`.test.ts`), `engine/difficultyEngine.ts` (+`.test.ts`),
`persistenceService.ts` (seed base stats), `components/AdventureWorld/CombatScene.tsx`
(use `combat.ts`, total-defense badge), plus `PartyMember` fixtures in
`engine/equipment.test.ts` / `engine/enemyAI.test.ts`.

Phase B: `engine/equipment.ts` (+`.test.ts`), `engine/rewardEngine.ts` (+`.test.ts`),
`engine/enemyAI.ts` (roster attack), `engine/difficultyEngine.ts` (floor),
`App.tsx` (victory/defeat recovery, `handleWarRevive`, `ITEM_TEMPLATES`, WarRoom `onRevive`),
`components/WarRoom.tsx` (revive vs use branch), `persistenceService.ts` (seed Revive Tonic),
`components/AdventureWorld/TownScene.tsx` (shop Revive Tonic).

## Risks / notes

- Dropping `level*10` for a base-`attack` stat changes level scaling (offense now grows
  `+2/level` instead of `+10/level`). Fine for the low-level demo; keeps early numbers
  close. Re-tune `ATTACK_PER_LEVEL` if high-level play feels flat later.
- Making `PartyMember.attack/defense` required touches every fixture — a compile-error
  checklist, low risk.
- `planHeal` now refuses `hp <= 0`; in-combat already excludes the dead, War Room button
  is re-gated — verify no other caller relied on corpse-healing.
- Enemy buff + live enemy defense interact with adaptive difficulty; the change lifts the
  floor and activates a dormant stat only — top-of-band (strong players) unaffected. Every
  number (`*_PER_LEVEL`, recovery pcts, roster values, floor, seed stats) is a single-knob
  tunable.
- Combat-logic tuning here is a deliberate, user-approved exception to the Phase 6
  "layout-only, don't rebalance" rule.
