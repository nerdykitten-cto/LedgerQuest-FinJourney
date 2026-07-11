# For the Future Finished Product (Beyond-Demo Backlog)

This file collects work that is **deliberately out of scope for the LedgerQuest
demo** — ideas parked for the eventual full production release. The demo (see
`PLANS/DemoPolishPlan.md`) intentionally ships a lighter version of some systems.
When building the real product, start here.

> Status: living document. Add to it whenever a "not for the demo" decision is made.

---

## 1. Full RPG combat stat system (deferred from the 2026-07 combat-stats work)

### What the demo shipped (the "light, honest stats" version)
Merged to `main` `a4809f3` (2026-07-11). Spec: `PLANS/specs/2026-07-10-revive-and-combat-recovery-design.md`.
- Characters have base **`attack`** and **`defense`** stats (seeded per role; grow
  +2/+1 per level; recruits seed base values).
- **`enemy.defense` is now live** (was dead) and scales with adaptive difficulty.
- Damage math extracted to a pure, tested `engine/combat.ts`
  (`strikeDamage`/`counterDamage`): strike = `attack + weapon − enemyDefense + rand`,
  crit ×1.5; counter = `enemyAttack − (baseDefense + Σ gearDefense) + rand`, floor 1.
- Gear (5 slots) augments the real stats; War Room / combat badges show base + gear.
- Revive item + post-battle recovery rules; enemy attack buff + difficulty floor 0.75.

### What a finished product should add (explicitly OUT of the demo)
Chosen by the user as a "beyond demo" overhaul (2026-07-11). Each is a real sub-project
with its own spec:

- **Primary attribute system** — proper stats beyond attack/defense: e.g. Strength,
  Agility/Speed, Intellect, Vitality, and derived stats (crit rate, crit damage,
  evasion/accuracy, resistances). Wire them into the damage/turn formulas instead of
  the current two-stat model.
- **Speed / initiative / turn order** — the demo has a fixed loop (player strikes → one
  enemy counter). A real system needs an initiative/speed stat, a turn queue, and
  possibly action economy (multiple actions, haste/slow).
- **MP / mana + abilities/skills** — `PartyMember.mp`/`maxMp` exist but are a **dead
  resource** today (only used as an AI targeting hint). Build a real spell/ability
  system: MP costs, per-class skill trees, targeting, cooldowns.
- **Status effects & elements** — buffs/debuffs (poison, stun, shield, regen), elemental
  types + resistances/weaknesses, damage-over-time. None exist today (crit is a flat
  hardcoded 10% ×1.5).
- **Deeper enemy AI & encounters** — multi-enemy battles, formations, enemy abilities,
  boss mechanics. Today it's one scaled enemy per battle with a 3-archetype targeting AI.
- **Gear depth** — affixes/rarity/random rolls, set bonuses, sockets, more slots
  (boots/back were baked in art but cut from the demo's 5 slots), upgrade/crafting.
- **Balance/tuning pass** — re-tune the adaptive difficulty engine, the level curve
  (offense currently grows only +2 attack/level after the demo dropped `level*10`),
  and the economy once the above land. The demo's numbers are a single-knob tunable
  placeholder, not a balanced end-game curve.

### Why deferred
The demo's goal is a playable finance-RPG loop, not a deep JRPG battle system. The
light stat model makes gear/defense meaningful and reviewable (the user's actual ask)
without the cost of a full combat overhaul. Ship the demo; build the above for prod.

---

## 2. (add future beyond-demo items here)

- Real backend / accounts / per-user profiles (demo is static, localStorage-only, no
  sign-in, IP detection N/A — see Phase 7 decision in `PLANS/DemoPolishPlan.md`).
- Real art pipeline for enemies + consumables (demo uses emoji enemies + SVG-placeholder
  consumables; equipment/characters already have baked art).
- (append as decisions are made)
