import type { 
  FinanceTask, 
  Habit, 
  LogicEngineTrace,
  Encounter,
  Expense,
  PlayerStats,
  Quest,
  CampaignState
} from './types/schemas';
import storyManifestData from './data/storyManifest.json';

interface ManifestQuest {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  reward: {
    exp: number;
    gold: number;
  };
  objectives?: any[];
}

interface Chapter {
  id: string;
  title: string;
  minProgress: number;
  location: string;
  mainQuests: ManifestQuest[];
  sideQuests: ManifestQuest[];
}

interface StoryManifest {
  chapters: Chapter[];
}

const storyManifest = storyManifestData as StoryManifest;

/**
 * AP EVALUATOR SCRIPT
 */
export class APEvaluator {
  evaluateTaskReward(task: FinanceTask): number {
    let reward = task.baseAPReward;
    if (task.isNecessity) {
      reward *= 1.5;
    }
    return Math.round(reward);
  }

  calculateActionCost(type: Encounter['type']): number {
    switch (type) {
      case 'dialogue': return 1;
      case 'battle': return 3;
      case 'puzzle': return 2;
      case 'minigame': return 5;
      default: return 1;
    }
  }

  calculateTravelCost(distance: number): number {
    return Math.max(1, Math.floor(distance / 10));
  }
}

/**
 * DIFFICULTY & VALUE ADJUSTER SCRIPT
 */
export class ValueAdjuster {
  adjustHabit(habit: Habit): { adjustedAP: number; newDifficulty: number; rationale: string } {
    let multiplier = 1.0;
    let newDifficulty = habit.difficulty;
    let rationale = '';

    if (habit.skipCount > 0) {
      multiplier += (habit.skipCount * 0.2);
      rationale = 'Incentive: Reward increased by ' + (habit.skipCount * 20) + '% due to skips. ';
    }

    if (habit.skipCount >= 3) {
      newDifficulty = Math.max(1, habit.difficulty - 1);
      rationale += 'Momentum: Difficulty lowered to help you restart. ';
    }

    if (habit.streak >= 5) {
      newDifficulty = Math.min(10, habit.difficulty + 1);
      multiplier += 0.1;
      rationale += 'Challenge: Difficulty increased for your ' + habit.streak + '-day streak! ';
    }

    const baseReward = 10;
    const adjustedAP = Math.round(baseReward * multiplier);

    return { adjustedAP, newDifficulty, rationale };
  }

  generateTrace(type: 'AP_EVALUATOR' | 'VALUE_ADJUSTER' | 'STORY_TELLING_ENGINE', input: unknown, rationale: string, output: unknown): LogicEngineTrace {
    return {
      timestamp: Date.now(),
      type: type as "AP_EVALUATOR" | "VALUE_ADJUSTER" | "STORY_TELLING_ENGINE",
      input,
      rationale,
      output
    };
  }
}

/**
 * STORY-TELLING ENGINE
 */
export class StoryTellingEngine {
  private adjuster = new ValueAdjuster();

  async process(
    _expenses: Expense[], 
    _stats: PlayerStats, 
    _habits: Habit[],
    campaign: CampaignState,
    existingQuests: Quest[]
  ): Promise<{ quest?: Quest; trace: LogicEngineTrace }> {
    
    const isAtTown = campaign.currentLocation.toLowerCase().indexOf('town') !== -1 || 
                     campaign.currentLocation.toLowerCase().indexOf('village') !== -1 ||
                     campaign.currentLocation.toLowerCase().indexOf('city') !== -1 ||
                     campaign.currentLocation.toLowerCase().indexOf('citadel') !== -1;

    const observation = {
      campaignProgress: campaign.progressPercentage,
      location: campaign.currentLocation,
      isAtTown,
      hasActiveQuest: existingQuests.some(q => q.status === 'active' || q.status === 'available')
    };

    let quest: Quest | undefined;
    let decisionReason = 'Waiting for player to reach a town or complete active quests.';

    if (isAtTown && !observation.hasActiveQuest) {
      const chapter = [...storyManifest.chapters]
        .reverse()
        .find(ch => observation.campaignProgress >= ch.minProgress) || storyManifest.chapters[0];

      if (chapter) {
        const mqData = chapter.mainQuests[0];
        const isMainCompleted = existingQuests.some(q => q.id === mqData.id && q.status === 'completed');

        if (!isMainCompleted) {
          quest = {
            ...mqData,
            type: 'main',
            status: 'available',
            requirements: { apQuota: 5, taskCount: 0, habitCount: 0 }
          } as Quest;
          decisionReason = 'Nudging player to Main Quest: ' + quest.title;
        } else {
           decisionReason = 'All primary objectives for ' + chapter.title + ' completed.';
        }
      }
    }

    const trace = this.adjuster.generateTrace(
      'STORY_TELLING_ENGINE',
      observation,
      decisionReason,
      { decisionReason, quest }
    );

    return { quest, trace };
  }
}
