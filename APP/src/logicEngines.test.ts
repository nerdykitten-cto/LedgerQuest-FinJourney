import { describe, it, expect } from 'vitest';
import { APEvaluator, ValueAdjuster } from './logicEngines';

// Smoke tests proving the vitest harness runs against real modules.
// logicEngines is scheduled for replacement by src/engine/ (Overhaul Phase 2);
// these tests pin current behavior until the Director reaches parity.

describe('APEvaluator', () => {
  const evaluator = new APEvaluator();

  it('multiplies necessity task rewards by 1.5', () => {
    expect(
      evaluator.evaluateTaskReward({
        id: 't', title: '', description: '', isNecessity: true, baseAPReward: 10, isCompleted: false,
      }),
    ).toBe(15);
  });

  it('keeps non-necessity rewards at base value', () => {
    expect(
      evaluator.evaluateTaskReward({
        id: 't', title: '', description: '', isNecessity: false, baseAPReward: 10, isCompleted: false,
      }),
    ).toBe(10);
  });
});

describe('ValueAdjuster', () => {
  const adjuster = new ValueAdjuster();

  it('raises difficulty and reward on a 5-day streak', () => {
    const result = adjuster.adjustHabit({
      id: 'h', name: '', streak: 5, lastCompleted: 0, skipCount: 0, difficulty: 3,
    });
    expect(result.newDifficulty).toBe(4);
    expect(result.adjustedAP).toBe(11);
  });

  it('lowers difficulty after 3+ skips', () => {
    const result = adjuster.adjustHabit({
      id: 'h', name: '', streak: 0, lastCompleted: 0, skipCount: 3, difficulty: 3,
    });
    expect(result.newDifficulty).toBe(2);
    expect(result.adjustedAP).toBe(16);
  });
});
