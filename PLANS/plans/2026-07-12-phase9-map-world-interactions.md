# Phase 9 — Map & World interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (project memory: do NOT use subagent-driven here). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typed map pointers, a zoom-into-village transition, and a clear village-interior hotspot set (plus a light multi-line NPC dialogue) — all on top of the existing `world_map.png`, no new map art.

**Architecture:** Typed data lives in `engine/world.ts` (add `type` + `LOCATION_ICON`); the map render (`WorldMapScene.tsx`) swaps the plain ring for a per-type emoji on the ring base and adds a local pre-enter zoom animation (no `worldState`/routing change → invasion lockout stays intact); the town interior (`TownScene.tsx`) formalizes 6 hotspots (4 real + Arena/Inn cosmetic) and drives multi-line NPC dialogue from local state via the existing dumb `DialogueBox`.

**Tech Stack:** React 19 + TS + Vite + Tailwind; Vitest unit tests; localStorage persistence. Read source via grep/sed (Read gated); edit source via Bash python exact-string replace; Write/Edit only for files you create.

**Spec:** `PLANS/specs/2026-07-12-phase9-map-world-interactions-design.md`

---

## Working notes (apply to every task)
- `cbm-code-discovery-gate` BLOCKS the Read tool on source. Read via `grep`/`sed`; edit
  via Bash python exact-string replace (assert the replacement count). Write/Edit are
  fine for NEW files (e.g. `world.test.ts`) and non-source.
- All commands run from `APP/`: `cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP`.
- Gates before each commit that touches source: `npx tsc -b` (0 errors) + `npm run build`.
  `npm test` after any test/engine change.
- Commits are LOCAL on `main` (project convention — every prior phase did this). NO push.
- Browser verify with `preview_start "ledgerquest-dev"` + `preview_eval` DOM assertions
  (`preview_screenshot` times out on the CRT anim). `body.innerText` is CSS-uppercased →
  match `/i` or read an element's innerText. `localStorage.clear()`+reload before checks.

---

## Task 1: Typed location data + icon map + travel-cost re-pin

**Files:**
- Modify: `src/engine/world.ts` (interface + 4 locations + icon map)
- Create: `src/engine/world.test.ts`
- Modify: `src/engine/director.test.ts` (re-pin the 5 travel costs; comment)

- [ ] **Step 1: Write the failing test** — create `src/engine/world.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LOCATIONS, LOCATION_ICON, type LocationType } from './world';

const TYPES: LocationType[] = ['village', 'town', 'city', 'citadel'];

describe('world LOCATIONS typing', () => {
  it('tags every location with a valid settlement type', () => {
    expect(LOCATIONS).toHaveLength(4);
    for (const loc of LOCATIONS) {
      expect(TYPES).toContain(loc.type);
    }
  });

  it('assigns the canonical type per location', () => {
    const byName = Object.fromEntries(LOCATIONS.map(l => [l.name, l.type]));
    expect(byName['Starting Village']).toBe('village');
    expect(byName['Copper Town']).toBe('town');
    expect(byName['Silver City']).toBe('city');
    expect(byName['Iron Citadel']).toBe('citadel');
  });

  it('has a pointer glyph for every settlement type', () => {
    for (const t of TYPES) {
      expect(LOCATION_ICON[t]).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run it, verify RED**

Run: `cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && npx vitest run src/engine/world.test.ts`
Expected: FAIL — `LOCATION_ICON` not exported / `type` missing on `WorldLocation`.

- [ ] **Step 3: Implement in `src/engine/world.ts`.** Replace the `WorldLocation`
  interface + the `LOCATIONS` array with the typed + repositioned version, and append
  `LOCATION_ICON`. Use a python exact-string replace. New content:

```ts
export type LocationType = 'village' | 'town' | 'city' | 'citadel';

export interface WorldLocation {
  name: string;
  x: number; // percentage coords on the world map
  y: number;
  description: string;
  type: LocationType;
}

export const LOCATIONS: WorldLocation[] = [
  { name: 'Starting Village', x: 26, y: 40, type: 'village', description: 'A humble beginning for a grand ledger.' },
  { name: 'Copper Town', x: 83, y: 66, type: 'town', description: 'The hub of base metal trade.' },
  { name: 'Silver City', x: 60, y: 12, type: 'city', description: 'Glistening spires of high-yield capital.' },
  { name: 'Iron Citadel', x: 58, y: 62, type: 'citadel', description: 'The fortress of impenetrable savings.' },
];

/** Per-settlement-type map pointer glyph (emoji placeholder — no new map art). */
export const LOCATION_ICON: Record<LocationType, string> = {
  village: '🛖',
  town: '🏘️',
  city: '🏙️',
  citadel: '🏰',
};
```

  Concretely, run:
```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
import re,io
p='src/engine/world.ts'
s=open(p).read()
old_iface='''export interface WorldLocation {
  name: string;
  x: number; // percentage coords on the world map
  y: number;
  description: string;
}'''
new_iface='''export type LocationType = 'village' | 'town' | 'city' | 'citadel';

export interface WorldLocation {
  name: string;
  x: number; // percentage coords on the world map
  y: number;
  description: string;
  type: LocationType;
}'''
assert s.count(old_iface)==1, 'iface anchor not unique'
s=s.replace(old_iface,new_iface)
old_locs='''export const LOCATIONS: WorldLocation[] = [
  { name: 'Starting Village', x: 22.5, y: 80, description: 'A humble beginning for a grand ledger.' },
  { name: 'Copper Town', x: 72.5, y: 70, description: 'The hub of base metal trade.' },
  { name: 'Silver City', x: 90, y: 36.6, description: 'Glistening spires of high-yield capital.' },
  { name: 'Iron Citadel', x: 50, y: 20, description: 'The fortress of impenetrable savings.' },
];'''
new_locs='''export const LOCATIONS: WorldLocation[] = [
  { name: 'Starting Village', x: 26, y: 40, type: 'village', description: 'A humble beginning for a grand ledger.' },
  { name: 'Copper Town', x: 83, y: 66, type: 'town', description: 'The hub of base metal trade.' },
  { name: 'Silver City', x: 60, y: 12, type: 'city', description: 'Glistening spires of high-yield capital.' },
  { name: 'Iron Citadel', x: 58, y: 62, type: 'citadel', description: 'The fortress of impenetrable savings.' },
];

/** Per-settlement-type map pointer glyph (emoji placeholder — no new map art). */
export const LOCATION_ICON: Record<LocationType, string> = {
  village: '\\u{1F6D6}',
  town: '\\u{1F3D8}\\uFE0F',
  city: '\\u{1F3D9}\\uFE0F',
  citadel: '\\u{1F3F0}',
};'''
assert s.count(old_locs)==1, 'locs anchor not unique'
s=s.replace(old_locs,new_locs)
open(p,'w').write(s)
print('world.ts patched')
PY
```
  NOTE: the python writes emoji as JS `\u{...}` escapes to avoid shell/encoding issues;
  they compile to the same glyphs. Verify with `grep -n "1F6D6\|LocationType\|x: 26" src/engine/world.ts`.

- [ ] **Step 4: Re-pin `src/engine/director.test.ts`.** The coord move changes
  `travelCost`. Replace the pinned block (verified by running the fn: 9/8/7/6/6):

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/engine/director.test.ts'
s=open(p).read()
old='''    // Pinned economy (Phase 4): adjacent hops <= +8 AP from one expense.
    expect(travelCost('Starting Village', 'Copper Town')).toBe(7);
    expect(travelCost('Copper Town', 'Silver City')).toBe(5);
    expect(travelCost('Silver City', 'Iron Citadel')).toBe(6);
    // Full cross-map trips stay a real cost, but still under the legacy 20.
    expect(travelCost('Starting Village', 'Iron Citadel')).toBe(9);
    expect(travelCost('Starting Village', 'Silver City')).toBe(11);'''
new='''    // Pinned economy (Phase 9 re-position): hops land 6-9 AP, still <= the legacy 20
    // and near the +8 AP from one logged expense.
    expect(travelCost('Starting Village', 'Copper Town')).toBe(9);
    expect(travelCost('Copper Town', 'Silver City')).toBe(8);
    expect(travelCost('Silver City', 'Iron Citadel')).toBe(7);
    expect(travelCost('Starting Village', 'Iron Citadel')).toBe(6);
    expect(travelCost('Starting Village', 'Silver City')).toBe(6);'''
assert s.count(old)==1, 'director pin anchor not unique'
s=s.replace(old,new)
open(p,'w').write(s)
print('director.test.ts re-pinned')
PY
```

- [ ] **Step 5: Run tests + typecheck, verify GREEN**

Run: `cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && npx vitest run src/engine/world.test.ts src/engine/director.test.ts && npx tsc -b`
Expected: world (3) + director suite PASS; tsc 0 errors. Then full `npm test` PASS
(expect 229 + 3 = **232**).

- [ ] **Step 6: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO && git add APP/src/engine/world.ts APP/src/engine/world.test.ts APP/src/engine/director.test.ts && git commit -m "feat(phase9): typed + repositioned world locations, travel re-pin

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Typed emoji pointers on the map

**Files:**
- Modify: `src/components/AdventureWorld/WorldMapScene.tsx` (import + node pin render)

- [ ] **Step 1: Add `LOCATION_ICON` to the world import.** Replace:

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/WorldMapScene.tsx'
s=open(p).read()
old="import { LOCATIONS } from '../../engine/world';"
new="import { LOCATIONS, LOCATION_ICON } from '../../engine/world';"
assert s.count(old)==1
s=s.replace(old,new); open(p,'w').write(s); print('import ok')
PY
```

- [ ] **Step 2: Replace the plain-ring pin with the typed emoji + ring base.** The
  current block (the `{/* Map Pin Icon */}` div) becomes an emoji glyph above a smaller
  gold-ring base that keeps the current-node highlight + selected scale:

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/WorldMapScene.tsx'
s=open(p).read()
old='''            {/* Map Pin Icon */}
            <div className={`w-4 h-4 md:w-6 md:h-6 rounded-full border-2 border-[#f4d03f] flex items-center justify-center transition-transform ${selectedLocation === loc.name ? 'scale-125' : 'scale-100'} ${campaign.currentLocation === loc.name ? 'bg-[#f4d03f]' : 'bg-[#171f33]'}`}>
              {campaign.currentLocation === loc.name && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse" />}
            </div>'''
new='''            {/* Typed pointer: per-settlement emoji glyph over the gold-ring base.
                Keeps the current-node highlight (filled ring + pulse) + selected scale. */}
            <div className={`relative flex flex-col items-center transition-transform ${selectedLocation === loc.name ? 'scale-125' : 'scale-100'}`}>
              <span className="text-2xl md:text-3xl leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)] select-none" role="img" aria-label={loc.type}>
                {LOCATION_ICON[loc.type]}
              </span>
              <div className={`mt-0.5 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-[#f4d03f] flex items-center justify-center ${campaign.currentLocation === loc.name ? 'bg-[#f4d03f]' : 'bg-[#171f33]'}`}>
                {campaign.currentLocation === loc.name && <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white animate-pulse" />}
              </div>
            </div>'''
assert s.count(old)==1, 'pin anchor not unique'
s=s.replace(old,new); open(p,'w').write(s); print('pin replaced')
PY
```

- [ ] **Step 3: Typecheck + build, verify GREEN**

Run: `cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && npx tsc -b && npm run build`
Expected: 0 TS errors; build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO && git add APP/src/components/AdventureWorld/WorldMapScene.tsx && git commit -m "feat(phase9): per-type emoji map pointers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Zoom-into-village transition

**Files:**
- Modify: `src/components/AdventureWorld/WorldMapScene.tsx` (state, enter helpers, layer style, container skip-click, current-node click branch)

Behaviour: tapping the CURRENT node sets `entering`, which zooms the map layer INTO
that node's (x,y) (~400ms scale+fade) then calls `onEnterTown`. Skippable (second tap /
reduced-motion). No change to `App.tsx`/`worldState` → invasion lockout unaffected.

- [ ] **Step 1: Add zoom state + helpers.** Insert right after the existing
  `const [selectedLocation, setSelectedLocation] = useState<...>` line (find it first
  with `grep -n "selectedLocation" src/components/AdventureWorld/WorldMapScene.tsx`).
  Use this python (anchored on the `handleLocationClick` definition, inserting the
  helpers just above it):

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/WorldMapScene.tsx'
s=open(p).read()
anchor='  const handleLocationClick = (name: string) => {'
helpers='''  // Zoom-into-village: a fast pre-enter animation that scales the map INTO the
  // tapped node before swapping to the town scene. Purely visual — does not touch
  // worldState routing, so the Batch B invasion lockout is unaffected.
  const [entering, setEntering] = useState<string | null>(null);
  const enterTimer = useRef<number | null>(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const doEnter = (name: string) => {
    if (enterTimer.current) { window.clearTimeout(enterTimer.current); enterTimer.current = null; }
    setEntering(null);
    onEnterTown(name);
  };

  const beginEnter = (name: string) => {
    if (prefersReducedMotion) { doEnter(name); return; }
    setEntering(name);
    enterTimer.current = window.setTimeout(() => doEnter(name), 400);
  };

  useEffect(() => () => { if (enterTimer.current) window.clearTimeout(enterTimer.current); }, []);

'''
assert s.count(anchor)==1, 'handleLocationClick anchor not unique'
s=s.replace(anchor, helpers+anchor)
open(p,'w').write(s); print('helpers inserted')
PY
```

  NOTE: this uses `useState`, `useRef`, `useEffect` — all already imported in this file
  (it already uses `useRef` for `containerRef`/`drag` and `useEffect` for auto-centre).
  Confirm with `grep -n "^import React" src/components/AdventureWorld/WorldMapScene.tsx`;
  if `useEffect` is missing from the import, add it.

- [ ] **Step 2: Route the current-node tap through the zoom.** Replace the current-node
  branch inside `handleLocationClick`:

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/WorldMapScene.tsx'
s=open(p).read()
old='''    if (name === campaign.currentLocation) {
      onEnterTown(name); // tap the village you are standing on to enter it
      return;
    }'''
new='''    if (name === campaign.currentLocation) {
      // tap the village you are standing on to enter it (with a zoom).
      if (entering) { doEnter(name); return; } // second tap skips the animation
      beginEnter(name);
      return;
    }'''
assert s.count(old)==1
s=s.replace(old,new); open(p,'w').write(s); print('click branch ok')
PY
```

- [ ] **Step 3: Apply the zoom to the map layer + a skip-click on the container.**
  Replace the map-layer opening `<div data-testid="map-layer" ...>` (with its inline
  `style={pannable ? {...} : undefined}`) with a computed `layerStyle` that appends
  `scale(2.2)` + `transform-origin` at the entering node + fade; and add an
  `onClick` on the outer container that skips when `entering`:

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/WorldMapScene.tsx'
s=open(p).read()

# 3a: container onClick to skip the animation on a second tap anywhere.
old_container='''      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >'''
new_container='''      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={entering ? () => doEnter(entering) : undefined}
    >'''
assert s.count(old_container)==1, 'container anchor not unique'
s=s.replace(old_container,new_container)

# 3b: compute layerStyle just before the return's map-layer div by replacing the
# inline style expression on the map-layer div.
old_layer='''      <div
        data-testid="map-layer"
        className={`absolute will-change-transform ${pannable ? '' : 'inset-0'}`}
        style={pannable ? {
          width: side,
          height: side,
          left: '50%',
          top: '50%',
          transform: `translate3d(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px), 0)`,
          transition: drag.current.down ? 'none' : 'transform 0.12s ease-out',
        } : undefined}
      >'''
new_layer='''      <div
        data-testid="map-layer"
        className={`absolute will-change-transform ${pannable ? '' : 'inset-0'}`}
        style={(() => {
          const enterLoc = entering ? LOCATIONS.find(l => l.name === entering) : null;
          const baseTransform = pannable
            ? `translate3d(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px), 0)`
            : '';
          const st: React.CSSProperties = pannable
            ? {
                width: side,
                height: side,
                left: '50%',
                top: '50%',
                transform: baseTransform,
                transition: drag.current.down ? 'none' : 'transform 0.12s ease-out',
              }
            : {};
          if (enterLoc) {
            st.transformOrigin = `${enterLoc.x}% ${enterLoc.y}%`;
            st.transform = `${baseTransform} scale(2.2)`.trim();
            st.opacity = 0;
            st.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
          }
          return st;
        })()}
      >'''
assert s.count(old_layer)==1, 'layer anchor not unique'
s=s.replace(old_layer,new_layer)
open(p,'w').write(s); print('zoom applied')
PY
```

- [ ] **Step 4: Typecheck + build**

Run: `cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && npx tsc -b && npm run build`
Expected: 0 TS errors; build succeeds. (`React.CSSProperties` — `React` is already
imported as default in this file.)

- [ ] **Step 5: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO && git add APP/src/components/AdventureWorld/WorldMapScene.tsx && git commit -m "feat(phase9): zoom-into-village enter transition (skippable)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Village interior hotspots (Arena + Inn cosmetic; spread the set)

**Files:**
- Modify: `src/components/AdventureWorld/TownScene.tsx` (nudge NPC row + shop; add Arena/Inn cosmetic hotspots)

- [ ] **Step 1: Nudge NPC row + shop so the 6 hotspots don't collide.** NPCs → top 62%;
  shop → `left-[72%] md:left-[76%] top-[58%]`:

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/TownScene.tsx'
s=open(p).read()
# NPC row position
old_npc="                style={{ left: `${20 + i * 30}%`, top: '60%' }}"
new_npc="                style={{ left: `${18 + i * 26}%`, top: '62%' }}"
assert s.count(old_npc)==1, 'npc pos anchor not unique'
s=s.replace(old_npc,new_npc)
# Shop gate position
old_shop='              className="absolute left-[72%] md:left-[80%] top-[55%] -translate-x-1/2 flex flex-col items-center group cursor-pointer"'
new_shop='              className="absolute left-[72%] md:left-[76%] top-[58%] -translate-x-1/2 flex flex-col items-center group cursor-pointer"'
assert s.count(old_shop)==1, 'shop pos anchor not unique'
s=s.replace(old_shop,new_shop)
open(p,'w').write(s); print('positions nudged')
PY
```

- [ ] **Step 2: Add Arena + Inn cosmetic hotspots.** Insert them right after the Shop
  Gate block, before the `{/* Move to Outskirts */}` comment:

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/TownScene.tsx'
s=open(p).read()
anchor='            {/* Move to Outskirts */}'
block='''            {/* Arena — cosmetic hotspot (no mechanic yet) */}
            <div
              className="absolute left-[20%] top-[30%] -translate-x-1/2 flex flex-col items-center group cursor-pointer"
              onClick={() => showDialogue('The Arena is being built — challenges are coming soon.')}
            >
              <div className="text-5xl mb-2 opacity-80 group-hover:scale-110 group-hover:-translate-y-2 transition-all">\\u{1F3DF}\\uFE0F</div>
              <div className="bg-[#171f33]/90 border border-[#4c4634] px-3 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                 <span className="font-label text-[10px] uppercase font-bold text-[#dbe2fd]">Arena &middot; Soon</span>
              </div>
            </div>

            {/* Inn — cosmetic hotspot (no heal mechanic yet) */}
            <div
              className="absolute left-[74%] md:left-[78%] top-[30%] -translate-x-1/2 flex flex-col items-center group cursor-pointer"
              onClick={() => showDialogue('The Inn will offer rest and healing — coming soon.')}
            >
              <div className="text-5xl mb-2 opacity-80 group-hover:scale-110 group-hover:-translate-y-2 transition-all">\\u{1F6CF}\\uFE0F</div>
              <div className="bg-[#171f33]/90 border border-[#4c4634] px-3 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                 <span className="font-label text-[10px] uppercase font-bold text-[#dbe2fd]">Inn &middot; Soon</span>
              </div>
            </div>

'''
assert s.count(anchor)==1, 'outskirts anchor not unique'
s=s.replace(anchor, block+anchor)
open(p,'w').write(s); print('cosmetic hotspots added')
PY
```
  (🏟️ = `\u{1F3DF}️`, 🛏️ = `\u{1F6CF}️` — written as escapes to dodge shell
  encoding; they render as the emoji. Verify: `grep -n "1F3DF\|1F6CF\|Arena\|Inn" src/components/AdventureWorld/TownScene.tsx`.)

- [ ] **Step 3: Typecheck + build**

Run: `cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && npx tsc -b && npm run build`
Expected: 0 TS errors; build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO && git add APP/src/components/AdventureWorld/TownScene.tsx && git commit -m "feat(phase9): village interior hotspot set + cosmetic Arena/Inn

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Light multi-line NPC dialogue

**Files:**
- Modify: `src/components/AdventureWorld/TownScene.tsx` (import DialogueBox; `lines[]` per NPC; local dialogue state + render; talk handler)
- Modify: `src/components/AdventureWorld/AdventureWorld.tsx` (slim `handleNPCTalk` so it no longer shows the shared box — the local box owns NPC display)

- [ ] **Step 1: Slim `handleNPCTalk` in AdventureWorld** so NPC talk no longer triggers
  the shared `DialogueBox` (TownScene's local box will show the lines); it still
  forwards `onTalk` (quest/tutorial objective + invasion trigger):

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/AdventureWorld.tsx'
s=open(p).read()
old='''  const handleNPCTalk = (npcName: string, message: string) => {
    showDialogue(message);
    onTalk(npcName, message);
  };'''
new='''  // NPC lines are shown by TownScene's own DialogueBox (multi-line advance);
  // here we only forward the talk event (quest/tutorial objective + invasion trigger).
  const handleNPCTalk = (npcName: string, message: string) => {
    onTalk(npcName, message);
  };'''
assert s.count(old)==1, 'handleNPCTalk anchor not unique'
s=s.replace(old,new); open(p,'w').write(s); print('handleNPCTalk slimmed')
PY
```

- [ ] **Step 2: Import DialogueBox + add local NPC-line state in TownScene.** Add the
  import and a `useState`:

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/TownScene.tsx'
s=open(p).read()
# import DialogueBox (after the GEAR_CATALOG import line)
old_imp="import { GEAR_CATALOG } from '../../data/gear';"
new_imp="import { GEAR_CATALOG } from '../../data/gear';\nimport { DialogueBox } from './Shared/DialogueBox';"
assert s.count(old_imp)==1
s=s.replace(old_imp,new_imp)
# local state after the activeArea state line
old_st="  const [activeArea, setActiveArea] = useState<'center' | 'outskirts'>('center');"
new_st="  const [activeArea, setActiveArea] = useState<'center' | 'outskirts'>('center');\n  const [npcDialogue, setNpcDialogue] = useState<{ lines: string[]; idx: number } | null>(null);"
assert s.count(old_st)==1
s=s.replace(old_st,new_st)
open(p,'w').write(s); print('import + state added')
PY
```

- [ ] **Step 3: Give each NPC a `lines: string[]`.** Replace the whole `getTownNPCs`
  body so every NPC carries 1–3 short lines instead of a single `message`. (Keeping the
  first line equal to the old message preserves the talk-objective text.)

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/TownScene.tsx'
s=open(p).read()
import re
start=s.index('  const getTownNPCs = () => {')
end=s.index('  };', start)+len('  };')
new_fn='''  const getTownNPCs = () => {
    switch (name) {
      case 'Starting Village':
        return [
          { id: 'n1', name: 'Chronicler Daniel', area: 'center', icon: '🧙‍♂️', lines: [
            "Welcome, scribe. To clear the fog of debt, one must first document the flow. Log your expenses to earn Action Points.",
            "Every coin you record sharpens your focus — and focus is what fuels a hero.",
          ] },
          { id: 'n2', name: 'Stablemaster', area: 'center', icon: '🏇', lines: [
            "The road to Iron Citadel is long. Ensure your Action Reserve is full before departing.",
            "Rest your steed, mind your ledger. Both carry you further than gold alone.",
          ] }
        ];
      case 'Copper Town':
        return [
          { id: 'n3', name: 'Copper Smith', area: 'center', icon: '⚒️', lines: [
            "Base metals for base needs. Efficiency is the key to profit.",
            "Temper your spending like I temper steel — slow, deliberate, unbreakable.",
          ] },
          { id: 'n4', name: 'Market Overseer', area: 'center', icon: '⚖️', lines: [
            "The ledger must balance, even here in the mud.",
          ] }
        ];
      case 'Silver City':
        return [
          { id: 'n5', name: 'High Banker', area: 'center', icon: '🏛️', lines: [
            "Interest never sleeps, and neither should your focus on savings.",
            "Compound your discipline daily and the spires of this city will feel small.",
          ] },
          { id: 'n6', name: 'Guild Master', area: 'center', icon: '🎭', lines: [
            "Join the elite scribes. Master your budget, master the realm.",
          ] }
        ];
      case 'Iron Citadel':
        return [
          { id: 'n7', name: 'Commander Fortis', area: 'center', icon: '💂', lines: [
            "The fortress of savings is impenetrable. Your discipline is your shield.",
            "Debt lays siege to the careless. You will not be careless.",
          ] },
          { id: 'n8', name: 'Grand Archivist', area: 'center', icon: '📜', lines: [
            "Every copper logged is a brick in the wall of your future.",
          ] }
        ];
      default:
        return [
          { id: 'n9', name: 'Traveler', area: 'center', icon: '🚶', lines: [
            "The map is vast, but the ledger is vaster.",
          ] }
        ];
    }
  };'''
s=s[:start]+new_fn+s[end:]
open(p,'w').write(s); print('getTownNPCs rewritten')
PY
```

- [ ] **Step 4: Update the talk handler + the NPC-render message ref + render the local
  box.** (a) `handleNPCInteraction` fires `onTalk` once with `lines[0]` and opens the
  local box; (b) render a `DialogueBox` driven by `npcDialogue`; (c) cosmetic Arena/Inn
  clicks clear any open NPC box first (avoid two boxes).

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && python3 - <<'PY'
p='src/components/AdventureWorld/TownScene.tsx'
s=open(p).read()

# 4a: talk handler
old_h='''  const handleNPCInteraction = (npc: typeof NPCs[0]) => {
    showDialogue(npc.message);
    onTalk(npc.name, npc.message);
  };'''
new_h='''  const handleNPCInteraction = (npc: typeof NPCs[0]) => {
    onTalk(npc.name, npc.lines[0]); // fire the quest/tutorial talk objective once
    setNpcDialogue({ lines: npc.lines, idx: 0 });
  };'''
assert s.count(old_h)==1, 'talk handler anchor not unique'
s=s.replace(old_h,new_h)

# 4b: cosmetic hotspots clear the NPC box first
s=s.replace(
  "onClick={() => showDialogue('The Arena is being built — challenges are coming soon.')}",
  "onClick={() => { setNpcDialogue(null); showDialogue('The Arena is being built — challenges are coming soon.'); }}")
s=s.replace(
  "onClick={() => showDialogue('The Inn will offer rest and healing — coming soon.')}",
  "onClick={() => { setNpcDialogue(null); showDialogue('The Inn will offer rest and healing — coming soon.'); }}")

# 4c: render the local advancing DialogueBox just before the closing Shop Overlay /
# end of component. Anchor on the Exit button block's closing so it sits above overlays.
anchor='''      {/* Shop Overlay */}'''
box='''      {/* NPC dialogue — local, multi-line advance (dumb shared DialogueBox) */}
      {npcDialogue && (
        <DialogueBox
          message={npcDialogue.lines[npcDialogue.idx]}
          isVisible={true}
          onClose={() =>
            setNpcDialogue(prev =>
              prev && prev.idx < prev.lines.length - 1
                ? { ...prev, idx: prev.idx + 1 }
                : null
            )
          }
        />
      )}

'''
assert s.count(anchor)==1, 'shop overlay anchor not unique'
s=s.replace(anchor, box+anchor)
open(p,'w').write(s); print('talk handler + local box wired')
PY
```

- [ ] **Step 5: Typecheck + build + full tests**

Run: `cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && npx tsc -b && npm run build && npm test`
Expected: 0 TS errors; build succeeds; **232** tests pass (no test change since Task 1).
If tsc flags `npc.message` still referenced anywhere, grep it out — the NPC objects no
longer have `message` (only `lines`); the JSX NPC name render uses `npc.name`/`npc.icon`
which are unchanged.

- [ ] **Step 6: Commit**

```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO && git add APP/src/components/AdventureWorld/TownScene.tsx APP/src/components/AdventureWorld/AdventureWorld.tsx && git commit -m "feat(phase9): light multi-line NPC dialogue

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Browser verification + final gates

**Files:** none (verification only; a follow-up fix commit if a check fails).

- [ ] **Step 1: Start the dev server + clean state**

Run: `preview_start "ledgerquest-dev"` then in `preview_eval`:
`localStorage.clear(); location.reload();`
(Fresh scratch → onboarding gate. To reach the map you must pass the budget→AP gate, OR
seed a mid-game campaign directly — see Step 2.)

- [ ] **Step 2: Seed a playable map state** (skip the onboarding gate for verification)
  via `preview_eval`, mirroring the Batch B recipe:
```js
localStorage.setItem('player/profile', JSON.stringify({ onboardingComplete: true, tutorialDone: true }));
localStorage.setItem('player/stats', JSON.stringify({ level: 1, exp: 0, ap: 40, gold: 500, monthlyBudget: 3000, currency: 'USD', attack: 0, defense: 0 }));
localStorage.setItem('player/campaign', JSON.stringify({ worldState: 'peace', currentLocation: 'Starting Village' }));
location.reload();
```
  Open the Strategic Map tab (Quests). Assert the map renders:
  `document.querySelector('[data-testid="map-layer"]') !== null`.

- [ ] **Step 3: Assert typed pointers.** Via `preview_eval`, confirm 4 emoji pointers
  and the type labels (aria-label per node):
```js
[...document.querySelectorAll('[data-testid="map-layer"] [role="img"]')].map(e => e.getAttribute('aria-label'));
// expect ['village','town','city','citadel'] (order per LOCATIONS)
```

- [ ] **Step 4: Assert travel + pan.** Tapping a non-current node travels (AP drops by
  the pinned cost). Confirm at desktop width the map fills (no pan) and at a mobile
  viewport (`preview_resize` mobile) the drag-to-pan still pans and a drag does not
  travel. Check the AP value before/after a travel click via the AP testid
  (`[data-testid="ap-value"]`), expecting −6..−9.

- [ ] **Step 5: Assert zoom-into-village + interior.** Tap the current node (Starting
  Village); confirm the map animates then the town interior mounts
  (`document.querySelector('[data-testid="adventure-world"]')` shows the town — assert
  the town header text via element innerText, matched `/starting village/i`). In the
  interior assert 6 hotspots reachable: the NPC emoji, 🏪 shop (opens the shop overlay on
  click), the outskirts arrow, the Exit button, and the Arena/Inn cosmetic hotspots
  (clicking Arena/Inn shows a "coming soon" dialogue — read the DialogueBox element
  innerText, `/coming soon/i`).

- [ ] **Step 6: Assert multi-line NPC dialogue.** Click Chronicler Daniel; the local
  DialogueBox shows line 0; clicking it advances to line 1; clicking again closes it.
  Confirm the shared box is NOT double-rendered (only one DialogueBox at a time).

- [ ] **Step 7: Assert invasion NOT regressed.** Seed an invasion + enter the town:
```js
localStorage.setItem('player/campaign', JSON.stringify({ worldState: 'peace', currentLocation: 'Starting Village', invasion: { town: 'Starting Village', questId: 'q-test', bossName: 'Debt Gnomes' } }));
location.reload();
```
  Open the map, tap Starting Village (zoom → enter). Assert `InvasionDialog` shows
  (lockout) — read the overlay's text (`/under siege/i` via element innerText, since
  `body.innerText` is CSS-uppercased) — and the playable interior hotspots are NOT the
  primary surface. This proves the zoom did not bypass the lockout.

- [ ] **Step 8: Final gates**

Run: `cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO/APP && npm test && npx tsc -b && npm run build`
Expected: **232** tests pass; 0 TS errors; build succeeds.

- [ ] **Step 9: Update the plan doc + memory, commit any verification-fix.** If any check
  triggered a fix, commit it. Then update `PLANS/DemoPolishPlan.md` Phase 9 checkboxes
  to done with a VERIFIED note, and add a Phase 9 DONE line to the
  `ledgerquest-demo-polish-plan` memory. Commit:
```bash
cd /home/nerdcat/Documents/PROJECTS/GAMES/BOTH/FinanceRPG-DEMO && git add -A && git commit -m "docs(phase9): mark Map & World interactions done + verified

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
  Then STOP and show the user.

---

## Self-review notes (author)
- **Spec coverage:** Item 1 typed pointers → Tasks 1–2; reposition + re-pin → Task 1;
  Item 2 zoom → Task 3; Item 3 hotspots → Task 4; light NPC dialogue → Task 5; invasion
  invariant → Task 6 Step 7; mobile pan preserved → Task 3 (compose transform) + Task 6
  Step 4. All spec sections covered.
- **No placeholders:** every code/edit step has concrete content + an anchored,
  assertion-guarded python replace.
- **Type consistency:** `LocationType`, `LOCATION_ICON`, `entering`, `npcDialogue`,
  `handleNPCTalk` used consistently across tasks; NPC objects drop `message` for
  `lines` in the same task that updates every reader (Task 5).
- **Risk:** if the map-layer `style` anchor in Task 3 Step 3b has drifted from the
  survey, re-grep the exact current block and adapt the `old_layer` string before
  running (the assertion will catch a mismatch rather than silently corrupt).
