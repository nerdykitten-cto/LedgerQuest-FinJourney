# Design — Demo polish batch (Settings, currency, boss flow, tutorial, footer)

Date: 2026-07-11
Status: APPROVED (forks locked with user 2026-07-11)
Supersedes/extends: `PLANS/DemoPolishPlan.md` (adds Phase 7.5; advances the Phase 9
battle-encounter-rework bullet; expands Phase 8 tutorial).

## Context

Six user-requested fixes after Phase 7 (first-run onboarding). They fold into the
existing phased plan (not a parallel track) and ship in three commit-and-show batches:

- **Batch A / Phase 7.5** — items 1, 2, 5, 6 (Settings+gear, currency, outskirts→town, footer).
- **Batch B** — item 4 (chronicle boss invasion flow); this is the Phase 9 "battle-encounter
  rework" bullet pulled forward.
- **Batch C / Phase 8** — item 3 (contextual tutorial guide, AP-emphasis).

Order: A → B → C. Boss flow (B) lands before the tutorial (C) so the tutorial guides the
final combat/town flow.

### Locked forks (user, 2026-07-11)
- Currency = **symbol relabel only** (no FX conversion). Same numbers, new symbol.
- Chronicle trigger = **all non-kill objectives done → boss invades**; the kill objective is
  satisfied by actually beating the invading boss.
- Tutorial = **contextual guide overlay** (non-blocking, skippable), with **special emphasis
  on AP**: what it is, where it is earned (log expense / tasks / rituals), what it is spent on
  (travel), so the player understands how the finance side powers the game side.
- Delivery = **batched with checkpoints**, recorded in `DemoPolishPlan.md`.
- Studio name = **PixelOre** (exact).

### Working notes (every session for this repo)
- `cbm-code-discovery-gate` hook BLOCKS Read on source → read via grep/sed, edit source via
  Bash python exact-string replace; Write/Edit fine for files you create + non-source.
- Dev server `preview_start "ledgerquest-dev"`; `preview_screenshot` times out on the CRT
  animation → verify via `preview_eval` DOM assertions; `localStorage.clear()`+reload first.
- TDD pure engine/helper logic. Keep `npm test` + `npx tsc -b` + `npm run build` green
  (currently **203 tests**). Commit locally per batch, NO push, stop and show the user.

### Current architecture facts (surveyed 2026-07-11)
- `campaign.worldState`: `'peace'` (world map) / `'town'` (`TownScene`) / `'battle'`
  (`CombatScene`). `campaign.activeEnemy` holds the current `Enemy`.
- Battle victory/defeat (`App.handleBattleVictory`/`handleBattleDefeat`) currently ALWAYS
  `updateCampaign({ worldState: 'peace' })` → returns to the world map.
- Only battle trigger today: `TownScene` outskirts → `onBattleAction` → director
  `battle-requested` → `spawn-enemy` (random from `pickEnemy`) → `worldState: 'battle'`.
- `checkQuestObjective('kill', target)` is force-called in `handleBattleVictory` against the
  active quest's kill target → the kill objective completes on ANY victory (boss never truly
  fought). This is what item 4 fixes.
- Chronicles = the 4 `storyManifest.json` chapters. Each chapter has ONE `mainQuest` whose
  `objectives` mix `talk`/`travel` + a final `kill` (the boss). Kill targets: Debt Gnomes
  (ch0), Gorgos (ch1), Inflation Djinn (ch2), Compound Golem (ch3).
- Finance money renders `$…` hardcoded in `App.tsx` (ledger cards, budget streams, savings,
  deposit toast) and `ExpenseList.tsx` (`amount.toFixed(2)$`). Game **Gold** is separate and
  stays as Gold.
- Header top-right cluster = `TopAppBar.tsx` (AP badge + feedback `<a>`).
- Danger Zone "New Game" reset currently lives in Archive → Vaults (`archiveTab === 'savings'`).
- Mobile bottom nav = a `fixed bottom-0 … md:hidden` footer in `App.tsx`.
- `PlayerStats` = `{ level, exp, ap, gold, monthlyBudget? }`. `PlayerProfile` (Phase 7) =
  `{ onboardingComplete }` at localStorage key `player/profile`.

---

## Item 1 — Settings modal + gear icon

**Goal:** a gear button in the header top-right opens a Settings modal; move the Danger Zone
"New Game" reset there, out of Archive → Vaults.

- `TopAppBar.tsx`: add a gear icon button in the right cluster (beside AP badge + feedback),
  matching sizing (`w-9 h-9 md:w-10 md:h-10`, round, same hover treatment). New prop
  `onOpenSettings: () => void`.
- New `components/SettingsModal.tsx`: full-screen overlay (App modal pattern — `fixed inset-0
  z-[130]`, centered card `max-w-md`, `max-h-[92vh]` inner-scroll). Props: `onClose`,
  `onResetGame`. Content: a "Danger Zone" section with the **New Game — Start From Scratch**
  button (same `handleResetGame` confirm flow as today). Header "Settings".
- `App.tsx`: `isSettingsOpen` state; render `<SettingsModal>` when open; wire gear → open.
  **Remove** the Danger Zone block from the Archive savings section (keep Forge Vault etc).
- Responsive: gear visible at all widths in the header cluster; modal fits phone→desktop with
  no page scroll. Verify the header right cluster does not overflow on iPhone-SE width
  (the AP badge + feedback + gear must fit; drop gaps at small widths if needed).

**Testing:** UI-only → browser `preview_eval` (gear present, opens modal, reset button inside
modal, Danger Zone gone from Archive). No unit test.

---

## Item 2 — Currency (symbol relabel)

**Goal:** a currency dropdown in the budget; the chosen currency relabels the whole finance
side. Numbers unchanged. Game Gold untouched.

- New `data/currencies.ts`: `CURRENCIES` = ordered list of `{ code, symbol, label }` for at
  least USD `$`, EUR `€`, GBP `£`, INR `₹`, JPY `¥`, CAD `$`, AUD `$` (code disambiguates the
  three `$`). Plus a `symbolOf(code)` lookup (default `$`).
- New pure `formatMoney(amount, code, opts?)`: returns `symbol + amount.toLocaleString()`
  (respect the existing `toLocaleString()` / `toFixed(2)` call sites — provide a `fractionDigits`
  option so `ExpenseList` can keep 2 decimals). Symbol prefix (all supported currencies here
  are prefix-symbol; keep it simple — no locale-specific suffix placement). **TDD** this helper.
- Schema: add `currency?: string` to `PlayerStats` (default `'USD'`). Scratch seed
  (`SCRATCH_STATS`) sets `currency: 'USD'`. Legacy saves without it → treated as USD by
  `symbolOf`/`formatMoney` fallback.
- Budget editor (`App.tsx` "Calibrate Budget" modal): add a `<select>` bound to
  `stats.currency`; on submit persist `{ monthlyBudget, currency }` via `updateStats`.
- Swap finance render sites to `formatMoney(value, stats.currency)`:
  `App.tsx` ledger cards (`totalIncome`, `totalExpenses`, `remainingBudget`), budget-stream
  labels (`allocatedAmount`, `catTotal`), savings (`currentAmount`, `targetAmount`), deposit
  toast (`+$${amount}`), and `ExpenseList.tsx` (`-{amount}$` → `-{formatMoney(amount, currency, {fractionDigits:2})}`).
  `ExpenseList` needs the currency passed in as a prop (App holds `stats.currency`).
- **Do NOT** touch Gold displays (shop costs, victory toasts, recruit fees) — those are the
  in-game currency, not the player's real-world finance currency.

**Testing:** `formatMoney`/`symbolOf` unit tests (symbols, default fallback, fraction digits,
locale grouping). Browser: switch currency in budget → ledger cards + expense list + savings
all re-symbol; Gold unaffected.

---

## Item 5 — Outskirts battle returns to town

**Goal:** after an outskirts fight (win OR lose), the player lands back in the **town**, not
the world map.

- Add `campaign.battleOrigin?: 'town' | 'map' | 'invasion'` (default undefined → treated as
  `'map'` for backward-compat). Set it when a battle starts:
  - `handleBattleAction` (outskirts) → `updateCampaign({ worldState: 'battle', activeEnemy, battleOrigin: 'town' })`.
  - Invasion boss (item 4) → `battleOrigin: 'invasion'`.
- `handleBattleVictory` / `handleBattleDefeat`: replace the hardcoded
  `updateCampaign({ worldState: 'peace' })` with a return target derived from `battleOrigin`:
  `'town'` or `'invasion'` → `worldState: 'town'` (stay at `currentLocation`); else `'peace'`.
  Clear `battleOrigin` on return.
- Note: on **defeat** of a normal outskirts fight the player still returns to town (with the
  existing revive-a-survivor recovery). Invasion-boss defeat handling is item 4.

**Testing:** browser — start outskirts fight, win → back in TownScene (worldState `'town'`);
lose → back in TownScene. Unit: none required (thin routing), but assert via the item-4 pure
helper if one is extracted (see below).

---

## Item 4 — Chronicle boss invasion flow

**Goal:** finishing a chronicle's non-boss objectives makes the boss invade the town; a TV
dialog offers Fight or Escape; Escape locks the town (kick to World Map, re-entering re-shows
the dialog, can't zoom in) until the boss is beaten; beating it clears the lock, returns to a
normal town, ends the chronicle, and grants the reward.

### State (campaign)
- `invasion?: { town: string; questId: string; bossName: string }` — the pending/active
  invasion. Set when the trigger fires; cleared on boss defeat.
- `townLocked?: boolean` — true after Escape; while true + `invasion` set, the invaded town is
  inaccessible (dialog instead of interior).
- `battleOrigin: 'invasion'` (item 5) marks the boss battle so victory routes correctly.

### Pure engine module — `engine/chronicle.ts` (TDD)
Isolates the decisions so they are testable without React/localStorage:
- `bossObjective(quest)` → the final `kill` objective (or null).
- `nonBossObjectivesComplete(quest)` → true when every non-`kill` objective is done and the
  `kill` objective is NOT yet done (the invasion trigger predicate).
- `resolveBoss(bossName, progress)` → an `Enemy` for the invasion: look up the bestiary by
  name (via `enemyAI`), else synthesize a boss-tier `Enemy` from `bossName`, then `scaleEnemy`
  by progress. Bosses get a modest HP/attack bump over a normal encounter so they read as a
  boss (documented multiplier). Returns a valid `Enemy` (schema-complete).
- `isTownLocked(campaign, town)` → true when `invasion.town === town && townLocked`.
Tests: trigger predicate (talk done + kill pending = true; all done = false; kill done = false),
boss resolution (known + synthesized names, scaling), lock predicate.

### Flow wiring (`App.tsx`)
1. **Trigger:** in `checkQuestObjective` (after marking an objective done) — if the active
   main quest now satisfies `nonBossObjectivesComplete`, set
   `campaign.invasion = { town: currentLocation, questId, bossName }` and surface the invasion
   dialog. Do NOT auto-complete the kill objective anymore for main/boss quests — remove/guard
   the blanket `checkQuestObjective('kill', …)` in `handleBattleVictory` so the kill only ticks
   when the **invasion boss** is actually beaten (`battleOrigin === 'invasion'`). Non-boss
   side-quest kills (director-forged "Menace" quests) keep the existing behavior.
2. **Invasion dialog (TV):** new `components/AdventureWorld/InvasionDialog.tsx` (or a mode in
   the existing dialogue overlay) shown on the GameView when `campaign.invasion` is set AND the
   player is on/at that town (`worldState` `'town'`, or `'peace'` sitting on that node). Copy:
   *"A {bossName} has invaded {town} and is wreaking havoc!"* Buttons:
   - **"We have to fight him!"** → `updateCampaign({ worldState: 'battle', activeEnemy: resolveBoss(...), battleOrigin: 'invasion', townLocked: false })`.
   - **"We have to escape!"** → `updateCampaign({ worldState: 'peace', townLocked: true })`
     (kick to World Map; keep `invasion` set).
3. **Town lockout:** `handleEnterTown(name)` — if `isTownLocked(campaign, name)`, do NOT enter;
   instead re-show the invasion dialog (set `worldState` so the dialog renders / keep on map and
   pop the dialog). The player cannot zoom into the interior until the boss is defeated.
4. **Boss defeat:** in `handleBattleVictory`, when `battleOrigin === 'invasion'`:
   - tick the boss kill objective (`checkQuestObjective('kill', bossObjective(quest).target)`),
   - clear `invasion` + `townLocked`,
   - return to the now-normal town (`worldState: 'town'`), grant reward. The quest goes to
     `'ready'` (existing) then claim, OR auto-claim on boss defeat — **decision:** keep the
     existing claim flow (quest → `ready`, player claims in the Strategic Map) so the reward
     path stays uniform; surface a toast "The {town} is free! Claim your reward."
   - **Boss defeat (loss):** the party is revived per existing `applyDefeatRecovery`; the
     invasion stays active (town still locked) so the player can regroup and retry.

### Notes / edges
- Only ONE invasion at a time (the active chronicle's town). If the player is mid-invasion and
  travels, the lock follows the invaded town (other towns remain enterable).
- The seeded ch0 quest ("The Ledger of the Lost Town", boss "Debt Gnomes") is the first place
  this shows; the tutorial (item 3) walks the player up to (but not necessarily through) it.

**Testing:** engine unit tests (above). Browser: complete the talk objective → invasion dialog
on TV → Escape → World Map + town locked (re-enter → dialog again, no interior) → Fight → boss
battle → win → town unlocked + normal + quest ready + reward claimable.

---

## Item 3 — Tutorial contextual guide (Phase 8)

**Goal:** a non-blocking, skippable guided walkthrough of the full finance↔game loop that
lands a scratch player on step 1 and teaches how the two sides connect — with **special
emphasis on AP** (what it is, where earned, what it is spent on).

### Step model — extend `engine/onboarding.ts` (or new `engine/tutorial.ts`, TDD)
Reuse the Phase-7 `OnboardingStep` vocabulary; extend the ordered steps past `complete`:
`set-budget → log-expense → (AP explainer) → open-map → travel → enter-town → talk-npc →
outskirts-fight → claim-reward → done`. Persist the current tutorial step on the profile
(`PlayerProfile.tutorialStep?` or reuse `onboardingComplete` + a `tutorialStep`); the gate
(Phase 7) covers the first two steps, the tutorial continues from there.
- Pure helpers: `nextTutorialStep(state)`, `tutorialStepFor(context)` derived from
  stats/campaign/quests (e.g. once `worldState === 'town'` the step advances to `talk-npc`),
  and a `tutorialActive(profile)` predicate. TDD the transitions.

### UI — `components/TutorialGuide.tsx`
- A small, persistent, dismissible hint bubble/card (non-blocking overlay, does not block
  clicks) that shows the current step's instruction + a "next action" pointer toward the
  relevant UI (Map tab, Ledger, town NPC, etc.). Skippable ("Skip guide") → sets tutorial done.
- **AP emphasis:** a dedicated step / persistent callout explaining AP — "Action Points power
  the adventure: earn them by logging expenses and completing tasks & rituals; spend them to
  travel the map and hunt." Point at the AP badge in the header.
- Advances automatically as the player performs each action (derived from state), so it tracks
  the real loop rather than requiring manual "next".

### Wiring (`App.tsx`)
- Render `<TutorialGuide>` when `tutorialActive(profile)`; feed it stats/campaign/quests →
  current step; persist advancement via `updateProfile`.
- Hooks into the Phase-7 onboarding gate (scratch player lands on step 1 automatically).

**Testing:** tutorial step-transition unit tests. Browser (fresh scratch): guide appears,
walks set-budget → log-expense (AP explainer shows, AP badge highlighted) → open map → travel →
town → talk → outskirts fight → claim → guide completes; Skip ends it.

---

## Item 6 — Demo / studio footer

**Goal:** a gray strip on ALL pages stating this is a demo (not a real financial tool yet) and
a PixelOre product.

- New `components/DemoFooter.tsx` (or inline in `App.tsx` root): a thin, muted-gray bar with
  two lines/segments:
  - *"DEMO — not a real financial tool (yet)."*
  - *"A PixelOre product."*
- Placement: a low-key strip that shows on every tab. Must NOT collide with the existing
  `fixed bottom-0 … md:hidden` mobile nav footer or the CRT panel:
  - Desktop (md+): a slim static strip at the very bottom of the page (or a fixed bottom bar
    with low z-index and small height).
  - Mobile: the strip sits so the mobile nav footer still clears it (add bottom padding to the
    page, or place the strip above the nav). Verify no overlap on iPhone-SE and no horizontal
    overflow.
- Styling: gray/muted (`text-on-surface-variant`, small `text-[10px]`/`text-xs`, subtle top
  border), non-interactive, low emphasis.

**Testing:** browser — footer text present on ledger/trials/archive/quests tabs; does not
overlap the mobile nav or cause page-scroll regressions; readable in the app theme.

---

## Files touched (summary)

- **Item 1:** `TopAppBar.tsx`, NEW `components/SettingsModal.tsx`, `App.tsx` (state + remove
  Archive Danger Zone).
- **Item 2:** NEW `data/currencies.ts` (+ `formatMoney` + `.test.ts`), `types/schemas.ts`
  (`PlayerStats.currency`), `engine/onboarding.ts` (`SCRATCH_STATS.currency`), `App.tsx`
  (budget dropdown + render swaps), `components/ExpenseList.tsx` (currency prop).
- **Item 5:** `types/schemas.ts` (`CampaignState.battleOrigin`), `App.tsx`
  (`handleBattleAction`/`handleBattleVictory`/`handleBattleDefeat`).
- **Item 4:** NEW `engine/chronicle.ts` (+ `.test.ts`), `types/schemas.ts`
  (`CampaignState.invasion`/`townLocked`), NEW `components/AdventureWorld/InvasionDialog.tsx`,
  `App.tsx` (trigger, dialog wiring, lockout, boss-defeat), possibly
  `AdventureWorld/AdventureWorld.tsx` (render dialog).
- **Item 3:** `engine/onboarding.ts` or NEW `engine/tutorial.ts` (+ `.test.ts`),
  `types/schemas.ts` (`PlayerProfile.tutorialStep`), NEW `components/TutorialGuide.tsx`,
  `App.tsx` (render + advancement).
- **Item 6:** NEW `components/DemoFooter.tsx`, `App.tsx` (mount + spacing).

## Out of scope (YAGNI / deferred)
- FX conversion of currency (symbol-only per fork).
- New authored chronicle side-missions (reuse existing manifest objectives).
- Hard-gated/blocking tutorial (contextual/skippable per fork).
- Phase 9 map-zoom / typed pointers / interior hotspots (only the battle-encounter/boss slice
  is pulled forward here).
- MP/abilities/turn-order and the fuller RPG stat overhaul (parked in
  `PLANS/ForFutureFinishedProd.md`).
```
