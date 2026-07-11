import type { PlayerStats } from '../types/schemas';

/**
 * First-run / hard-reset onboarding (Phase 7). No sign-in — a fresh visit or a
 * "New Game" reset drops the player into a SCRATCH profile with a zeroed economy
 * and a budget-first gate that keeps play (map travel / AP spend) locked until
 * they set a budget limit and log a first expense (earning their first AP).
 *
 * Pure logic only — persistence lives in persistenceService, UI in App/OnboardingGate.
 * The step model is intentionally reusable: Phase 8's guided tutorial extends the
 * flow past 'complete' (talk → battle → claim).
 */

/** Scratch economy: true fresh start — zero AP/gold/xp, blank budget. The party,
 *  gear and potions are seeded separately (scratch zeroes the ECONOMY, not the party). */
export const SCRATCH_STATS: PlayerStats = {
  level: 1,
  exp: 0,
  ap: 0,
  gold: 0,
  monthlyBudget: 0,
  currency: 'USD',
};

export interface PlayerProfile {
  onboardingComplete: boolean;
}

export const SCRATCH_PROFILE: PlayerProfile = { onboardingComplete: false };

/** Budget-first onboarding steps, in order. */
export type OnboardingStep = 'set-budget' | 'log-expense' | 'complete';
export const ONBOARDING_STEPS: OnboardingStep[] = ['set-budget', 'log-expense', 'complete'];

export const hasBudget = (stats: Pick<PlayerStats, 'monthlyBudget'>): boolean =>
  (stats.monthlyBudget ?? 0) > 0;

export const hasEarnedAp = (stats: Pick<PlayerStats, 'ap'>): boolean => stats.ap > 0;

type GateStats = Pick<PlayerStats, 'monthlyBudget' | 'ap'>;

/**
 * Which onboarding step the player is on. Latches to 'complete' via the profile
 * flag, so spending AP back to 0 after unlocking never re-locks play.
 */
export const currentOnboardingStep = (stats: GateStats, profile: PlayerProfile): OnboardingStep => {
  if (profile.onboardingComplete) return 'complete';
  if (!hasBudget(stats)) return 'set-budget';
  if (!hasEarnedAp(stats)) return 'log-expense';
  return 'complete';
};

/** Play (map travel / AP spend) is unlocked once onboarding reaches 'complete'. */
export const isPlayUnlocked = (stats: GateStats, profile: PlayerProfile): boolean =>
  currentOnboardingStep(stats, profile) === 'complete';

/**
 * True when the unlock condition is freshly met but not yet latched — the App
 * uses this to persist onboardingComplete=true exactly once (the one-way latch).
 */
export const shouldLatchUnlock = (stats: GateStats, profile: PlayerProfile): boolean =>
  !profile.onboardingComplete && hasBudget(stats) && hasEarnedAp(stats);
