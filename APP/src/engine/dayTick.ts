import type { Habit, BudgetStream } from '../types/schemas';

export interface DayTickInput {
  lastSeen: number; // 0 = first boot, no penalties
  now: number;
  habits: Habit[];
  budgets: BudgetStream[];
}

export interface DayTickResult {
  changed: boolean;
  missedDays: number;
  habits: Habit[];
  budgets: BudgetStream[];
  monthRolled: boolean;
  rationale: string;
}

const startOfDay = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const DAY_MS = 24 * 60 * 60 * 1000;

const daysBetween = (fromDay: number, toDay: number): number =>
  Math.round((toDay - fromDay) / DAY_MS);

export function dayTick(input: DayTickInput): DayTickResult {
  const { lastSeen, now, habits, budgets } = input;

  const noop = (rationale: string): DayTickResult => ({
    changed: false,
    missedDays: 0,
    habits,
    budgets,
    monthRolled: false,
    rationale,
  });

  if (lastSeen <= 0) return noop('First boot: no elapsed days to evaluate.');

  const fromDay = startOfDay(lastSeen);
  const toDay = startOfDay(now);
  const missedDays = daysBetween(fromDay, toDay);
  if (missedDays <= 0) return noop('Same calendar day: nothing to tick.');

  // A habit skipped a day D when its single lastCompleted stamp does not fall on D.
  const newHabits = habits.map(h => {
    const completedDay = h.lastCompleted > 0 ? startOfDay(h.lastCompleted) : -1;
    let skips = 0;
    for (let d = fromDay; d < toDay; d += DAY_MS) {
      if (startOfDay(d) !== completedDay) skips++;
    }
    if (skips === 0) return h;
    return { ...h, skipCount: h.skipCount + skips, streak: 0 };
  });

  const last = new Date(lastSeen);
  const cur = new Date(now);
  const monthRolled =
    last.getFullYear() !== cur.getFullYear() || last.getMonth() !== cur.getMonth();
  const newBudgets = monthRolled ? budgets.map(b => ({ ...b, spentAmount: 0 })) : budgets;

  const rationale =
    `${missedDays} day(s) since last session; habit skip counters updated` +
    (monthRolled ? '; new month, budget streams reset.' : '.');

  return {
    changed: true,
    missedDays,
    habits: newHabits,
    budgets: newBudgets,
    monthRolled,
    rationale,
  };
}
