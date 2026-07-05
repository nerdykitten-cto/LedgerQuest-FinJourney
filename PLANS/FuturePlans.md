# LedgerQuest — Future Plans (post-overhaul polish)

STATUS: **NOT STARTED** — backlog only. This file scopes the next body of work
after the 0-4 technical overhaul (see `OverhaulPlan.md`, all phases DONE).

The overhaul made the app correct, tested, lean, and deployable. It did **not**
make it *good* as a game or *complete* as a finance tool. The next effort is a
dedicated **game-design review + playtest pass**, then a prioritized fix/build
phase off its findings. Nothing here is implemented yet — this is the "what's
next" pointer.

---

## DEMO quick UI fixes (do at the start of the next session)

Small, concrete fixes to land before/independent of the bigger design pass:

- [ ] **TV frame crops its content when the browser fills/maximizes the screen.**
  The CRT-TV game view (`GameView.tsx` frame + `AdventureWorld` scenes) crops at
  large/maximized viewport widths — content spills past or is clipped by the bezel.
  (User provided a screenshot of the cropping; get it from them at fix time.)
  Likely an `overflow`/aspect-ratio/`min-h-0` sizing issue on the TV frame at wide
  viewports — related to the Phase 1 flexbox `min-w-0`/`min-h-0` work, but now
  manifesting at the *large* end rather than small. Repro by maximizing the window.
- [ ] **Party-position marker on the world map shows the Vite logo.** In
  `components/AdventureWorld/WorldMapScene.tsx`, the "Hero Icon" block renders
  `<img src="/assets/game/hero.png">` at the party's current location — the asset
  is resolving to the default Vite logo. Replace it with a **custom hand-made SVG
  arrow marker** that points at / highlights the current-location node.

## Phase 5 (proposed) — Design review & playtest pass

Do a structured designer/playtester review of the live app, write findings, then
turn them into a phased plan (like the overhaul). Scope below is the checklist of
things to evaluate and likely fix. **To be done; not started.**

### Game side

- [ ] **AP economy / anti-farming (highest priority).** Confirmed exploit: expense
  AP is flat (`+5`, or `+8` under budget) with **no cap, no diminishing returns,
  and no dependence on amount** (`App.tsx handleAddExpense`). A user can log many
  trivial expenses to flood AP and skim the whole map. Options to evaluate: daily
  AP cap from logging, diminishing returns per same-day log, tie AP to financial
  *outcomes* (staying under budget at period close, hitting savings goals, clearing
  bills) rather than raw log count. Decide the intended difficulty curve.
- [ ] **Combat depth.** Today combat is two actions — STRIKE and an auto-targeted
  potion (`CombatScene.tsx`). `mp`/`maxMp` exist on party members but are **unused
  in battle** (dead stat). No abilities/spells, no status effects, no player-chosen
  targets, single enemy per fight. Evaluate: MP-driven skills, class identity
  (Arcanist/Lightweaver/Sharpshooter should play differently), status effects
  (debt-as-poison fits the theme), multi-enemy encounters, boss mechanics.
- [ ] **Content breadth.** Enemy bestiary (6, 3 tiers) and equipment/shop exist and
  work, but variety is thin. Evaluate more enemy types/themes, more weapons/armor
  with meaningful trade-offs, and whether the loot loop rewards engagement.
- [ ] **Narrative / world-building.** NPC dialogue is one line each; quest flavor is
  thin. Evaluate dialogue trees, per-town lore, chapter framing (Inflation Djinn /
  Compound Golem themes are promising but underdeveloped).
- [ ] **Quests.** Only `talk` and `kill` objective types; chains cap at ~2 objectives.
  Evaluate fetch/multi-step/branching quests, side-quest generation quality
  (dedupe/variety of "The {Category} Menace"), and pacing of reward claims.

### Finance side

- [ ] **Identity: finance tool vs gamified to-do.** Rituals (habits) and Feats (tasks)
  are currently *generic* productivity, not finance-specific — risks diluting the
  "finance" identity. Evaluate refocusing them on finance behaviors (no-spend day,
  logged-all-expenses, reviewed-budget) so every action reinforces the theme.
- [ ] **Hands-on vs automated tools (design discussion needed).** Everything is manual
  today (log expense, set budget, deposit to vault) — engaging but tedious, and the
  manual-log loop is exactly what enables AP farming. Evaluate automated/derived
  tools: subscription tracking (schema + persistence already exist, **no UI**),
  recurring-bill calendar/reminders, auto-categorization, spending trends/reports,
  budget-pace warnings, savings auto-allocation. Recommendation to test: reward the
  game from *automated-detected good financial behavior*, which both fixes the AP
  exploit and makes the finance side a real tool.
- [ ] **Missing finance staples.** No income/paycheck tracking, no net worth, no
  explicit debt tracking (thematically ideal — "debt" is literally the enemy),
  no reports. Decide which belong in v1.

### Also queued (from overhaul backlog)

- [ ] Subscriptions manager UI (schema + persistence exist, no UI).
- [ ] Receipt photos; savings-milestone rewards (rare item / party member on goal
  completion) — from the original product description.

---

When starting this work in a fresh session: read `OverhaulPlan.md` (context on the
finished technical state) + this file, then begin with the **AP economy** and the
**finance hands-on-vs-automated** decisions — they gate most other choices.
