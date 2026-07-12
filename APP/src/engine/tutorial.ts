import type { PlayerProfile } from './onboarding';

/**
 * Contextual tutorial (item 3 / Phase 8). Non-blocking, skippable guide that walks the whole
 * finance→game loop, emphasising AP (Action Points): earned on the finance side (logging
 * expenses, completing tasks & rituals) and spent on the game side (travelling, fighting).
 *
 * Pure + deterministic. The current step is a milestone ladder over live game context; the App
 * persists the furthest step reached on the profile (monotonic — never regresses).
 */

export type TutorialStep =
  | 'set-budget' | 'log-expense' | 'open-map' | 'enter-town' | 'talk' | 'fight' | 'claim' | 'done';

export const TUTORIAL_STEPS: TutorialStep[] = [
  'set-budget', 'log-expense', 'open-map', 'enter-town', 'talk', 'fight', 'claim', 'done',
];

export interface TutorialContext {
  hasBudget: boolean;    // monthlyBudget > 0
  earnedAp: boolean;     // first AP earned (onboarding latched)
  onMap: boolean;        // currently on the Strategic Map (Quests) tab
  inTown: boolean;       // worldState === 'town' (durable)
  talkedToNpc: boolean;  // main quest talk objective completed
  beatBoss: boolean;     // main quest kill objective completed
  claimed: boolean;      // main quest completed (reward claimed)
}

export const TUTORIAL_COPY: Record<TutorialStep, { title: string; hint: string; ap?: boolean }> = {
  'set-budget': {
    title: 'Set your budget',
    hint: 'Every ledger starts with a limit. Open the Budget card and set your monthly allowance.',
  },
  'log-expense': {
    title: 'Earn your first AP',
    hint: '⚡ AP (Action Points) power the adventure. You earn AP on the finance side — by logging expenses and completing tasks & rituals. Log your first expense to earn AP!',
    ap: true,
  },
  'open-map': {
    title: 'Spend AP to explore',
    hint: '⚡ AP is spent on the game side — travelling the world and fighting costs AP. Open the Strategic Map (Quests tab) to begin.',
    ap: true,
  },
  'enter-town': {
    title: 'Travel & enter a town',
    hint: 'Tap your location on the world map to enter the town. Traveling between towns spends AP — keep logging expenses to refill it.',
  },
  talk: {
    title: 'Talk to the Chronicler',
    hint: 'Inside the town, speak with Chronicler Daniel to take up the chronicle’s quest.',
  },
  fight: {
    title: 'Face the threat',
    hint: 'Head to the Outskirts to battle — or defend the town when a boss invades. Battles spend AP and reward XP & gold.',
  },
  claim: {
    title: 'Claim your reward',
    hint: 'Victory! Claim your quest reward in the Strategic Map to complete the chronicle.',
  },
  done: {
    title: 'You’re ready',
    hint: 'That’s the loop: earn AP on the finance side, spend it on the adventure. Keep your ledger honest and your party strong!',
  },
};

/** The step the player is currently ON (their next action), from the furthest milestone reached. */
export const currentTutorialStepIndex = (ctx: TutorialContext): number => {
  if (ctx.claimed) return 7;
  if (ctx.beatBoss) return 6;
  if (ctx.talkedToNpc) return 5;
  if (ctx.inTown) return 4;
  if (ctx.onMap) return 3;
  if (ctx.earnedAp) return 2;
  if (ctx.hasBudget) return 1;
  return 0;
};

/** Monotonic advance — the persisted step never regresses when a momentary condition drops. */
export const advanceTutorialStep = (prev: number | undefined, ctx: TutorialContext): number =>
  Math.max(prev ?? 0, currentTutorialStepIndex(ctx));

/** Tutorial is active until the player finishes or skips it. */
export const tutorialActive = (profile: PlayerProfile): boolean => !profile.tutorialDone;
