# Demo Polish Batch A (Phase 7.5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement
> this plan task-by-task (per project memory `execution-prefer-inline-over-subagent` — run
> inline, NOT subagent-driven). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the four quick-win demo fixes — a header Settings modal (gear icon) holding the
New Game reset, a finance-side currency selector (symbol relabel), outskirts battles that return
to the town, and a demo/PixelOre footer on every page.

**Architecture:** One pure TDD helper (`formatMoney`) + a small currency data file drive all
finance-money rendering. Currency is stored on `PlayerStats`. Battle return routing keys off a
new `campaign.battleOrigin`. Two new presentational components (`SettingsModal`, `DemoFooter`).
Source files are Read-gated → edit via Bash python exact-string replace; new files via Write.

**Tech Stack:** React 19 + TS + Vite + Tailwind, Vitest (node env), localStorage persistence.

**Source of truth:** `PLANS/specs/2026-07-11-demo-polish-batch-design.md` (items 1, 2, 5, 6).
Batches B (boss flow) and C (tutorial) get their own plans at their checkpoints.

**Working notes:** `cbm-code-discovery-gate` BLOCKS Read on source → grep/sed to read, python
string-replace to edit (assert the replacement happened). `preview_start "ledgerquest-dev"`;
`preview_screenshot` times out on the CRT anim → verify via `preview_eval` DOM assertions,
`localStorage.clear()`+reload first. All commands run from `APP/`. Keep `npm test` /
`npx tsc -b` / `npm run build` green (baseline **203 tests**). Commit locally, NO push.

---

## File Structure

- Create `APP/src/data/currencies.ts` — currency list + `symbolOf` + pure `formatMoney`.
- Create `APP/src/data/currencies.test.ts` — unit tests for the above.
- Modify `APP/src/types/schemas.ts` — `PlayerStats.currency?`, `CampaignState.battleOrigin?`.
- Modify `APP/src/engine/onboarding.ts` — `SCRATCH_STATS.currency = 'USD'`.
- Modify `APP/src/App.tsx` — budget dropdown, money-render swaps, battle routing, Settings
  wiring + remove Archive Danger Zone, mount `DemoFooter`.
- Modify `APP/src/components/ExpenseList.tsx` — accept + use `currency` prop.
- Modify `APP/src/components/TopAppBar.tsx` — gear button + `onOpenSettings` prop.
- Create `APP/src/components/SettingsModal.tsx` — Settings overlay holding the New Game reset.
- Create `APP/src/components/DemoFooter.tsx` — gray demo/PixelOre strip.

---

## Task 1: Currency data + `formatMoney` (pure, TDD)

**Files:**
- Create: `APP/src/data/currencies.test.ts`
- Create: `APP/src/data/currencies.ts`

- [ ] **Step 1: Write the failing test**

Create `APP/src/data/currencies.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { CURRENCIES, symbolOf, formatMoney } from './currencies';

describe('currency catalogue', () => {
  it('offers USD/EUR/GBP/INR/JPY at minimum, USD first', () => {
    const codes = CURRENCIES.map(c => c.code);
    expect(codes[0]).toBe('USD');
    ['USD', 'EUR', 'GBP', 'INR', 'JPY'].forEach(c => expect(codes).toContain(c));
  });
});

describe('symbolOf', () => {
  it('maps known codes to symbols', () => {
    expect(symbolOf('USD')).toBe('$');
    expect(symbolOf('EUR')).toBe('€');
    expect(symbolOf('GBP')).toBe('£');
    expect(symbolOf('INR')).toBe('₹');
    expect(symbolOf('JPY')).toBe('¥');
  });
  it('falls back to $ for unknown/missing codes (legacy saves)', () => {
    expect(symbolOf(undefined)).toBe('$');
    expect(symbolOf('ZZZ')).toBe('$');
  });
});

describe('formatMoney', () => {
  it('prefixes the symbol and groups thousands', () => {
    expect(formatMoney(3000, 'EUR')).toBe('€3,000');
    expect(formatMoney(1000000, 'GBP')).toBe('£1,000,000');
  });
  it('defaults currency to USD when absent', () => {
    expect(formatMoney(1500, undefined)).toBe('$1,500');
  });
  it('honours fractionDigits (expense list keeps 2 decimals)', () => {
    expect(formatMoney(1234.5, 'USD', { fractionDigits: 2 })).toBe('$1,234.50');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/currencies.test.ts`
Expected: FAIL — cannot resolve `./currencies`.

- [ ] **Step 3: Write the implementation**

Create `APP/src/data/currencies.ts`:

```ts
/** Finance-side display currencies (item 2). Symbol relabel only — no FX conversion.
 *  The stored amounts never change; only the symbol shown to the player does. Game Gold
 *  is a separate in-game currency and is NOT affected. */
export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: '$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'Australian Dollar' },
];

const SYMBOLS: Record<string, string> = Object.fromEntries(CURRENCIES.map(c => [c.code, c.symbol]));

export const symbolOf = (code?: string): string => (code && SYMBOLS[code]) || '$';

/** Format a finance amount for display: prefixed symbol + grouped number. */
export const formatMoney = (
  amount: number,
  code?: string,
  opts?: { fractionDigits?: number },
): string => {
  const n =
    opts?.fractionDigits != null
      ? amount.toLocaleString(undefined, {
          minimumFractionDigits: opts.fractionDigits,
          maximumFractionDigits: opts.fractionDigits,
        })
      : amount.toLocaleString();
  return `${symbolOf(code)}${n}`;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/currencies.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
cd APP && git add src/data/currencies.ts src/data/currencies.test.ts
git commit -m "feat(currency): currency catalogue + formatMoney helper (TDD)"
```

---

## Task 2: Store currency on stats (schema + scratch seed)

**Files:**
- Modify: `APP/src/types/schemas.ts` (`PlayerStats`)
- Modify: `APP/src/engine/onboarding.ts` (`SCRATCH_STATS`)
- Modify: `APP/src/engine/onboarding.test.ts` (scratch assertion)

- [ ] **Step 1: Update the scratch test (RED)**

Run this python to extend the SCRATCH_STATS assertion:

```bash
cd APP && python3 - <<'PY'
p='src/engine/onboarding.test.ts'
s=open(p).read()
old="expect(SCRATCH_STATS).toEqual({ level: 1, exp: 0, ap: 0, gold: 0, monthlyBudget: 0 });"
new="expect(SCRATCH_STATS).toEqual({ level: 1, exp: 0, ap: 0, gold: 0, monthlyBudget: 0, currency: 'USD' });"
assert old in s; s=s.replace(old,new,1); open(p,'w').write(s); print('ok')
PY
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/onboarding.test.ts`
Expected: FAIL — SCRATCH_STATS missing `currency`.

- [ ] **Step 3: Add the field to the schema + scratch seed**

```bash
cd APP && python3 - <<'PY'
# schema
p='src/types/schemas.ts'; s=open(p).read()
old="  monthlyBudget?: number;\n}"
new="  monthlyBudget?: number;\n  currency?: string; // finance-side display currency code (item 2); default USD\n}"
assert old in s; s=s.replace(old,new,1); open(p,'w').write(s)

# scratch seed
p='src/engine/onboarding.ts'; s=open(p).read()
old="  gold: 0,\n  monthlyBudget: 0,\n};"
new="  gold: 0,\n  monthlyBudget: 0,\n  currency: 'USD',\n};"
assert old in s; s=s.replace(old,new,1); open(p,'w').write(s)
print('schema+scratch updated')
PY
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/engine/onboarding.test.ts && npx tsc -b`
Expected: PASS + tsc clean.

- [ ] **Step 5: Commit**

```bash
cd APP && git add src/types/schemas.ts src/engine/onboarding.ts src/engine/onboarding.test.ts
git commit -m "feat(currency): persist currency on PlayerStats + scratch seed USD"
```

---

## Task 3: Currency dropdown in the budget editor + render swaps

**Files:**
- Modify: `APP/src/App.tsx` (import, budget modal `<select>`, submit, money renders)
- Modify: `APP/src/components/ExpenseList.tsx` (currency prop + render)

- [ ] **Step 1: Import helpers + currency draft state, persist currency on budget submit**

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
def rep(a,b):
    assert a in s, "NF: "+a[:70]
    return s.replace(a,b,1)

# import formatMoney + CURRENCIES (place after the GEAR_BY_NAME import)
s=rep("import { GEAR_BY_NAME } from './data/gear';\n",
      "import { GEAR_BY_NAME } from './data/gear';\nimport { CURRENCIES, formatMoney } from './data/currencies';\n")

# currency draft state next to newBudget
s=rep("  const [newBudget, setNewBudget] = useState(stats.monthlyBudget || 3000);",
      "  const [newBudget, setNewBudget] = useState(stats.monthlyBudget || 3000);\n  const [newCurrency, setNewCurrency] = useState(stats.currency || 'USD');")

# persist currency with budget
s=rep("    await dbService.updateStats(() => ({ monthlyBudget: newBudget }));",
      "    await dbService.updateStats(() => ({ monthlyBudget: newBudget, currency: newCurrency }));")

open(p,'w').write(s); print('app imports+state+submit done')
PY
```

- [ ] **Step 2: Add the `<select>` to the Calibrate Budget modal**

The budget modal has a Monthly Allowance input then an Update button. Insert a currency select
between them:

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
anchor='''                    onChange={e => setNewBudget(parseInt(e.target.value) || 0)} 
                    required 
                  />
                </div>'''
add=anchor+'''
                <div className="flex flex-col gap-2">
                  <span className="font-label text-[10px] uppercase text-on-surface-variant">Currency</span>
                  <select
                    className="w-full bg-surface doodle-border py-3 px-4 text-primary font-bold text-lg outline-none"
                    value={newCurrency}
                    onChange={e => setNewCurrency(e.target.value)}
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} ({c.symbol}) — {c.label}</option>
                    ))}
                  </select>
                </div>'''
assert anchor in s; s=s.replace(anchor,add,1); open(p,'w').write(s); print('select added')
PY
```

- [ ] **Step 3: When opening the budget editor, seed the currency draft too**

There are two open-points that set `newBudget`; make both also set `newCurrency`.

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
s=s.replace("setNewBudget(totalIncome); setIsBudgetEditorOpen(true);",
            "setNewBudget(totalIncome); setNewCurrency(stats.currency || 'USD'); setIsBudgetEditorOpen(true);")
open(p,'w').write(s); print('open-points seeded:', s.count("setNewCurrency(stats.currency || 'USD'); setIsBudgetEditorOpen"))
PY
```

Expected print: `open-points seeded: 2`.

- [ ] **Step 4: Swap the finance money renders to `formatMoney`**

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
def rep(a,b):
    assert a in s, "NF: "+a[:70]
    return s.replace(a,b,1)

# ledger cards
s=rep('${totalIncome.toLocaleString()}', '{formatMoney(totalIncome, stats.currency)}')
s=rep('${totalExpenses.toLocaleString()}', '{formatMoney(totalExpenses, stats.currency)}')
s=rep('${remainingBudget.toLocaleString()}', '{formatMoney(remainingBudget, stats.currency)}')
# budget streams (allocatedAmount label in Streams sub-tab header + the ledger budget-card list)
s=s.replace('${b.allocatedAmount}', '{formatMoney(b.allocatedAmount, stats.currency)}')  # both occurrences
s=rep('${catTotal.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">of ${b.allocatedAmount}</span>',
      '{formatMoney(catTotal, stats.currency)} <span className="text-sm font-normal text-on-surface-variant">of {formatMoney(b.allocatedAmount, stats.currency)}</span>')
# savings goals
s=rep('${g.currentAmount.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">of ${g.targetAmount.toLocaleString()}</span>',
      '{formatMoney(g.currentAmount, stats.currency)} <span className="text-sm font-normal text-on-surface-variant">of {formatMoney(g.targetAmount, stats.currency)}</span>')
# deposit toast
s=rep('showNotify(`+$${amount} sealed into ${goal.name}`);',
      'showNotify(`+${formatMoney(amount, stats.currency)} sealed into ${goal.name}`);')
open(p,'w').write(s); print('renders swapped; remaining raw $-toLocale:', s.count('.toLocaleString()}'))
PY
```

Note: `catTotal`/`b.allocatedAmount` appear in the Streams header (`of ${b.allocatedAmount}`) and
the ledger budget-card top-row label (`${b.allocatedAmount}`). The `s.replace(...)` without count
handles both `${b.allocatedAmount}` occurrences; the `rep(...)` handles the composed Streams line.
If the assert on the composed line fails, grep for the exact current text and adjust.

- [ ] **Step 5: Pass currency into ExpenseList + use it there**

Wire the prop where `<ExpenseList>` is rendered, then update the component.

```bash
cd APP && python3 - <<'PY'
# App: pass prop
p='src/App.tsx'; s=open(p).read()
s=s.replace('<ExpenseList expenses={expenses} />','<ExpenseList expenses={expenses} currency={stats.currency} />')
# fallback if the render has different attrs order/spacing:
if '<ExpenseList expenses={expenses} currency=' not in s:
    import re
    s=re.sub(r'<ExpenseList expenses=\{expenses\}\s*/>','<ExpenseList expenses={expenses} currency={stats.currency} />',s)
open(p,'w').write(s)

# ExpenseList component
p='src/components/ExpenseList.tsx'; s=open(p).read()
s=s.replace("import type { Expense } from '../types/schemas';",
            "import type { Expense } from '../types/schemas';\nimport { formatMoney } from '../data/currencies';")
s=s.replace("interface Props {\n  expenses: Expense[];\n}",
            "interface Props {\n  expenses: Expense[];\n  currency?: string;\n}")
s=s.replace("const ExpenseList: React.FC<Props> = ({ expenses }) => {",
            "const ExpenseList: React.FC<Props> = ({ expenses, currency }) => {")
s=s.replace("-{exp.amount.toFixed(2)}$",
            "-{formatMoney(exp.amount, currency, { fractionDigits: 2 })}")
open(p,'w').write(s); print('ExpenseList wired')
PY
```

- [ ] **Step 6: Typecheck + build + browser verify**

Run: `npx tsc -b && npm run build`
Expected: clean.

Browser (`preview_start "ledgerquest-dev"`, then in `preview_eval`): with a save that has a
budget set, open the Ledger — money shows `$`. Then set currency to EUR via the budget modal
(or directly: `updateStats currency:'EUR'`) and reload — ledger cards, budget streams, savings
and the expense list all show `€`; Gold-based UI (shop, victory toast) still says Gold.
Assert e.g.:
```js
JSON.stringify({ hasEuro: /€/.test(document.body.innerText), hasDollar: /\$/.test(document.body.innerText) })
```

- [ ] **Step 7: Commit**

```bash
cd APP && git add src/App.tsx src/components/ExpenseList.tsx
git commit -m "feat(currency): budget currency dropdown + relabel finance renders"
```

---

## Task 4: Outskirts battle returns to town (`battleOrigin`)

**Files:**
- Modify: `APP/src/types/schemas.ts` (`CampaignState.battleOrigin`)
- Modify: `APP/src/App.tsx` (`handleBattleAction`, `handleBattleVictory`, `handleBattleDefeat`)

- [ ] **Step 1: Add `battleOrigin` to the schema**

```bash
cd APP && python3 - <<'PY'
p='src/types/schemas.ts'; s=open(p).read()
old="  worldState: 'peace' | 'battle' | 'puzzle' | 'town';\n  activeEnemy?: Enemy;\n}"
new="  worldState: 'peace' | 'battle' | 'puzzle' | 'town';\n  activeEnemy?: Enemy;\n  battleOrigin?: 'town' | 'map' | 'invasion'; // where a battle was entered from → where victory/defeat returns\n}"
assert old in s; s=s.replace(old,new,1); open(p,'w').write(s); print('ok')
PY
```

- [ ] **Step 2: Tag the outskirts battle with origin `'town'`**

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
old="        await dbService.updateCampaign({ worldState: 'battle', activeEnemy: a.enemy });"
new="        await dbService.updateCampaign({ worldState: 'battle', activeEnemy: a.enemy, battleOrigin: 'town' });"
assert old in s; s=s.replace(old,new,1); open(p,'w').write(s); print('ok')
PY
```

- [ ] **Step 3: Route victory + defeat back to origin**

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
# victory
old_v="    await dbService.updateCampaign({ worldState: 'peace' });\n  }, [quests, stats, party, checkQuestObjective, showNotify]);"
new_v="    await dbService.updateCampaign({ worldState: campaign.battleOrigin === 'town' ? 'town' : 'peace', battleOrigin: undefined });\n  }, [quests, stats, party, campaign.battleOrigin, checkQuestObjective, showNotify]);"
assert old_v in s; s=s.replace(old_v,new_v,1)
# defeat
old_d="    const survivor = changed[0];\n    await dbService.updateCampaign({ worldState: 'peace' });\n    showNotify(survivor ? `Defeated... ${survivor.name} was revived to fight another day.` : 'Defeated... Escaped to safety.');\n  }, [stats, party, showNotify]);"
new_d="    const survivor = changed[0];\n    await dbService.updateCampaign({ worldState: campaign.battleOrigin === 'town' ? 'town' : 'peace', battleOrigin: undefined });\n    showNotify(survivor ? `Defeated... ${survivor.name} was revived to fight another day.` : 'Defeated... Escaped to safety.');\n  }, [stats, party, campaign.battleOrigin, showNotify]);"
assert old_d in s; s=s.replace(old_d,new_d,1)
open(p,'w').write(s); print('routing updated')
PY
```

- [ ] **Step 4: Typecheck + browser verify**

Run: `npx tsc -b`
Expected: clean.

Browser: seed a battle from the town outskirts (or set `campaign.worldState='battle'` +
`battleOrigin:'town'` + an `activeEnemy`, reload, open Quests). Win the fight (strike until
enemy HP 0) → assert `JSON.parse(localStorage.getItem('player/campaign')).worldState === 'town'`.
Repeat forcing a loss → also returns to `'town'`.

- [ ] **Step 5: Commit**

```bash
cd APP && git add src/types/schemas.ts src/App.tsx
git commit -m "feat(combat): outskirts battles return to town, not the world map"
```

---

## Task 5: Settings modal + gear icon (move New Game reset)

**Files:**
- Create: `APP/src/components/SettingsModal.tsx`
- Modify: `APP/src/components/TopAppBar.tsx` (gear button + prop)
- Modify: `APP/src/App.tsx` (state, wire gear + TopAppBar prop, render modal, remove Archive
  Danger Zone)

- [ ] **Step 1: Create the SettingsModal component**

Create `APP/src/components/SettingsModal.tsx`:

```tsx
interface SettingsModalProps {
  onClose: () => void;
  onResetGame: () => void;
}

/** App settings overlay. Holds the Danger Zone "New Game" reset (moved out of the Grand
 *  Archive → Vaults tab). Room to grow (currency lives in the budget editor, per design). */
export default function SettingsModal({ onClose, onResetGame }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
      <div className="w-full max-w-md relative animate-in zoom-in-95 duration-200">
        <div className="tape-accent doodle-border bg-surface-container p-5 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-2xl font-bold text-primary">Settings</h3>
            <button
              onClick={onClose}
              aria-label="Close settings"
              className="w-9 h-9 rounded-full bg-surface-container-high border-2 border-outline/30 flex items-center justify-center hover:border-primary/50 transition-all"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="border-t-2 border-dashed border-error/30 pt-6">
            <h4 className="font-headline text-lg font-black text-error uppercase">Danger Zone</h4>
            <p className="font-body text-xs text-on-surface-variant italic mb-4">
              Erase ALL progress and start a brand-new game from scratch — the budget gate and
              tutorial are reset.
            </p>
            <button
              onClick={onResetGame}
              className="bg-error text-on-error px-8 py-3 doodle-border font-label text-[10px] uppercase font-black hover:scale-105 transition-transform"
            >
              New Game — Start From Scratch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the gear button to TopAppBar**

Add an `onOpenSettings` prop and a gear button before the feedback link.

```bash
cd APP && python3 - <<'PY'
p='src/components/TopAppBar.tsx'; s=open(p).read()
# prop type
s=s.replace("interface Props {\n  currentTab: string;\n  onTabChange: (tab: string) => void;\n  ap: number;\n}",
            "interface Props {\n  currentTab: string;\n  onTabChange: (tab: string) => void;\n  ap: number;\n  onOpenSettings: () => void;\n}")
# destructure
s=s.replace("const TopAppBar: React.FC<Props> = ({ currentTab, onTabChange, ap }) => {",
            "const TopAppBar: React.FC<Props> = ({ currentTab, onTabChange, ap, onOpenSettings }) => {")
# gear button before the feedback <a>
anchor='''          <a
            href="https://forms.gle/1DH1yBBggYtuH12D9"'''
gear='''          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            title="Settings"
            className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 border-outline/30 hover:border-primary/50 transition-all text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-xl md:text-2xl">settings</span>
          </button>

          <a
            href="https://forms.gle/1DH1yBBggYtuH12D9"'''
assert anchor in s; s=s.replace(anchor,gear,1)
open(p,'w').write(s); print('gear added')
PY
```

- [ ] **Step 3: Wire settings state + TopAppBar prop in App, render modal**

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
# import
s=s.replace("import TopAppBar from './components/TopAppBar';",
            "import TopAppBar from './components/TopAppBar';\nimport SettingsModal from './components/SettingsModal';")
# state (add next to isVaultOpen)
s=s.replace("  const [isVaultOpen, setIsVaultOpen] = useState(false);",
            "  const [isVaultOpen, setIsVaultOpen] = useState(false);\n  const [isSettingsOpen, setIsSettingsOpen] = useState(false);")
open(p,'w').write(s); print('state+import done')
PY
```

Then find the `<TopAppBar ... />` render and the `{gatedQuest && ...}` overlay line to attach the
prop and mount the modal:

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
import re
# add onOpenSettings to TopAppBar usage (handle any current prop set)
s2=re.sub(r'<TopAppBar\b', '<TopAppBar onOpenSettings={() => setIsSettingsOpen(true)}', s, count=1)
assert s2!=s, "TopAppBar usage not found"; s=s2
# mount modal right after the gatedQuest overlay line
anchor="      {gatedQuest && <QuestGater"
assert anchor in s, "gatedQuest anchor not found"
s=s.replace(anchor,
    "      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} onResetGame={() => { setIsSettingsOpen(false); handleResetGame(); }} />}\n"+anchor, 1)
open(p,'w').write(s); print('wired TopAppBar+modal')
PY
```

- [ ] **Step 4: Remove the Danger Zone block from Archive → Vaults**

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
old='''                     <div className="border-t-2 border-dashed border-error/30 pt-8 mt-4">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                           <div>
                              <h4 className="font-headline text-lg font-black text-error uppercase">Danger Zone</h4>
                              <p className="font-body text-xs text-on-surface-variant italic">Erase ALL progress and start a brand-new game from scratch — the budget gate and tutorial are reset.</p>
                           </div>
                           <button onClick={handleResetGame} className="bg-error text-on-error px-8 py-3 doodle-border font-label text-[10px] uppercase font-black hover:scale-105 transition-transform">New Game — Start From Scratch</button>
                        </div>
                     </div>
'''
assert old in s, "Archive Danger Zone block not found verbatim — grep and adjust"
s=s.replace(old,'',1); open(p,'w').write(s); print('archive danger zone removed')
PY
```

- [ ] **Step 5: Typecheck + build + browser verify**

Run: `npx tsc -b && npm run build`
Expected: clean.

Browser: header shows a gear button; click → Settings modal with "New Game — Start From Scratch";
Archive → Vaults no longer shows Danger Zone. Assert:
```js
(()=>{const g=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Settings');g?.click();return JSON.stringify({gear:!!g, resetInModal:[...document.querySelectorAll('button')].some(b=>/new game/i.test(b.textContent))});})()
```
Check the header right cluster does not overflow at 375px (`preview_resize` mobile): AP badge +
gear + feedback all fit, no horizontal page scroll.

- [ ] **Step 6: Commit**

```bash
cd APP && git add src/components/SettingsModal.tsx src/components/TopAppBar.tsx src/App.tsx
git commit -m "feat(settings): gear-icon Settings modal holding New Game reset (moved from Archive)"
```

---

## Task 6: Demo / PixelOre footer

**Files:**
- Create: `APP/src/components/DemoFooter.tsx`
- Modify: `APP/src/App.tsx` (mount + bottom spacing so the mobile nav clears it)

- [ ] **Step 1: Create the DemoFooter component**

Create `APP/src/components/DemoFooter.tsx`:

```tsx
/** Persistent low-key strip on every page: this is a demo, not a real financial tool, and a
 *  PixelOre product. Muted gray, non-interactive. Sits in normal flow at the bottom of the
 *  page; App adds bottom padding on mobile so the floating nav clears it. */
export default function DemoFooter() {
  return (
    <div className="w-full border-t-2 border-outline-variant/40 bg-surface-container-low/60 px-4 py-2 text-center select-none">
      <p className="font-label text-[9px] md:text-[10px] uppercase tracking-widest text-on-surface-variant/70">
        DEMO — not a real financial tool <span className="italic normal-case tracking-normal">(yet)</span>
        <span className="mx-2 opacity-40">·</span>
        A <span className="text-primary/70 font-black">PixelOre</span> product
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Mount it + reserve mobile bottom room**

The mobile nav is a `fixed bottom-0 … md:hidden` footer; a flow strip would sit under it. Render
`DemoFooter` just before that mobile `<footer>` and give the strip a mobile bottom margin so it
clears the floating nav.

```bash
cd APP && python3 - <<'PY'
p='src/App.tsx'; s=open(p).read()
# import
s=s.replace("import SettingsModal from './components/SettingsModal';",
            "import SettingsModal from './components/SettingsModal';\nimport DemoFooter from './components/DemoFooter';")
# mount before the mobile nav footer
anchor='      <footer className="fixed bottom-0 left-0 w-full z-50 p-4 md:p-6 md:hidden">'
assert anchor in s, "mobile nav footer anchor not found"
s=s.replace(anchor, '      <div className="mb-24 md:mb-0"><DemoFooter /></div>\n'+anchor, 1)
open(p,'w').write(s); print('footer mounted')
PY
```

- [ ] **Step 3: Typecheck + build + browser verify**

Run: `npx tsc -b && npm run build`
Expected: clean.

Browser: on each tab (ledger/trials/archive/quests) the footer text is present:
```js
JSON.stringify({ demo: /DEMO — not a real financial tool/i.test(document.body.innerText), pixelore: /PixelOre/.test(document.body.innerText) })
```
`preview_resize` mobile (375×812): the strip is visible and NOT hidden behind the floating nav,
and there is no new horizontal overflow. Desktop: strip sits at the bottom of the page, muted.

- [ ] **Step 4: Commit**

```bash
cd APP && git add src/components/DemoFooter.tsx src/App.tsx
git commit -m "feat(ui): demo + PixelOre footer strip on every page"
```

---

## Final gate (Batch A)

- [ ] `npx tsc -b` clean.
- [ ] `npm test` green (baseline 203 + currency tests ≈ 210).
- [ ] `npm run build` clean.
- [ ] Browser smoke: fresh scratch still gates (Phase 7 intact); gear→Settings→reset works;
  currency switch relabels finance side (Gold untouched); outskirts fight → back to town;
  footer on all pages, mobile nav clears it.
- [ ] Update `PLANS/DemoPolishPlan.md` — add a "Phase 7.5 — DONE" note (items 1,2,5,6) + point
  to this plan + the spec. Update project memory `ledgerquest-demo-polish-plan`.
- [ ] Report to the user, then move to Batch B (boss flow) plan.

## Self-review notes
- **Spec coverage:** item 1 → Task 5; item 2 → Tasks 1–3; item 5 → Task 4; item 6 → Task 6. All
  four Batch-A items covered.
- **Type consistency:** `formatMoney(amount, code?, opts?)` used identically in App + ExpenseList;
  `battleOrigin` values `'town'|'map'|'invasion'` match schema; `SCRATCH_STATS.currency:'USD'`
  matches the extended scratch test.
- **Anchor risk:** several python edits assert on verbatim current source; if an assert fires
  (source drifted), grep the current text and adjust the `old` string — do NOT weaken the assert.
```
