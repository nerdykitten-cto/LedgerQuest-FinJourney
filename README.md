# LedgerQuest — Demo

**Turn real-world budgeting into a retro RPG.** Every expense you log and every
budget you keep becomes **Action Points** — the fuel for a party of adventurers
exploring a world map, clearing towns, and winning turn-based battles.

▶ **Live demo:** https://ledgerquest-demo.web.app

LedgerQuest is a fully **offline, single-player** web app: all state lives in your
browser's `localStorage`. No account, no backend, no cloud calls. This build is a
public **demo** of the concept — a *PixelOre* product, not a real financial tool
(yet).

At its core it's a **personal finance tracker** — a ledger for your expenses,
budget, and habits. The twist is the **game**: an RPG adventure — the world map,
towns, and turn-based battles — that plays inside a retro **CRT-TV frame** on the
Quests tab. The adventure is a layer of gamification sitting on top of everyday
expense tracking; its job is to keep you coming back to **log your finances
daily**. Your logged spending is what earns the Action Points that power the game,
so staying on top of your real budget is what moves the story forward.

## First run

A brand-new visitor starts from **scratch** — 0 AP, 0 gold, no budget — and play is
**locked** behind a budget-first gate:

1. **Set your monthly budget** (and pick your currency).
2. **Log your first expense** to earn your first Action Points.
3. The gate opens and the world map unlocks.

A small, non-blocking **tutorial guide** rides along in the corner, walking you
through set-budget → earn AP → open the map → enter a town → talk → fight → claim.
You can skip it anytime. (Returning players are never re-gated or re-nagged.)

## How it plays

The app has four tabs plus a settings menu:

- **Ledger** — Log expenses and calibrate your monthly budget. Logging an expense
  earns **Action Points (AP)**: **+5 base**, **+3 bonus** while you stay under
  budget (**+8 total**). Money is shown in your chosen currency (USD, EUR, GBP,
  INR, JPY, PKR, CAD, AUD — symbol only, no conversion).
- **Trials** — Two kinds of self-improvement:
  - **Rituals** (habits) — repeatable; performing one pays AP and builds a streak.
  - **Feats** (tasks) — one-time to-dos that pay a one-off AP reward.
- **Quests** — The **Strategic Map**. Spend AP to travel between towns, embark on
  quests, zoom into a town, talk to NPCs, and fight. Side panels: the **War Room**
  (party & gear) and the **Vault** (inventory).
- **Archive** — Records and goals: full expense ledger, budget streams, **Savings
  Vaults**, and the **Engine Log** (every decision the game engine made).
- **⚙ Settings** — Gear icon in the top bar; holds the **New Game — Start From
  Scratch** reset.

### The core loop

1. **Log an expense** → earn AP (the finance side).
2. **Open the map & travel** — travel cost is distance-based (~6–9 AP between
   towns, minimum 4); entering the town you're standing on is free (the game side).
3. **Embark** on a quest — costs its AP quota.
4. **Talk** to the objective NPCs to advance the quest.
5. **Fight** the quest's boss and clear the encounter.
6. **Claim** the reward once every objective is met — exp, gold, and level-ups.

## The world

- **World map** — A hand-drawn island rendered inside the CRT frame. Each of the
  four settlements shows a **typed pointer** by kind — 🛖 village, 🏘️ town, 🏙️ city,
  🏰 citadel — sitting on its matching terrain, with your party marker and
  distance-based travel. On phones the map is **drag-to-pan**.
- **Enter a town** — Tapping the town you're on plays a quick **zoom-into-village**
  transition into its interior.
- **Town interior** — A set of clickable **hotspots**: the quest-giver NPCs, the
  🏪 Shop, the Outskirts (where battles happen), the Exit, plus 🏟️ Arena and 🛏️ Inn
  (coming soon). NPCs now speak in **multi-line dialogue** you read through.
- **Invasions** — When you finish a main quest's non-boss objectives, its boss
  **invades the town**: the town locks behind an invasion screen until you fight
  (or flee and come back to face it). Win and the town is freed.

## Combat

Turn-based battles inside the CRT frame. Each **STRIKE** costs 1 AP.

- **Party stats** — Every member has base **attack** and **defense** that grow on
  level-up. Damage = your attack + weapon − enemy defense (+ a small roll, with
  crits); the enemy's counter is reduced by your total defense.
- **Gear** — Five equipment slots (**weapon, armor, helmet, shield, gloves**);
  defense is summed across everything equipped. Manage loadouts in the War Room.
- **Consumables** — Health potions heal the most-hurt member; a **Revive Tonic**
  brings back a fallen one. Survive a wipe and your strongest member is revived so
  you're never soft-locked.
- **Adaptive difficulty** — Enemies are scaled to your recent performance to hold a
  fair win-rate band.

## Quests

- **Two quests per town.** Each settlement surfaces a story quest, then a second
  quest once the first is cleared. Later towns' quests carry **multiple
  sub-missions** (talk to several NPCs) before their boss.
- **Auto-forged side quests** — "The {Category} Menace" quests are generated from
  your top real spending category, validated by the engine before they're offered.
- Progress is objective-by-objective, with a manual **reward claim**.

## Finance side, for real

- **Budget calibration** — Set a monthly allowance and currency; track "Remaining
  Safe" per category.
- **Savings Vaults** — Create goals, deposit toward them, watch them seal when
  funded.
- **Engine Log** — The game is driven by a deterministic **Game Director**
  (`APP/src/engine/`) that records every decision as an **observe → infer → decide
  → act** trace you can read in the Archive.

## Reset

**Settings (⚙) → New Game — Start From Scratch** wipes all progress and returns you
to the first-run scratch state (budget gate + tutorial), after a confirmation.

## Tech stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS.
- **Persistence:** Browser `localStorage`, behind a single unified API
  (`APP/src/persistenceService.ts`); same-tab reactivity via a manual `storage`
  event dispatch.
- **Engine:** Pure, deterministic TypeScript (`APP/src/engine/`) — no external AI,
  no network. Day-tick, quest forging, enemy AI/scaling, adaptive difficulty,
  reward and combat math, chronicle boss flow — all unit-tested with Vitest.
- **Hosting:** Static build served by **Firebase Hosting**
  (`ledgerquest-demo.web.app`). A multi-stage `Dockerfile` (Node build → Nginx) is
  also included for container platforms.

## Develop locally

```bash
cd APP
npm install
npm run dev        # http://localhost:5173
```

### Tests & build

```bash
cd APP
npm test           # Vitest unit tests (engine + persistence)
npm run test:e2e   # Playwright end-to-end (needs a dev server)
npm run build      # tsc -b && vite build  →  APP/dist
```

## Deploy the demo (Firebase Hosting)

```bash
# from the repo root, in an env with the Firebase CLI + a selected project
cd APP && npm ci && npm run build && cd ..
firebase deploy --only hosting     # publishes APP/dist to ledgerquest-demo.web.app
```

`firebase.json` already points the `ledgerquest-demo` target at `APP/dist` with an
SPA rewrite. First time on a fresh machine, run `firebase use --add` and
`firebase target:apply hosting ledgerquest-demo ledgerquest-demo` before deploying.

## Container (optional)

```bash
# from the repo root
docker build -t ledgerquest .
docker run --rm -e PORT=8080 -p 8080:8080 ledgerquest
# open http://localhost:8080
```

The image builds `APP/` and serves the static `dist/` with Nginx; `envsubst`
substitutes the platform-assigned `${PORT}` at startup.
