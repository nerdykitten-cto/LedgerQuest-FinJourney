# LedgerQuest — Demo Polish Plan (Phase 5 series)

STATUS: **Phase 2 DONE** (2026-07-07) — CRT panel enlarged + centered, cheat-sheet/tape clip fixed, map/town/combat fit with no scrollbar. Next: Phase 3 (Assets scaffold).
CONTEXT: Technical overhaul (OverhaulPlan.md phases 0–4) is done + deployed. This
plan is the design/feature polish pass for the public **demo** site (static,
localStorage-only, hosted on Firebase Hosting `ledgerquest-demo.web.app`; Cloud
Run being retired). Source of scope: user session 2026-07-06 (8 requested items).

How to use this doc: each phase is sized for one fresh session. Read this file +
`PLANS/OverhaulPlan.md` + project memory first, do the phase, run the checkpoint,
commit locally, then STOP and show the user. Every phase ends with a **HANDOFF
PROMPT** — the user pastes it into a new session to start the next phase cleanly.

## Locked decisions (from user, 2026-07-06)
- **TV sizing (items 2 & 5):** keep the CRT-TV chrome; **enlarge the whole panel**
  (bigger game cell, more of the page) and re-tune each scene to fit with **no
  scrollbar**. Also fix the two separate bugs visible in the screenshots: TV sits
  left-of-center (asymmetric 8% speaker vs 18% control panel) and the controls
  cheat-sheet is clipped at the viewport bottom.
- **Starting party (item 3):** seed **3 members** — 1 tank/front, 1 melee/front,
  1 support — shown in their formation rows.
- **Reset (item 7):** **hard reset to true scratch + force tutorial before play
  unlocks.** No sign-in: first visit (empty localStorage) auto-creates a local
  profile and enters onboarding. IP detection N/A on a static host — key off
  localStorage. Fresh state = 0 AP / 0 gold / 0 xp / no feats / no rituals / blank
  budget; player must set a budget limit first, then log spend → earn AP → play.
- **Tutorial (item 8):** convert the first quest **"The Ledger of the Lost Town"**
  + Starting Village into a **guided tutorial** (steps: set budget → log expense →
  talk to Chronicler Daniel → win first battle → claim reward).
- **Assets (item 3/4):** real art is coming later. For now: **emoji** placeholders
  for characters (skin-tone modifiers to differentiate) and **creepy/oni-mask
  emoji** for enemies; **inline SVG** placeholders for equipment + consumables.
  A repo-root `/Assets/` folder is the staging drop-zone for the real art the user
  will supply; web-ready files get integrated under `APP/public/assets/...`.

## Working notes (every session)
- `cbm-code-discovery-gate` hook BLOCKS Read on source files. Read code via
  codebase-memory MCP or `grep`/`sed`; edit source with Bash python exact-string
  replace (assert the replacement happened). Write/Edit work on files you create
  this session + non-source files (`*.md`, configs).
- Dev server: `preview_start "ledgerquest-dev"` (port 5173). `preview_screenshot`
  can time out on a healthy page — verify via `preview_eval` DOM assertions /
  `preview_snapshot`. `localStorage.clear()` + reload before checks.
- Tests: `cd APP && npm test` (vitest) and `npm run test:e2e` (Playwright, needs
  dev server). `npx tsc -b` and `npm run build` must pass before any commit. TDD
  for new/changed engine logic (engine modules show the pattern).
- Commits: conventional, **local only**. DO NOT push without asking. Cloud Run is
  being retired (see Phase 6-ops note); Firebase deploy is manual via Cloud Shell.

---

## Phase 1 — Feedback form link  ·  (item 1)  ·  ✅ DONE (2026-07-07)
- [x] Top-right speech-bubble button (`TopAppBar.tsx:56`) → `<a>` to
  `https://forms.gle/1DH1yBBggYtuH12D9`, `target="_blank" rel="noopener noreferrer"`,
  icon `Icon_ImageIcon_Chat.png` unchanged.
- [x] `aria-label`/`title` "Send feedback"; no layout shift. tsc/127 tests/build green.
- Files: `APP/src/components/TopAppBar.tsx` (confirm name via grep).
- Checkpoint: button opens the form in a new tab; `tsc`/tests/build green.
- Draft form questions already delivered to user (name+email required, rest
  optional; impressions + feature-wishlist; LinkedIn-friendly).

**HANDOFF PROMPT (Phase 1):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (+ OverhaulPlan
> + project memory) and do **Phase 1 — Feedback form link**. The Google Form URL
> is: `<PASTE URL HERE>`. Wire the top-right speech-bubble button to open it in a
> new tab (keep the icon). Follow the working notes (Read gated → grep/python
> edits). Keep `npm test` + `tsc -b` + build green, commit locally (no push), then
> stop and show me.

---

## Phase 2 — TV / scene sizing overhaul  ·  (items 2 & 5)  ·  ✅ DONE (2026-07-07)
Goal: enlarge the CRT panel, center it, stop clipping the cheat-sheet, and make
**map / town / combat all fit with no scrollbar** at the new size. Keep CRT chrome.
- [x] Enlarged the game cell: `App.tsx` game col `lg:col-span-8`→`9`, quest list
  `4`→`3`; quests view height `calc(100vh-11rem)`→`10rem`; `GameView` panel
  `max-w-[1100px]`→`[1400px]`.
- [x] Center fix: balanced the two rails — left speaker `8%`→`12%`, right controls
  `18%`→`12%`, both now `hidden lg:flex` (appear/disappear together) → screen
  centered in bezel. Verified `centerOffset 0` at 1280/1536/1920/2560.
- [x] Cheat-sheet/tape clip: reserved bottom room on the `GameView` root
  (`p-2`→`px-2 pt-2 pb-9 2xl:pb-12`), pulled tape overhang `-bottom-6`→`-bottom-5`.
  No clip at any width.
- [x] Combat fit: `md:p-4` already overrode `pt-20` at desktop; trimmed heading
  margins (`mb-2 mt-1`→`mb-1`) + enemy block (`mb-3`→`mb-1`) so combat clears the
  smallest target (1280×800 inner box ~460px) with no inner scroll. `overflow-y-auto`
  kept as a safety net — full reflow (drop it, 3-card polish) is Phase 6.
- Verified (browser, preview_eval DOM assertions): 1280/1536/1920/2560 + mobile —
  centered, rails symmetric, tape+cheat-sheet unclipped, map/town/combat no inner
  scroll, no desktop page scroll (mobile stacked layout scrolls as before). Console
  clean. tsc 0 / 127 tests / build green.
- Files: `APP/src/App.tsx` (quests tab cell), `APP/src/components/GameView.tsx`,
  the three `AdventureWorld/*Scene.tsx`.
- Checkpoint (browser, 1280 / 1536 / 1920 / 2560 wide + mobile): TV centered in
  bezel; cheat-sheet + tape fully visible; map/town/combat each fit with no
  scrollbar; no regression at small widths (Phase 1 min-w-0/min-h-0 intact).
  `tsc`/tests/build green, console clean.

**HANDOFF PROMPT (Phase 2):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (+ OverhaulPlan
> + project memory) and do **Phase 2 — TV/scene sizing overhaul** (items 2 & 5).
> Decision: keep CRT chrome, enlarge the whole panel, center the picture (fix the
> 8%/18% asymmetry), stop clipping the bottom cheat-sheet/tape, and make map, town
> AND combat all fit with NO scrollbar at the bigger size. Verify in the browser at
> 1280/1536/1920/2560 + mobile via preview_eval DOM assertions. Working notes:
> Read gated → grep/python edits. Keep tests/tsc/build green, commit locally (no
> push), then stop and show me.

---

## Phase 3 — Assets scaffold + placeholders  ·  (item 3 groundwork)
Goal: the asset pipeline + placeholders that Phases 4/5/6 render.
- [ ] Create repo-root `/Assets/` staging folder with a `README.md` documenting
  expected subfolders + naming: `characters/`, `enemies/`, `equipment/`,
  `consumables/` (PNG/SVG, sizing guidance). This is where the user drops real art.
- [ ] Character placeholders: emoji with **skin-tone modifiers** so the 3 starting
  members read as distinct people; map each party member → an emoji in the seed.
- [ ] Enemy placeholders: **oni-mask / creepy** emoji (👹👺💀🎭🧟) per bestiary entry.
- [ ] Equipment + consumable placeholders: small **inline SVG** icons (weapon,
  armor, shield, potion, etc.), themed to the app palette (`#f4d03f`/`#4c4634`).
- [ ] Wire placeholders through schemas/rendering so avatars/enemy/item icons stop
  referencing broken PNGs (e.g. the old `hero.png`). Keep a single swap-point so
  real assets later replace placeholders with minimal edits.
- Files: `APP/src/types/schemas.ts`, `APP/src/engine/world.ts` + `enemyAI.ts`
  (enemy art), seed/party defaults in `persistenceService.ts`, a new
  `APP/src/assets/placeholderIcons.tsx` (or similar) for the SVGs.
- Checkpoint: fresh save shows 3 distinct emoji party members + emoji enemies in
  combat + SVG item icons; no broken-image glyphs anywhere; tests/tsc/build green.

**HANDOFF PROMPT (Phase 3):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (+ OverhaulPlan
> + project memory) and do **Phase 3 — Assets scaffold + placeholders**. Create a
> repo-root `/Assets/` drop-folder (README with characters/enemies/equipment/
> consumables structure). Add placeholder art: emoji + skin-tone modifiers for the
> 3 starting party members, oni-mask/creepy emoji for enemies, inline SVG icons for
> equipment + consumables (app palette). Route them through schemas/rendering so no
> broken PNGs remain, with one clean swap-point for future real assets. Working
> notes: Read gated → grep/python edits; TDD any schema/seed logic. Keep tests/tsc/
> build green, commit locally (no push), then stop and show me.

---

## Phase 4 — War Room party management  ·  (item 3)
Goal: fix the blank/broken War Room into a working, scaled party manager for the
demo. (Root cause to confirm: fresh save seeds too few members and avatars point
at broken art — Phase 3 fixes art; this phase fixes composition + management UI.)
- [ ] Seed the **3-member** starting party (tank/front, melee/front, support) with
  classes + stats + placeholder emoji; render each in its correct formation row
  (Front line / Support & Ranged).
- [ ] **Heal from inventory:** use a consumable (potion) on a selected member →
  restores HP, decrements item qty (through the persistence/engine API, TDD).
- [ ] **Weapon/equipment swap:** equip a weapon/armor from inventory onto a member
  → stat effect applies + reflected in combat; unequip returns item to inventory.
- [ ] Neat, **scaled** layout (matches the enlarged panel from Phase 2; no overflow).
- Files: `APP/src/components/WarRoom*.tsx` (confirm via grep), `engine/recruitment.ts`
  (existing recruit/dismiss), inventory/equip logic in `persistenceService.ts` +
  a new `engine/equipment.ts` if needed, `schemas.ts` (equipped slots).
- Checkpoint (browser): 3 members show in correct rows with distinct avatars; heal
  a member with a potion (HP up, qty down); swap a weapon (stat changes, persists);
  recruit/dismiss still work; UI fits with no scroll. tests/tsc/build green.

**HANDOFF PROMPT (Phase 4):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (+ OverhaulPlan
> + project memory) and do **Phase 4 — War Room party management** (item 3).
> Requires Phase 3 assets. Seed 3 starting members (tank/front, melee/front,
> support) in their formation rows; implement heal-from-inventory (potion → HP,
> qty−1), weapon/armor swap (stat effect + persists), keep recruit/dismiss working,
> scale the UI to the enlarged panel with no scroll. Working notes: Read gated →
> grep/python edits; TDD the heal/equip engine logic. Keep tests/tsc/build green,
> commit locally (no push), then stop and show me.

---

## Phase 5 — Inventory management  ·  (item 4)
Goal: inventory uses equipment-asset icons (placeholder SVGs now, real art later)
and the category filters actually work.
- [ ] Replace emoji/ad-hoc icons in the Grand Vault inventory with the Phase 3
  equipment/consumable SVG icons (asset-driven, single swap-point).
- [ ] **Working filters:** All / Consumables / Equipment tabs filter the grid
  correctly (fix the current non-working/incorrect filtering).
- [ ] Use / Equip / Discard actions consistent with Phase 4 (equip routes to a
  party member; use = consume; discard removes).
- Files: `APP/src/components/*Vault*/*Inventory*.tsx` (confirm via grep),
  `schemas.ts` item `category`/`type`.
- Checkpoint (browser): each filter tab shows only its category; equipment shows
  asset icons; use/equip/discard behave; tests/tsc/build green.

**HANDOFF PROMPT (Phase 5):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (+ OverhaulPlan
> + project memory) and do **Phase 5 — Inventory management** (item 4). Requires
> Phase 3 assets + Phase 4 equip logic. Swap inventory emoji/icons for the Phase 3
> equipment/consumable SVGs; make the All/Consumables/Equipment filter tabs filter
> correctly; keep use/equip/discard consistent with the War Room. Working notes:
> Read gated → grep/python edits. Keep tests/tsc/build green, commit locally (no
> push), then stop and show me.

---

## Phase 6 — Battle UI polish  ·  (item 5 detail)
Goal: with the enlarged panel (Phase 2), lay combat out fully and neatly with **no
scrollbar** — AP badge, turn indicator, enemy, 3 party cards, STRIKE buttons,
inventory row, and the battle log all visible at once.
- [ ] Re-flow `CombatScene` for the larger screen; remove the `overflow-y-auto`
  reliance (content should fit, not scroll). Keep the sticky battle log readable.
- [ ] Verify at the demo's common widths; 3-member party is the layout target.
- Files: `APP/src/components/AdventureWorld/CombatScene.tsx`.
- Checkpoint (browser, fresh battle): full combat visible with no scroll at
  1280/1536/1920; buttons reachable; log readable; tests/tsc/build green.

**HANDOFF PROMPT (Phase 6):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (+ OverhaulPlan
> + project memory) and do **Phase 6 — Battle UI polish** (item 5). Requires Phases
> 2–4. Re-flow CombatScene so AP, turn indicator, enemy, 3 party cards, STRIKE
> buttons, inventory row and battle log all fit the enlarged panel with NO
> scrollbar (drop the overflow-y-auto crutch). Verify a live battle at 1280/1536/
> 1920 via preview_eval. Working notes: Read gated → grep/python edits. Keep tests/
> tsc/build green, commit locally (no push), then stop and show me.

---

## Phase 7 — First-run onboarding + hard reset  ·  (item 7)
Goal: no sign-in; first visit auto-creates a fresh local profile and enters the
budget-first onboarding; a hard "New Game" reset reproduces that scratch state and
re-forces the tutorial.
- [ ] First-run detection: empty/absent core localStorage → seed a scratch profile
  (0 AP / 0 gold / 0 xp / no feats / no rituals / blank budget) and route into the
  onboarding gate. (IP detection N/A on static host — documented; localStorage is
  the signal.)
- [ ] Budget-first gate: play (map/AP spend) stays locked until the user sets a
  budget limit; guide them to set it, then log a spend → earn first AP.
- [ ] Hard reset button ("New Game" / "Start From Scratch") with a clear warning
  dialog ("all progress will be erased, you'll start over") → on confirm, wipe ALL
  state incl. `engine_*` keys, reseed scratch, force tutorial. Per decision this
  supersedes the old "Reset Adventure" behavior (which reseeded a mid-game world).
- Files: `App.tsx` (first-run bootstrap + gate), `persistenceService.ts`
  (`resetGameDB` → scratch variant; `ENGINE_STATE_KEYS`), the Vaults "Reset
  Adventure" control, new onboarding component.
- Checkpoint (browser): `localStorage.clear()` + reload → scratch profile, budget
  gate shown, play locked; set budget + log expense → AP appears, gate opens; hard
  reset warns then returns to scratch + tutorial. TDD reset/seed. tests/tsc/build
  green.

**HANDOFF PROMPT (Phase 7):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (+ OverhaulPlan
> + project memory) and do **Phase 7 — First-run onboarding + hard reset** (item
> 7). No sign-in: first visit (empty localStorage) auto-seeds a SCRATCH profile (0
> AP/gold/xp, no feats/rituals, blank budget) and enters a budget-first gate that
> keeps play locked until a budget is set + first expense logged (earns first AP).
> Add a hard "New Game" reset with a warning dialog that wipes ALL state (incl.
> engine_* keys) back to scratch and re-forces the tutorial, superseding the old
> "Reset Adventure". IP detection is N/A (static host) — use localStorage. Working
> notes: Read gated → grep/python edits; TDD the reset/seed logic. Keep tests/tsc/
> build green, commit locally (no push), then stop and show me.

---

## Phase 8 — Tutorial guided first quest  ·  (item 8)
Goal: turn "The Ledger of the Lost Town" + Starting Village into a guided tutorial
that a first-run / freshly-reset player is walked through.
- [ ] Step gating: (1) set budget → (2) log first expense (earn AP) → (3) open
  Strategic Map + talk to Chronicler Daniel → (4) travel to outskirts + win first
  battle → (5) claim reward. Each step surfaces a clear prompt/next-action.
- [ ] Hook into Phase 7 onboarding so the scratch player lands on step 1.
- [ ] Keep it skippable-after-first-battle or fully guided — confirm with user
  during the phase (default: guided through claim, then normal play).
- Files: `engine/questForge.ts` (seed/first quest), `App.tsx` quest-objective
  tracking, onboarding component from Phase 7, `TownScene`/dialogue.
- Checkpoint (browser, fresh scratch): player is guided through all 5 steps; each
  objective ticks; on claim, normal play is unlocked. tests/tsc/build green.

**HANDOFF PROMPT (Phase 8):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (+ OverhaulPlan
> + project memory) and do **Phase 8 — Tutorial guided first quest** (item 8).
> Requires Phase 7. Convert "The Ledger of the Lost Town" + Starting Village into a
> guided tutorial: set budget → log expense (earn AP) → talk to Chronicler Daniel →
> win first battle in the outskirts → claim reward, each with a clear next-action
> prompt, landing the scratch player on step 1 from onboarding. Working notes: Read
> gated → grep/python edits; TDD quest/objective logic. Keep tests/tsc/build green,
> commit locally (no push), then stop and show me.

---

## Ops (not a code phase) — retire Cloud Run, deploy Firebase (item 6)
Done by the user in the GCP Console:
1. Cloud Build → Triggers → disable/delete the `LedgerQuest-FinJourney` trigger
   (stops auto-deploy on push).
2. Cloud Run → the service → Delete (stops the live URL + its billing).
3. (Optional) Artifact Registry → delete the image repo (storage cost).
Deploy going forward (Option 1, manual, all in-browser): Cloud Shell → clone repo
→ `firebase use --add` → `firebase hosting:sites:create ledgerquest-demo` →
`firebase target:apply hosting ledgerquest-demo ledgerquest-demo` → `cd APP && npm
run build && cd ..` → `firebase deploy --only hosting`. Config already in repo
(`firebase.json`).
