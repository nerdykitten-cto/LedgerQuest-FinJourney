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

## Phase 5.5 — Gear & equipment slots  ·  (new, user-directed 2026-07-10)  ·  ✅ DONE (2026-07-10)
DONE: 5 slots (weapon/armor/helmet/shield/gloves), data-driven `slot` field, 20 gear
(4/slot). NEW single-source `src/data/gear.ts` (`GEAR_CATALOG` + `GEAR_BY_NAME`) feeds
seed + shop + App template map. Schema: `PartyMember.equipment` grew to 5 keys + `EquipSlot`
type + `InventoryItem.slot?`. Engine (`equipment.ts`): `EquipSlot` re-exported from schemas,
`equipSlotOf = item.slot ?? legacy-heuristic` (old-save fallback); +6 tests (5-slot read,
prefer-slot, fallback, per-slot swap ×5, one-of-each) → 163 total. Combat (`CombatScene.tsx`):
enemy-turn defense = SUM `statBonus.defense` over ALL equipped Equipment on target (reduce);
party-card defense badge shows summed number + piece count. War Room: 5 slotBoxes. Grand Vault:
equip path already generic over `plan.slot` — no change. Content: seed = 20 gear (4/slot) +
3 potions; shop = full catalogue + potion; `handleShopPurchase` + quest-reward builder now carry
`slot`. Art: initially reused one PNG per slot; FOLLOW-UP (2026-07-10) gave every item its OWN distinct
PNG under `public/assets/game/equipment/` sourced from the 2D Art Maker atlas
(`Assets/imported_assets/images/{helmet,top,eyewear,gearhand,gloves_r}`): Leather Cap = real brown
leather aviator (helmet_11), Iron Helm = grey visored knight (helmet_13), Steel Barbute = silver
dome (helmet_20), Scholar's Spectacles = round specs (eyewear_14); body = brown chestplate/tan
gambeson/olive vest/grey cuirass (top_19/26/25/54); shields = buckler/kite/tower/ledger
(gear_left_6/4/5/10); gloves = leather/padded/thief/ironclad (gloves_r_9/2/3/16). All 20 sprites
load 200, none shared (verified browser). VERIFIED (browser,
preview_eval): fresh seed = 4/slot, no missing slot, no sprite 404 (incl shield); equipped 1 of
each slot to Althea → `equipment` has all 5 keys + 5 items `equippedTo=p1` (defense sum 20);
per-slot swap (2nd helmet displaces 1st, count stays 5); War Room modal fits viewport (page's
228px scroll at 954px preview height pre-exists w/o modal = Phase 6 scene-fit, not this change);
console clean. tsc 0 / 163 tests / build green. Files: NEW `src/data/gear.ts`, `types/schemas.ts`,
`engine/equipment.ts`+`.test.ts`, `AdventureWorld/CombatScene.tsx`, `WarRoom.tsx`,
`persistenceService.ts`, `App.tsx`, `AdventureWorld/TownScene.tsx`, NEW
`public/assets/game/equipment/tower-shield.png`.

Goal: expand the 2-slot gear system (`weapon`, `armor`) into distinct equipment
slots — **weapon, body armor, helmet, shield, gloves** — with a small variety of
items (**≥4 each**, ~20 total) that the player can mix-and-match per party member.
Slot into the schedule **before Phase 6** (Battle UI must render the new slots).

Why a dedicated phase (deferred from Phase 4, which was weapon+armor only): this
touches the schema, the equip engine, combat stat math, BOTH gear UIs (War Room +
Grand Vault), item content, and art — too big to bolt onto a bug-fix.

- [ ] **Schema** (`types/schemas.ts`): grow `PartyMember.equipment` to
  `{ weapon?, armor?, helmet?, shield?, gloves? }` (values = display name, as today).
  Add an explicit **`slot`** field to `InventoryItem`
  (`'weapon'|'armor'|'helmet'|'shield'|'gloves'`) so slotting is data-driven, not
  guessed. Keep `type` ('Equipment'|'Consumable'|'Quest') as-is — `slot` only applies
  to `type:'Equipment'`. Migration: existing saves have no `slot` → derive a fallback
  from the old heuristic so old saves don't break (see engine below).
- [ ] **Engine** (`engine/equipment.ts`, TDD): widen `EquipSlot` to the 5 slots.
  Rewrite `equipSlotOf` to prefer `item.slot`, falling back to the current
  sword/attack→weapon, else→armor heuristic for legacy items with no `slot`.
  `planEquip`/`planUnequip` are already generic over `slot` — verify + extend tests
  to cover all 5 slots and same-slot swap per slot.
- [ ] **Combat** (`AdventureWorld/CombatScene.tsx`): today it reads one `equippedWeapon`
  (attack) + one `equippedArmor` (defense). Change defense to **sum `statBonus.defense`
  across body+helmet+shield+gloves** (all equipped defensive slots on the striking/
  defending member). Keep the source of truth = `InventoryItem.equippedTo`; combat
  resolves each member's equipped items by scanning inventory for `equippedTo===member.id`.
- [ ] **UI — Grand Vault** (`GrandVault.tsx`): equip flow already routes via the engine;
  ensure a helmet/shield/gloves item equips to its correct slot and the detail pane +
  the "E" grid badge reflect it. (Filter tabs unchanged — still by `type`; all 5 gear
  kinds are `type:'Equipment'`.)
- [ ] **UI — War Room** (`WarRoom.tsx`): show the member's 5 gear slots (not just
  weapon/armor); equip/unequip each; fits the enlarged panel with **no page scroll**.
- [ ] **Content** (seed/shop templates in `persistenceService.ts` + `TownScene.tsx`,
  and the `App.tsx` template map): add ≥4 items per slot (~20). Give each a `slot`,
  a `statBonus`, and a `sprite`.
- [ ] **Art**: helmets/gloves/body partly baked (`iron-helm`, `leather-gloves`,
  `leather-tunic`). **No shield PNG is baked yet** — either pick from
  `public/assets/game/weapons/` (16 assets) as stand-ins or drop new PNGs into
  `public/assets/game/equipment/` (the `isBakedItemArt` whitelist already covers
  `equipment|consumables|weapons`). Keep the single-swap-point (`ItemIcon`).
- Files: `types/schemas.ts`, `engine/equipment.ts` (+ `.test.ts`),
  `components/AdventureWorld/CombatScene.tsx`, `components/GrandVault.tsx`,
  `components/WarRoom.tsx`, `persistenceService.ts` (seed), `App.tsx` (template map),
  `components/AdventureWorld/TownScene.tsx` (shop), `public/assets/game/equipment/`.
- Checkpoint (browser): a member can equip 1 of each of the 5 slots at once; combat
  defense reflects the SUM of all defensive slots; ≥4 options show per slot; icons
  render (no SVG-fallback/404); War Room + Vault fit with no page scroll; legacy save
  with no `slot` still equips (fallback). tests/tsc/build green.

### PREP NOTES (surveyed 2026-07-10 — start here)
- **Current state = 2 slots.** `PartyMember.equipment = {weapon?, armor?}`
  (`schemas.ts:84`). `equipSlotOf` (`engine/equipment.ts:21`) = `icon==='swords' ||
  statBonus.attack!==undefined ? 'weapon' : 'armor'` — a heuristic, NOT a data field.
  Replace with a real `slot` field; keep the heuristic ONLY as the legacy fallback.
- **Source of truth for "equipped" = `InventoryItem.equippedTo` (member id)** — combat
  reads THAT. `PartyMember.equipment{}` stores only a display name. Multi-slot means a
  member can have several inventory items with `equippedTo===member.id`, each a
  different slot. Combat must scan inventory per member, not read a single field.
- **Combat math today** (`CombatScene.tsx`): strike dmg = `level*10 + weapon.attack +
  rand`; enemy counter = `enemy.attack − armor.defense + rand`, min 1. New: replace the
  single `armor.defense` with `sum(defense of all equipped defensive-slot items)`.
- **`planEquip` already unequips the same slot first** — with per-slot data this Just
  Works once `equipSlotOf` returns the right slot; extend tests to prove per-slot swaps.
- **Baked art present:** `iron-helm.png` (helmet), `leather-gloves.png` (gloves),
  `leather-tunic.png` (body), plus weapons dir. **Shield art missing** — decide stand-in
  vs new PNG at phase start. `isBakedItemArt` now whitelists `equipment|consumables|weapons`.
- **Scope discipline:** boots/back/`gear_*` slots exist in the art pack but are OUT —
  this phase is exactly weapon/body/helmet/shield/gloves (5 slots). Don't add more.
- **Layout risk:** War Room member cards are `h-[200px]`; 5 slot rows must fit the
  enlarged panel with no page scroll (same constraint Phase 4 hit at 2 slots).

**HANDOFF PROMPT (Phase 5.5):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (Phase 5.5 + its
> PREP NOTES) + `PLANS/OverhaulPlan.md` + project memory first. Do **Phase 5.5 — Gear
> & equipment slots**. Expand the 2-slot gear system (`weapon`,`armor`) into 5 distinct
> slots — **weapon, body armor, helmet, shield, gloves** — with ≥4 items each (~20).
> (1) Schema: grow `PartyMember.equipment` to those 5 keys + add a data-driven `slot`
> field to `InventoryItem`; keep a legacy fallback so old saves (no `slot`) still equip.
> (2) Engine (`engine/equipment.ts`, TDD): widen `EquipSlot`, make `equipSlotOf` read
> `item.slot` (heuristic = fallback only); extend tests for all 5 slots + per-slot swap.
> (3) Combat (`CombatScene.tsx`): defense = SUM of `statBonus.defense` across ALL
> equipped defensive slots (body+helmet+shield+gloves), resolved by scanning inventory
> for `equippedTo===member.id`; keep `equippedTo` as source of truth. (4) UI: War Room
> shows/equips all 5 slots; Grand Vault equips each to its correct slot; both fit with
> NO page scroll. (5) Content: ≥4 templates per slot with `slot`/`statBonus`/`sprite`
> in the seed + shop + App template map. (6) Art: `iron-helm`/`leather-gloves`/
> `leather-tunic` are baked; NO shield PNG exists — pick a weapons-dir stand-in or add a
> PNG under `public/assets/game/equipment/` (`isBakedItemArt` covers equipment|
> consumables|weapons). Scope = exactly these 5 slots (boots/back OUT). Working notes: a
> `cbm-code-discovery-gate` hook BLOCKS Read on source → read via grep/sed, edit via
> Bash python exact-string replace; Write/Edit fine for files you create + non-source.
> Dev server `preview_start "ledgerquest-dev"`; `preview_screenshot` times out on the
> CRT animation → verify via `preview_eval` DOM assertions, and `localStorage.clear()` +
> reload before checks. TDD the equip engine changes. Keep `npm test` + `npx tsc -b` +
> `npm run build` green, commit locally (NO push), then stop and show me.

---

## Phase 6 — Battle UI polish  ·  (item 5 detail)  ·  ✅ DONE (2026-07-10)
Goal: with the enlarged panel (Phase 2), lay combat out fully and neatly with **no
scrollbar** — AP badge, turn indicator, enemy, 3 party cards, STRIKE buttons,
inventory row, and the battle log all visible at once.
- [x] Re-flowed `CombatScene`: **dropped the `overflow-y-auto custom-scrollbar` crutch**
  → root is now `overflow-hidden min-h-0` (clips as a last resort, never scrolls). The
  party row became the single flexible band (`flex-1 min-h-0 items-center`) that absorbs
  slack and pins the log to the bottom, so the log lost its `mt-auto sticky bottom-0`
  crutch. Removed `shrink-0` from the party row (kept it only on the genuinely-fixed
  small siblings: heading/potion-shelf/enemy/log). Trimmed ~80px of intrinsic height
  (heading text-xs+leading-none, potion py-1/mb-1, enemy sprite md:w-12 + name md:text-base,
  card p-2/mb-1/mb-1.5, STRIKE py-1.5, root md:py-2) so content has real headroom.
- [x] Verified at 1280/1536/1920 (+ a 380px stress box); 3-member party the layout target.
- Files: `APP/src/components/AdventureWorld/CombatScene.tsx` (layout classes only — NO
  combat-logic / damage change).
- VERIFIED (browser, preview_eval DOM assertions; battle seeded via
  `campaign.worldState='battle'` + Overdraft Ogre in localStorage): **min box needed =
  372px** (was ~454px, razor-thin at the ~460px target → now 88px headroom). At every
  size — 1280-wide box 380px (vh 640 stress), 1536×864 box 459px, 1920×1080 box 564px —
  `scrollHeight−clientHeight = 0` (no scrollbar), party row `scrollWidth−clientWidth = 0`
  (no x-overflow), and all 3 STRIKE buttons' `getBoundingClientRect().bottom` sit inside
  both the root and the viewport (0 below either). Original audit bug #1 (STRIKE below
  screen) cannot recur — the flexible party band keeps STRIKE on screen and overflow is
  clipped, not scrolled.
- [x] **Phase 5.5 gear math live-verified** (folded in): equipped a defensive loadout to
  Althea (4 pieces → badge reads **"+20 Defense from 4 piece(s)"**, visible `shield 20`)
  and to Elora (4 pieces → **"+40 Defense from 4 piece(s)"**). Drove real strikes: the
  Overdraft Ogre (attack 8) hit Elora for **8–11 dmg at defense 0** and for **1 dmg
  (floored) at defense 40** — enemy counter-damage falls as more defensive slots are
  equipped, exactly as `damage = max(1, attack − Σ statBonus.defense + rand(0..4))`.
- tsc 0 / **163** tests / build green (layout-only, no test change).
- RE-CHECKED 2026-07-11 after the combat-stats/revive feature touched `CombatScene.tsx`
  (strike/counter wiring + the defense badge now ALWAYS renders, since base defense is
  always > 0): no-scroll fit still holds — at the tight 1280×640 box (~380px, tighter
  than the 460px target) `scrollHeight−clientHeight = 0`, no party x-overflow, all 3
  STRIKE inside root+viewport, 3 base-defense badges render (absolute-positioned → no
  added flow height). Phase 6 intact.

### PREP NOTES (surveyed 2026-07-10 — start here)
- **`CombatScene.tsx` is 288 lines, single flex-col.** Root (line 158):
  `flex flex-col items-center p-3 pt-20 md:p-4 overflow-x-hidden overflow-y-auto
  custom-scrollbar`. THE CRUTCH = that `overflow-y-auto` + every child marked
  `shrink-0`. Goal: make the column fit so the scroll never engages (then drop it,
  or keep only as a last-resort safety like Phase 2 did).
- **Vertical stack, top→bottom:** (1) `Combat Interface` H2 (`hidden md:block`, l.177)
  · (2) AP badge + Turn indicator bar (`Player/Enemy Phase`, l.164–174) · (3) Potion
  "Inventory:" shelf (conditional, l.179–196) · (4) Enemy block — sprite 48–56px +
  name + HP bar (l.198–216) · (5) Party row — 3 cards, `overflow-x-auto`,
  `min-w-[104px]` each, equipped weapon/defense badges + STRIKE button per card
  (l.218–278) · (6) Battle Log — `mt-auto sticky bottom-0 min-h-[44px] md:min-h-[48px]`
  (l.280–286). Order in the JSX is AP-bar, potion shelf, enemy, party, log.
- **`pt-20` is mobile header clearance** (overridden by `md:p-4` at desktop — Phase 2
  note). Don't remove it without checking phones.
- **STRIKE-below-screen was the original audit bug (#1).** The buttons live at the
  BOTTOM of each party card, above the sticky log. If the column overflows they get
  covered → unplayable. That is exactly what Phase 6 must kill.
- **Layout gotchas (carry over):** flex ancestors need `min-w-0`/`min-h-0` or content
  blows past the CRT bezel (Phase 1). Combat fits *exactly* at 1280×800 inner box
  (~460px tall) — any added height reintroduces the inner scroll (Phase 2). The
  3-member party is the layout target.
- **Phase 5.5 already touched this file:** party cards now compute `totalDefense`
  (sum across equipped Equipment) and render a `+N` defense badge + a weapon badge
  (top-right of each card, l.~230–250). Minor extra height — keep it in the reflow.
- **Driving a live battle (no grinding travel/AP):** the peace→battle machine lives
  in `App.tsx` (`worldState` + `pickEnemy`). Fastest browser repro = seed a battle
  directly: set `campaign.worldState='battle'` + a valid `activeEnemy` in localStorage
  (mirror an `Enemy` from the bestiary) and reload, or drive travel with enough AP.
  `preview_screenshot` times out on the CRT anim → assert via `preview_eval`
  (measure `scrollHeight<=clientHeight` on the CombatScene root; check STRIKE buttons'
  `getBoundingClientRect().bottom <= viewport`). `localStorage.clear()`+reload first.
- **Scope:** this is layout/reflow only — no combat-logic change. Don't rebalance
  damage or touch the engine.

**HANDOFF PROMPT (Phase 6):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (Phase 6 + its
> PREP NOTES) + `PLANS/OverhaulPlan.md` + project memory first. Do **Phase 6 — Battle
> UI polish** (item 5). Re-flow `AdventureWorld/CombatScene.tsx` (288 lines, single
> flex-col) so ALL of it fits the enlarged CRT panel with NO scrollbar at once: the
> AP badge + turn indicator, the potion "Inventory:" shelf, the enemy block, the 3
> party cards (each with its equipped weapon/defense badges + STRIKE button), and the
> sticky battle log. Kill the `overflow-y-auto` + `shrink-0` crutch on the root (drop
> it, or keep only as a last-resort safety) — the STRIKE-buttons-below-the-screen bug
> (original audit #1) must not come back. Constraints: 3-member party is the layout
> target; flex ancestors need `min-w-0`/`min-h-0` (bezel overflow); combat fits
> exactly at the 1280×800 inner box (~460px) so trim heights, don't add. This is
> layout-only — do NOT change combat logic or rebalance damage. WHILE you have a live
> battle open, also eyeball the Phase 5.5 gear math: each party card's defense badge
> should show the SUMMED defense + piece count, and enemy counter-damage should fall
> as more defensive slots are equipped (5.5 unit-tested this but never drove it live).
> Verify at 1280/1536/1920 via `preview_eval` DOM assertions (measure the CombatScene
> root `scrollHeight<=clientHeight` and STRIKE `getBoundingClientRect().bottom` inside
> viewport). To get into a battle without grinding: seed `campaign.worldState='battle'`
> + a valid `activeEnemy` in localStorage and reload (or travel with enough AP).
> `preview_screenshot` times out on the CRT animation → use DOM assertions, and
> `localStorage.clear()`+reload before checks. Working notes: a `cbm-code-discovery-gate`
> hook BLOCKS Read on source → read via grep/sed, edit via Bash python exact-string
> replace; Write/Edit fine for files you create + non-source. Keep `npm test` +
> `npx tsc -b` + `npm run build` green (currently 163 tests), commit locally (NO push),
> then stop and show me.

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

### PREP NOTES (surveyed 2026-07-11 — start here, saves re-discovery)
- **Context since Phase 6:** a user-directed combat-stats + revive + post-battle
  recovery feature shipped and merged to `main` (`a4809f3`, local) — see project
  memory. It added base attack/defense, a Revive Tonic, and enemy buffs. Doesn't
  change Phase 7 mechanics, but the SCRATCH seed still seeds the 3-member party +
  full gear + potions + Revive Tonic (that's intended — combat must work once play
  unlocks; scratch zeroes the ECONOMY, not the party).
- **First-run trigger today = per-collection "empty" checks, NOT a profile flag.**
  `initializeLocalData()` (`persistenceService.ts:287`) is called once from an App
  mount effect (`App.tsx:101`) and seeds each collection **only if that collection
  is empty**: tasks(2), habits(1 "Daily Expense Logging"), quests(1 = storyManifest
  ch0 mainQuest0, `status:'available'`, `apQuota:5`), party(3), inventory(20 gear +
  Health Potion + Revive Tonic). **Stats + campaign are NOT seeded here** — they
  default lazily: `subscribeStats` returns `{level:1,exp:0,ap:10,gold:0,
  monthlyBudget:3000}` when the key is absent (`persistenceService.ts:94`); campaign
  defaults to `worldState:'peace'`. So "first run" is implicit and the current
  defaults are a MID-GAME start (10 AP, $3000 budget, an available quest), NOT scratch.
- **What "scratch" must change (locked decision):** on true first run / hard reset,
  the profile must be **0 AP / 0 gold / 0 xp, blank budget (no $3000 default), no
  feats/rituals**, and play (map travel / AP spend) **locked** until the player (a)
  sets a budget limit, then (b) logs a first expense → earns first AP → gate opens.
  This needs a real persisted "scratch" stats seed (ap:0, gold:0, exp:0, budget:0 or
  null) instead of relying on the 10-AP/$3000 lazy default, AND a **single explicit
  first-run/onboarding flag** (e.g. a `player/profile` key with `onboardingComplete`)
  so first-run is detected deterministically rather than by "is some collection
  empty" (which breaks once any collection is seeded).
- **Budget-first gate is NOT built yet.** Budget editing exists (`App.tsx:526`
  `newBudget` state → `updateStats({monthlyBudget})` at `:530`) in the Ledger view,
  but nothing LOCKS play on it. Phase 7 adds the gate: while budget is unset, block
  map/AP flows and surface a "set your budget" prompt; after budget set + first
  expense logged (AP earned), open the gate. Decide where the lock lives (the game
  view / world map entry) and the unlock signal (monthlyBudget > 0 && ap > 0, or an
  explicit flag).
- **Hard reset today reseeds a MID-GAME world, not scratch.** "Reset Adventure"
  button (`App.tsx:777`) → `handleResetGame` (`App.tsx:520`) → `resetGameDB()`
  (`persistenceService.ts:267`) which `removeItem`s all 12 collections + all
  `ENGINE_STATE_KEYS`, then calls `initializeLocalData()` (reseeds party/gear/quest).
  Phase 7 must make reset go to **scratch** (also clear the new onboarding flag +
  seed 0-economy stats) and **re-force the tutorial**, superseding this. Add a clear
  warning dialog ("all progress erased, start over") before wiping. Reuse/extend
  `resetGameDB` — keep the collection+engine-key wipe, swap the reseed for scratch.
- **No onboarding component exists** — Phase 7 creates one (or a gated overlay).
  Phase 8 (tutorial) hooks into it; keep the onboarding flag/step model reusable so
  Phase 8's guided quest can read "which onboarding step am I on".
- **TDD target:** the reset/scratch-seed decision + the gate/unlock predicate are
  pure-logic-able → put them in a small engine module (or `persistenceService`
  helper) with tests, like the equipment/reward engines. IP detection is N/A on the
  static host — key everything off localStorage (documented decision).
- **Working notes:** `cbm-code-discovery-gate` hook BLOCKS Read on source → read via
  grep/sed, edit via Bash python exact-string replace; Write/Edit fine for files you
  create + non-source. Dev server `preview_start "ledgerquest-dev"`;
  `preview_screenshot` times out on the CRT animation → verify via `preview_eval`
  DOM assertions + `localStorage.clear()`+reload before checks.

**HANDOFF PROMPT (Phase 7):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (Phase 7 + its
> PREP NOTES) + `PLANS/OverhaulPlan.md` + project memory first. Do **Phase 7 —
> First-run onboarding + hard reset** (item 7). No sign-in: first visit (empty
> localStorage) auto-seeds a **SCRATCH profile — 0 AP / 0 gold / 0 xp, no feats/
> rituals, BLANK budget** (do NOT use the current lazy defaults of 10 AP / $3000
> budget / an available quest; those are a mid-game start) and enters a **budget-
> first gate** that keeps play (map travel / AP spend) LOCKED until the player sets a
> budget limit, then logs a first expense → earns first AP → gate opens. The scratch
> seed STILL seeds the 3-member party + gear + potions + Revive Tonic (combat must
> work once unlocked — scratch zeroes the economy, not the party). Add a hard "New
> Game" / "Start From Scratch" reset with a warning dialog ("all progress erased,
> start over") that wipes ALL state (all collections + `ENGINE_STATE_KEYS` + the new
> onboarding flag) back to scratch and re-forces the tutorial, superseding the old
> "Reset Adventure" (`App.tsx:777` → `handleResetGame` → `resetGameDB`, which today
> reseeds a mid-game world). Key first-run off a **single explicit onboarding flag**
> (e.g. `player/profile.onboardingComplete`), NOT the current "is a collection empty"
> heuristic. Keep the onboarding step model reusable for Phase 8's guided tutorial.
> IP detection N/A (static host) — use localStorage. TDD the scratch-seed/reset +
> gate-unlock predicate (pure engine helper). Working notes: a `cbm-code-discovery-
> gate` hook BLOCKS Read on source → read via grep/sed, edit via Bash python exact-
> string replace; Write/Edit fine for files you create + non-source. Dev server
> `preview_start "ledgerquest-dev"`; `preview_screenshot` times out on the CRT
> animation → verify via `preview_eval` DOM assertions, `localStorage.clear()`+reload
> before checks. Keep `npm test` + `npx tsc -b` + `npm run build` green (currently
> 181 tests), commit locally (NO push), then stop and show me.

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
