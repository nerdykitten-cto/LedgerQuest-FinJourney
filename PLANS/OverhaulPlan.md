# LedgerQuest Overhaul Plan — Global Release

STATUS: Phase 4 complete (2026-07-05). Overhaul phases 0-4 all DONE — ship-ready.
CONTEXT: Competition prototype (didn't win, deadline passed). Goal now: fix, polish, publish globally. All "Antigravity" agent code is being replaced with custom deterministic TS algorithms — no external AI, no cloud cost, offline localStorage app.

How to use this doc in a fresh session: read this file + `~/.claude` project memory (`ledgerquest-audit-2026-07`), then start the first unchecked phase. Each phase ends with a browser-verifiable checkpoint. Update STATUS line and checkboxes when a phase lands.

---

## Phase 0 — Cleanup & foundation ✅ DONE (2026-07-04)
- [x] Removed `gm-antigravity` npm dep (was a VS Code extension, never imported, unusable in browser).
- [x] Deleted dead code: `APP/src/antigravityAgent.ts`, `APP/src/components/PlayerDashboard.tsx`, `AntigravityTrace` interface in `schemas.ts`.
- [x] Deduplicated assets: deleted `APP/public/assets/game/ui/` (exact duplicate of `APP/public/assets/ui/`, which is what code references).
- [x] Stripped challenge branding: README.md title/intro; DevelopmentPlan.md marked LEGACY pointing here.
- [x] Added vitest: `APP/vitest.config.ts` (unit tests in `src/**/*.test.ts`, Playwright stays in `APP/tests/`), `npm test` script, 4 passing smoke tests in `src/logicEngines.test.ts` pinning current behavior.
- [x] Deleted `GAME/` (183MB deprecated Phaser legacy) from git and disk; `.gitignore` cleaned (GAME whitelist removed, test-results ignored).
- Verified: `npm test` 4/4, `npm run build` passes.
- Committed locally on `main`: `76e7377` (cleanup + vitest), `53f3769` (GAME removal). **Not pushed** — pushing `main` triggers Cloud Build → Cloud Run redeploy and burns TryGCP credits; push only at deploy-worthy checkpoints.

## Phase 1 — P0 playability ✅ DONE (2026-07-04)
All bugs runtime-verified in audit:
- [x] Rebuilt TV/GameView sizing: TV `h-[85vh]` → `flex-1 min-h-0` fills parent; killed `min-w-[600px] min-h-[450px]` in WorldMapScene; quests tab gets `lg:h-[calc(100vh-11rem)]` + `h-[70vh]` game cell on mobile; `min-w-0` added at flex ancestors so scenes can't blow past TV screen (flexbox min-width:auto). CombatScene column compressed + `overflow-y-auto` fallback; battle log `sticky bottom-0`.
- [x] Mobile layout pass: speaker panel `hidden md:flex`, control dials + key-info `hidden 2xl:flex`, thin bezel `border-[6px]` / chunky `md:border-[8px]`, tape label hidden on mobile; TownScene header + CombatScene HUD responsive.
- [x] Location default `'Start Town'` → `'Starting Village'` in all 3 fallbacks; legacy saves migrated on read in `subscribeCampaign`. Phantom 20 AP travel charge gone (verified: enter town at 13 AP → still 13 AP).
- [x] Atomic stat writes: `updateStats(updater)` functional API (localStorage read-modify-write inside; Firestore `runTransaction`); `updateStatsDB` deleted; all 10 App.tsx callers migrated. Unit-tested (18+10+15−5 = 38, no lost updates).
- [x] DialogueBox cleared on `worldState` change in AdventureWorld effect (verified: town dialogue open → Hunt For Gold → combat clean).
- CHECKPOINT PASSED: full loop played in browser at 1280/1024/768/375: expense (+8 AP) → embark (−5) → dbl-click enter town (no charge) → talk (objective ✓) → outskirts → combat (4 strikes, −4 AP, atomic) → victory (+100xp/+50g) → claim (+150xp/+100g). `npm test` 10/10, `npm run build` ✓, console clean. Combat fits TV screen exactly at 1280×800 and 768; scrolls gracefully at 1024×768 (all STRIKEs + sticky log visible).
- New: `APP/src/persistenceService.test.ts` (6 tests: location defaults/migration + functional updates).

## Phase 2 — Game Director engine ✅ DONE (2026-07-05) — replaced ALL agent/logic-engine code
New `APP/src/engine/`, pure deterministic TS, TDD per module (RED-GREEN verified, 108 tests total):
- [x] `dayTick.ts` — lastSeen compare; per missed calendar day: uncompleted habit skipCount+1 & streak reset; month rollover flag + budget spentAmount reset. Bonus: `handleCompleteHabit` now resets skipCount to 0 on completion (skip bonus paid once).
- [x] `playerModel.ts` — persisted signals (`engine_signals`): log streak, budget pace, task/habit completion rates, combat W/L + avg strikes, potion usage, AP earn/spend totals + daysActive, session gaps. EWMA (α=0.3).
- [x] `difficultyEngine.ts` — 6-signal skill score; 55-65% win-rate band nudges ±0.1; multiplier clamped [0.5, 1.6]; pity −0.1×(lossStreak−1); `adjustHabitReward` = ValueAdjuster rules verbatim (parity-tested). Rationale per decision.
- [x] `rewardEngine.ts` — battle reward = base(100/50) × difficulty × performance(0.7-1.3 from strikes/potions); `expToNext = 100 × level^1.5`; party +1 lvl/+10 maxHp/full heal per level-up; `taskReward` (APEvaluator parity). `handleClaimReward` exp also runs through `applyExp`.
- [x] `questForge.ts` — manifest → 4 chapters (ch2 Silver City/Inflation Djinn, ch3 Iron Citadel/Compound Golem); "The {Category} Menace" side quests from top spend; `validateQuest` QC (targets vs world, apQuota ≤ 2×avg daily AP earn, reward ≤200exp/120gold per difficulty) with repair→regenerate (max 3) + duplicate skip. New `engine/world.ts` canonical LOCATIONS/NPCs/bosses (WorldMapScene imports it).
- [x] `enemyAI.ts` — 6-enemy bestiary, 3 progress tiers, deterministic rotation; archetype targeting (Aggressor=lowest HP / Tactician=highest MP / Opportunist=unarmored) wired into CombatScene enemy turn; 5-battle memory (`engine_battleMemory`) counters potion spam (+20% ATK) / single-striker (+2 DEF). `Enemy.archetype?` added to schemas.
- [x] `director.ts` + `traceHub.ts` — `director.onEvent(...)` singleton in App.tsx: boot day-tick, world-changed quest offers, battle-requested spawn, battle-finished scaled rewards, AP earn/spend + habit/task/expense signals. `travelCost(from,to)` from coords (min 4, ~9-13 AP between towns, fallback 20). Unified traces {observe, infer, decide, act, rationale}, ring buffer 100 (`engine_traces`). CombatScene reports `BattleResult` {strikes, potionsUsed, distinctStrikers}.
- [x] Deleted `logicEngines.ts` + smoke test; GEMINI.md architecture section rewritten (Game Director modules; stale GAME/ ref dropped).
- CHECKPOINT PASSED (browser, fresh save): expense +8 AP → side quest "The Food Menace" auto-forged (QC pass, 1 attempt) → embark −5 → town entry free → talk ✓ → Hunt spawns Debt Gnome scaled 50→46 HP (win rate below band; rationale in trace) → victory in 4 strikes → +110xp/+55g (0.91 diff × 1.20 perf) → LEVEL UP to 2 + party maxHp +10 → claim +150xp/+100g through level curve (no spurious level-up) → 5 traces, all with observe/infer/decide/act/rationale. `npm test` 108/108, `tsc -b` clean, `npm run build` ✓, console clean.

## Phase 3 — Feature completion ✅ DONE (2026-07-05)
- [x] WarRoom recruit/dismiss real: new `engine/recruitment.ts` (TDD, 11 tests) — recruit needs `worldState === 'town'` + gold (`100 + 20×(party−1)`), deterministic candidate pool (2 front / 3 support), stats scale to avg party level (+10 maxHp/level, mirrors rewardEngine); dismiss blocked for Leader. Wired as Director events `recruit-requested`/`dismiss-requested` → `recruit-member`/`dismiss-member`/`deny` actions, all traced. WarRoom passes slot (`'front'|'support'`) + shows signing fee; new `removePartyMemberDB`.
- [x] Quest requirements: seeded quest gets `requirements {apQuota:5}` (matches questForge main-quest); `confirmStartQuest` uses `req.apQuota ?? 5` + notify when short on AP.
- [x] `handleAddHabit` → new `dbService.addHabitDB` (raw localStorage block deleted).
- [x] "Engine Log" tab in Grand Archive: renders `engine_traces` (DirectorTrace) newest-first — act headline, observe/infer/decide grid, rationale quote; new `subscribeEngineTraces`. Legacy `addTraceDB`/`subscribeTraces` (dead `traces` col API) deleted.
- [x] "Vaults" tab in Grand Archive: savings goals list w/ progress bars + SEALED state, per-goal deposit form (`updateSavingsGoalDB`), "Forge Vault" creation (new `addSavingsGoalDB`); Danger Zone "Reset Adventure" button (confirm dialog) → `resetGameDB`, which now also clears `engine_*` keys (new `ENGINE_STATE_KEYS` export from director).
- CHECKPOINT PASSED (browser, fresh save): seeded quest has requirements; New Ritual → habit lands in `habits` via API + UI updates; Embark uses apQuota (AP 10→5, quest active); War Room: leader dismiss denied ("The party leader cannot be dismissed."), Lia dismissed (party 4, Recruit Support appears w/ "160g signing fee"), recruit at peace denied ("Recruits gather in settlements…"), in town w/ 500g Mirelle joins (−160g → 340); Engine Log shows all 7 traces w/ observe/infer/decide/act+rationale; Vaults: deposit +$600 (12400→13000), "Emergency Fund" forged; Reset Adventure wipes engine keys + reseeds world (party 5, quest available, 10 AP). `npm test` 127/127, `tsc -b` clean, `npm run build` ✓, console clean. (preview_screenshot tool timed out — evidence via DOM assertions.)
- New tests: `engine/recruitment.test.ts` (11), director recruitment suite (3), persistence adds/reset/engine-traces (5).

## Phase 4 — Quality & ship prep ✅ DONE (2026-07-05)
- [x] Rewrote Playwright e2e (`APP/tests/e2e.spec.ts`) against real UI. Root cause of old failures pinned down live: AP renders as split spans (added `data-testid="ap-value"` to TopAppBar), nav labels are CSS-uppercased but accessible names keep original case ("Quests" not "QUESTS"), and enter-town is two `onClick`s <350ms apart (added `data-testid="adventure-world"` scope + a retry helper since Playwright click overhead blows the 350ms window). 6 tests, all green: full core loop (expense→embark via Royal Writ apQuota→enter town free→talk objective→outskirts→combat victory→claim), distance-based travel, New Ritual habit, Vaults deposit/forge/reset, Engine Log trace viewer, War Room dismiss+recruit.
- [x] **Firebase removed entirely for v1** (user decision). Deleted `firebase.ts`, dropped `firebase` dep, stripped every `USE_FIREBASE` branch — `persistenceService.ts` is now localStorage-only. Bundle 617KB → 292KB. Plus lazy-loaded game scenes: `GameView` is `React.lazy` + `Suspense` in App.tsx, split into a 28KB chunk that streams in when the Strategic Map opens.
- [x] Economy balance: `travelCost` divisor 5→7 in `engine/director.ts`. Adjacent inter-town hops now 5-7 AP (≤ the +8 AP from one logged expense → sustainable loop); full cross-map trips 8-11 AP; min floor 4 kept. Re-pinned exact values in `director.test.ts` (SV→Copper 7, Copper→Silver 5, Silver→Iron 6, SV→Iron 9, SV→Silver 11). Reward bases (100/50) + `expToNext` (100×lvl^1.5) left as-is — progression felt right in playtest, no change warranted. Verified live: SV→Copper travel −7 AP.
- [x] Docker build verified end-to-end: `docker build -t ledgerquest .` from repo root (10/10 steps, node20-alpine build → nginx-alpine serve). Container smoke-test (`-e PORT=8080`): `/` → 200 (title "LedgerQuest - DEMO"), `/quests` → 200 via nginx `try_files` SPA fallback, main JS chunk → 200, PORT env substitution honored, logs clean. README.md rewritten as product docs (localStorage-only, Game Director not "Logic Engines", full Phase 3 feature set documented).
- CHECKPOINT PASSED: `npm test` 127/127, `tsc -b` clean, `npm run build` clean, e2e 6/6, deployable image serves. Committed locally on `main`. **Not pushed** (would trigger Cloud Build → Cloud Run redeploy, burns TryGCP credits).

## Deferred / backlog (not scheduled)
- Delete `GAME/` legacy (awaiting user OK).
- Subscriptions manager (schema + persistence exist, no UI), receipt photos, savings-milestone rewards (rare item / party member on goal completion — from product description).

## Key architecture facts for fresh sessions
- App: `APP/` React 19 + TS + Vite + Tailwind. Persistence: localStorage-only behind `APP/src/persistenceService.ts` unified API (Firebase removed in Phase 4); same-tab reactivity via manual `window.dispatchEvent(new Event('storage'))`.
- Game: `APP/src/components/GameView.tsx` (CRT TV frame) → `AdventureWorld/` scenes (map/town/combat) driven by `campaign.worldState`.
- Engine: `APP/src/engine/` Game Director (`director.onEvent` singleton in App.tsx) — dayTick, playerModel (EWMA signals), difficultyEngine, rewardEngine, questForge (+`world.ts` canonical world model), enemyAI, traceHub. Engine state in localStorage keys `engine_*`; all decisions traced.
- All game state flows through App.tsx callbacks; quest objectives tracked by `checkQuestObjective(type, target)`.
- Tests: `npm test` (vitest, src/**/*.test.ts), `npm run test:e2e` (Playwright, APP/tests/).
