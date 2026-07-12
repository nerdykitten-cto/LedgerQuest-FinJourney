import { describe, it, expect } from 'vitest';
import {
  TUTORIAL_STEPS, TUTORIAL_COPY, currentTutorialStepIndex, advanceTutorialStep, tutorialActive,
  type TutorialContext,
} from './tutorial';

const ctx = (over: Partial<TutorialContext> = {}): TutorialContext => ({
  hasBudget: false, earnedAp: false, onMap: false, inTown: false,
  talkedToNpc: false, beatBoss: false, claimed: false, ...over,
});

describe('step vocabulary', () => {
  it('has 8 ordered steps ending at done, each with copy', () => {
    expect(TUTORIAL_STEPS).toEqual(['set-budget', 'log-expense', 'open-map', 'enter-town', 'talk', 'fight', 'claim', 'done']);
    TUTORIAL_STEPS.forEach(s => expect(TUTORIAL_COPY[s].title.length).toBeGreaterThan(0));
  });
  it('emphasises AP on the earn and spend steps', () => {
    expect(TUTORIAL_COPY['log-expense'].ap).toBe(true);
    expect(TUTORIAL_COPY['open-map'].ap).toBe(true);
  });
});

describe('currentTutorialStepIndex (milestone ladder = next action)', () => {
  it('scratch player starts at set-budget (0)', () => {
    expect(currentTutorialStepIndex(ctx())).toBe(0);
  });
  it('budget set -> log-expense (1)', () => {
    expect(currentTutorialStepIndex(ctx({ hasBudget: true }))).toBe(1);
  });
  it('AP earned -> open-map (2)', () => {
    expect(currentTutorialStepIndex(ctx({ hasBudget: true, earnedAp: true }))).toBe(2);
  });
  it('map opened -> enter-town (3)', () => {
    expect(currentTutorialStepIndex(ctx({ earnedAp: true, onMap: true }))).toBe(3);
  });
  it('in town -> talk (4), durable even if the map tab is left', () => {
    expect(currentTutorialStepIndex(ctx({ earnedAp: true, inTown: true, onMap: false }))).toBe(4);
  });
  it('talked -> fight (5); boss beaten -> claim (6); claimed -> done (7)', () => {
    expect(currentTutorialStepIndex(ctx({ talkedToNpc: true }))).toBe(5);
    expect(currentTutorialStepIndex(ctx({ beatBoss: true }))).toBe(6);
    expect(currentTutorialStepIndex(ctx({ claimed: true }))).toBe(7);
  });
});

describe('advanceTutorialStep (monotonic)', () => {
  it('never regresses when a momentary condition drops', () => {
    expect(advanceTutorialStep(3, ctx({ earnedAp: true, onMap: false }))).toBe(3);
  });
  it('advances when a further milestone is reached', () => {
    expect(advanceTutorialStep(2, ctx({ earnedAp: true, inTown: true }))).toBe(4);
  });
  it('treats undefined prior step as 0', () => {
    expect(advanceTutorialStep(undefined, ctx({ hasBudget: true }))).toBe(1);
  });
});

describe('tutorialActive', () => {
  it('active until done/skipped', () => {
    expect(tutorialActive({ onboardingComplete: false })).toBe(true);
    expect(tutorialActive({ onboardingComplete: true, tutorialDone: false })).toBe(true);
    expect(tutorialActive({ onboardingComplete: true, tutorialDone: true })).toBe(false);
  });
});
