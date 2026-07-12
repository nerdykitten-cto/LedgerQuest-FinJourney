# Phase 9 — Map & World interactions — Design Spec

Date: 2026-07-12 · Plan: `PLANS/DemoPolishPlan.md` Phase 9 · Status: approved, ready to plan

## Goal
Make the world map and village interior feel like a place, not a menu — using ONLY
small changes on top of the existing `world_map.png` (LOCKED: no new map art). Three
scoped items: typed location pointers, a zoom-into-village transition, and a clear
village-interior hotspot set. Plus a light NPC-dialogue upgrade.

## Locked decisions (user, 2026-07-12 brainstorm)
- **Keep the existing `world_map.png`** — no new map art; only overlays/CSS on top.
- **Keep the 4 locations.**
- **Interior hotspot set:** the 4 real hotspots that already exist (Quest-giver/NPCs,
  Shop, Outskirts-battle, Exit) formalized into a clear typed layout, PLUS **Arena** and
  **Inn** as **cosmetic "coming soon" hotspots** (flavor only — NO new mechanic).
- **Follow-on cluster:** a **light NPC-dialogue upgrade only** (multi-line per NPC,
  advance-to-next). Branching dialogue and any story/narrative arc are **DEFERRED**.
- **Typed pointer icons:** a per-type **emoji glyph** on the existing gold-ring backing.

## Non-goals (explicitly OUT)
- New map art or a per-village illustrated interior.
- Real Inn-heal or Arena mechanics (both cosmetic this phase).
- Branching dialogue trees, a narrative arc, or an encounter-trigger rework
  (the chronicle boss invasion flow from Batch B stays exactly as-is).
- Any change to the `peace`/`town`/`battle` `worldState` machine or battle routing.

## CRITICAL invariant — do not regress
- **Batch B invasion lockout:** entering an INVADED town must still show
  `InvasionDialog` (lockout) instead of a playable interior, and battles still return
  to town via `battleOrigin`. This is safe by construction: `InvasionDialog` is an
  overlay rendered by `AdventureWorld` from `campaign.invasion && worldState==='town'
  && currentLocation===invasion.town`, decoupled from the enter transition. The zoom
  is a pre-enter visual in `WorldMapScene` and does NOT touch `worldState` routing.
- **Mobile drag-to-pan:** the pannable square layer, `MOBILE_ZOOM`, the 8px
  tap-vs-drag threshold (a drag never travels/enters), and auto-centre on the party
  must all keep working.

---

## Item 1 — Typed location pointers

### Data (`engine/world.ts`)
- Add `type: LocationType` to `WorldLocation`, where
  `type LocationType = 'village' | 'town' | 'city' | 'citadel'`.
- Reposition each node's `x,y` (percentage coords on the map) onto a matching-terrain
  landmark, and tag its type:

  | Location | type | old (x,y) | new (x,y) | landmark on `world_map.png` |
  |---|---|---|---|---|
  | Starting Village | `village` | 22.5, 80 | **26, 40** | blue-roof cottage cluster (huts, well) |
  | Copper Town | `town` | 72.5, 70 | **83, 66** | forge/foundry + docks (base-metal trade) |
  | Silver City | `city` | 90, 36.6 | **60, 12** | blossom shrine / glowing spire (top-centre) |
  | Iron Citadel | `citadel` | 50, 20 | **58, 62** | grey stone citadel tower (crystal) |

- Add `export const LOCATION_ICON: Record<LocationType, string> =
  { village:'🛖', town:'🏘️', city:'🏙️', citadel:'🏰' }`.

### Travel-cost re-pin (`engine/director.ts` unchanged; `engine/director.test.ts` updated)
- `travelCost = Math.max(4, Math.round(hypot(Δx,Δy)/7))` is unchanged; only the coords
  move, so the pinned expectations change. Expected new values (recompute + confirm by
  running the fn — do not trust hand math blindly):
  - Starting Village → Copper Town ≈ **9**
  - Copper Town → Silver City ≈ **8**
  - Silver City → Iron Citadel ≈ **7**
  - Starting Village → Iron Citadel ≈ **6**
  - Starting Village → Silver City ≈ **6**
  - Symmetry + unknown-location fallback (20) tests stay as-is.
- All hops land 6–9 AP (≤ the +8 AP from one logged expense) → economy stays
  sustainable. `validateQuest` does not read `travelCost`, so no QC regression.

### Render (`AdventureWorld/WorldMapScene.tsx`)
- Replace the plain ring's inner fill with the per-type emoji glyph
  (`LOCATION_ICON[loc.type]`, sized ~`text-2xl md:text-3xl`, drop-shadow).
- **Keep:** the gold-ring/glow backing as the marker base + hit area, the current-node
  highlight (filled ring + pulsing dot / gold accent), the selected-node scale, the
  name tag, the bobbing party arrow, the connecting polyline, and all pan/tap logic.
- `handleLocationClick` behaviour unchanged: tap the CURRENT node → enter (now via the
  zoom, item 2); tap ANOTHER node → `onTravel(name, travelCost)`; a pan gesture
  (`drag.current.moved`) still swallows the click.

---

## Item 2 — Zoom-into-village transition

`WorldMapScene.tsx` only. No change to `App.tsx`, `worldState`, or `AdventureWorld`
routing.

- Local state `entering: string | null` (the node name being entered) + a timer ref.
- When `handleLocationClick` targets the current node, instead of calling
  `onEnterTown` immediately: set `entering = name`, which drives a fast (~400ms)
  CSS transform on the map layer — `scale` up + fade — with `transform-origin` set to
  that node's `(x%, y%)` so the map appears to zoom INTO the node. On transition end
  (or a ~400ms timeout) → call `onEnterTown(name)`.
- TownScene already mounts with `animate-in fade-in zoom-in-125 duration-1000`, which
  visually continues the motion, so the two read as one zoom.
- **Skippable / fast:** (a) if the user taps again while `entering`, clear the timer
  and call `onEnterTown` immediately; (b) if `prefers-reduced-motion: reduce`, skip the
  animation and enter immediately. Keep the whole thing ≤ ~450ms.
- Panning must not trigger it (existing `drag.current.moved` guard already prevents the
  click). The pannable/non-pannable layer transform must compose with the zoom
  transform without breaking pan on phones (apply the zoom as a separate style layer or
  compose into the existing `transform` string carefully; verify pan still works).

---

## Item 3 — Village interior hotspots + light NPC dialogue

`AdventureWorld/TownScene.tsx` (+ `Shared/DialogueBox` advance support if needed).

### Hotspot layout (center area)
Formalize the `activeArea:'center'` view into a clear, spread hotspot set on different
parts of the frame. Each hotspot = an emoji/icon + label-on-hover, absolutely
positioned (as today), sized for the CRT panel with no scroll:

- **Quest-giver / NPCs** (real) — the `getTownNPCs()` NPCs; talking opens dialogue and
  fires `onTalk` (quest/tutorial objective + invasion trigger unchanged).
- **🏪 Shop** (real) — opens the existing shop overlay (`setIsShopOpen(true)`).
- **⚔️ Outskirts** (real) — the existing "To The Outskirts" → `setActiveArea('outskirts')`
  battle path (unchanged).
- **Exit** (real) — the existing "[ Back to Map ]" → `onExit`.
- **🏟️ Arena** (cosmetic) — `showDialogue("The Arena is being built — coming soon.")`.
- **🛏️ Inn** (cosmetic) — `showDialogue("The Inn will offer rest — coming soon.")`.

Keep the outskirts sub-view and the shop overlay exactly as they are. Positions chosen
so the 6 hotspots don't overlap and fit the panel (verify in browser, no page scroll).

### Light NPC dialogue upgrade
- Give each NPC a `lines: string[]` instead of a single `message` (keep it as data in
  `getTownNPCs()` / `TOWN_NPCS`-adjacent). 1–3 short lines per NPC.
- Talking to an NPC opens the DialogueBox on line 0 and fires `onTalk(npc.name,
  lines[0])` **once** (preserves the quest talk-objective + invasion trigger — those
  only need one talk event). Advancing (a "next" affordance / tapping the box) steps
  through remaining lines; the last line closes as today. No branching, no choices.
- If `DialogueBox` can't already advance multi-line, add a minimal `lines`/`onNext`
  path to it (or drive the advance from `TownScene` local state and keep DialogueBox a
  dumb single-message view). Prefer the smaller change.

---

## Testing strategy
- **Pure logic (TDD, new/updated unit tests):**
  - `engine/world.ts`: every `LOCATION` has a valid `type`; `LOCATION_ICON` covers all
    four `LocationType` values; the 4 canonical names/coords are present.
  - `engine/director.test.ts`: re-pin the 5 travel-cost expectations to the new coords
    (values confirmed by running `travelCost`), keep symmetry + fallback tests.
  - If the NPC line model gets a pure helper (e.g. next-line selection), TDD it;
    otherwise it stays trivial component state (no test).
- **Browser (preview_eval DOM assertions — `preview_screenshot` times out on the CRT
  anim; `body.innerText` is CSS-uppercased → match `/i` or read element innerText;
  `localStorage.clear()`+reload first):**
  - Map: 4 typed emoji pointers at the new positions; current-node highlight + party
    arrow present; tap a non-current node travels (AP drops by the pinned cost); mobile
    drag-to-pan still pans and a drag does not travel.
  - Zoom: tapping the current node plays the zoom then lands in the town interior;
    fast/skippable.
  - Interior: 6 hotspots present (Quest-giver, Shop, Outskirts, Exit, Arena, Inn);
    Shop opens; Outskirts → battle path; Arena/Inn show "coming soon"; NPC talk shows
    multi-line and advances; `onTalk` still ticks the quest/tutorial talk step.
  - Invasion NOT regressed: seed an invasion (per Batch B recipe) → entering the
    invaded town still shows `InvasionDialog` (lockout), not the interior.
- **Gates:** `npm test` + `npx tsc -b` + `npm run build` all green (currently 229
  tests — expect a few more from the world/travel tests). Commit locally per task, NO
  push.

## Files touched
- `APP/src/engine/world.ts` (type + coords + icon map)
- `APP/src/engine/world.test.ts` (new or extended — typed-location assertions)
- `APP/src/engine/director.test.ts` (re-pin travel costs)
- `APP/src/components/AdventureWorld/WorldMapScene.tsx` (typed pointers + zoom)
- `APP/src/components/AdventureWorld/TownScene.tsx` (hotspots + multi-line dialogue)
- `APP/src/components/AdventureWorld/Shared/DialogueBox.tsx` (only if multi-line advance
  needs it)

## Risks / watch-outs
- **Travel-cost math:** recompute from the real fn, not by hand, before pinning tests.
- **Zoom vs pan transform:** the phone pannable layer already owns a `transform`;
  the zoom must compose with it without breaking pan (verify on a mobile viewport).
- **Emoji vs pixel-art map:** keep the emoji small + on the ring backing so it reads as
  a marker, not clutter; verify current/selected states still legible.
- **DialogueBox reuse:** it's shared with map/combat dialogue — a multi-line change
  must not break single-message callers.
