# Combat Stats + Revive + Post-Battle Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give LedgerQuest characters/enemies an honest base attack+defense stat system, add a Revive Tonic + post-battle recovery rules, and buff enemies so death is reachable — all layout/logic changes verified green.

**Architecture:** Phase A adds base `attack`/`defense` to `PartyMember`, activates the dead `enemy.defense`, and extracts combat damage math into a pure/tested `engine/combat.ts`. Phase B adds `planRevive` + `applyWinRecovery`/`applyDefeatRecovery` pure fns, a Revive Tonic item, War Room revive UI, victory/defeat recovery wiring, and an enemy attack buff + difficulty-floor lift.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind (`APP/`); Vitest unit tests; localStorage persistence. Spec: `PLANS/specs/2026-07-10-revive-and-combat-recovery-design.md`.

## Working notes (READ FIRST)

- **A `cbm-code-discovery-gate` hook BLOCKS the Read tool on source files.** Read source via `grep`/`sed`; edit source with a Bash `python3` exact-string replace that asserts the match count (pattern shown in Task A1 Step 3). `Write`/`Edit` are fine for NEW files you create and non-source (`*.md`).
- Run commands from `APP/`: tests `npm test`, types `npx tsc -b`, build `npm run build`.
- Vitest runs pure fns in node — no jsdom. Test files sit next to source as `*.test.ts`.
- Commit locally only (conventional commits). **Do NOT push.** End messages with the `Co-Authored-By` trailer used in this repo.
- Baseline before starting: `npx tsc -b` clean, **163** tests pass, build green.

---

# PHASE A — Combat stat foundation (light)

## Task A1: Add base stats to schema + all construction sites (keep compile green)

Adding required `attack`/`defense` to `PartyMember` breaks every place a member is built. This task adds the fields and fixes ALL sites in one commit so `tsc` stays green. No damage-formula change yet.

**Files:**
- Modify: `APP/src/types/schemas.ts`
- Modify: `APP/src/persistenceService.ts` (seed party)
- Modify: `APP/src/engine/recruitment.ts` (Candidate + member build)
- Modify: `APP/src/engine/equipment.test.ts` (member fixture)
- Modify: `APP/src/engine/enemyAI.test.ts` (member fixture)
- Modify: `APP/src/engine/recruitment.test.ts` (member fixture, if present)

- [ ] **Step 1: Inspect current shapes**

Run:
```bash
cd APP/src
grep -n "export interface PartyMember" -A18 types/schemas.ts
grep -n "hpHeal?: number;" types/schemas.ts
grep -n "interface Candidate" -A6 engine/recruitment.ts
grep -n "level: 1, hp: 100, maxHp: 100" engine/*.test.ts
```
Expected: `PartyMember` has `mp/maxMp/equipment` but no `attack/defense`; `statBonus` has `hpHeal?`; `Candidate` has `baseHp/baseMp`; three test fixtures build members inline.

- [ ] **Step 2: Add fields to `types/schemas.ts`**

Add `attack`/`defense` to `PartyMember` (after `maxMp`), and `revive?` to `InventoryItem.statBonus` (both statBonus blocks — `InventoryItem` is the one with `hpHeal`). Use this python edit:
```bash
cd APP/src
python3 - <<'PY'
f='types/schemas.ts'; s=open(f).read(); o=s
# PartyMember: add attack/defense after maxMp
a="  mp: number;\n  maxMp: number;\n  equipment: {"
b="  mp: number;\n  maxMp: number;\n  attack: number;\n  defense: number;\n  equipment: {"
assert s.count(a)==1, "PartyMember maxMp/equipment block not unique"; s=s.replace(a,b)
# statBonus (InventoryItem): add revive? after hpHeal?
a2="    hpHeal?: number;\n  };"
b2="    hpHeal?: number;\n    revive?: number;\n  };"
assert s.count(a2)>=1, "hpHeal statBonus block missing"; s=s.replace(a2,b2,1)
open(f,'w').write(s); print("schemas patched:", s!=o)
PY
```

- [ ] **Step 3: Add base stats to Candidate + member build in `engine/recruitment.ts`**

Add `baseAttack`/`baseDefense` to the `Candidate` interface and to every POOL entry, and set `attack`/`defense` on the built member (level-scaled). The `ATTACK_PER_LEVEL`/`DEFENSE_PER_LEVEL` constants are defined in Task A4; for now inline the growth (they will be centralized in A4).
```bash
cd APP/src
python3 - <<'PY'
f='engine/recruitment.ts'; s=open(f).read(); o=s
# 1) Candidate interface gains baseAttack/baseDefense
s=s.replace("  baseHp: number;\n  baseMp: number;",
            "  baseHp: number;\n  baseMp: number;\n  baseAttack: number;\n  baseDefense: number;",1)
# 2) member build: add attack/defense (level-scaled) next to maxMp
a="    mp: candidate.baseMp,\n    maxMp: candidate.baseMp,\n    equipment: {},"
b=("    mp: candidate.baseMp,\n    maxMp: candidate.baseMp,\n"
   "    attack: candidate.baseAttack + 2 * (level - 1),\n"
   "    defense: candidate.baseDefense + 1 * (level - 1),\n    equipment: {},")
assert s.count(a)==1, "member build block not unique"; s=s.replace(a,b)
open(f,'w').write(s); print("recruitment build patched:", s!=o)
PY
```
Then add `baseAttack`/`baseDefense` to each POOL candidate. Inspect and edit:
```bash
grep -n "baseHp:" engine/recruitment.ts
```
For EACH candidate line (Bram, Sigrid, Mirelle, Fenwick, Isolde) append `, baseAttack: <A>, baseDefense: <D>` before the closing `}`, using role-appropriate values: Vanguard (Bram/Sigrid) `baseAttack:15, baseDefense:5`; Arcanist (Mirelle) `baseAttack:10, baseDefense:3`; Sharpshooter (Fenwick) `baseAttack:14, baseDefense:3`; Lightweaver (Isolde) `baseAttack:9, baseDefense:3`. Example python:
```bash
python3 - <<'PY'
f='engine/recruitment.ts'; s=open(f).read()
reps=[
 ("baseHp: 120, baseMp: 10 }","baseHp: 120, baseMp: 10, baseAttack: 15, baseDefense: 5 }"),
 ("baseHp: 130, baseMp: 8 }","baseHp: 130, baseMp: 8, baseAttack: 15, baseDefense: 5 }"),
 ("baseHp: 80, baseMp: 50 }","baseHp: 80, baseMp: 50, baseAttack: 10, baseDefense: 3 }"),
 ("baseHp: 90, baseMp: 15 }","baseHp: 90, baseMp: 15, baseAttack: 14, baseDefense: 3 }"),
 ("baseHp: 70, baseMp: 40 }","baseHp: 70, baseMp: 40, baseAttack: 9, baseDefense: 3 }"),
]
for a,b in reps:
    assert s.count(a)==1, f"pool entry not unique: {a}"; s=s.replace(a,b)
open(f,'w').write(s); print("pool patched")
PY
```

- [ ] **Step 4: Seed party base stats in `persistenceService.ts`**

```bash
cd APP/src
python3 - <<'PY'
f='persistenceService.ts'; s=open(f).read(); o=s
reps=[
 ("name: 'Althea', avatar: PARTY_ART.p1, role: 'Leader', hp: 100, maxHp: 100, mp: 20, maxMp: 20, level: 1, equipment: {} }",
  "name: 'Althea', avatar: PARTY_ART.p1, role: 'Leader', hp: 100, maxHp: 100, mp: 20, maxMp: 20, level: 1, attack: 12, defense: 8, equipment: {} }"),
 ("name: 'Kael', avatar: PARTY_ART.p2, role: 'Vanguard', hp: 120, maxHp: 120, mp: 10, maxMp: 10, level: 1, equipment: {} }",
  "name: 'Kael', avatar: PARTY_ART.p2, role: 'Vanguard', hp: 120, maxHp: 120, mp: 10, maxMp: 10, level: 1, attack: 15, defense: 5, equipment: {} }"),
 ("name: 'Elora', avatar: PARTY_ART.p3, role: 'Arcanist', hp: 80, maxHp: 80, mp: 50, maxMp: 50, level: 1, equipment: {} }",
  "name: 'Elora', avatar: PARTY_ART.p3, role: 'Arcanist', hp: 80, maxHp: 80, mp: 50, maxMp: 50, level: 1, attack: 10, defense: 3, equipment: {} }"),
]
for a,b in reps:
    assert s.count(a)==1, f"seed member not unique: {a[:40]}"; s=s.replace(a,b)
open(f,'w').write(s); print("seed patched:", s!=o)
PY
```

- [ ] **Step 5: Add `attack`/`defense` to test-file member fixtures**

Each fixture reads `level: 1, hp: 100, maxHp: 100, mp: 20, maxMp: 20, equipment: {}, ...over,`. Add `attack: 12, defense: 5,`:
```bash
cd APP/src
python3 - <<'PY'
import glob
old="level: 1, hp: 100, maxHp: 100, mp: 20, maxMp: 20, equipment: {}, ...over,"
new="level: 1, hp: 100, maxHp: 100, mp: 20, maxMp: 20, attack: 12, defense: 5, equipment: {}, ...over,"
n=0
for f in glob.glob('engine/*.test.ts'):
    s=open(f).read()
    if old in s:
        s=s.replace(old,new); open(f,'w').write(s); n+=1; print("patched",f)
print("files patched:",n)
PY
grep -rn "role:" engine/recruitment.test.ts | head   # check for any other member literals
```
If any other member literal exists (e.g. a party array in `recruitment.test.ts` or `enemyAI.test.ts` without the `...over` spread), add `attack`/`defense` there too — `tsc` in Step 6 will name the exact file:line if one is missed.

- [ ] **Step 6: Verify compile + tests green**

Run:
```bash
cd APP && npx tsc -b && npm test 2>&1 | tail -6
```
Expected: tsc clean; **163** tests pass (no behavior change yet). If tsc reports a member literal missing `attack`/`defense`, add the two fields there and re-run.

- [ ] **Step 7: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/types/schemas.ts APP/src/persistenceService.ts APP/src/engine/recruitment.ts APP/src/engine/*.test.ts
git commit -m "$(printf 'feat(stats): add base attack/defense to PartyMember\n\nAdd required attack/defense to PartyMember + baseAttack/baseDefense to\nrecruitment Candidate, seed the 3 heroes and recruits with role-appropriate\nvalues, and add statBonus.revive. No damage-formula change yet.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

## Task A2: Pure combat math module `engine/combat.ts` (TDD)

**Files:**
- Create: `APP/src/engine/combat.ts`
- Create: `APP/src/engine/combat.test.ts`

- [ ] **Step 1: Write the failing test** — create `APP/src/engine/combat.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { strikeDamage, counterDamage } from './combat';

describe('strikeDamage', () => {
  it('sums attack + weapon - enemyDefense + roll, floored at 1', () => {
    expect(strikeDamage({ attack: 12, weaponAttack: 5, enemyDefense: 4, roll: 0, crit: false })).toBe(13);
  });
  it('applies a 1.5x crit multiplier (rounded)', () => {
    expect(strikeDamage({ attack: 12, weaponAttack: 5, enemyDefense: 4, roll: 0, crit: true })).toBe(20); // round(13*1.5)
  });
  it('never drops below 1', () => {
    expect(strikeDamage({ attack: 1, weaponAttack: 0, enemyDefense: 100, roll: 0, crit: false })).toBe(1);
  });
  it('higher enemy defense lowers damage (defense is live)', () => {
    const low = strikeDamage({ attack: 20, weaponAttack: 0, enemyDefense: 2, roll: 0, crit: false });
    const high = strikeDamage({ attack: 20, weaponAttack: 0, enemyDefense: 10, roll: 0, crit: false });
    expect(high).toBeLessThan(low);
  });
});

describe('counterDamage', () => {
  it('is enemyAttack - defense + roll, floored at 1', () => {
    expect(counterDamage({ enemyAttack: 12, defense: 5, roll: 0 })).toBe(7);
  });
  it('higher total defense lowers damage', () => {
    const low = counterDamage({ enemyAttack: 12, defense: 3, roll: 0 });
    const high = counterDamage({ enemyAttack: 12, defense: 20, roll: 0 });
    expect(high).toBeLessThan(low);
    expect(high).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd APP && npx vitest run src/engine/combat.test.ts`
Expected: FAIL — `Cannot find module './combat'`.

- [ ] **Step 3: Write minimal implementation** — create `APP/src/engine/combat.ts`:

```ts
/**
 * Pure combat damage math. RNG (roll) and crit decision are made by the caller
 * (CombatScene); these functions are deterministic and unit-tested.
 */

export interface StrikeInput {
  attack: number;       // striking member's base attack (already level-grown)
  weaponAttack: number; // equipped weapon's statBonus.attack (0 if none)
  enemyDefense: number; // defending enemy's defense stat (now live)
  roll: number;         // rand(0..9)
  crit: boolean;        // 10% chance decided by caller
}

/** Player strike damage. Enemy defense is subtracted; result floored at 1. */
export function strikeDamage(i: StrikeInput): number {
  const base = i.attack + i.weaponAttack - i.enemyDefense + i.roll;
  const dmg = i.crit ? Math.round(base * 1.5) : base;
  return Math.max(1, dmg);
}

export interface CounterInput {
  enemyAttack: number; // attacking enemy's attack stat
  defense: number;     // defending member's base defense + summed gear defense
  roll: number;        // rand(0..4)
}

/** Enemy counter damage. Total member defense is subtracted; floored at 1. */
export function counterDamage(i: CounterInput): number {
  return Math.max(1, i.enemyAttack - i.defense + i.roll);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd APP && npx vitest run src/engine/combat.test.ts`
Expected: PASS (6 assertions).

- [ ] **Step 5: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/engine/combat.ts APP/src/engine/combat.test.ts
git commit -m "$(printf 'feat(combat): pure strikeDamage/counterDamage with live enemy defense\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

## Task A3: Wire CombatScene to combat.ts (activate base attack/defense + enemy.defense)

**Files:**
- Modify: `APP/src/components/AdventureWorld/CombatScene.tsx`

- [ ] **Step 1: Add the import**

```bash
cd APP/src
python3 - <<'PY'
f='components/AdventureWorld/CombatScene.tsx'; s=open(f).read()
a="import { chooseTarget } from '../../engine/enemyAI';"
b="import { chooseTarget } from '../../engine/enemyAI';\nimport { strikeDamage, counterDamage } from '../../engine/combat';"
assert s.count(a)==1; s=s.replace(a,b); open(f,'w').write(s); print("import added")
PY
```

- [ ] **Step 2: Replace the player-strike damage calc** (uses member.attack + enemy.defense)

```bash
cd APP/src
python3 - <<'PY'
f='components/AdventureWorld/CombatScene.tsx'; s=open(f).read()
a=("    const damage = Math.max(1, member.level * 10 + weaponBonus + Math.floor(Math.random() * 10));\n"
   "    const isCrit = Math.random() > 0.9;\n"
   "    const finalDmg = isCrit ? Math.floor(damage * 1.5) : damage;")
b=("    const isCrit = Math.random() > 0.9;\n"
   "    const finalDmg = strikeDamage({\n"
   "      attack: member.attack,\n"
   "      weaponAttack: weaponBonus,\n"
   "      enemyDefense: enemy.defense,\n"
   "      roll: Math.floor(Math.random() * 10),\n"
   "      crit: isCrit,\n"
   "    });")
assert s.count(a)==1, "strike calc block not found/unique"; s=s.replace(a,b)
open(f,'w').write(s); print("strike wired")
PY
```

- [ ] **Step 3: Replace the enemy-counter damage calc** (member.defense + gear)

```bash
cd APP/src
python3 - <<'PY'
f='components/AdventureWorld/CombatScene.tsx'; s=open(f).read()
a=("        const defenseBonus = inventory\n"
   "          .filter(i => i.equippedTo === target.id && i.type === 'Equipment')\n"
   "          .reduce((sum, i) => sum + (i.statBonus?.defense || 0), 0);\n"
   "\n"
   "        const damage = Math.max(1, enemy.attack - defenseBonus + Math.floor(Math.random() * 5));")
b=("        const gearDefense = inventory\n"
   "          .filter(i => i.equippedTo === target.id && i.type === 'Equipment')\n"
   "          .reduce((sum, i) => sum + (i.statBonus?.defense || 0), 0);\n"
   "\n"
   "        const damage = counterDamage({\n"
   "          enemyAttack: enemy.attack,\n"
   "          defense: target.defense + gearDefense,\n"
   "          roll: Math.floor(Math.random() * 5),\n"
   "        });")
assert s.count(a)==1, "counter calc block not found/unique"; s=s.replace(a,b)
open(f,'w').write(s); print("counter wired")
PY
```

- [ ] **Step 4: Update the defense badge to show TOTAL (base + gear)**

```bash
cd APP/src
python3 - <<'PY'
f='components/AdventureWorld/CombatScene.tsx'; s=open(f).read()
# compute total defense = member.defense + gear
a="          const totalDefense = memberGear.reduce((sum, i) => sum + (i.statBonus?.defense || 0), 0);"
b=("          const gearDefense = memberGear.reduce((sum, i) => sum + (i.statBonus?.defense || 0), 0);\n"
   "          const totalDefense = member.defense + gearDefense;")
assert s.count(a)==1; s=s.replace(a,b)
# tooltip: show base + gear breakdown
a2="title={`+${totalDefense} Defense from ${memberGear.filter(i => i.statBonus?.defense).length} piece(s)`}"
b2="title={`${totalDefense} Defense (base ${member.defense} + gear ${gearDefense} from ${memberGear.filter(i => i.statBonus?.defense).length} piece(s))`}"
assert s.count(a2)==1; s=s.replace(a2,b2)
# badge should render whenever there is any defense (base is always > 0)
a3="                {totalDefense > 0 && ("
b3="                {totalDefense > 0 && ("  # unchanged; base defense makes this always true
open(f,'w').write(s); print("badge updated")
PY
```

- [ ] **Step 5: Verify compile + full suite**

Run:
```bash
cd APP && npx tsc -b && npm test 2>&1 | tail -6
```
Expected: tsc clean; 169 tests pass (163 + 6 from A2). No behavior test here — verified live in Task B7.

- [ ] **Step 6: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/components/AdventureWorld/CombatScene.tsx
git commit -m "$(printf 'feat(combat): CombatScene uses base attack/defense + live enemy.defense\n\nStrike = strikeDamage(member.attack, weapon, enemy.defense); counter =\ncounterDamage(enemy.attack, member.defense + gear). Defense badge shows\ntotal (base + gear) with a breakdown tooltip.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

## Task A4: Grow attack/defense on level-up (TDD)

**Files:**
- Modify: `APP/src/engine/rewardEngine.ts`
- Modify: `APP/src/engine/rewardEngine.test.ts`

- [ ] **Step 1: Update the failing test** — extend the existing `applyLevelUps` test. First read it:

```bash
cd APP/src && grep -n "applyLevelUps" -A10 engine/rewardEngine.test.ts
```
Replace the "raises party level and maxHp" assertion block so it also checks attack/defense. The fixture `mkMember()` must include `attack`/`defense`; check and add if missing:
```bash
grep -n "function mkMember\|const mkMember" -A6 engine/rewardEngine.test.ts
```
Apply:
```bash
python3 - <<'PY'
f='engine/rewardEngine.test.ts'; s=open(f).read()
# ensure mkMember fixture has attack/defense (add if absent) — adjust to actual shape if needed
if 'attack:' not in s.split('applyLevelUps')[0]:
    s=s.replace("mp: 20, maxMp: 20,","mp: 20, maxMp: 20, attack: 10, defense: 4,",1)
# extend assertions
a=("    expect(updated[0].level).toBe(3);\n"
   "    expect(updated[0].maxHp).toBe(120);\n"
   "    expect(updated[0].hp).toBe(120);")
b=("    expect(updated[0].level).toBe(3);\n"
   "    expect(updated[0].maxHp).toBe(120);\n"
   "    expect(updated[0].hp).toBe(120);\n"
   "    expect(updated[0].attack).toBe(14); // 10 + 2*2\n"
   "    expect(updated[0].defense).toBe(6); // 4 + 1*2")
assert s.count(a)==1, "applyLevelUps assertion block not found; inspect + hand-edit"; s=s.replace(a,b)
open(f,'w').write(s); print("test extended")
PY
```
NOTE: if `mkMember` seeds different `attack`/`defense` than 10/4, adjust the expected `14`/`6` to `attack+4` / `defense+2`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd APP && npx vitest run src/engine/rewardEngine.test.ts -t applyLevelUps`
Expected: FAIL — `updated[0].attack` is undefined / unchanged.

- [ ] **Step 3: Implement growth in `rewardEngine.ts`**

```bash
cd APP/src
python3 - <<'PY'
f='engine/rewardEngine.ts'; s=open(f).read()
# add DEFENSE/ATTACK per-level constants next to MAX_HP_PER_LEVEL
s=s.replace("const MAX_HP_PER_LEVEL = 10;",
            "const MAX_HP_PER_LEVEL = 10;\nconst ATTACK_PER_LEVEL = 2;\nconst DEFENSE_PER_LEVEL = 1;",1)
# bump attack/defense in applyLevelUps map
a=("    const maxHp = m.maxHp + MAX_HP_PER_LEVEL * levelsGained;\n"
   "    return { ...m, level: m.level + levelsGained, maxHp, hp: maxHp };")
b=("    const maxHp = m.maxHp + MAX_HP_PER_LEVEL * levelsGained;\n"
   "    const attack = m.attack + ATTACK_PER_LEVEL * levelsGained;\n"
   "    const defense = m.defense + DEFENSE_PER_LEVEL * levelsGained;\n"
   "    return { ...m, level: m.level + levelsGained, maxHp, hp: maxHp, attack, defense };")
assert s.count(a)==1, "applyLevelUps map body not found"; s=s.replace(a,b)
open(f,'w').write(s); print("growth added")
PY
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd APP && npx vitest run src/engine/rewardEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/engine/rewardEngine.ts APP/src/engine/rewardEngine.test.ts
git commit -m "$(printf 'feat(stats): grow attack (+2) and defense (+1) per level on level-up\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

## Task A5: Scale enemy.defense in the difficulty engine (TDD)

**Files:**
- Modify: `APP/src/engine/difficultyEngine.ts`
- Modify: `APP/src/engine/difficultyEngine.test.ts`

- [ ] **Step 1: Add the failing test** — append inside the `describe('scaleEnemy', ...)` block. The `baseEnemy` fixture has `defense: 2`. Add:

```bash
cd APP/src
python3 - <<'PY'
f='engine/difficultyEngine.test.ts'; s=open(f).read()
a="  it('scales hp and attack up for strong players', () => {\n    const { enemy } = scaleEnemy(baseEnemy, strong);\n    expect(enemy.hp).toBeGreaterThan(baseEnemy.hp);\n    expect(enemy.attack).toBeGreaterThan(baseEnemy.attack);"
b=a+"\n    expect(enemy.defense).toBeGreaterThan(baseEnemy.defense);"
assert s.count(a)==1, "scaleEnemy strong test not found"; s=s.replace(a,b)
open(f,'w').write(s); print("defense-scale test added")
PY
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd APP && npx vitest run src/engine/difficultyEngine.test.ts -t scaleEnemy`
Expected: FAIL — `enemy.defense` equals base (2), not greater.

- [ ] **Step 3: Implement defense scaling in `scaleEnemy`**

```bash
cd APP/src
python3 - <<'PY'
f='engine/difficultyEngine.ts'; s=open(f).read()
a=("  const hp = Math.max(10, Math.round(base.hp * multiplier));\n"
   "  const attack = Math.max(1, Math.round(base.attack * multiplier));\n"
   "  return {\n"
   "    enemy: { ...base, hp, maxHp: hp, attack },")
b=("  const hp = Math.max(10, Math.round(base.hp * multiplier));\n"
   "  const attack = Math.max(1, Math.round(base.attack * multiplier));\n"
   "  const defense = Math.max(0, Math.round(base.defense * multiplier));\n"
   "  return {\n"
   "    enemy: { ...base, hp, maxHp: hp, attack, defense },")
assert s.count(a)==1, "scaleEnemy body not found"; s=s.replace(a,b)
open(f,'w').write(s); print("defense scaling added")
PY
```

- [ ] **Step 4: Run tests + full suite**

Run: `cd APP && npx vitest run src/engine/difficultyEngine.test.ts && npm test 2>&1 | tail -4`
Expected: PASS; full suite green (171 tests: 163 + 6 combat + 2 new assertions counted within existing tests → confirm the printed total, it will be ~170).

- [ ] **Step 5: Commit + Phase A gate**

```bash
cd APP && npx tsc -b && npm run build 2>&1 | tail -3
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/engine/difficultyEngine.ts APP/src/engine/difficultyEngine.test.ts
git commit -m "$(printf 'feat(difficulty): scale enemy.defense with the difficulty multiplier\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```
Expected: tsc clean, build green.

---

# PHASE B — Revive item + post-battle recovery + enemy buff

## Task B1: planRevive + planHeal guard (TDD)

**Files:**
- Modify: `APP/src/engine/equipment.ts`
- Modify: `APP/src/engine/equipment.test.ts`

- [ ] **Step 1: Write failing tests** — append to `equipment.test.ts`. Inspect the existing member/item fixture helpers first:

```bash
cd APP/src && grep -n "mkMember\|mkItem\|const item\|HealDecision\|planHeal" engine/equipment.test.ts | head
```
Add (adapt fixture helper names to what exists — `mkMember({...})` and an item literal):

```ts
import { planRevive } from './equipment';

describe('planRevive', () => {
  const reviveItem = { id: 'rt1', templateId: 'revive-tonic', name: 'Revive Tonic', type: 'Consumable' as const,
    icon: 'cardiology', description: '', statBonus: { revive: 0.5 }, weight: 0.5, quantity: 2 };

  it('revives a fallen member to ceil(maxHp*revive), qty-1', () => {
    const m = mkMember({ hp: 0, maxHp: 81 });
    const plan = planRevive(reviveItem, m)!;
    expect(plan.newHp).toBe(41);        // ceil(81*0.5)
    expect(plan.newQuantity).toBe(1);
    expect(plan.removeItem).toBe(false);
  });
  it('removes the item at the last charge', () => {
    const m = mkMember({ hp: 0, maxHp: 80 });
    const plan = planRevive({ ...reviveItem, quantity: 1 }, m)!;
    expect(plan.removeItem).toBe(true);
  });
  it('returns null for a living member', () => {
    expect(planRevive(reviveItem, mkMember({ hp: 40, maxHp: 80 }))).toBeNull();
  });
  it('returns null for a non-revive consumable', () => {
    const potion = { ...reviveItem, statBonus: { hpHeal: 40 } };
    expect(planRevive(potion, mkMember({ hp: 0, maxHp: 80 }))).toBeNull();
  });
});

describe('planHeal guards', () => {
  const potion = { id: 'p', templateId: 'health-potion', name: 'Health Potion', type: 'Consumable' as const,
    icon: 'science', description: '', statBonus: { hpHeal: 40 }, weight: 0.5, quantity: 2 };
  it('refuses to heal a fallen (0 HP) member', () => {
    expect(planHeal(potion, mkMember({ hp: 0, maxHp: 80 }))).toBeNull();
  });
  it('refuses a revive item (revive is not a potion)', () => {
    const revive = { ...potion, statBonus: { revive: 0.5 } };
    expect(planHeal(revive, mkMember({ hp: 40, maxHp: 80 }))).toBeNull();
  });
});
```
If `equipment.test.ts` has no `mkMember` helper, add one:
```ts
const mkMember = (over: Partial<PartyMember> = {}): PartyMember => ({
  id: 'm1', name: 'Test', avatar: '', role: 'Leader', level: 1, hp: 100, maxHp: 100,
  mp: 20, maxMp: 20, attack: 12, defense: 5, equipment: {}, ...over,
});
```
(and ensure `planHeal` is imported at the top).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd APP && npx vitest run src/engine/equipment.test.ts -t planRevive`
Expected: FAIL — `planRevive` not exported.

- [ ] **Step 3: Implement in `equipment.ts`**

```bash
cd APP/src
python3 - <<'PY'
f='engine/equipment.ts'; s=open(f).read()
# 3a) guard planHeal: reject dead + revive items
a=("export function planHeal(item: InventoryItem, member: PartyMember): HealDecision | null {\n"
   "  if (item.type !== 'Consumable') return null;")
b=("export function planHeal(item: InventoryItem, member: PartyMember): HealDecision | null {\n"
   "  if (item.type !== 'Consumable') return null;\n"
   "  if (member.hp <= 0) return null;                 // corpses need a revive, not a potion\n"
   "  if (item.statBonus?.revive != null) return null; // revive items are handled by planRevive")
assert s.count(a)==1, "planHeal head not found"; s=s.replace(a,b)
# 3b) append planRevive
s=s.rstrip()+"""

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
"""
open(f,'w').write(s); print("planRevive + planHeal guard added")
PY
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd APP && npx vitest run src/engine/equipment.test.ts`
Expected: PASS (existing living-heal tests + new planRevive/guard tests).

- [ ] **Step 5: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/engine/equipment.ts APP/src/engine/equipment.test.ts
git commit -m "$(printf 'feat(equip): planRevive for fallen members + planHeal rejects corpses\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

## Task B2: applyWinRecovery + applyDefeatRecovery (TDD)

**Files:**
- Modify: `APP/src/engine/rewardEngine.ts`
- Modify: `APP/src/engine/rewardEngine.test.ts`

- [ ] **Step 1: Write failing tests** — append to `rewardEngine.test.ts` (reuse `mkMember`; if it lacks `attack`/`defense`, they were added in A4):

```ts
import { applyWinRecovery, applyDefeatRecovery } from './rewardEngine';

describe('applyWinRecovery', () => {
  it('heals survivors by ceil(maxHp*0.3), capped, leaves fallen down', () => {
    const party = [mkMember({ id: 'a', hp: 10, maxHp: 100 }), mkMember({ id: 'b', hp: 0, maxHp: 80 })];
    const out = applyWinRecovery(party);
    expect(out[0].hp).toBe(40); // 10 + ceil(100*0.3)
    expect(out[1].hp).toBe(0);  // fallen stays down
  });
  it('does not exceed maxHp', () => {
    const out = applyWinRecovery([mkMember({ hp: 95, maxHp: 100 })]);
    expect(out[0].hp).toBe(100);
  });
});

describe('applyDefeatRecovery', () => {
  it('revives exactly one member (highest maxHp) to ceil(maxHp*0.3)', () => {
    const party = [mkMember({ id: 'a', hp: 0, maxHp: 80 }), mkMember({ id: 'b', hp: 0, maxHp: 120 })];
    const out = applyDefeatRecovery(party);
    expect(out.find(m => m.id === 'b')!.hp).toBe(36); // ceil(120*0.3)
    expect(out.find(m => m.id === 'a')!.hp).toBe(0);
  });
  it('breaks maxHp ties by array order (first)', () => {
    const party = [mkMember({ id: 'a', hp: 0, maxHp: 100 }), mkMember({ id: 'b', hp: 0, maxHp: 100 })];
    const out = applyDefeatRecovery(party);
    expect(out[0].hp).toBe(30);
    expect(out[1].hp).toBe(0);
  });
  it('is safe on an empty party', () => {
    expect(applyDefeatRecovery([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd APP && npx vitest run src/engine/rewardEngine.test.ts -t Recovery`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement in `rewardEngine.ts`** (append after `applyLevelUps`)

```bash
cd APP/src
python3 - <<'PY'
f='engine/rewardEngine.ts'; s=open(f).read()
s=s.rstrip()+"""

const WIN_RECOVERY_PCT = 0.3;
const DEFEAT_REVIVE_PCT = 0.3;

/** After a WON fight (no level-up path): survivors (hp>0) heal 30% of maxHp,
 *  capped; fallen members (hp<=0) stay down. Pure. */
export function applyWinRecovery(party: PartyMember[]): PartyMember[] {
  return party.map(m => {
    if (m.hp <= 0) return m;
    const hp = Math.min(m.maxHp, m.hp + Math.ceil(m.maxHp * WIN_RECOVERY_PCT));
    return { ...m, hp };
  });
}

/** After a LOST fight: revive exactly one member (highest maxHp, ties by array
 *  order) to 30% of maxHp so play can continue. Others unchanged. Pure. */
export function applyDefeatRecovery(party: PartyMember[]): PartyMember[] {
  if (party.length === 0) return party;
  let bestIdx = 0;
  for (let i = 1; i < party.length; i++) {
    if (party[i].maxHp > party[bestIdx].maxHp) bestIdx = i;
  }
  return party.map((m, i) =>
    i === bestIdx ? { ...m, hp: Math.ceil(m.maxHp * DEFEAT_REVIVE_PCT) } : m
  );
}
"""
open(f,'w').write(s); print("recovery fns added")
PY
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd APP && npx vitest run src/engine/rewardEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/engine/rewardEngine.ts APP/src/engine/rewardEngine.test.ts
git commit -m "$(printf 'feat(reward): applyWinRecovery + applyDefeatRecovery post-battle rules\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

## Task B3: Content — Revive Tonic (seed + shop + template map)

**Files:**
- Modify: `APP/src/persistenceService.ts` (seed inventory)
- Modify: `APP/src/components/AdventureWorld/TownScene.tsx` (SHOP_ITEMS)
- Modify: `APP/src/App.tsx` (ITEM_TEMPLATES)

- [ ] **Step 1: Add Revive Tonic to the seed inventory**

```bash
cd APP/src
python3 - <<'PY'
f='persistenceService.ts'; s=open(f).read()
a=("        statBonus: { hpHeal: 40 },\n        weight: 0.5,\n        quantity: 3\n      }\n    ];")
b=("        statBonus: { hpHeal: 40 },\n        weight: 0.5,\n        quantity: 3\n      },\n"
   "      {\n"
   "        id: 'init-revive-tonic',\n"
   "        templateId: 'revive-tonic',\n"
   "        name: 'Revive Tonic',\n"
   "        type: 'Consumable',\n"
   "        icon: 'cardiology',\n"
   "        description: 'Revives a fallen ally to 50% health.',\n"
   "        stats: 'Revive 50% HP',\n"
   "        statBonus: { revive: 0.5 },\n"
   "        weight: 0.5,\n"
   "        quantity: 1\n"
   "      }\n    ];")
assert s.count(a)==1, "seed potion tail not found"; s=s.replace(a,b)
open(f,'w').write(s); print("seed revive tonic added")
PY
```

- [ ] **Step 2: Add Revive Tonic to the Town shop**

```bash
cd APP/src
python3 - <<'PY'
f='components/AdventureWorld/TownScene.tsx'; s=open(f).read()
a=("      type: 'Consumable' as const,\n"
   "      icon: 'science',\n"
   "      stats: '+40 HP',\n"
   "      statBonus: { hpHeal: 40 },\n"
   "      weight: 0.5\n"
   "    }\n"
   "  ];")
b=("      type: 'Consumable' as const,\n"
   "      icon: 'science',\n"
   "      stats: '+40 HP',\n"
   "      statBonus: { hpHeal: 40 },\n"
   "      weight: 0.5\n"
   "    },\n"
   "    {\n"
   "      id: 'revive-tonic',\n"
   "      name: 'Revive Tonic',\n"
   "      cost: 120,\n"
   "      type: 'Consumable' as const,\n"
   "      icon: 'cardiology',\n"
   "      stats: 'Revive 50% HP',\n"
   "      statBonus: { revive: 0.5 },\n"
   "      weight: 0.5\n"
   "    }\n"
   "  ];")
assert s.count(a)==1, "shop potion tail not found"; s=s.replace(a,b)
open(f,'w').write(s); print("shop revive tonic added")
PY
```
Note: the shop item has no `sprite` key, so `ItemIcon` renders the consumable SVG placeholder (matches the seed potion). `handleShopPurchase` already copies `statBonus` generically, so the revive stat carries through.

- [ ] **Step 3: Add Revive Tonic to the App template map**

```bash
cd APP/src
python3 - <<'PY'
f='App.tsx'; s=open(f).read()
a="  },\n  ...GEAR_BY_NAME,\n};"
b=("  },\n"
   "  'Revive Tonic': {\n"
   "    templateId: 'revive-tonic',\n"
   "    name: 'Revive Tonic',\n"
   "    type: 'Consumable',\n"
   "    icon: 'cardiology',\n"
   "    description: 'Revives a fallen ally to 50% health.',\n"
   "    stats: 'Revive 50% HP',\n"
   "    statBonus: { revive: 0.5 },\n"
   "    weight: 0.5\n"
   "  },\n"
   "  ...GEAR_BY_NAME,\n};")
assert s.count(a)==1, "ITEM_TEMPLATES tail not found"; s=s.replace(a,b)
open(f,'w').write(s); print("template map revive tonic added")
PY
```

- [ ] **Step 4: Verify compile + build**

Run: `cd APP && npx tsc -b && npm run build 2>&1 | tail -3`
Expected: tsc clean, build green.

- [ ] **Step 5: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/persistenceService.ts APP/src/components/AdventureWorld/TownScene.tsx APP/src/App.tsx
git commit -m "$(printf 'feat(content): add Revive Tonic to seed, shop, and template map\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

## Task B4: War Room revive UI + handler

**Files:**
- Modify: `APP/src/components/WarRoom.tsx`
- Modify: `APP/src/App.tsx`

- [ ] **Step 1: Add `onRevive` to WarRoom props**

```bash
cd APP/src
python3 - <<'PY'
f='components/WarRoom.tsx'; s=open(f).read()
s=s.replace("  onHeal: (memberId: string, itemId: string) => void;",
            "  onHeal: (memberId: string, itemId: string) => void;\n  onRevive: (memberId: string, itemId: string) => void;",1)
s=s.replace("  onAddMember, onRemoveMember, onHeal, onEquip, onUnequip,",
            "  onAddMember, onRemoveMember, onHeal, onRevive, onEquip, onUnequip,",1)
open(f,'w').write(s); print("prop added")
PY
```

- [ ] **Step 2: Branch the consumable button on revive vs. heal**

Replace the potion `<button>` (the one gated `disabled={selected.hp >= selected.maxHp}`) so revive items get a "Revive" button and potions get a re-gated "Use" button.

```bash
cd APP/src
python3 - <<'PY'
f='components/WarRoom.tsx'; s=open(f).read()
a=('                          <button\n'
   '                            onClick={() => onHeal(selected.id, item.id)}\n'
   '                            disabled={selected.hp >= selected.maxHp}\n'
   '                            className="bg-tertiary text-on-tertiary px-4 py-1 rounded-full text-[10px] font-black uppercase hover:scale-110 transition-transform disabled:opacity-30 disabled:hover:scale-100"\n'
   '                          >Use</button>')
b=('                          {item.statBonus?.revive != null ? (\n'
   '                          <button\n'
   '                            onClick={() => onRevive(selected.id, item.id)}\n'
   '                            disabled={selected.hp > 0}\n'
   '                            className="bg-error text-on-error px-4 py-1 rounded-full text-[10px] font-black uppercase hover:scale-110 transition-transform disabled:opacity-30 disabled:hover:scale-100"\n'
   '                          >Revive</button>\n'
   '                          ) : (\n'
   '                          <button\n'
   '                            onClick={() => onHeal(selected.id, item.id)}\n'
   '                            disabled={selected.hp <= 0 || selected.hp >= selected.maxHp}\n'
   '                            className="bg-tertiary text-on-tertiary px-4 py-1 rounded-full text-[10px] font-black uppercase hover:scale-110 transition-transform disabled:opacity-30 disabled:hover:scale-100"\n'
   '                          >Use</button>\n'
   '                          )}')
assert s.count(a)==1, "WarRoom potion button not found/unique"; s=s.replace(a,b)
open(f,'w').write(s); print("revive/use branch added")
PY
```
Note: if the `bg-error`/`text-on-error` Tailwind tokens are not defined in this theme, `grep -rn "bg-error" APP/src` — the counter/HP bar already uses `bg-error` (seen in WarRoom), so it exists.

- [ ] **Step 3: Add `handleWarRevive` in `App.tsx` and pass the prop**

```bash
cd APP/src
python3 - <<'PY'
f='App.tsx'; s=open(f).read()
# import planRevive alongside existing equipment imports
import re
s=s.replace("import { planEquip", "import { planRevive, planEquip", 1) if "import { planEquip" in s else s
# add handler after handleWarHeal
anchor='    showNotify(`${member.name} recovers ${plan.newHp - member.hp} HP`);\n  };'
handler=anchor+"""

  const handleWarRevive = (memberId: string, itemId: string) => {
    const member = party.find(m => m.id === memberId);
    const item = inventory.find(i => i.id === itemId);
    if (!member || !item) return;
    const plan = planRevive(item, member);
    if (!plan) return;
    dbService.updatePartyMemberDB(plan.memberId, { hp: plan.newHp });
    if (plan.removeItem) dbService.removeInventoryItemDB(plan.itemId);
    else dbService.updateInventoryItemDB(plan.itemId, { quantity: plan.newQuantity });
    showNotify(`${member.name} is revived (${plan.newHp} HP)`);
  };"""
assert s.count(anchor)==1, "handleWarHeal tail not found"; s=s.replace(anchor,handler)
# pass onRevive prop to <WarRoom>
s=s.replace("onHeal={handleWarHeal} onEquip={handleWarEquip}",
            "onHeal={handleWarHeal} onRevive={handleWarRevive} onEquip={handleWarEquip}",1)
open(f,'w').write(s); print("handler + prop wired")
PY
```
Verify the `planRevive` import landed (if the existing import line differs, add `planRevive` to whatever `from '../engine/equipment'`/`'./engine/equipment'` import App uses):
```bash
grep -n "planRevive\|from './engine/equipment'\|from '../engine/equipment'\|engine/equipment'" App.tsx | head
```

- [ ] **Step 4: Verify compile + full suite**

Run: `cd APP && npx tsc -b && npm test 2>&1 | tail -4`
Expected: tsc clean; suite green.

- [ ] **Step 5: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/components/WarRoom.tsx APP/src/App.tsx
git commit -m "$(printf 'feat(warroom): revive fallen members with a revive item\n\nRevive items show a Revive button (enabled only when hp<=0); potions show\nUse (disabled when hp<=0 or full), closing the accidental corpse-heal.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

## Task B5: Post-battle recovery wiring

**Files:**
- Modify: `APP/src/App.tsx` (handleBattleVictory, handleBattleDefeat)

- [ ] **Step 1: Import the recovery fns**

```bash
cd APP/src && grep -n "from './engine/rewardEngine'\|rewardEngine'" App.tsx
```
If `App.tsx` already imports from `rewardEngine`, add `applyWinRecovery, applyDefeatRecovery` to that import; otherwise add a new import near the other engine imports:
```bash
python3 - <<'PY'
f='App.tsx'; s=open(f).read()
if "rewardEngine'" in s:
    import re
    s=re.sub(r"import \{([^}]*)\} from ('(?:\.\./)?\./engine/rewardEngine')",
             lambda m: "import {"+m.group(1).rstrip()+", applyWinRecovery, applyDefeatRecovery } from "+m.group(2), s, count=1)
else:
    s=s.replace("import WarRoom from './components/WarRoom';",
                "import WarRoom from './components/WarRoom';\nimport { applyWinRecovery, applyDefeatRecovery } from './engine/rewardEngine';",1)
open(f,'w').write(s); print("recovery import wired")
PY
grep -n "applyWinRecovery" App.tsx | head
```

- [ ] **Step 2: Apply win recovery in `handleBattleVictory`** (else-branch = no level-up)

```bash
cd APP/src
python3 - <<'PY'
f='App.tsx'; s=open(f).read()
a=("        for (const m of a.party) {\n"
   "          await dbService.updatePartyMemberDB(m.id, { level: m.level, maxHp: m.maxHp, hp: m.hp });\n"
   "        }")
b=("        const healed = a.levelsGained > 0 ? a.party : applyWinRecovery(a.party);\n"
   "        for (const m of healed) {\n"
   "          await dbService.updatePartyMemberDB(m.id, { level: m.level, maxHp: m.maxHp, hp: m.hp });\n"
   "        }")
assert s.count(a)==1, "victory persist loop not found"; s=s.replace(a,b)
open(f,'w').write(s); print("win recovery wired")
PY
```

- [ ] **Step 3: Apply defeat recovery in `handleBattleDefeat`**

```bash
cd APP/src
python3 - <<'PY'
f='App.tsx'; s=open(f).read()
a=("  const handleBattleDefeat = useCallback(async (result: BattleResult) => {\n"
   "    director.onEvent({ type: 'battle-finished', won: false, ...result, stats, party });\n"
   "    await dbService.updateCampaign({ worldState: 'peace' });\n"
   "    showNotify('Defeated... Escaped to safety.');\n"
   "  }, [stats, party, showNotify]);")
b=("  const handleBattleDefeat = useCallback(async (result: BattleResult) => {\n"
   "    director.onEvent({ type: 'battle-finished', won: false, ...result, stats, party });\n"
   "    const revived = applyDefeatRecovery(party);\n"
   "    const survivor = revived.find((m, i) => m.hp !== party[i].hp);\n"
   "    for (const m of revived) {\n"
   "      if (m.hp !== party[revived.indexOf(m)]?.hp) await dbService.updatePartyMemberDB(m.id, { hp: m.hp });\n"
   "    }\n"
   "    await dbService.updateCampaign({ worldState: 'peace' });\n"
   "    showNotify(survivor ? `Defeated... ${survivor.name} was revived to fight another day.` : 'Defeated... Escaped to safety.');\n"
   "  }, [stats, party, showNotify]);")
assert s.count(a)==1, "handleBattleDefeat not found (check exact text via grep)"; s=s.replace(a,b)
open(f,'w').write(s); print("defeat recovery wired")
PY
```
NOTE: the `revived.indexOf(m)` guard persists only the changed member. If the exact `handleBattleDefeat` text differs, `grep -n "handleBattleDefeat" -A6 App.tsx` and hand-adapt: compute `applyDefeatRecovery(party)`, persist each member whose `hp` changed, notify with that member's name.

- [ ] **Step 4: Verify compile + full suite**

Run: `cd APP && npx tsc -b && npm test 2>&1 | tail -4`
Expected: tsc clean; suite green.

- [ ] **Step 5: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/App.tsx
git commit -m "$(printf 'feat(battle): post-battle recovery (survivors heal on win, one revives on loss)\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

## Task B6: Enemy buff — roster attack + difficulty-floor lift

**Files:**
- Modify: `APP/src/engine/enemyAI.ts` (BESTIARY attack)
- Modify: `APP/src/engine/difficultyEngine.ts` (floor)
- Modify: `APP/src/engine/difficultyEngine.test.ts` (pin new floor)

- [ ] **Step 1: Bump roster attack (~+50%, HP unchanged)**

```bash
cd APP/src
python3 - <<'PY'
f='engine/enemyAI.ts'; s=open(f).read()
reps=[
 ("id: 'debt-gnome', name: 'Debt Gnome', hp: 50, maxHp: 50, attack: 5,",
  "id: 'debt-gnome', name: 'Debt Gnome', hp: 50, maxHp: 50, attack: 8,"),
 ("id: 'interest-imp', name: 'Interest Imp', hp: 40, maxHp: 40, attack: 6,",
  "id: 'interest-imp', name: 'Interest Imp', hp: 40, maxHp: 40, attack: 9,"),
 ("id: 'ledger-wraith', name: 'Ledger Wraith', hp: 70, maxHp: 70, attack: 7,",
  "id: 'ledger-wraith', name: 'Ledger Wraith', hp: 70, maxHp: 70, attack: 11,"),
 ("id: 'overdraft-ogre', name: 'Overdraft Ogre', hp: 85, maxHp: 85, attack: 8,",
  "id: 'overdraft-ogre', name: 'Overdraft Ogre', hp: 85, maxHp: 85, attack: 12,"),
 ("id: 'inflation-djinn', name: 'Inflation Djinn', hp: 110, maxHp: 110, attack: 10,",
  "id: 'inflation-djinn', name: 'Inflation Djinn', hp: 110, maxHp: 110, attack: 15,"),
 ("id: 'compound-golem', name: 'Compound Golem', hp: 140, maxHp: 140, attack: 12,",
  "id: 'compound-golem', name: 'Compound Golem', hp: 140, maxHp: 140, attack: 18,"),
]
for a,b in reps:
    assert s.count(a)==1, f"roster row not unique: {a[:40]}"; s=s.replace(a,b)
open(f,'w').write(s); print("roster attack buffed")
PY
```

- [ ] **Step 2: Lift the difficulty floor**

```bash
cd APP/src
python3 - <<'PY'
f='engine/difficultyEngine.ts'; s=open(f).read()
s=s.replace("  let multiplier = 0.7 + score * 0.6; // 0.7 .. 1.3 from skill alone",
            "  let multiplier = 0.9 + score * 0.5; // 0.9 .. 1.4 from skill alone (floor lifted)",1)
s=s.replace("  multiplier = clamp(multiplier, 0.5, 1.6);",
            "  multiplier = clamp(multiplier, 0.8, 1.6);",1)
open(f,'w').write(s); print("floor lifted")
PY
```

- [ ] **Step 3: Pin the new floor in the test**

```bash
cd APP/src
python3 - <<'PY'
f='engine/difficultyEngine.test.ts'; s=open(f).read()
s=s.replace("expect(difficultyMultiplier(weak).multiplier).toBeGreaterThanOrEqual(0.5);",
            "expect(difficultyMultiplier(weak).multiplier).toBeGreaterThanOrEqual(0.8);",1)
open(f,'w').write(s); print("floor test pinned")
PY
```

- [ ] **Step 4: Run tests + confirm director still green**

Run: `cd APP && npx vitest run src/engine/difficultyEngine.test.ts src/engine/enemyAI.test.ts src/engine/director.test.ts`
Expected: PASS. If `director.test.ts` pins an exact scaled attack/multiplier that changed, update that expectation to match the new floor (it asserts relationally in most cases; adjust only the specific pinned number).

- [ ] **Step 5: Full gate + commit**

```bash
cd APP && npx tsc -b && npm test 2>&1 | tail -4 && npm run build 2>&1 | tail -3
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO
git add APP/src/engine/enemyAI.ts APP/src/engine/difficultyEngine.ts APP/src/engine/difficultyEngine.test.ts
git commit -m "$(printf 'feat(balance): +50%% roster attack and lift difficulty floor to 0.8\n\nMakes death reachable in real play so revive/recovery is testable; live\nenemy.defense + base member defense keep the tweak-via-gear loop meaningful.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

## Task B7: Live browser verification (all behaviors)

**Files:** none (verification only). Uses the preview server + `preview_eval` DOM assertions (screenshots time out on the CRT animation).

- [ ] **Step 1: Start the dev server**

`preview_start "ledgerquest-dev"` (port 5173). Note the `serverId`.

- [ ] **Step 2: Seed a fresh battle** (per the Phase 6 recipe) via `preview_eval`:

```js
// 1) clear + reload to seed fresh party/inventory/stats
localStorage.clear(); location.reload();
// 2) after reload, seed a battle campaign, then reload again:
localStorage.setItem('player/campaign', JSON.stringify({
  currentLocation:'Starting Village', progressPercentage:0, worldState:'battle',
  activeEnemy:{ id:'overdraft-ogre', name:'Overdraft Ogre', hp:85, maxHp:85, attack:12, defense:4, archetype:'Aggressor' }
}));
location.reload();
// 3) after reload, click the "Quests" nav to mount the CombatScene.
```

- [ ] **Step 3: Verify the honest stat model** — via `preview_eval`:
  - Party card defense badge shows **base + gear**: with no gear, Elora's badge = base 3 (tooltip `"3 Defense (base 3 + gear 0 ...)"`).
  - Set `inventory` `equippedTo:'p3'` on a defensive gear piece, reload+enter battle → badge total rises and the enemy COUNTER-STRIKE log damage on that member drops.
  - Confirm player strike damage is reduced by the enemy's `defense` (seed a high-defense enemy, e.g. `defense:20`, and read `STRIKE ... DEALT n DMG` — lower than with `defense:0`).

- [ ] **Step 4: Verify revive + recovery** — via `preview_eval`:
  - Set a member's `hp:0` in `party`, open War Room (`localStorage`-driven or press `m`), select the fallen member → "Revive" enabled, potion "Use" disabled → click Revive → member hp = `ceil(maxHp*0.5)`, Revive Tonic qty −1.
  - Win a fight without leveling (strike the seeded low-HP enemy to 0) → survivors gain ~30% maxHp, a member left at 0 stays 0.
  - Lose a fight (set all `party` hp low / let the buffed enemy wipe you) → exactly one member returns at ~30% maxHp; notify names them; no soft-lock (STRIKE reachable next battle).

- [ ] **Step 5: Verify balance** — drive a full battle against the buffed Ogre with an ungeared Elora and confirm she can actually reach 0 HP over the fight (counter logs ~9–13/hit).

- [ ] **Step 6: Final gate**

```bash
cd APP && npx tsc -b && npm test 2>&1 | tail -4 && npm run build 2>&1 | tail -3
```
Expected: tsc clean; all tests pass; build green. Report the exact test count and a summary of the live verifications. Do NOT push.

---

## Self-review notes (author)

- Spec coverage: A1 schema+seed+recruit+fixtures; A2 combat.ts; A3 CombatScene wiring + badge; A4 level-up growth; A5 enemy.defense scaling; B1 planRevive+planHeal guard; B2 recovery fns; B3 content; B4 War Room UI; B5 victory/defeat wiring; B6 enemy buff+floor; B7 live verify. All spec sections mapped.
- Type consistency: `strikeDamage`/`counterDamage` signatures match A2↔A3; `HealDecision` reused by `planRevive`; `applyWinRecovery`/`applyDefeatRecovery` names consistent B2↔B5; `onRevive` prop consistent B4 (WarRoom)↔App.
- Test-count deltas are approximate (printed totals confirm); the executor should trust the runner's number, not the estimate.
- Several edits depend on exact current source text; each python edit asserts its match count and every task ends on a green `tsc`/test gate, so a missed match fails loudly rather than silently corrupting.
