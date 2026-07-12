# Demo Polish Batch B — Chronicle Boss Invasion Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (run inline per
> project memory `execution-prefer-inline-over-subagent` — NOT subagent-driven). Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finishing a chronicle's non-boss objectives makes the boss invade the town; a TV dialog
offers Fight or Escape; escaping kicks the player to the World Map and keeps the town locked
(re-entering re-shows the dialog); beating the boss clears the lock, returns to a normal town,
completes the kill objective and lets the player claim the chronicle reward.

**Architecture:** A pure, TDD'd `engine/chronicle.ts` isolates the decisions (invasion trigger
predicate, boss objective lookup, boss enemy resolution/scaling). `campaign.invasion` (its mere
presence = the town lock — no separate `townLocked` flag) drives a full-cover `InvasionDialog`
rendered on the TV over the town. App wires the trigger effect, the Fight/Escape handlers, and the
boss-defeat branch in `handleBattleVictory` (reusing `battleOrigin: 'invasion'` from Batch A).

**Tech Stack:** React 19 + TS + Vite + Tailwind, Vitest (node env), localStorage persistence.

**Source of truth:** `PLANS/specs/2026-07-11-demo-polish-batch-design.md` (item 4). Simplification
vs the spec: the spec named a `townLocked` boolean; we drop it — `campaign.invasion` being set IS
the lock (fewer states, same behavior). Escape → World Map; re-entering the town re-mounts the
dialog because the invasion is still set.

**Working notes:** `cbm-code-discovery-gate` BLOCKS Read on source → grep/sed to read, python
string-replace to edit (assert the replacement happened). `preview_start "ledgerquest-dev"`;
`preview_screenshot` times out on the CRT anim → verify via `preview_eval` DOM assertions,
`localStorage.clear()`+reload first. All commands from `APP/`. Keep `npm test` / `npx tsc -b` /
`npm run build` green (baseline **209 tests**). Commit locally per task, NO push.

---

## Key facts (surveyed 2026-07-11)

- `Enemy` = `{ id, name, hp, maxHp, attack, defense, archetype? }`.
- `BESTIARY` (`engine/enemyAI.ts`) ids: `debt-gnome`(Debt Gnome 50/8/2), `interest-imp`,
  `ledger-wraith`, `overdraft-ogre`, `inflation-djinn`(110/15/5), `compound-golem`(140/18/6).
- Manifest chronicle kill targets: `Debt Gnomes`(ch0), `Gorgos`(ch1, NOT in bestiary),
  `Inflation Djinn`(ch2), `Compound Golem`(ch3).
- `Quest.type: 'main' | 'side'`; `Quest.status: 'available'|'active'|'ready'|'completed'|…`;
  `objectives[]: { id, text, type:'talk'|'kill'|'travel', target, isCompleted }`.
- `CampaignState` already has `battleOrigin?: 'town'|'map'|'invasion'` (Batch A).
- `App.handleBattleVictory` currently ticks the active quest's FIRST incomplete kill objective on
  ANY victory (`checkQuestObjective('kill', targetObj.target)`) — this must be split so a MAIN
  (boss) kill only ticks on an invasion victory, while SIDE-quest kills keep ticking on normal
  outskirts kills.
- `AdventureWorld` renders `WorldMapScene`/`CombatScene`/`TownScene` by `worldState`, plus a
  `<DialogueBox>` overlay. `GameView` passes App callbacks straight through to `AdventureWorld`.
- Battle routing (Batch A): victory/defeat return to `'town'` when `battleOrigin==='town'`, else
  `'peace'`. Batch B extends this to also route `'invasion'` → `'town'`.

## File Structure

- Create `APP/src/engine/chronicle.ts` — pure invasion decisions.
- Create `APP/src/engine/chronicle.test.ts` — its tests.
- Modify `APP/src/types/schemas.ts` — `CampaignState.invasion?`.
- Create `APP/src/components/AdventureWorld/InvasionDialog.tsx` — TV overlay.
- Modify `APP/src/components/AdventureWorld/AdventureWorld.tsx` — render dialog + 2 new props.
- Modify `APP/src/components/GameView.tsx` — pass the 2 new props through.
- Modify `APP/src/App.tsx` — trigger effect, Fight/Escape handlers, victory/defeat branching,
  guard the blanket kill-tick, pass props to GameView.

---

## Task 1: `engine/chronicle.ts` — pure invasion decisions (TDD)

**Files:**
- Create: `APP/src/engine/chronicle.test.ts`
- Create: `APP/src/engine/chronicle.ts`

- [ ] **Step 1: Write the failing test**

Create `APP/src/engine/chronicle.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { bossObjective, nonBossObjectivesComplete, resolveBoss } from './chronicle';
import type { Quest } from '../types/schemas';

const quest = (objs: Array<{ type: 'talk' | 'kill' | 'travel'; target: string; isCompleted: boolean }>): Quest => ({
  id: 'q', title: 'T', description: '', type: 'main', difficulty: 1,
  reward: { exp: 100, gold: 50 }, status: 'active',
  objectives: objs.map((o, i) => ({ id: 'o' + i, text: '', ...o })),
});

describe('bossObjective', () => {
  it('returns the kill objective, or null when there is none', () => {
    expect(bossObjective(quest([{ type: 'talk', target: 'Daniel', isCompleted: true }, { type: 'kill', target: 'Gorgos', isCompleted: false }]))!.target).toBe('Gorgos');
    expect(bossObjective(quest([{ type: 'talk', target: 'Daniel', isCompleted: true }]))).toBeNull();
  });
});

describe('nonBossObjectivesComplete (invasion trigger)', () => {
  it('true when every non-kill objective is done and the kill is still pending', () => {
    expect(nonBossObjectivesComplete(quest([
      { type: 'talk', target: 'Daniel', isCompleted: true },
      { type: 'kill', target: 'Debt Gnomes', isCompleted: false },
    ]))).toBe(true);
  });
  it('false while a non-kill objective is still pending', () => {
    expect(nonBossObjectivesComplete(quest([
      { type: 'talk', target: 'Daniel', isCompleted: false },
      { type: 'kill', target: 'Debt Gnomes', isCompleted: false },
    ]))).toBe(false);
  });
  it('false once the boss is already dead (no re-trigger)', () => {
    expect(nonBossObjectivesComplete(quest([
      { type: 'talk', target: 'Daniel', isCompleted: true },
      { type: 'kill', target: 'Debt Gnomes', isCompleted: true },
    ]))).toBe(false);
  });
  it('false when the quest has no kill objective at all', () => {
    expect(nonBossObjectivesComplete(quest([{ type: 'talk', target: 'Daniel', isCompleted: true }]))).toBe(false);
  });
});

describe('resolveBoss', () => {
  it('beefs a bestiary boss above its base stats', () => {
    const b = resolveBoss('Debt Gnomes', 0);
    expect(b.name).toBe('Debt Gnomes');
    expect(b.hp).toBe(80);      // 50 * 1.6
    expect(b.maxHp).toBe(80);
    expect(b.attack).toBe(10);  // 8 * 1.25
    expect(b.defense).toBe(4);  // 2 + 2
  });
  it('synthesizes a boss absent from the bestiary (Gorgos)', () => {
    const b = resolveBoss('Gorgos', 0);
    expect(b.name).toBe('Gorgos');
    expect(b.hp).toBeGreaterThan(0);
    expect(b.attack).toBeGreaterThan(0);
  });
  it('scales up with world progress', () => {
    expect(resolveBoss('Debt Gnomes', 100).hp).toBeGreaterThan(resolveBoss('Debt Gnomes', 0).hp);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/chronicle.test.ts`
Expected: FAIL — cannot resolve `./chronicle`.

- [ ] **Step 3: Write the implementation**

Create `APP/src/engine/chronicle.ts`:

```ts
import type { Enemy, Quest } from '../types/schemas';
import { BESTIARY } from './enemyAI';

/**
 * Chronicle boss invasion logic (item 4). Pure + deterministic so it is testable without
 * React/localStorage. A chronicle = a main-quest chapter whose objectives are non-boss
 * (talk/travel) + a final `kill` (the boss). Finishing the non-boss objectives triggers the
 * invasion; the kill is satisfied only by beating the invading boss.
 */

type Objective = NonNullable<Quest['objectives']>[number];

/** The final boss (kill) objective of a chronicle quest, or null if it has none. */
export const bossObjective = (quest: Quest): Objective | null =>
  quest.objectives?.find(o => o.type === 'kill') ?? null;

/** Invasion trigger: every non-kill objective done AND the kill objective still pending. */
export const nonBossObjectivesComplete = (quest: Quest): boolean => {
  const objs = quest.objectives ?? [];
  const boss = objs.find(o => o.type === 'kill');
  if (!boss || boss.isCompleted) return false;
  return objs.filter(o => o.type !== 'kill').every(o => o.isCompleted);
};

// Manifest kill target -> bestiary id (bosses that exist in the bestiary).
const BOSS_BESTIARY: Record<string, string> = {
  'Debt Gnomes': 'debt-gnome',
  'Inflation Djinn': 'inflation-djinn',
  'Compound Golem': 'compound-golem',
};

// Bosses referenced by the manifest but absent from the bestiary — synthesized bases.
const BOSS_SYNTH: Record<string, Enemy> = {
  Gorgos: { id: 'gorgos', name: 'Gorgos', hp: 90, maxHp: 90, attack: 13, defense: 4, archetype: 'Aggressor' },
};

const BOSS_HP_MULT = 1.6;
const BOSS_ATK_MULT = 1.25;

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Build the invading boss Enemy: a beefed bestiary/synth base scaled up by world progress. */
export const resolveBoss = (bossName: string, progress: number): Enemy => {
  const baseId = BOSS_BESTIARY[bossName];
  const base: Enemy =
    (baseId && BESTIARY.find(e => e.id === baseId)) ||
    BOSS_SYNTH[bossName] ||
    { id: 'boss-generic', name: bossName, hp: 80, maxHp: 80, attack: 12, defense: 4, archetype: 'Aggressor' };
  const prog = 1 + Math.max(0, Math.min(100, progress)) / 200; // up to +50% at 100% progress
  const hp = Math.round(base.hp * BOSS_HP_MULT * prog);
  const attack = Math.round(base.attack * BOSS_ATK_MULT * prog);
  const defense = base.defense + 2;
  return { id: 'boss-' + (baseId ?? slug(bossName)), name: bossName, hp, maxHp: hp, attack, defense, archetype: base.archetype };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/chronicle.test.ts`
Expected: PASS (all cases). Note: `resolveBoss('Debt Gnomes',0)` = hp `round(50*1.6*1)=80`,
attack `round(8*1.25*1)=10`, defense `2+2=4`.

- [ ] **Step 5: Commit**

```bash
cd APP && git add src/engine/chronicle.ts src/engine/chronicle.test.ts
git commit -m "feat(chronicle): pure invasion decisions (trigger + boss resolve, TDD)"
```

---

## Task 2: `campaign.invasion` schema field

**Files:**
- Modify: `APP/src/types/schemas.ts` (`CampaignState`)

- [ ] **Step 1: Add the field**

```bash
cd APP && python3 - <<'PY'
p='src/types/schemas.ts'; s=open(p).read()
old="  battleOrigin?: 'town' | 'map' | 'invasion'; // where a battle was entered from -> where victory/defeat returns\n}"
new="  battleOrigin?: 'town' | 'map' | 'invasion'; // where a battle was entered from -> where victory/defeat returns\n  invasion?: { town: string; questId: string; bossName: string }; // chronicle boss invading a town; presence = town locked\n}"
assert old in s; s=s.replace(old,new,1); open(p,'w').write(s); print('invasion field added')
PY
npx tsc -b 2>&1 | tail -3
```

Expected: tsc clean.

- [ ] **Step 2: Commit**

```bash
cd APP && git add src/types/schemas.ts
git commit -m "feat(chronicle): campaign.invasion state field"
```

---

## Task 3: `InvasionDialog` TV overlay component

**Files:**
- Create: `APP/src/components/AdventureWorld/InvasionDialog.tsx`

- [ ] **Step 1: Create the component**

Create `APP/src/components/AdventureWorld/InvasionDialog.tsx`:

```tsx
interface InvasionDialogProps {
  bossName: string;
  town: string;
  onFight: () => void;
  onEscape: () => void;
}

/** Full-cover TV overlay shown when a chronicle boss has invaded the current town. The player
 *  must choose Fight (→ boss battle) or Escape (→ World Map, town stays locked). Rendered by
 *  AdventureWorld over the town scene while `campaign.invasion` targets this town. */
export function InvasionDialog({ bossName, town, onFight, onEscape }: InvasionDialogProps) {
  return (
    <div className="absolute inset-0 z-[200] bg-[#060d20]/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in-95">
      <div className="w-full max-w-lg bg-[#171f33] border-4 border-[#84231d] p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
        <div className="text-5xl mb-3 animate-pulse">⚠️</div>
        <h3 className="font-headline text-2xl md:text-3xl font-black text-[#ffb4aa] uppercase tracking-tight mb-3">
          {town} Under Siege!
        </h3>
        <p className="font-body text-[#dbe2fd] italic mb-8">
          A <span className="text-[#f4d03f] font-black not-italic">{bossName}</span> has invaded
          {' '}{town} and is wreaking havoc! The townsfolk cry out — what do we do?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onFight}
            className="bg-[#84231d] text-white px-6 py-3 doodle-border font-headline font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">swords</span> We have to fight him!
          </button>
          <button
            onClick={onEscape}
            className="bg-[#171f33] text-[#ffeebb] px-6 py-3 doodle-border border-[#4c4634] font-headline font-black uppercase hover:bg-[#222a3e] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">directions_run</span> We have to escape!
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: clean (component not yet used — that is fine).

- [ ] **Step 3: Commit**

```bash
cd APP && git add src/components/AdventureWorld/InvasionDialog.tsx
git commit -m "feat(chronicle): InvasionDialog TV overlay (fight/escape)"
```

---

## Task 4: Render the dialog in AdventureWorld + thread props through GameView

**Files:**
- Modify: `APP/src/components/AdventureWorld/AdventureWorld.tsx`
- Modify: `APP/src/components/GameView.tsx`

- [ ] **Step 1: AdventureWorld — import, props, render**

```bash
cd APP && python3 - <<'PY'
p='src/components/AdventureWorld/AdventureWorld.tsx'; s=open(p).read()
# import
s=s.replace("import { DialogueBox } from './Shared/DialogueBox';",
            "import { DialogueBox } from './Shared/DialogueBox';\nimport { InvasionDialog } from './InvasionDialog';")
# props type
s=s.replace("  onEnterTown: (name: string) => void;\n  onExitTown: () => void;\n}",
            "  onEnterTown: (name: string) => void;\n  onExitTown: () => void;\n  onInvasionFight: () => void;\n  onInvasionEscape: () => void;\n}")
# destructure (the block ends with onEnterTown, onExitTown)
s=s.replace("  onEnterTown,\n  onExitTown\n}) => {",
            "  onEnterTown,\n  onExitTown,\n  onInvasionFight,\n  onInvasionEscape\n}) => {")
# render the overlay just before the closing DialogueBox
anchor="      <DialogueBox "
add='''      {campaign.invasion && campaign.worldState === 'town' && campaign.currentLocation === campaign.invasion.town && (
        <InvasionDialog
          bossName={campaign.invasion.bossName}
          town={campaign.invasion.town}
          onFight={onInvasionFight}
          onEscape={onInvasionEscape}
        />
      )}

      <DialogueBox '''
assert anchor in s; s=s.replace(anchor, add, 1)
open(p,'w').write(s); print('AdventureWorld wired')
PY
```

- [ ] **Step 2: GameView — pass the two props through**

First read the exact `<AdventureWorld …/>` usage and the props interface to match style:

Run: `grep -n "onExitTown\|onEnterTown\|interface GameViewProps\|}: GameViewProps" src/components/GameView.tsx`

Then apply (adjust the anchors if the grep shows different surrounding text):

```bash
cd APP && python3 - <<'PY'
p='src/components/GameView.tsx'; s=open(p).read()
# props interface: add after onExitTown in the interface
import re
assert 'onInvasionFight' not in s
# 1) interface member (find the onExitTown type line and append)
s=re.sub(r"(onExitTown:\s*\(\)\s*=>\s*void;)",
         r"\1\n  onInvasionFight: () => void;\n  onInvasionEscape: () => void;", s, count=1)
# 2) destructured params: add after onExitTown in the destructure list (the one followed by a comma or before }: GameViewProps)
s=re.sub(r"(\n\s*onExitTown,)",
         r"\1\n  onInvasionFight,\n  onInvasionEscape,", s, count=1)
# 3) pass to AdventureWorld (after the onExitTown={...} JSX prop)
s=re.sub(r"(onExitTown=\{onExitTown\})",
         r"\1\n                      onInvasionFight={onInvasionFight}\n                      onInvasionEscape={onInvasionEscape}", s, count=1)
assert s.count('onInvasionFight')==3, 'expected 3 insertions, got '+str(s.count('onInvasionFight'))
open(p,'w').write(s); print('GameView threaded')
PY
```

If the destructure or JSX uses a different token for `onExitTown` (e.g. no trailing comma), grep
the file and adjust the regex — do NOT leave a prop unthreaded.

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: errors that `App.tsx` does not yet pass `onInvasionFight`/`onInvasionEscape` to
`GameView` — that is fixed in Task 5. If the ONLY errors are those missing props, proceed.
(If you prefer a clean gate, do Task 5 before running tsc.)

- [ ] **Step 4: Commit (with Task 5, since tsc is red until App passes the props)**

Defer the commit to the end of Task 5 so the tree is green. (No commit here.)

---

## Task 5: App — invasion trigger, Fight/Escape handlers, pass props

**Files:**
- Modify: `APP/src/App.tsx`

- [ ] **Step 1: Import the chronicle helpers**

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
s=s.replace("import { CURRENCIES, formatMoney } from './data/currencies';",
            "import { CURRENCIES, formatMoney } from './data/currencies';\nimport { nonBossObjectivesComplete, bossObjective, resolveBoss } from './engine/chronicle';")
open(p,'w').write(s); print('import added')
PY
```

- [ ] **Step 2: Add the invasion trigger effect + Fight/Escape handlers**

Insert right after the budget-gate latch effect (the `useEffect` that calls
`shouldLatchUnlock`). This effect fires the invasion when the active chronicle's non-boss
objectives are all done; the handlers start the boss battle or escape to the map.

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
anchor='''      showNotify('Adventure unlocked! The world map awaits.');
    }
  }, [stats, profile, showNotify]);'''
add=anchor+'''

  // Item 4: chronicle boss invasion. When the active main quest's non-boss objectives are all
  // done (talk/travel), the boss invades the current town. Presence of campaign.invasion locks
  // the town until the boss is beaten.
  useEffect(() => {
    if (campaign.invasion) return; // already invading
    const mainQ = quests.find(q => q.status === 'active' && q.type === 'main');
    if (mainQ && nonBossObjectivesComplete(mainQ)) {
      const boss = bossObjective(mainQ);
      if (boss) {
        dbService.updateCampaign({ invasion: { town: campaign.currentLocation, questId: mainQ.id, bossName: boss.target } });
        showNotify(`A ${boss.target} has invaded ${campaign.currentLocation}!`);
      }
    }
  }, [quests, campaign.invasion, campaign.currentLocation, showNotify]);

  const handleInvasionFight = useCallback(async () => {
    if (!campaign.invasion) return;
    const boss = resolveBoss(campaign.invasion.bossName, campaign.progressPercentage);
    await dbService.updateCampaign({ worldState: 'battle', activeEnemy: boss, battleOrigin: 'invasion' });
  }, [campaign.invasion, campaign.progressPercentage]);

  const handleInvasionEscape = useCallback(async () => {
    // Flee to the World Map. The invasion stays set, so re-entering the town re-shows the dialog.
    await dbService.updateCampaign({ worldState: 'peace' });
    showNotify('You flee to the world map. The town remains under siege...');
  }, [showNotify]);'''
assert anchor in s; s=s.replace(anchor,add,1); open(p,'w').write(s); print('effect+handlers added')
PY
```

- [ ] **Step 3: Pass the handlers to GameView**

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
old="                  onEnterTown={handleEnterTown}\n                  onExitTown={handleExitTown}"
new="                  onEnterTown={handleEnterTown}\n                  onExitTown={handleExitTown}\n                  onInvasionFight={handleInvasionFight}\n                  onInvasionEscape={handleInvasionEscape}"
assert old in s; s=s.replace(old,new,1); open(p,'w').write(s); print('props passed to GameView')
PY
npx tsc -b 2>&1 | tail -4
```

Expected: tsc clean now (all props threaded).

- [ ] **Step 4: Commit Tasks 4+5 together (tree green)**

```bash
cd APP && git add src/components/AdventureWorld/AdventureWorld.tsx src/components/GameView.tsx src/App.tsx
git commit -m "feat(chronicle): invasion trigger + fight/escape wiring through the TV"
```

---

## Task 6: Boss-defeat branch + guard the blanket kill-tick + routing

**Files:**
- Modify: `APP/src/App.tsx` (`handleBattleVictory`, `handleBattleDefeat`)

- [ ] **Step 1: Rework `handleBattleVictory`**

The current top of the function ticks the active quest's first incomplete kill objective on ANY
victory. Replace that with: on an INVASION victory tick the MAIN quest's kill (the boss) then
clear the invasion + return to a normal town; on a NORMAL victory tick only SIDE-quest kills.

First, read the current function to anchor exactly:

Run: `grep -n "const handleBattleVictory" src/App.tsx` then `sed -n '<start>,<start+30>p'` to
confirm the block matches the strings below.

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()

# (a) Replace the blanket kill-tick at the top of handleBattleVictory with a side-quest-only tick.
old_top='''    const activeQuest = quests.find(q => q.status === 'active');
    if (activeQuest) {
      const targetObj = activeQuest.objectives?.find(o => o.type === 'kill' && !o.isCompleted);
      if (targetObj) checkQuestObjective('kill', targetObj.target);
    }'''
new_top='''    // Boss (main-quest) kills only count via the invasion flow (below). Normal outskirts kills
    // still advance SIDE quests (director-forged "Menace" quests).
    if (campaign.battleOrigin !== 'invasion') {
      const activeSide = quests.find(q => q.status === 'active' && q.type === 'side');
      const targetObj = activeSide?.objectives?.find(o => o.type === 'kill' && !o.isCompleted);
      if (targetObj) checkQuestObjective('kill', targetObj.target);
    }'''
assert old_top in s, "victory top block not found verbatim — grep and adjust"
s=s.replace(old_top,new_top,1)

# (b) On invasion victory, after rewards, tick the boss kill + clear invasion + return to town.
old_ret="    await dbService.updateCampaign({ worldState: campaign.battleOrigin === 'town' ? 'town' : 'peace', battleOrigin: undefined });\n  }, [quests, stats, party, campaign.battleOrigin, checkQuestObjective, showNotify]);"
new_ret='''    if (campaign.battleOrigin === 'invasion') {
      const mainQ = quests.find(q => q.status === 'active' && q.type === 'main');
      const boss = mainQ ? bossObjective(mainQ) : null;
      if (boss) await checkQuestObjective('kill', boss.target);
      const freedTown = campaign.invasion?.town ?? campaign.currentLocation;
      await dbService.updateCampaign({ worldState: 'town', battleOrigin: undefined, invasion: undefined });
      showNotify(`${freedTown} is free! Claim your reward in the Strategic Map.`);
      return;
    }
    await dbService.updateCampaign({ worldState: campaign.battleOrigin === 'town' ? 'town' : 'peace', battleOrigin: undefined });
  }, [quests, stats, party, campaign.battleOrigin, campaign.invasion, campaign.currentLocation, checkQuestObjective, showNotify]);'''
assert old_ret in s, "victory return line not found verbatim — grep and adjust"
s=s.replace(old_ret,new_ret,1)
open(p,'w').write(s); print('victory reworked')
PY
```

Note the invasion branch is placed BEFORE the generic return, but AFTER the reward loop (so the
boss still grants XP/gold). The reward loop already runs above via `director.onEvent('battle-finished')`.

- [ ] **Step 2: Route defeat back to the town for invasion too**

On losing to the boss, the party is revived (existing recovery) and the invasion STAYS set, so
the player lands back in the town and the dialog re-appears (retry). Update the defeat routing to
treat `'invasion'` like `'town'`.

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
old="    await dbService.updateCampaign({ worldState: campaign.battleOrigin === 'town' ? 'town' : 'peace', battleOrigin: undefined });\n    showNotify(survivor ? `Defeated... ${survivor.name} was revived to fight another day.` : 'Defeated... Escaped to safety.');"
new="    const returnState = (campaign.battleOrigin === 'town' || campaign.battleOrigin === 'invasion') ? 'town' : 'peace';\n    await dbService.updateCampaign({ worldState: returnState, battleOrigin: undefined });\n    showNotify(survivor ? `Defeated... ${survivor.name} was revived to fight another day.` : 'Defeated... Escaped to safety.');"
assert old in s, "defeat routing not found verbatim — grep and adjust"
s=s.replace(old,new,1); open(p,'w').write(s); print('defeat routing updated')
PY
npx tsc -b 2>&1 | tail -4 && npm run build 2>&1 | tail -2
```

Expected: tsc + build clean. (On invasion defeat `battleOrigin` is cleared but `invasion` stays,
so re-entering the town — already `worldState 'town'` — re-shows the dialog.)

- [ ] **Step 3: Commit**

```bash
cd APP && git add src/App.tsx
git commit -m "feat(chronicle): boss-defeat unlock + reward, guard main-quest kill to invasion"
```

---

## Task 7: Full-flow browser verification

**Files:** none (verification only).

- [ ] **Step 1: Seed a chronicle at the invasion threshold**

Drive a save where the ch0 main quest is `active` with the talk objective DONE and the kill
pending, in the Starting Village town, so the trigger fires. In `preview_eval`:

```js
(()=>{
  localStorage.clear();
  localStorage.setItem('player/profile', JSON.stringify({onboardingComplete:true}));
  localStorage.setItem('player/stats', JSON.stringify({level:5,exp:0,ap:30,gold:0,monthlyBudget:3000,currency:'USD'}));
  localStorage.setItem('party', JSON.stringify([{id:'p1',name:'Althea',avatar:'',role:'Leader',hp:200,maxHp:200,mp:20,maxMp:20,level:5,attack:80,defense:20,equipment:{}}]));
  localStorage.setItem('quests', JSON.stringify([{
    id:'q0_main', title:'The Ledger of the Lost Town', description:'', type:'main', difficulty:1,
    reward:{exp:150,gold:100}, status:'active',
    objectives:[
      {id:'obj0_1',text:'Talk to Daniel',type:'talk',target:'Chronicler Daniel',isCompleted:true},
      {id:'obj0_2',text:'Defeat the Debt Gnomes',type:'kill',target:'Debt Gnomes',isCompleted:false}
    ]
  }]));
  localStorage.setItem('player/campaign', JSON.stringify({currentLocation:'Starting Village',progressPercentage:0,worldState:'town'}));
  location.reload(); return 'seeded chronicle at threshold';
})()
```

- [ ] **Step 2: Confirm the invasion triggered + dialog on the TV**

Open Quests tab; assert `campaign.invasion` is set and the dialog text renders:

```js
(()=>{[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Quests')?.click();
 return JSON.stringify({ invasion: JSON.parse(localStorage.getItem('player/campaign')).invasion,
   dialog: /has invaded|Under Siege/i.test(document.body.innerText),
   fightBtn: [...document.querySelectorAll('button')].some(b=>/fight him/i.test(b.textContent)),
   escapeBtn: [...document.querySelectorAll('button')].some(b=>/escape/i.test(b.textContent)) });})()
```
Expected: `invasion` set (town Starting Village, bossName Debt Gnomes), dialog + both buttons.

- [ ] **Step 3: Escape → World Map + town stays locked**

Click "We have to escape!", assert `worldState==='peace'` and `invasion` still set. Then simulate
re-entering the town (`updateCampaign worldState:'town'` via the enter flow or directly) and assert
the dialog re-appears:

```js
(()=>{[...document.querySelectorAll('button')].find(b=>/escape/i.test(b.textContent))?.click();
 return new Promise(r=>setTimeout(()=>{const c=JSON.parse(localStorage.getItem('player/campaign'));
   r(JSON.stringify({worldState:c.worldState, invasionStillSet: !!c.invasion}));},400));})()
```
Expected: `worldState:'peace'`, `invasionStillSet:true`. Then set worldState back to `'town'` and
reload → dialog shows again (lockout).

- [ ] **Step 4: Fight → boss battle → win → town unlocked + reward-ready**

Re-enter town (dialog shows) → click "We have to fight him!" → CombatScene mounts with the boss
(Debt Gnomes, ~80 HP) → strike until dead. Assert after victory: `invasion` cleared,
`worldState:'town'`, the quest kill objective `isCompleted:true` and quest `status:'ready'`.

```js
// after striking to victory:
(()=>{const c=JSON.parse(localStorage.getItem('player/campaign'));
 const q=JSON.parse(localStorage.getItem('quests'))[0];
 return JSON.stringify({invasion:c.invasion??null, worldState:c.worldState,
   killDone:q.objectives.find(o=>o.type==='kill').isCompleted, questStatus:q.status});})()
```
Expected: `invasion:null`, `worldState:'town'`, `killDone:true`, `questStatus:'ready'`.

- [ ] **Step 5: Regression — normal outskirts fight still returns to town + advances side quests only**

Confirm a normal (non-invasion) outskirts win still routes to `'town'` (Batch A) and does NOT tick
a main-quest boss kill. Console clean throughout (`preview_console_logs level:error`).

- [ ] **Step 6: Final gate + docs**

```bash
cd APP && npx tsc -b && npm test && npm run build
```
Expected: tsc clean, tests green (baseline 209 + chronicle ≈ 219), build clean.

Then:
- Update `PLANS/DemoPolishPlan.md` — mark the Phase 9 battle-encounter/boss slice DONE (Batch B),
  link this plan + the spec.
- Update project memory `ledgerquest-demo-polish-plan`.
- Report to the user; Batch C (tutorial) next.

## Self-review notes
- **Spec coverage (item 4):** trigger → Task 5 effect; TV dialog → Tasks 3–4; Fight → Task 5
  handler + Task 6 victory branch; Escape → Task 5 handler; town lockout → dialog re-mounts while
  `invasion` set (Task 4 render condition); boss defeat unlock + reward → Task 6; boss resolution →
  Task 1. `townLocked` intentionally dropped (invasion presence = lock) — documented above.
- **Type consistency:** `resolveBoss(name, progress): Enemy`, `bossObjective(quest): Objective|null`,
  `nonBossObjectivesComplete(quest): boolean` used identically in App; `campaign.invasion` shape
  `{town, questId, bossName}` matches schema; `battleOrigin: 'invasion'` reused from Batch A.
- **Kill-tick guard:** main-quest boss kill ONLY on invasion victory; side-quest kills on normal
  victory — prevents the old "boss dies on any fight" bug (audit #7 lineage).
```
