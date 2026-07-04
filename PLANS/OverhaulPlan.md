# LedgerQuest Overhaul Plan — Global Release

STATUS: Phase 0 complete (2026-07-04). Next up: **Phase 1**.
CONTEXT: Competition prototype (didn't win, deadline passed). Goal now: fix, polish, publish globally. All "Antigravity" agent code is being replaced with custom deterministic TS algorithms — no external AI, no cloud cost, offline localStorage app.

How to use this doc in a fresh session: read this file + `~/.claude` project memory (`ledgerquest-audit-2026-07`), then start the first unchecked phase. Each phase ends with a browser-verifiable checkpoint. Update STATUS line and checkboxes when a phase lands.

---

## Phase 0 — Cleanup & foundation ✅ DONE (2026-07-04)
- [x] Removed `gm-antigravity` npm dep (was a VS Code extension, never imported, unusable in browser).
- [x] Deleted dead code: `APP/src/antigravityAgent.ts`, `APP/src/components/PlayerDashboard.tsx`, `AntigravityTrace` interface in `schemas.ts`.
- [x] Deduplicated assets: deleted `APP/public/assets/game/ui/` (exact duplicate of `APP/public/assets/ui/`, which is what code references).
- [x] Stripped challenge branding: README.md title/intro; DevelopmentPlan.md marked LEGACY pointing here.
- [x] Added vitest: `APP/vitest.config.ts` (unit tests in `src/**/*.test.ts`, Playwright stays in `APP/tests/`), `npm test` script, 4 passing smoke tests in `src/logicEngines.test.ts` pinning current behavior.
- [ ] DEFERRED (user decision pending): delete `GAME/` (183MB deprecated Phaser legacy, untracked).
- Verified: `npm test` 4/4, `npm run build` passes.

## Phase 1 — P0 playability (NEXT) — game unplayable without this
All bugs runtime-verified in audit:
- [ ] Rebuild TV/GameView sizing ([GameView.tsx](../APP/src/components/GameView.tsx)): kill fixed `h-[85vh]` TV and `min-w-[600px] min-h-[450px]` in [WorldMapScene.tsx](../APP/src/components/AdventureWorld/WorldMapScene.tsx); scenes must scale fluidly to container. Evidence: at 1440×900 combat STRIKE buttons render at y=806 while TV screen ends y=692 — combat literally unclickable; at <1024px width bottom map nodes (Starting Village, Copper Town) clipped → can't enter towns; mobile = ~30px sliver.
- [ ] Mobile layout pass: TV chrome collapses to thin bezel on small screens.
- [ ] Fix location default mismatch: [persistenceService.ts](../APP/src/persistenceService.ts) campaign default `'Start Town'` vs map node `'Starting Village'` (also `subscribeCampaign`/`updateCampaign` fallbacks) → first town click charges phantom 20 AP travel.
- [ ] Atomic stat writes: all `updateStatsDB` callers read stale React `stats.ap` (read-modify-write race; verified lost update 18+10+15→33). Add functional-update API in persistence layer (`updateStats(fn: (cur) => Partial)`) and migrate callers.
- [ ] Clear DialogueBox on scene change ([AdventureWorld.tsx](../APP/src/components/AdventureWorld/AdventureWorld.tsx)): town NPC dialogue currently persists over combat screen.
- CHECKPOINT: full loop playable by hand at 1280/1024/768/375 widths: expense → AP → embark → enter town → talk → outskirts → combat → victory → claim.

## Phase 2 — Game Director engine — replaces ALL agent/logic-engine code
New `APP/src/engine/`, pure deterministic TS, TDD each module (vitest ready):
- [ ] `dayTick.ts` — on boot compare lastSeen date; per missed day: uncompleted habit skipCount+1 & streak reset; budget month rollover. (Today `skipCount` is read by ValueAdjuster but NEVER written — half of habit logic dead.)
- [ ] `playerModel.ts` — persisted signal tracker: daily log streak, budget pace ratio, task/habit completion rates, combat win/loss + avg strikes, potion usage, AP earn/spend rate, session gaps. EWMA per signal.
- [ ] `difficultyEngine.ts` — skill score from signals, target 55-65% win rate; enemy HP/attack scaling, habit AP multipliers (preserve streak/skip rules from ValueAdjuster), pity bonuses on loss streaks. Rationale string per decision.
- [ ] `rewardEngine.ts` — battle reward = base × difficulty × performance (replaces flat +100/+50 in App.tsx `handleBattleVictory`); level curve `expToNext = 100 × level^1.5` with stat gains (fixes level frozen at 1 forever).
- [ ] `questForge.ts` — replaces `StoryTellingEngine`: manifest spine expanded to 4 chapters (one per map town in `storyManifest.json`); generated side quests themed by top spending category ("The {Category} Menace" — idea salvaged from deleted AntigravityAgent); `validateQuest()` QC: targets exist in world, AP-to-complete ≤ ~2 days average earnings, reward band clamp; reject → log → regenerate (max 3).
- [ ] `enemyAI.ts` — archetypes (Aggressor=weakest / Tactician=highest MP / Opportunist=unarmored) + persisted memory of last 5 battles (counter potion spam, counter single-striker reliance); small bestiary replaces hardcoded 50HP Debt Gnome in App.tsx `handleBattleAction`.
- [ ] `director.ts` + `traceHub.ts` — single entry `director.onEvent(...)` replacing App.tsx fragile agent `useEffect([expenses.length, currentLocation, quests.length, stats.ap])`; distance-based travel cost from LOCATIONS coords (replaces hardcoded 20 AP); unified trace {observe, infer, decide, act, rationale}, ring buffer 100, persisted.
- [ ] Delete `logicEngines.ts` + its smoke test after parity; update GEMINI.md architecture section (still describes old Logic Engines).
- CHECKPOINT: side quests generated from spending patterns, enemies scale with performance, level-ups fire, decisions traced.

## Phase 3 — Feature completion
- [ ] WarRoom: real recruit (requires city visit + gold cost) and dismiss (currently toast/no-op).
- [ ] Quest requirement consistency: seeded quest gets `requirements`; `confirmStartQuest` uses `req.apQuota` not hardcoded 5.
- [ ] Route `handleAddHabit` through persistence API (currently raw localStorage writes in App.tsx).
- [ ] Trace Viewer panel — "Engine Log" tab in Archive showing observe/infer/decide/act per decision (traces currently stored but zero UI).
- [ ] Savings goals UI (schema+seed exist, `_savings` unused) + wire `resetGameDB` to a settings/reset button.
- CHECKPOINT: every README-advertised feature works.

## Phase 4 — Quality & ship prep
- [ ] Rewrite Playwright e2e to match real UI (currently fails at step 1: `text=10 AP` split-span locator; later steps assert stale text "Critical Incursion"/"Heal Potions:" vs actual "Combat Interface"/"Inventory:"). Extend to full loop incl. combat + claim.
- [ ] Bundle: 617KB single chunk — lazy-load game scenes; **Firebase decision (user pending)**: remove entirely for v1 (recommended; `USE_FIREBASE=false`, placeholder config, Firestore branches buggy/untested) or env-config it.
- [ ] Economy balance: travel 20 AP vs expense +8 AP too punishing; tune via difficultyEngine constants.
- [ ] Docker build verify; README/docs rewrite as product docs.
- CHECKPOINT: green `npm test` + e2e, lean bundle, deployable image.

## Deferred / backlog (not scheduled)
- Delete `GAME/` legacy (awaiting user OK).
- Subscriptions manager (schema + persistence exist, no UI), receipt photos, savings-milestone rewards (rare item / party member on goal completion — from product description).

## Key architecture facts for fresh sessions
- App: `APP/` React 19 + TS + Vite + Tailwind. Persistence: localStorage behind `APP/src/persistenceService.ts` unified API (`USE_FIREBASE=false`); same-tab reactivity via manual `window.dispatchEvent(new Event('storage'))`.
- Game: `APP/src/components/GameView.tsx` (CRT TV frame) → `AdventureWorld/` scenes (map/town/combat) driven by `campaign.worldState`.
- All game state flows through App.tsx callbacks; quest objectives tracked by `checkQuestObjective(type, target)`.
- Tests: `npm test` (vitest, src/**/*.test.ts), `npm run test:e2e` (Playwright, APP/tests/).
