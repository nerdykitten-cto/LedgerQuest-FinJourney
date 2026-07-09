# LedgerQuest — Demo Polish Plan (Phase 5 series)

STATUS: **Phase 3 DONE** (2026-07-08, `0169f50`) — /Assets/ drop-folder + single
swap-point placeholders (emoji chars/enemies, inline-SVG items) wired through all
render sites; seed party now 3 members; no broken PNGs. Next: **Phase 4 (War Room
party management)** — needs Phase 3 assets (done) + Phase 2 sizing (done).

POST-PHASE-2 MOBILE POLISH (2026-07-08, not a numbered phase — extra hardening):
- `6e46936` de-cramp mobile across all pages (responsive padding/gaps, md: restores).
- `8e8f1b1` Grand Vault mobile: category rail = grid-cols-3 (no overflow), AP badge scaled.
- `23ec415` header md/tablet band: shifted desktop restores md:→lg:, nav tabs icon-only
  in md band, Map pill xl: only (was colliding with Quests tab).
- `ac840f2` Grand Archive iPhone-SE horizontal overflow (header stacks, pills fit).
- `f227d3e` + `2c23f37` **world map drag-to-pan on phones**: `WorldMapScene.tsx` now
  wraps the map in a pannable square layer (touch/pointer drag, 8px tap-vs-drag
  threshold so a drag never travels; tap a node to travel / tap current node to
  enter town). Phones get an oversized square layer (max(w,h)*1.2) so the whole
  square map art is reachable edge-to-edge + auto-centres on the party; md+ fills
  the window with no pan. `MOBILE_ZOOM` const tunes the phone zoom.
All committed to `main`, tree clean; tsc 0 / 127 tests / build green throughout.
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

## Phase 3 — Assets scaffold + placeholders  ·  (item 3 groundwork)  ·  ✅ DONE (2026-07-08, `0169f50`)
Goal: the asset pipeline + placeholders that Phases 4/5/6 render.
- [x] Created repo-root `/Assets/` staging folder + `README.md` (subfolders
  `characters/`/`enemies/`/`equipment/`/`consumables/`, naming keyed to in-code
  ids, sizing guidance, swap instructions). Whitelisted in `.gitignore` (`!/Assets/`).
- [x] Character placeholders: emoji + **skin-tone modifiers** in `PARTY_ART`
  (p1 🧝🏻‍♀️ / p2 🧔🏾 / p3 🧙🏿‍♀️). Seed party reduced to the **3 starting members**
  (Leader/tank, Vanguard/melee, Arcanist/support); recruit pool avatars → emoji.
- [x] Enemy placeholders: oni-mask/creepy emoji per bestiary id (`ENEMY_ART`,
  👺😈👻👹🧞🗿), 👹 fallback.
- [x] Equipment + consumable placeholders: inline SVG icons (sword/shield/armor/
  potion/quest) in the app palette (`#f4d03f`/`#4c4634`).
- [x] Wired through render: no broken PNG refs remain. **Single swap-point** =
  `APP/src/assets/placeholders.tsx` — `<Sprite>` (chars/enemies, `isAssetPath`
  emoji↔path), `<ItemIcon>` (items, `USE_REAL_ITEM_ART` flag). Real art later =
  per-asset one-line edit.
- Files touched: NEW `APP/src/assets/placeholders.tsx` (+ `.test.ts`, 13 tests),
  `persistenceService.ts` (seed), `engine/recruitment.ts` (pool), `WarRoom.tsx`,
  `AdventureWorld/CombatScene.tsx` + `TownScene.tsx`, `GrandVault.tsx`. (No schema
  change needed — enemy art resolved by id in `placeholders.tsx`; `avatar` reused.)
- Checkpoint: fresh save shows 3 distinct emoji party members + emoji enemies in
  combat + SVG item icons; no broken-image glyphs anywhere; tests/tsc/build green.
- VERIFIED (browser, preview_eval): fresh save = 3 distinct emoji members (War
  Room), 2 SVG item icons (Vault), zero non-path `<img>` on page, console clean.
  tsc 0 / **140** tests / build green. NOTE: enemy-in-combat emoji is wired +
  unit-tested (`enemyArt`) but not driven live (battle requires travel/AP); if
  Phase 6 opens combat, eyeball it there.

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

## Phase 4 — War Room party management  ·  (item 3)  ·  ✅ DONE (2026-07-09, `c5a9aa8`)
Goal: fix the blank/broken War Room into a working, scaled party manager for the
demo. (Root cause to confirm: fresh save seeds too few members and avatars point
at broken art — Phase 3 fixes art; this phase fixes composition + management UI.)
- [x] Seed the **3-member** starting party (already done Phase 3) — verified renders
  in correct rows (Althea/Leader + Kael/Vanguard front; Elora/Arcanist support).
- [x] **Heal from inventory:** select a member + potion → `hp=min(maxHp,hp+hpHeal)`,
  qty−1, remove at 0. Pure `planHeal` (TDD) + App `handleWarHeal`. Verified 30→70,
  qty 3→2; Use button disabled at full HP.
- [x] **Weapon/equipment swap:** equip/unequip weapon|armor via pure `planEquip`/
  `planUnequip` (TDD) — source of truth `InventoryItem.equippedTo` (combat already
  reads it, no combat change). Verified equippedTo=p1 + slot fills + unequip returns.
- [x] Neat, **scaled** layout — modal `max-h-[92vh]`, inner scroll only; verified
  NO page scroll (0/0) at the enlarged panel, console clean.
- Extracted the duplicated equip/heal decisions into `engine/equipment.ts` (pure,
  14 tests) and deduped `GrandVault.tsx` to reuse it. Files: NEW `engine/equipment.ts`
  + `.test.ts`, `WarRoom.tsx` (inventory prop + select + heal/equip UI), `App.tsx`
  (handlers + props), `GrandVault.tsx` (dedupe). tsc 0 / **157** tests / build green.
- Files: `APP/src/components/WarRoom*.tsx` (confirm via grep), `engine/recruitment.ts`
  (existing recruit/dismiss), inventory/equip logic in `persistenceService.ts` +
  a new `engine/equipment.ts` if needed, `schemas.ts` (equipped slots).
- Checkpoint (browser): 3 members show in correct rows with distinct avatars; heal
  a member with a potion (HP up, qty down); swap a weapon (stat changes, persists);
  recruit/dismiss still work; UI fits with no scroll. tests/tsc/build green.

### PREP NOTES (surveyed 2026-07-09 — start here, saves re-discovery)
- **Already done (Phase 3):** the 3-member seed exists in `persistenceService.ts`
  (`initializeLocalData`): p1 Althea **Leader**, p2 Kael **Vanguard**, p3 Elora
  **Arcanist**, all with real `avatar` busts. `WarRoom.tsx` already sorts front =
  role in {Leader,Vanguard}, support = else → p1/p2 front, p3 support. So
  "seed + formation rows" is basically **done**; just verify it renders.
- **Combat ALREADY reads equipped stats** (`AdventureWorld/CombatScene.tsx`):
  strike dmg `= member.level*10 + (equippedWeapon.statBonus.attack) + rand(0..9)`,
  crit ×1.5; enemy counter `= enemy.attack − (equippedArmor.statBonus.defense) +
  rand(0..4)`, min 1. So equip is "reflected in combat" the moment `equippedTo`
  is set — **no combat changes needed**, just set the flag.
- **Source of truth for equipped = `InventoryItem.equippedTo` (member id)** — that
  is what combat reads. `PartyMember.equipment{weapon,armor}` only stores a display
  name (written by the Vault; combat ignores it). Keep writing it for display, or
  drop it — don't rely on it for stats.
- **Equip logic already exists** in `GrandVault.tsx` (`getSlot`, `handleEquip`,
  `handleUnequip`): weapon = `icon==='swords' || statBonus.attack`, else armor;
  unequip same-slot first, then set `equippedTo`. **Extract this into a new
  `engine/equipment.ts` (pure decision fns, TDD)** and reuse from BOTH War Room and
  Vault (dedupe) — that satisfies the "TDD equip logic" requirement.
- **Heal:** potion = `type:'Consumable'`, `statBonus.hpHeal` (health-potion = 40).
  In-combat potion use lives in `CombatScene` (auto-targets most-hurt). War Room
  heal = **let the player pick a member + potion** → `hp = min(maxHp, hp+hpHeal)`,
  `quantity−1` (remove item at 0). New pure fn in `engine/equipment.ts`, TDD.
- **Wiring gaps:** `WarRoom.tsx` props today = `party, recruitCost, onClose,
  onAddMember, onRemoveMember` — **inventory is NOT passed in.** Add `inventory`
  (App already holds it) + `onHeal(memberId,itemId)` + `onEquip/onUnequip` handlers
  in `App.tsx` (rendered at ~`App.tsx:556`). Persist via existing
  `updatePartyMemberDB` / `updateInventoryItemDB` / `removeInventoryItemDB`.
- **Icons:** baked equipment PNGs render via `<ItemIcon item=.. />` (Phase 3);
  potion falls back to inline SVG. Reuse `ItemIcon` in the War Room equip/heal UI.
- **Scope note:** Phase 4 = **weapon + armor** slots only (schema
  `equipment:{weapon?,armor?}`). The fuller helmet/gloves/boots/back slot system
  (art is baked) is a **schema expansion — DEFER**, don't balloon this phase.
- **Layout:** `WarRoom.tsx` is a full-screen modal (fixed inset) with member cards
  `h-[200px]`; heal/equip UI must fit the enlarged panel with no page scroll.

**HANDOFF PROMPT (Phase 4):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (Phase 4 + its
> PREP NOTES) + `PLANS/OverhaulPlan.md` + project memory first. Do **Phase 4 — War
> Room party management**. The 3-member seed (p1 Leader / p2 Vanguard / p3 Arcanist,
> real busts) + baked equipment icons + combat-reads-equipped-stats already exist
> (see PREP NOTES) — do NOT redo them. Build: (1) create `engine/equipment.ts` with
> pure, TDD'd decisions for equip/unequip (weapon vs armor slot, unequip same slot
> first) and heal-from-inventory (`hp=min(maxHp,hp+hpHeal)`, `qty−1`, remove at 0);
> reuse it to dedupe the inline logic in `GrandVault.tsx`. (2) Wire the War Room UI:
> pass `inventory` into `WarRoom.tsx` + add App handlers `onHeal`/`onEquip`/
> `onUnequip` (persist via `updatePartyMemberDB`/`updateInventoryItemDB`/
> `removeInventoryItemDB`); equipped source of truth = `InventoryItem.equippedTo`.
> Let the player select a member and use a potion (HP up, qty down) or equip/unequip
> a weapon/armor (stat change persists + shows in combat). Keep recruit/dismiss
> working; render equip/consumable icons with `<ItemIcon>`; scale the modal to the
> enlarged panel with NO page scroll. Scope = weapon+armor slots only (defer the
> helmet/gloves/boots/back expansion). Working notes: a `cbm-code-discovery-gate`
> hook BLOCKS Read on source → read via grep/sed, edit via Bash python exact-string
> replace; Write/Edit fine for files you create + non-source. Dev server
> `preview_start "ledgerquest-dev"`; `preview_screenshot` times out on the CRT
> animation → verify via `preview_eval` DOM assertions, and `localStorage.clear()` +
> reload before checks. TDD the equipment/heal engine logic. Keep `npm test` +
> `npx tsc -b` + `npm run build` green (currently 143 tests), commit locally (NO
> push), then stop and show me.

---

## Phase 5 — Inventory management  ·  (item 4)  ·  ✅ DONE (2026-07-09)
Goal: inventory uses equipment-asset icons (placeholder SVGs now, real art later)
and the category filters actually work.
- [x] Icons (asset-driven `<ItemIcon>`, single swap-point) — already done Phase 3/4,
  no emoji/ad-hoc icons remained; spot-checked a **Quest**-type item renders its
  inline-SVG quest icon (browser-verified).
- [x] **Working filters:** verified in-browser with test items (2 Consumable /
  2 Equipment / 1 Quest) — All=5, Consumables=2, Equipment=2, Quest=1. The
  `i.type === activeTab` filter was already correct; the only gap was Quest items
  having no tab → **added a Quest tab** (`activeTab` now includes `'Quest'`; mobile
  nav grid `grid-cols-3`→`grid-cols-2` for the 4th tab). No `category` field invented.
- [x] **Discard action (the real gap):** added to the detail pane. `handleDiscard`
  → `window.confirm` → **auto-unequip first via `planUnequip`** (clears the member's
  `equipment[slot]`) so no member points at a deleted item → `removeInventoryItemDB`
  → clear selection. Reuses the tested engine fn (no new pure logic → no new tests).
  Renders for all types (Equipment/Consumable/Quest). Equip/Use unchanged (already
  engine-routed via `planEquip`/`planHeal`).
- VERIFIED (browser, preview_eval): filter counts above; Quest icon = SVG; discard a
  plain Quest item (inv 5→4, pane cleared); **discard an EQUIPPED shield** → item
  gone + `Althea.equipment` back to `{}` + zero `equippedTo==='p1'` orphans; NO page
  scroll (0). Console clean. tsc 0 / **157** tests / build green (no new tests — pure
  logic reused from Phase 4's `engine/equipment.ts`).
- Files: `APP/src/components/GrandVault.tsx` (Quest tab + Discard handler/button;
  reuses `engine/equipment.ts` `planUnequip`).
- Checkpoint (browser): each filter tab shows only its category; equipment shows
  asset icons; use/equip/discard behave; tests/tsc/build green.

### PREP NOTES (surveyed 2026-07-09 — start here; Phase 4 already did a LOT of this)
- **Icons: ALREADY DONE.** `GrandVault.tsx` renders `<ItemIcon item={item} />`
  everywhere (grid + detail pane) since Phase 3/4 — baked equipment PNGs + SVG
  fallback, single swap-point. No emoji/ad-hoc icons remain. Just **spot-check a
  Quest-type item's icon** renders (seed has none; quests may drop them).
- **Equip/Use: ALREADY DONE + engine-routed.** Phase 4 deduped `handleEquip`/
  `handleUnequip`/`handleUseConsumable` onto `engine/equipment.ts` (`planEquip`/
  `planUnequip`/`planHeal`). Equip routes to a party member, use consumes + heals.
  Keep consistent — reuse the same engine fns; don't re-implement.
- **Filters: VERIFY BEFORE "FIXING".** Current code is `activeTab: 'All' |
  'Consumable' | 'Equipment'`, `filteredItems = inventory.filter(i => activeTab
  === 'All' || i.type === activeTab)`. That looks correct on paper — but the seed
  inventory is only **2 items** (1 Equipment iron-sword, 1 Consumable potion), so
  filtering is hard to see and the old "broken" note may be stale. FIRST drive it
  in the browser (add a couple items or a Quest item to a test save) and confirm
  what, if anything, is actually wrong. Note: `InventoryItem` has **no `category`
  field** — `type` ('Consumable'|'Equipment'|'Quest') is the only axis. **Quest
  items have no tab** → they only show under All. Decide: add a Quest tab, or leave
  Quest as All-only (document it). Don't invent a `category` field.
- **Discard: THE REAL GAP — missing.** The detail-pane action area (GrandVault
  ~line 195) has Equip/Unequip (Equipment) and Use (Consumable) but **no Discard**.
  Add a Discard button that `removeInventoryItemDB(item.id)`s — and first guard/
  auto-unequip if `item.equippedTo` is set (don't leave a member pointing at a
  deleted item). Consider a confirm for equipped/valuable items.
- **Layout:** GrandVault is a full-screen modal; keep the no-page-scroll fit (like
  Phase 4's War Room). The grid pads to 10 slots — keep that or adjust cleanly.
- **Net:** Phase 5 is smaller than the checklist implies. Likely = (a) add Discard,
  (b) verify/adjust filters (+ maybe a Quest tab), (c) spot-check Quest-item icon.
  If (a)+(b) reveal shared decision logic worth extracting, add pure fns to
  `engine/equipment.ts` + TDD; otherwise keep it in the component.

**HANDOFF PROMPT (Phase 5):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (Phase 5 + its
> PREP NOTES) + `PLANS/OverhaulPlan.md` + project memory first. Do **Phase 5 —
> Inventory management** (item 4). IMPORTANT — Phase 4 already did most of the
> nominal scope, do NOT redo it: `GrandVault.tsx` already renders `<ItemIcon>`
> everywhere (no emoji icons left) and its equip/unequip/use handlers are already
> deduped onto `engine/equipment.ts` (`planEquip`/`planUnequip`/`planHeal`). The
> REAL work: (1) **Add a Discard action** to the item detail pane — `removeInventory
> ItemDB(item.id)`, but first auto-unequip / guard if `item.equippedTo` is set so no
> member points at a deleted item (confirm for equipped items). (2) **Verify the
> filter tabs in the browser before changing them** — the All/Consumables/Equipment
> filter is `i.type === activeTab` and looks correct, but the seed has only 2 items
> so drive it with a few test items (incl. a Quest item) and fix only if actually
> broken; `InventoryItem` has NO `category` field (`type` is the only axis) and
> Quest items currently have no tab (add one or document them as All-only — don't
> invent a category field). (3) Spot-check a Quest-type item's `<ItemIcon>`. Keep
> use/equip consistent with the War Room (reuse the engine fns; TDD any new pure
> decision logic). Keep the modal fitting with NO page scroll. Working notes: a
> `cbm-code-discovery-gate` hook BLOCKS Read on source → read via grep/sed, edit via
> Bash python exact-string replace; Write/Edit fine for files you create + non-
> source. Dev server `preview_start "ledgerquest-dev"`; `preview_screenshot` times
> out on the CRT animation → verify via `preview_eval` DOM assertions, and
> `localStorage.clear()` + reload before checks. Keep `npm test` + `npx tsc -b` +
> `npm run build` green (currently 157 tests), commit locally (NO push), then stop
> and show me.

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

## Phase 9 — Map & World interactions  ·  (future, user-directed 2026-07-09)
**LOCKED:** keep the existing `world_map.png` — NO new map art. Only small changes
on top of it.
- [ ] **Typed location pointers:** reposition the 4 `LOCATIONS` nodes so each sits
  on a matching-looking spot of the current map art, and give each a **typed
  pointer icon** by settlement kind (village hut / town / city spires / citadel)
  instead of the generic gold ring. (`engine/world.ts` — add a `type` per
  location + corrected `x,y`; `WorldMapScene.tsx` — icon per type.)
- [ ] **Zoom-into-village:** clicking a village pointer plays a **fade-in + scale
  zoom** transition from the node into the village interior (replaces today's
  instant town-enter). (`WorldMapScene.tsx` → `App.tsx` enter flow → `TownScene`.)
- [ ] **Village interior hotspots:** the zoomed-in village view highlights its
  **sub-locations** on different parts of the frame (clickable hotspots) rather
  than the current row of centred NPC emoji. (`TownScene.tsx`.)
- Files: `engine/world.ts`, `AdventureWorld/WorldMapScene.tsx`, `TownScene.tsx`,
  `App.tsx` (enter/worldState), plus the follow-on cluster below.
- **OPEN (resolve at phase start):** (a) interior = illustrated per-village vs a
  stylized/generated hotspot layout; (b) the sub-location set (Shop / Quest-giver
  / Arena / Inn-heal / Exit — standard vs per-village); (c) keep the 4 locations.

### Follow-on cluster (same or next phase — user "will request")
- [ ] **Battle encounters:** rework how/when encounters trigger (currently the
  `worldState` peace→battle machine in `App.tsx` + `pickEnemy`). Details TBD.
- [ ] **NPC dialogue:** beyond today's single static line per NPC — a real
  dialogue system (branches? multi-line? quest hooks). Details TBD.
- [ ] **Story / narrative:** DECIDE whether the early demo carries a light
  narrative arc through the 4 locations, or stays systems-only. Details TBD.
- Checkpoint + HANDOFF PROMPT: to be written once the OPEN items above are decided.

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
