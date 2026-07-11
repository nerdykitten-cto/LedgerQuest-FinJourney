import { describe, it, expect } from 'vitest';
import {
  SCRATCH_STATS,
  SCRATCH_PROFILE,
  ONBOARDING_STEPS,
  hasBudget,
  hasEarnedAp,
  currentOnboardingStep,
  isPlayUnlocked,
  shouldLatchUnlock,
} from './onboarding';

describe('scratch seed constants', () => {
  it('zeroes the economy (0 AP / 0 gold / 0 xp, blank budget)', () => {
    expect(SCRATCH_STATS).toEqual({ level: 1, exp: 0, ap: 0, gold: 0, monthlyBudget: 0 });
  });

  it('scratch profile starts onboarding incomplete', () => {
    expect(SCRATCH_PROFILE).toEqual({ onboardingComplete: false });
  });

  it('lists the budget-first steps in order, ending at complete', () => {
    expect(ONBOARDING_STEPS).toEqual(['set-budget', 'log-expense', 'complete']);
  });
});

describe('predicates', () => {
  it('hasBudget only when monthlyBudget > 0', () => {
    expect(hasBudget({ monthlyBudget: 0 })).toBe(false);
    expect(hasBudget({ monthlyBudget: undefined })).toBe(false);
    expect(hasBudget({ monthlyBudget: 1500 })).toBe(true);
  });

  it('hasEarnedAp only when ap > 0', () => {
    expect(hasEarnedAp({ ap: 0 })).toBe(false);
    expect(hasEarnedAp({ ap: 8 })).toBe(true);
  });
});

describe('currentOnboardingStep', () => {
  const incomplete = { onboardingComplete: false };

  it('fresh scratch player must set a budget first', () => {
    expect(currentOnboardingStep({ monthlyBudget: 0, ap: 0 }, incomplete)).toBe('set-budget');
  });

  it('after budget set but no AP earned, next step is log-expense', () => {
    expect(currentOnboardingStep({ monthlyBudget: 1500, ap: 0 }, incomplete)).toBe('log-expense');
  });

  it('budget set + first AP earned reaches complete', () => {
    expect(currentOnboardingStep({ monthlyBudget: 1500, ap: 8 }, incomplete)).toBe('complete');
  });

  it('latched profile stays complete even at 0 AP (spent it all after unlock)', () => {
    expect(currentOnboardingStep({ monthlyBudget: 1500, ap: 0 }, { onboardingComplete: true })).toBe('complete');
  });
});

describe('isPlayUnlocked', () => {
  it('locked on scratch', () => {
    expect(isPlayUnlocked({ monthlyBudget: 0, ap: 0 }, { onboardingComplete: false })).toBe(false);
  });

  it('locked with budget but no AP', () => {
    expect(isPlayUnlocked({ monthlyBudget: 1500, ap: 0 }, { onboardingComplete: false })).toBe(false);
  });

  it('unlocked once budget set + AP earned', () => {
    expect(isPlayUnlocked({ monthlyBudget: 1500, ap: 8 }, { onboardingComplete: false })).toBe(true);
  });

  it('stays unlocked after latch even when AP drops to 0', () => {
    expect(isPlayUnlocked({ monthlyBudget: 1500, ap: 0 }, { onboardingComplete: true })).toBe(true);
  });
});

describe('shouldLatchUnlock', () => {
  it('true exactly when unlock condition is freshly met but not yet latched', () => {
    expect(shouldLatchUnlock({ monthlyBudget: 1500, ap: 8 }, { onboardingComplete: false })).toBe(true);
  });

  it('false before the condition is met', () => {
    expect(shouldLatchUnlock({ monthlyBudget: 1500, ap: 0 }, { onboardingComplete: false })).toBe(false);
    expect(shouldLatchUnlock({ monthlyBudget: 0, ap: 8 }, { onboardingComplete: false })).toBe(false);
  });

  it('false once already latched (no repeat writes)', () => {
    expect(shouldLatchUnlock({ monthlyBudget: 1500, ap: 8 }, { onboardingComplete: true })).toBe(false);
  });
});
