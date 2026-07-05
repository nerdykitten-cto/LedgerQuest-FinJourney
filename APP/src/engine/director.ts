import type {
  CampaignState,
  Expense,
  Habit,
  Quest,
  PlayerStats,
  PartyMember,
  BudgetStream,
  Enemy,
} from '../types/schemas';
import { dayTick } from './dayTick';
import {
  defaultSignals,
  recordBattle,
  recordHabit,
  recordTask,
  recordExpenseLog,
  recordAp,
  recordSessionGap,
  avgApEarnedPerDay,
  type PlayerSignals,
} from './playerModel';
import { difficultyMultiplier, scaleEnemy } from './difficultyEngine';
import { applyExp, applyLevelUps, battlePerformance, battleReward } from './rewardEngine';
import {
  pickEnemy,
  chooseTarget,
  recordBattleMemory,
  analyzeMemory,
  applyCounters,
  type Archetype,
  type BattleMemory,
} from './enemyAI';
import { forgeValidatedSideQuest, nextMainQuest, DEFAULT_WORLD } from './questForge';
import { LOCATIONS } from './world';
import { TraceHub, localStorageBackend, type EngineStorage, type DirectorTrace } from './traceHub';

export { chooseTarget };
export type { Archetype };

// ---------- travel ----------

const LEGACY_TRAVEL_COST = 20;

/** Distance-based travel cost from world map coordinates (percent space). */
export function travelCost(from: string, to: string): number {
  const a = LOCATIONS.find(l => l.name === from);
  const b = LOCATIONS.find(l => l.name === to);
  if (!a || !b) return LEGACY_TRAVEL_COST;
  const dist = Math.hypot(a.x - b.x, a.y - b.y);
  return Math.max(4, Math.round(dist / 5));
}

// ---------- events & actions ----------

/** What CombatScene reports back when a battle ends. */
export interface BattleResult {
  strikes: number;
  potionsUsed: number;
  distinctStrikers: number;
}

export type DirectorEvent =
  | { type: 'boot'; now: number; habits: Habit[]; budgets: BudgetStream[] }
  | { type: 'world-changed'; campaign: CampaignState; quests: Quest[]; expenses: Expense[] }
  | { type: 'expense-logged'; now: number; apEarned: number }
  | { type: 'task-completed'; apEarned: number }
  | { type: 'habit-completed'; apEarned: number }
  | { type: 'ap-spent'; amount: number }
  | { type: 'battle-requested'; progress: number }
  | {
      type: 'battle-finished';
      won: boolean;
      strikes: number;
      potionsUsed: number;
      distinctStrikers: number;
      stats: PlayerStats;
      party: PartyMember[];
    };

export type DirectorAction =
  | {
      kind: 'apply-day-tick';
      habits: Habit[];
      budgets: BudgetStream[];
      missedDays: number;
      monthRolled: boolean;
    }
  | { kind: 'offer-quest'; quest: Quest; rationale: string }
  | { kind: 'spawn-enemy'; enemy: Enemy & { archetype: Archetype }; rationale: string }
  | {
      kind: 'battle-reward';
      exp: number;
      gold: number;
      stats: PlayerStats;
      party: PartyMember[];
      levelsGained: number;
      rationale: string;
    };

// ---------- persisted engine state ----------

const KEYS = {
  lastSeen: 'engine_lastSeen',
  lastExpenseDay: 'engine_lastExpenseDay',
  signals: 'engine_signals',
  battleMemory: 'engine_battleMemory',
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export class Director {
  private storage: EngineStorage;
  private traceHub: TraceHub;

  constructor(storage: EngineStorage = localStorageBackend()) {
    this.storage = storage;
    this.traceHub = new TraceHub(storage);
  }

  getSignals(): PlayerSignals {
    return this.storage.get<PlayerSignals>(KEYS.signals, defaultSignals());
  }

  getTraces(): DirectorTrace[] {
    return this.traceHub.all();
  }

  private setSignals(s: PlayerSignals) {
    this.storage.set(KEYS.signals, s);
  }

  private getMemory(): BattleMemory {
    return this.storage.get<BattleMemory>(KEYS.battleMemory, { records: [] });
  }

  private trace(t: Omit<DirectorTrace, 'id' | 'timestamp'>) {
    this.traceHub.record(t);
  }

  onEvent(event: DirectorEvent): DirectorAction[] {
    switch (event.type) {
      case 'boot':
        return this.onBoot(event);
      case 'world-changed':
        return this.onWorldChanged(event);
      case 'expense-logged': {
        const lastDay = this.storage.get<number>(KEYS.lastExpenseDay, 0);
        const daysSince = lastDay === 0 ? 1 : Math.round((startOfDay(event.now) - lastDay) / DAY_MS);
        this.setSignals(recordAp(recordExpenseLog(this.getSignals(), daysSince), { earned: event.apEarned }));
        this.storage.set(KEYS.lastExpenseDay, startOfDay(event.now));
        return [];
      }
      case 'task-completed':
        this.setSignals(recordAp(recordTask(this.getSignals(), true), { earned: event.apEarned }));
        return [];
      case 'habit-completed':
        this.setSignals(recordAp(recordHabit(this.getSignals(), true), { earned: event.apEarned }));
        return [];
      case 'ap-spent':
        this.setSignals(recordAp(this.getSignals(), { spent: event.amount }));
        return [];
      case 'battle-requested':
        return this.onBattleRequested(event);
      case 'battle-finished':
        return this.onBattleFinished(event);
    }
  }

  private onBoot(event: Extract<DirectorEvent, { type: 'boot' }>): DirectorAction[] {
    const lastSeen = this.storage.get<number>(KEYS.lastSeen, 0);
    const result = dayTick({ lastSeen, now: event.now, habits: event.habits, budgets: event.budgets });
    this.storage.set(KEYS.lastSeen, event.now);

    if (!result.changed) return [];

    this.setSignals(recordSessionGap(this.getSignals(), result.missedDays));
    this.trace({
      observe: `Boot after ${result.missedDays} missed day(s); ${event.habits.length} habit(s) on record.`,
      infer: 'Time passed without play; uncompleted daily habits were skipped.',
      decide: `Apply day tick: bump skip counters, reset broken streaks${result.monthRolled ? ', roll budget month' : ''}.`,
      act: 'Queued apply-day-tick action.',
      rationale: result.rationale,
    });

    return [
      {
        kind: 'apply-day-tick',
        habits: result.habits,
        budgets: result.budgets,
        missedDays: result.missedDays,
        monthRolled: result.monthRolled,
      },
    ];
  }

  private onWorldChanged(
    event: Extract<DirectorEvent, { type: 'world-changed' }>
  ): DirectorAction[] {
    const { campaign, quests, expenses } = event;
    if (campaign.worldState === 'battle') return [];

    const signals = this.getSignals();
    const main = nextMainQuest(campaign, quests);
    if (main.quest) {
      this.trace({
        observe: `Player at ${campaign.currentLocation} (${campaign.progressPercentage}% progress), no live quests.`,
        infer: 'Player is idle at a town; the story can advance.',
        decide: `Offer main quest "${main.quest.title}".`,
        act: 'Queued offer-quest action.',
        rationale: main.rationale,
      });
      return [{ kind: 'offer-quest', quest: main.quest, rationale: main.rationale }];
    }

    if (expenses.length > 0) {
      const forge = forgeValidatedSideQuest(expenses, {
        world: DEFAULT_WORLD,
        avgApPerDay: Math.max(5, avgApEarnedPerDay(signals)),
        progress: campaign.progressPercentage,
      }, quests);
      if (forge.quest) {
        this.trace({
          observe: `${expenses.length} expense(s) logged; top category drives side content.`,
          infer: 'Spending pattern is strong enough to theme a side quest.',
          decide: `Offer side quest "${forge.quest.title}" (QC passed in ${forge.attempts} attempt(s)).`,
          act: 'Queued offer-quest action.',
          rationale: forge.log.join(' '),
        });
        return [{ kind: 'offer-quest', quest: forge.quest, rationale: forge.log.join(' ') }];
      }
    }

    return [];
  }

  private onBattleRequested(
    event: Extract<DirectorEvent, { type: 'battle-requested' }>
  ): DirectorAction[] {
    const signals = this.getSignals();
    const base = pickEnemy({ progress: event.progress, battlesFought: signals.battlesFought });
    const scaled = scaleEnemy(base, signals);
    const analysis = analyzeMemory(this.getMemory());
    const countered = applyCounters(scaled.enemy, analysis);
    const enemy = { ...countered.enemy, id: `${base.id}-${Date.now()}`, archetype: base.archetype };
    const rationale = `${scaled.rationale} ${countered.rationale}`;

    this.trace({
      observe: `Battle requested at ${event.progress}% progress; ${signals.battlesFought} battles fought, win rate ${(signals.combatWinRate * 100).toFixed(0)}%.`,
      infer: `Player skill and recent behavior shape the encounter (${base.archetype} archetype).`,
      decide: `Field ${enemy.name} (HP ${enemy.hp}, ATK ${enemy.attack}, DEF ${enemy.defense}).`,
      act: 'Queued spawn-enemy action.',
      rationale,
    });

    return [{ kind: 'spawn-enemy', enemy, rationale }];
  }

  private onBattleFinished(
    event: Extract<DirectorEvent, { type: 'battle-finished' }>
  ): DirectorAction[] {
    const signals = this.getSignals();
    const memory = recordBattleMemory(this.getMemory(), {
      won: event.won,
      strikes: event.strikes,
      potionsUsed: event.potionsUsed,
      distinctStrikers: event.distinctStrikers,
    });
    this.storage.set(KEYS.battleMemory, memory);

    // Difficulty is judged on pre-battle signals: the fight was scaled by them.
    const difficulty = difficultyMultiplier(signals);
    this.setSignals(
      recordBattle(signals, {
        won: event.won,
        strikes: event.strikes,
        potionsUsed: event.potionsUsed,
      })
    );

    if (!event.won) {
      this.trace({
        observe: `Battle lost after ${event.strikes} strikes and ${event.potionsUsed} potion(s).`,
        infer: 'Loss streak feeds the pity system for the next encounter.',
        decide: 'No reward; difficulty will ease if losses continue.',
        act: 'Updated signals and battle memory.',
        rationale: difficulty.rationale,
      });
      return [];
    }

    const performance = battlePerformance({ strikes: event.strikes, potionsUsed: event.potionsUsed });
    const reward = battleReward({ exp: 100, gold: 50 }, difficulty.multiplier, performance);
    const leveled = applyExp(event.stats, reward.exp);
    const party = applyLevelUps(event.party, leveled.levelsGained);
    const rationale = `${reward.rationale} ${leveled.rationale}`;

    this.trace({
      observe: `Battle won in ${event.strikes} strikes with ${event.potionsUsed} potion(s).`,
      infer: `Performance factor ${performance.toFixed(2)} at difficulty ${difficulty.multiplier.toFixed(2)}.`,
      decide: `Pay ${reward.exp} exp / ${reward.gold} gold${leveled.levelsGained > 0 ? `, level up to ${leveled.stats.level}` : ''}.`,
      act: 'Queued battle-reward action.',
      rationale,
    });

    return [
      {
        kind: 'battle-reward',
        exp: reward.exp,
        gold: reward.gold,
        stats: { ...leveled.stats, gold: event.stats.gold + reward.gold },
        party,
        levelsGained: leveled.levelsGained,
        rationale,
      },
    ];
  }
}
