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

## Phase 7 — First-run onboarding + hard reset  ·  (item 7)  ·  ✅ DONE (2026-07-11)
Goal: no sign-in; first visit auto-creates a fresh local profile and enters the
budget-first onboarding; a hard "New Game" reset reproduces that scratch state and
re-forces the tutorial.
- [x] First-run detection keyed off a **single explicit flag** `player/profile`
  (`{onboardingComplete}`), NOT per-collection-empty. `initializeLocalData()` →
  `firstRun` when no profile + no stats + empty party → `seedScratch()`: scratch stats
  (0 AP/gold/xp, blank budget), profile `onboardingComplete:false`, party+gear+potions+
  Revive Tonic ONLY (no feats/rituals/starter-quest/budget-streams). Legacy saves (stats
  present, no flag) → stamped `onboardingComplete:true` so they never re-gate. IP N/A →
  localStorage is the signal (documented). NEW pure `engine/onboarding.ts` (`SCRATCH_STATS`,
  step model, `currentOnboardingStep`/`isPlayUnlocked`/`shouldLatchUnlock`, TDD 16 tests).
- [x] Budget-first gate: `<OnboardingGate>` replaces the world map while locked; travel +
  action-cost handlers early-return when locked; director quest-offers held until unlocked.
  Set budget → step 2 (log expense) → first AP earned latches `onboardingComplete:true`
  (one-way — spending AP back to 0 never re-locks). Bootstrap runs `initializeLocalData()`
  synchronously in render (useRef guard) + stats/profile useState read localStorage lazily,
  so the world-loop never fires a quest offer against optimistic defaults before the gate loads.
- [x] Hard reset "New Game — Start From Scratch" (Danger Zone) with a warning `confirm`
  ("ALL progress permanently erased… cannot be undone") → `resetGameDB()` now also removes
  `player/profile`, so `initializeLocalData()` re-detects first-run → `seedScratch` +
  re-armed gate; supersedes the old mid-game reseed. `ENGINE_STATE_KEYS` wipe kept.
- Files: NEW `engine/onboarding.ts` (+ `.test.ts`), NEW `components/OnboardingGate.tsx`,
  `persistenceService.ts` (`PROFILE_DOC` + `subscribeProfile`/`updateProfile`, `seedScratch`/
  refactored `initializeLocalData`, `resetGameDB` removes profile) + `.test.ts`, `App.tsx`
  (sync bootstrap + lazy stats/profile state, latch effect, travel/action gates, world-loop
  gate, gate render, reset copy/label).
- VERIFIED (browser, preview_eval on a fresh dev server — CRT screenshot times out):
  `localStorage.clear()`+reload → scratch (profile false, ap 0, gold 0, budget 0, quests 0,
  habits 0, tasks 0, budget-streams 0, party 3, 20 gear + health-potion + revive-tonic);
  Strategic Map shows the gate + "Set Budget", `adventure-world` NOT rendered (play locked);
  set budget → gate step 2 "Log an Expense" (still locked); earn first AP → onboarding latches
  true + gate gone + map renders; spend AP→0 stays unlocked (one-way latch); Danger Zone shows
  "New Game — Start From Scratch" → reset → back to full scratch + re-armed gate. Console clean.
  tsc 0 / **203** tests / build green. (The dev-only React "deps array changed size" warnings
  seen mid-session were HMR hot-swap artifacts across the deps-array edits — gone on a fresh
  server load; the final deps array is a stable 7-primitive literal.)
- NOT built here (deferred to Phase 8): the guided tutorial quest itself — scratch seeds NO
  quest, so after unlocking the QuestList is empty until the director forges a side quest or
  Phase 8 seeds "The Ledger of the Lost Town" as the guided first quest. The `OnboardingStep`
  vocabulary + gate are reusable for that.

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

## Phase 7.5 — Demo polish quick wins  ·  (user-directed 2026-07-11)  ·  ✅ DONE (2026-07-11)
Batch A of the 6-item demo-polish request. Spec `PLANS/specs/2026-07-11-demo-polish-batch-design.md`,
plan `PLANS/plans/2026-07-11-demo-polish-batch-a.md`. Items 1, 2, 5, 6 (executed inline, TDD +
per-task commits). Remaining: item 4 chronicle boss flow (Batch B), item 3 tutorial (Batch C /
Phase 8) — each gets its own plan at its checkpoint.
- [x] **Settings modal + gear icon (item 1):** gear button in `TopAppBar` right cluster (beside AP
  + feedback, `w-9 h-9 md:w-10`). NEW `components/SettingsModal.tsx` holds the Danger Zone "New
  Game — Start From Scratch" reset, **moved out of** Archive → Vaults. Mobile header fits at 375px
  (0 overflow).
- [x] **Currency relabel (item 2):** NEW `data/currencies.ts` (`CURRENCIES` USD/EUR/GBP/INR/JPY/
  CAD/AUD, `symbolOf`, pure `formatMoney` — TDD 6 tests). `PlayerStats.currency` (default USD;
  scratch seeds USD). `<select>` in the Calibrate Budget modal persists `{monthlyBudget, currency}`.
  All FINANCE money renders → `formatMoney(v, stats.currency)` (ledger cards, budget streams,
  savings, deposit toast, `ExpenseList` via new `currency` prop w/ 2-decimals). Game **Gold**
  untouched. Symbol-only, no FX (locked fork).
- [x] **Outskirts battle → town (item 5):** NEW `CampaignState.battleOrigin` (`'town'|'map'|
  'invasion'`). Outskirts battle tags `'town'`; `handleBattleVictory`/`handleBattleDefeat` route to
  `'town'` when origin was town (else `'peace'`), clearing `battleOrigin`. (Batch B extends
  `'invasion'`.)
- [x] **Demo/PixelOre footer (item 6):** NEW `components/DemoFooter.tsx` — muted gray strip "DEMO —
  not a real financial tool (yet) · A PixelOre product" on every page (in flow, `mb-24 md:mb-0` so
  the mobile floating nav clears it; hidden-nav on desktop).
- VERIFIED (browser, preview_eval): currency EUR relabels ledger €3,000 / expense €42.50 / remaining
  €2,957.5, Gold untouched; town-origin battle win → `worldState:'town'`; gear→Settings→New-Game
  present, Archive Danger Zone gone, 375px header 0 overflow; footer on all 4 tabs, mobile-nav
  clearance, desktop nav hidden; Phase 7 scratch gate still intact (onboarding false, ap 0, currency
  USD). tsc 0 / **209** tests / build green. Commits `…currency catalogue` → `…demo + PixelOre footer`
  (7 local commits incl. spec+plan). NO push.

---

## Phase 8 — Tutorial guided first quest  ·  (item 8 / Batch C)  ·  ✅ DONE (2026-07-11)
Delivered as a **contextual, non-blocking guide** (user fork 2026-07-11), not a hard-gated script.
Spec `PLANS/specs/2026-07-11-demo-polish-batch-design.md`, plan
`PLANS/plans/2026-07-11-demo-polish-batch-c-tutorial.md`. Executed inline (TDD + per-task commits).
- [x] Pure NEW `engine/tutorial.ts` (TDD, 12 tests): 8-step model
  (set-budget→log-expense→open-map→enter-town→talk→fight→claim→done) as a **milestone ladder**
  `currentTutorialStepIndex(ctx)` + **monotonic** `advanceTutorialStep(prev,ctx)` (never regresses
  when a momentary condition like the active tab drops) + `tutorialActive(profile)` + `TUTORIAL_COPY`.
  **AP emphasis** baked into the copy: log-expense = "earn AP on the finance side"; open-map =
  "spend AP on the game side" (both flagged `ap:true` → highlighted rail).
- [x] `PlayerProfile` grew `tutorialStep?`/`tutorialDone?`; `SCRATCH_PROFILE` seeds step 0 / not
  done; legacy/absent-profile defaults set `tutorialDone:true` so existing players are NOT nagged.
- [x] NEW `components/TutorialGuide.tsx` — small fixed corner card (non-blocking, `pointer-events`
  only on the card), shows step N/7 + title + hint + a per-step "jump" button (Ledger/Map) + Skip;
  the final `done` step shows a wrap-up card dismissed with "Got it!".
- [x] `App.tsx`: derives the context from live state (budget, `onboardingComplete`=AP earned,
  currentTab, worldState, main-quest talk/kill/completed) and advances the persisted step in an
  effect; renders the guide while `tutorialActive`. Does NOT auto-complete at step 7 (so the wrap-up
  card is seen; the player dismisses it → `tutorialDone`).
- [x] **Bonus fix (during Batch B, benefits this):** quest offers now guard against live localStorage
  (not stale React state) so chronicle progress survives reloads — the tutorial's talk→fight→claim
  steps read real quest state.
- VERIFIED (browser, preview_eval; CRT screenshot times out): fresh scratch → guide "Step 1/7 Set
  your budget"; set budget → "Earn your first AP" (⚡ AP emphasis); earn AP → "Spend AP to explore";
  open map → step 3; enter town → step 4; leave tab → **stays 4** (monotonic); talk→5, boss→6,
  claim→7 done card → "Got it!" → `tutorialDone` + guide gone; Skip works; legacy save NOT nagged;
  mobile (375) card sits above the nav, 0 overflow; console clean. tsc 0 / **229** tests / build green.
  8 local commits (plan + 5 feature + fixes). NO push.

**6-item demo-polish request COMPLETE** (Batches A+B+C): Settings+gear, currency (incl. PKR),
outskirts→town, PixelOre footer, chronicle boss invasion flow, contextual AP tutorial.

### Original Phase 8 sketch (superseded by the contextual guide above)
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

## Batch B — Chronicle boss invasion flow  ·  (user item 4, = Phase 9 encounter slice)  ·  ✅ DONE (2026-07-11)
Spec `PLANS/specs/2026-07-11-demo-polish-batch-design.md`, plan
`PLANS/plans/2026-07-11-demo-polish-batch-b-boss-flow.md`. The "battle-encounter rework"
bullet from Phase 9 (below), pulled forward. Executed inline (TDD + per-task commits).
- [x] **Pure engine** NEW `engine/chronicle.ts` (TDD, 8 tests): `bossObjective`,
  `nonBossObjectivesComplete` (invasion trigger = all non-kill objectives done + kill pending),
  `resolveBoss(name, progress)` → beefed bestiary/synth Enemy (×1.6 HP / ×1.25 ATK / +2 DEF,
  +progress scaling; Debt Gnomes/Inflation Djinn/Compound Golem from bestiary, Gorgos synthesized).
- [x] **State** `CampaignState.invasion?: {town, questId, bossName}` — its presence IS the town
  lock (dropped the spec's separate `townLocked` flag). NEW `components/AdventureWorld/InvasionDialog.tsx`
  full-cover TV overlay, rendered by `AdventureWorld` when `invasion && worldState==='town' &&
  currentLocation===invasion.town`; props threaded through `GameView`.
- [x] **Wiring** (`App.tsx`): trigger effect (active main quest hits `nonBossObjectivesComplete` →
  set `invasion` + notify); `handleInvasionFight` → boss battle (`battleOrigin:'invasion'`);
  `handleInvasionEscape` → World Map (`peace`), invasion stays set so re-entering re-shows the dialog
  (lockout). `handleBattleVictory` invasion branch → tick boss kill, clear invasion, return to normal
  town, quest→ready (claim reward); guarded the blanket kill-tick so MAIN/boss kills only count via
  invasion while SIDE-quest kills still tick on normal outskirts wins. Defeat routing returns to town
  (retry). 
- [x] **Bug fixed during verify:** the world-changed director offer used stale React `quests` ([] on
  mount) so `addQuestDB` clobbered an active quest back to a fresh 'available' one on every reload
  (reset chronicle progress + blocked the trigger). Now guards against the LIVE localStorage collection.
- VERIFIED (browser, preview_eval; CRT screenshot times out): seed ch0 at threshold (talk done, kill
  pending) → invasion fires (Debt Gnomes @ Starting Village) + dialog on TV; Escape → World Map +
  invasion persists; re-enter town → dialog re-appears (locked); Fight → boss battle (Debt Gnomes 80HP,
  origin invasion) → win → invasion cleared + worldState town + kill done + quest 'ready'. Regression:
  normal town-origin win returns to town + ticks SIDE-quest kill (not main). Console clean.
  tsc 0 / **217** tests / build green. 7 local commits (spec+plan+5 feature+1 fix). NO push.
- **Next: Batch C = Phase 8 tutorial (item 3).** Note for Phase 8: the tutorial should walk up to the
  invasion so the player sees the finance→game→boss connection; the guided quest's non-kill objectives
  now trigger the invasion (kill only via the boss fight).

---

## Phase 9 — Map & World interactions  ·  (user-directed 2026-07-09)  ·  ✅ DONE (2026-07-12)
Spec `PLANS/specs/2026-07-12-phase9-map-world-interactions-design.md`, plan
`PLANS/plans/2026-07-12-phase9-map-world-interactions.md`. Brainstormed forks (2026-07-12):
interior = one reused stylized hotspot layout (no per-village art); hotspot set = real
Quest-giver/Shop/Outskirts/Exit + **cosmetic** Arena & Inn ("coming soon", no mechanic);
follow-on = **light multi-line NPC dialogue only** (branching + story arc DEFERRED);
pointers = per-type emoji glyph. Executed inline (TDD + per-task local commits).
**LOCKED (honored):** kept the existing `world_map.png` — NO new map art.
- [x] **Typed location pointers:** `WorldLocation` gained `type`
  ('village'|'town'|'city'|'citadel') + `LOCATION_ICON` (🛖/🏘️/🏙️/🏰) in `engine/world.ts`;
  the 4 nodes repositioned onto matching terrain (Starting Village 26,40 cottages /
  Copper Town 83,66 forge+docks / Silver City 60,12 blossom-shrine spire / Iron Citadel
  58,62 stone tower). `WorldMapScene.tsx` renders the per-type emoji on the gold-ring
  base (kept current-node highlight, selected scale, name tags, party arrow, polyline,
  mobile drag-to-pan). `director.test.ts` travel-costs re-pinned to the new coords
  (SV→Copper 9, Copper→Silver 8, Silver→Iron 7, SV→Iron 6, SV→Silver 6) — all 6–9 AP.
- [x] **Zoom-into-village:** tapping the current node plays a fast (~400ms) scale+fade
  zoom INTO the node (`transform-origin` at its x,y) then enters — skippable (second tap
  / `prefers-reduced-motion`). `WorldMapScene.tsx` only; no `App`/`worldState` change, so
  the invasion lockout is untouched.
- [x] **Village interior hotspots:** `TownScene.tsx` center formalized into 6 spread
  hotspots — real Quest-giver/NPCs, 🏪 Shop, Outskirts, Exit + cosmetic 🏟️ Arena & 🛏️ Inn
  ("coming soon"). Plus **light multi-line NPC dialogue**: each NPC carries `lines[]`;
  a local `DialogueBox` advances line-by-line (`AdventureWorld.handleNPCTalk` slimmed to
  stop double-showing); `onTalk` still fires once → quest/tutorial talk objective +
  invasion trigger unchanged.
- VERIFIED (browser, preview_eval; screenshot times out on CRT): 4 typed emoji pointers
  + party arrow; travel SV→Copper −9 AP (matches pin); tap current node → zoom → interior
  (COPPER TOWN, map-layer gone); 6 hotspots present; NPC dialogue line0→line1→close; Inn
  "coming soon"; **invasion NOT regressed** (seed invasion → zoom-enter invaded town →
  InvasionDialog "Under Siege" lockout, worldState town, invasion persists); mobile
  drag-to-pan layer intact (oversized square, touch-none, drag hint). tsc 0 / **232**
  tests / build green. Local commits, NO push.

### Original scope (delivered above)
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

### PREP NOTES (surveyed 2026-07-11 — start here, saves re-discovery)
- **Context since this phase was drafted (2026-07-09):** the 6-item demo-polish request landed
  (Phases 7, 7.5, 8 + Batch B). Directly relevant to Phase 9:
  - The **"battle-encounter rework" follow-on is PARTLY DONE** — Batch B built the chronicle boss
    **invasion** flow (`engine/chronicle.ts`, `campaign.invasion`, `InvasionDialog`). The
    zoom-into-village work MUST respect it: entering an invaded town shows the invasion dialog
    (lockout) instead of the interior. Don't regress that (see Batch B section above).
  - `CampaignState` now has `battleOrigin` + `invasion`; battles return to **town** not the map
    (item 5). `worldState` machine unchanged: `peace`(map) / `town` / `battle`.
- **Current world model** (`engine/world.ts`): `WorldLocation = { name, x, y, description }` — NO
  `type` field yet. 4 `LOCATIONS`: Starting Village (22.5,80), Copper Town (72.5,70), Silver City
  (90,36.6), Iron Citadel (50,20). `x/y` are **percentage coords** on `world_map.png`. `travelCost`
  (`engine/director.ts`) derives AP from these coords — **moving a node changes travel costs**;
  re-pin the `director.test.ts` expected values if you reposition (like Phase 4 did).
- **Map render** (`WorldMapScene.tsx`): every node draws the SAME generic gold-ring pin
  (`div … rounded-full border-2 border-[#f4d03f]`, lines ~184-207) + a name tag; current node gets
  a filled ring + a bobbing SVG party arrow. There's already **drag-to-pan on phones** (pannable
  square layer, `MOBILE_ZOOM`, 8px tap-vs-drag threshold — DON'T break it) and an SVG path polyline
  connecting nodes. Typed pointers = add `type` to `LOCATIONS` + swap the pin `div` for a per-type
  icon (emoji or inline SVG — NO new map art per the LOCK). Keep the tap-vs-drag + current-node
  handling (`handleLocationClick`: tapping the CURRENT node → `onEnterTown`; another node →
  `onTravel(name, travelCost)`).
- **Enter flow today = instant, no zoom:** `handleLocationClick` → `onEnterTown(name)` (App
  `handleEnterTown` → `updateCampaign({ worldState:'town', currentLocation:name })`) → `AdventureWorld`
  swaps `currentScene` to `town` (TownScene mounts with a `fade-in zoom-in-125` CSS anim already).
  Zoom-into-village = play a deliberate node→interior transition here (CSS scale/fade on the map
  layer + a brief overlay, then set worldState town). Keep it skippable/fast; must still route to
  the invasion dialog for a locked town.
- **Town interior ALREADY uses absolute hotspots** (`TownScene.tsx`, `activeArea:'center'|'outskirts'`):
  center shows NPC emoji at absolute positions (`getTownNPCs` → Chronicler Daniel etc.), a 🏪 Shop
  gate (`left-[72%] top-[55%]`), and a "To The Outskirts" arrow (`top-[10%]`) that flips to the
  outskirts battle view; a "[ Back to Map ]" button calls `onExit` → `handleExitTown`. So Phase 9's
  "sub-location hotspots" is an EVOLUTION of what exists (formalize a Shop / Quest-giver / Arena /
  Inn-heal / Exit hotspot set + nicer placement), not a rewrite. NPCs come from `TOWN_NPCS`
  (`world.ts`); the outskirts battle path is unchanged from Batch A/B.
- **OPEN forks — resolve at phase start via brainstorming** (creative + undecided): (a) interior =
  illustrated-per-village vs one stylized/generated hotspot layout reused for all towns; (b) the
  sub-location set (Shop / Quest-giver / Arena / Inn-heal / Exit — standard vs per-village) and which
  are real vs cosmetic (Arena/Inn don't exist yet — Inn-heal would be a NEW mechanic → scope it or
  cut it); (c) keep the 4 locations (recommended: yes). Also decide the follow-on cluster items
  (NPC dialogue depth, story arc) or DEFER them out of this phase.
- **Working notes:** `cbm-code-discovery-gate` BLOCKS Read on source → grep/sed to read, python
  string-replace to edit; Write/Edit for files you create + non-source. Dev server
  `preview_start "ledgerquest-dev"`; `preview_screenshot` times out on the CRT anim → verify via
  `preview_eval` DOM assertions (`body.innerText` is CSS-uppercased → use `/i` or element innerText),
  `localStorage.clear()`+reload first. TDD any new pure logic (world/travel/hotspot decisions). Keep
  `npm test` + `npx tsc -b` + `npm run build` green (currently **229 tests**). Commit locally, NO push.

**HANDOFF PROMPT (Phase 9):**
> Continue LedgerQuest demo polish. Read `PLANS/DemoPolishPlan.md` (Phase 9 + its PREP NOTES) +
> `PLANS/OverhaulPlan.md` + project memory (`ledgerquest-demo-polish-plan`, `ledgerquest-overhaul-plan`,
> `ledgerquest-audit-2026-07`) first. Do **Phase 9 — Map & World interactions**. This is creative work
> with undecided forks, so START by brainstorming (superpowers:brainstorming) to lock the OPEN items,
> then write a spec + plan (per the repo flow: spec in `PLANS/specs/`, plan in `PLANS/plans/`) and
> execute INLINE (superpowers:executing-plans — project memory says do NOT use subagent-driven here),
> TDD + green gates + per-task local commits, then stop and show me. **LOCKED:** keep the existing
> `world_map.png` — NO new map art; only small changes on top of it. Scope: (1) **Typed location
> pointers** — add a `type` (village/town/city/citadel) to the 4 `LOCATIONS` in `engine/world.ts`,
> reposition their `x,y` onto matching-terrain spots, and render a per-type pointer icon in
> `WorldMapScene.tsx` instead of the generic gold ring (keep the mobile drag-to-pan, the party arrow,
> the name tags, and the tap-current-node-to-enter / tap-other-node-to-travel behavior; if you move a
> node, re-pin `engine/director.test.ts` travel-cost expectations). (2) **Zoom-into-village** — a
> fade+scale transition from the tapped node into the town interior (today `handleEnterTown` swaps the
> scene instantly), kept fast/skippable. (3) **Village interior hotspots** — evolve `TownScene.tsx`'s
> already-absolute-positioned center (NPC emoji + 🏪 shop + outskirts arrow) into a clear sub-location
> hotspot set (Shop / Quest-giver / Arena / Inn-heal / Exit — decide the set + which are real vs
> cosmetic during brainstorming; note Arena/Inn are NEW and may be out of scope). CRITICAL: do NOT
> regress the Batch B invasion flow — entering an INVADED town must still show the `InvasionDialog`
> (lockout) instead of the interior, and battles still return to town (`battleOrigin`). Decide during
> brainstorming whether the follow-on cluster (real NPC dialogue system, light story arc) is in this
> phase or deferred. Working notes: `cbm-code-discovery-gate` BLOCKS Read on source → read via
> grep/sed, edit source via Bash python exact-string replace; Write/Edit fine for files you create +
> non-source. Dev server `preview_start "ledgerquest-dev"`; `preview_screenshot` times out on the CRT
> animation → verify via `preview_eval` DOM assertions (`body.innerText` is CSS-uppercased — use `/i`),
> `localStorage.clear()`+reload before checks. Keep `npm test` + `npx tsc -b` + `npm run build` green
> (currently **229 tests**), commit locally (NO push), then stop and show me.

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
