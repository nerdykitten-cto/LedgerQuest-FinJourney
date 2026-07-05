# LedgerQuest

Turn real-world budgeting into a retro RPG. Every expense you log, budget you
keep, and habit you hold becomes fuel for a party of adventurers exploring a
world map, clearing towns, and winning turn-based battles.

LedgerQuest is a fully **offline, single-player** web app — all state lives in
your browser's `localStorage`. No account, no backend, no cloud calls.

## How it plays

The app has four tabs:

- **Ledger** — Log expenses and set your monthly budget. Logging an expense
  earns **Action Points (AP)**: **+5 base, +3 bonus** while you stay under
  budget (**+8 AP** total). AP is the currency of the adventure.
- **Trials** — Two kinds of self-improvement:
  - **Rituals** (habits) — repeatable; "Perform Ritual" pays AP and builds a
    streak. Create new ones with **New Ritual**.
  - **Feats** (tasks) — one-time to-dos that pay a one-off AP reward.
- **Quests** — The **Strategic Map**. Spend AP to travel between towns, embark
  on quests, enter towns, talk to NPCs, and fight. Side panels: the **War Room**
  (party formation) and the **Vault** (inventory).
- **Archive** — Historical records and goal calibration: expense ledger, budget
  streams, **Savings Vaults**, and the **Engine Log**.

### The core loop

1. **Log an expense** → earn AP.
2. **Embark** on a quest — costs its AP quota (gated by the Royal Writ screen).
3. **Travel / enter a town** — travel cost is distance-based on the map
   (~5–11 AP between towns, minimum 4); entering the town you're standing on is
   free.
4. **Talk** to the objective NPC to advance the quest.
5. **Fight** in the Outskirts — each STRIKE costs 1 AP; win to earn exp + gold.
6. **Claim** the quest reward once every objective is met.

## Feature set

- **Adventure engine** — Interactive world map, zoomed town scenes, and
  turn-based combat, all rendered inside a retro CRT-TV frame. The scene code is
  lazily loaded, so the app shell starts fast and the game world streams in when
  you open the map.
- **Game Director** — A deterministic decision engine (`APP/src/engine/`) that
  drives the game from a single event stream. It handles daily ticks, quest
  forging, enemy AI and scaling, adaptive difficulty, and reward calculation.
  Every decision is recorded as an **observe → infer → decide → act** trace,
  viewable in the **Engine Log**.
- **Quests** — Main-story and auto-forged side quests ("The {Category} Menace"
  from your top spending) with multi-objective progress and manual reward claim.
- **War Room** — Recruit and dismiss party members. Recruiting requires being in
  a town and paying a gold signing fee that scales with party size; the party
  leader cannot be dismissed.
- **Savings Vaults** — Create savings goals, deposit toward them, and watch them
  seal when funded. Includes a Danger Zone "Reset Adventure" that wipes all
  progress and reseeds the world.
- **Budget calibration** — Set a monthly allowance and track "Remaining Safe"
  per category.

## Tech stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS.
- **Persistence:** Browser `localStorage`, behind a single unified API
  (`APP/src/persistenceService.ts`). Same-tab reactivity is driven by a manual
  `storage` event dispatch.
- **Engine:** Pure, deterministic TypeScript modules (`APP/src/engine/`) — no
  external AI, no network. Unit-tested with Vitest.
- **Serving:** Multi-stage Docker build (Node build → Nginx static serve),
  parameterized by the `PORT` env var for container platforms such as Cloud Run.

## Develop locally

```bash
cd APP
npm install
npm run dev        # http://localhost:5173
```

### Tests

```bash
cd APP
npm test           # Vitest unit tests (engine + persistence)
npm run test:e2e   # Playwright end-to-end (needs a dev server)
npm run build      # tsc -b && vite build
```

## Build & run the container

```bash
# from the repo root
docker build -t ledgerquest .
docker run --rm -e PORT=8080 -p 8080:8080 ledgerquest
# open http://localhost:8080
```

The image builds `APP/` and serves the static `dist/` with Nginx. At startup
`envsubst` substitutes `${PORT}` into the Nginx config so the container honors
the platform-assigned port.
