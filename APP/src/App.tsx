import { useState, useEffect, useCallback } from 'react';
import './App.css';
import type { 
  Expense, 
  PlayerStats, 
  Quest, 
  LogicEngineTrace, 
  FinanceTask, 
  CampaignState,
  Habit,
  PartyMember,
  Enemy
} from './types/schemas';
import { APEvaluator, ValueAdjuster, StoryTellingEngine } from './logicEngines';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import QuestList from './components/QuestList';
import PlayerDashboard from './components/PlayerDashboard';
import BattleSystem from './components/BattleSystem';
import WorldMap from './components/WorldMap';
import GameView from './components/GameView';
import * as dbService from './persistenceService';
import { v4 as uuidv4 } from 'uuid';

const evaluator = new APEvaluator();
const adjuster = new ValueAdjuster();
const agent = new StoryTellingEngine();

function App() {
  const [viewMode, setViewMode] = useState<'finance' | 'rpg'>('finance');
  const [stats, setStats] = useState<PlayerStats>({ level: 1, exp: 0, ap: 10, gold: 0 });
  const [campaign, setCampaign] = useState<CampaignState>({ 
    currentLocation: 'Start Town', 
    progressPercentage: 0, 
    worldState: 'peace' 
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [tasks, setTasks] = useState<FinanceTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [traces, setTraces] = useState<LogicEngineTrace[]>([]);
  const [party, setParty] = useState<PartyMember[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    isNecessity: false, 
    baseAPReward: 10 
  });

  const showNotify = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Persistence Sync
  useEffect(() => {
    dbService.initializeLocalData();
    const unsubExpenses = dbService.subscribeExpenses(setExpenses);
    const unsubQuests = dbService.subscribeQuests(setQuests);
    const unsubStats = dbService.subscribeStats(setStats);
    const unsubCampaign = dbService.subscribeCampaign(setCampaign);
    const unsubTasks = dbService.subscribeTasks(setTasks);
    const unsubHabits = dbService.subscribeHabits(setHabits);
    const unsubTraces = dbService.subscribeTraces(setTraces);
    const unsubParty = dbService.subscribeParty(setParty);

    return () => {
      unsubExpenses();
      unsubQuests();
      unsubStats();
      unsubCampaign();
      unsubTasks();
      unsubHabits();
      unsubTraces();
      unsubParty();
    };
  }, []);

  // Story Telling Engine Trigger
  useEffect(() => {
    if (expenses.length >= 0) {
      const runAgent = async () => {
        const { quest, trace } = await agent.process(expenses, stats, habits, campaign, quests);
        if (quest) {
          const exists = quests.some(q => q.id === quest.id);
          if (!exists) {
            await dbService.addQuestDB(quest);
            showNotify('New Story Beat: ' + quest.title);
          }
        }
        await dbService.addTraceDB(trace);
      };
      runAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses.length, campaign.progressPercentage, quests.length]);

  // Finance Actions
  const handleAddExpense = async (expense: Expense) => {
    await dbService.addExpenseDB(expense);
    const reward = 2;
    await dbService.updateStatsDB({ ap: stats.ap + reward });
    showNotify('+' + reward + ' AP for logging expense!');
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    const task: FinanceTask = {
      id: uuidv4(),
      title: newTask.title,
      description: newTask.description,
      isNecessity: newTask.isNecessity,
      baseAPReward: newTask.baseAPReward,
      isCompleted: false,
    };

    await dbService.addTaskDB(task);
    setNewTask({ title: '', description: '', isNecessity: false, baseAPReward: 10 });
    showNotify('New task created: ' + task.title);
  };

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const reward = evaluator.evaluateTaskReward(task);
      await dbService.updateTaskDB(taskId, { isCompleted: true });
      await dbService.updateStatsDB({ ap: stats.ap + reward });
      showNotify('+' + reward + ' AP: Task "' + task.title + '" completed!');

      const trace = adjuster.generateTrace('AP_EVALUATOR', task, 'Task reward evaluation', { reward });
      await dbService.addTraceDB(trace);
    }
  };

  const handleCompleteHabit = useCallback(async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const now = Date.now();
      const { adjustedAP, newDifficulty, rationale } = adjuster.adjustHabit(habit);
      await dbService.updateHabitDB(habitId, { 
        streak: habit.streak + 1, 
        lastCompleted: now,
        skipCount: 0,
        difficulty: newDifficulty
      });
      await dbService.updateStatsDB({ ap: stats.ap + adjustedAP });
      showNotify('+' + adjustedAP + ' AP: Habit "' + habit.name + '" updated!');

      const trace = adjuster.generateTrace('VALUE_ADJUSTER', habit, rationale, { adjustedAP, newDifficulty });
      await dbService.addTraceDB(trace);
    }
  }, [habits, stats.ap, showNotify]);

  // RPG Actions
  const handleTravel = async (destination: string) => {
    const cost = evaluator.calculateTravelCost(20);
    if (stats.ap >= cost) {
      await dbService.updateStatsDB({ ap: stats.ap - cost });
      await dbService.updateCampaign({ 
        currentLocation: destination, 
        progressPercentage: Math.min(100, campaign.progressPercentage + 5) 
      });
      showNotify('Traveled to ' + destination + '. Cost: ' + cost + ' AP');
    } else {
      showNotify('Not enough AP to travel!');
    }
  };

  const handleRecruit = async () => {
    const cost = 500;
    if (stats.gold >= cost) {
      const newMember: PartyMember = {
        id: uuidv4(),
        name: 'Mercenary',
        role: 'Archer',
        hp: 80,
        maxHp: 80,
        mp: 40,
        maxMp: 40,
        level: stats.level,
        equipment: {}
      };
      await dbService.addPartyMemberDB(newMember);
      await dbService.updateStatsDB({ gold: stats.gold - cost });
      showNotify('Recruited a new Mercenary!');
    } else {
      showNotify('Need ' + cost + ' Gold to recruit!');
    }
  };

  const handleStartQuest = async (questId: string) => {
    const cost = 3; // Standard quest start cost
    if (stats.ap >= cost) {
      await dbService.updateQuestDB(questId, { status: 'active' });
      await dbService.updateStatsDB({ ap: stats.ap - cost });
      showNotify('Quest started! Good luck.');
    } else {
      showNotify('Not enough AP to start quest!');
    }
  };

  const handleFight = async () => {
    const cost = evaluator.calculateActionCost('battle');
    if (stats.ap >= cost) {
      const enemy: Enemy = {
        id: uuidv4(),
        name: 'Roaming Shadow',
        hp: 50 + stats.level * 10,
        maxHp: 50 + stats.level * 10,
        attack: 10 + stats.level * 2,
        defense: 5
      };
      await dbService.updateStatsDB({ ap: stats.ap - cost });
      await dbService.updateCampaign({ worldState: 'battle', activeEnemy: enemy });
      showNotify('Engaging in battle! Cost: ' + cost + ' AP');
    } else {
      showNotify('Not enough AP to fight!');
    }
  };

  const handleBattleVictory = async () => {
    const rewardExp = 100;
    const rewardGold = 50;
    await dbService.updateStatsDB({ 
      exp: stats.exp + rewardExp, 
      gold: stats.gold + rewardGold 
    });
    await dbService.updateCampaign({ worldState: 'peace', activeEnemy: undefined });
    showNotify('Victory! Gained ' + rewardExp + ' EXP and ' + rewardGold + ' Gold.');

    if (stats.exp + rewardExp >= stats.level * 1000) {
      await dbService.updateStatsDB({ level: stats.level + 1, exp: 0 });
      showNotify('LEVEL UP!');
    }
  };

  const handleBattleDefeat = async () => {
    await dbService.updateCampaign({ worldState: 'peace', activeEnemy: undefined });
    showNotify('Defeat... You escaped with minor injuries.');
  };

  const handleCompleteQuest = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (quest) {
      // For now, higher difficulty quests trigger a mandatory battle
      if (quest.difficulty > stats.level) {
        const enemy: Enemy = {
          id: uuidv4(),
          name: 'Quest Guardian: ' + quest.title,
          hp: quest.difficulty * 40,
          maxHp: quest.difficulty * 40,
          attack: quest.difficulty * 8,
          defense: quest.difficulty * 2
        };
        await dbService.updateCampaign({ 
          worldState: 'battle', 
          activeEnemy: enemy,
          activeQuestId: quest.id 
        });
        showNotify('A guardian blocks your quest! Defeat it to complete the quest.');
      } else {
        await finalizeQuest(quest);
      }
    }
  };

  const finalizeQuest = async (quest: Quest) => {
    await dbService.updateQuestDB(quest.id, { status: 'completed' });
    await dbService.updateStatsDB({ 
      exp: stats.exp + quest.reward.exp, 
      gold: stats.gold + quest.reward.gold 
    });
    showNotify('Quest Success! Gained ' + quest.reward.exp + ' EXP and ' + quest.reward.gold + ' Gold.');
    
    if (stats.exp + quest.reward.exp >= stats.level * 1000) {
      await dbService.updateStatsDB({ 
        level: stats.level + 1,
        exp: 0
      });
      showNotify('LEVEL UP!');
    }
    await dbService.updateCampaign({ activeQuestId: undefined });
  };

  // Check if a battle victory should complete a quest
  useEffect(() => {
    if (campaign.worldState === 'peace' && campaign.activeQuestId) {
      const quest = quests.find(q => q.id === campaign.activeQuestId);
      if (quest && quest.status === 'active') {
        finalizeQuest(quest);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.worldState, campaign.activeQuestId]);

  return (
    <div className="container">
      {notification && <div className="notification">{notification}</div>}

      <header className="main-header">
        <div className="title-area">
          <h1>FinJourney</h1>
          <p>{viewMode === 'finance' ? 'Finance Office' : 'Adventure World'}</p>
        </div>
        <nav className="mode-switcher">
          <button 
            className={viewMode === 'finance' ? 'active' : ''} 
            onClick={() => setViewMode('finance')}
          >
            Finance
          </button>
          <button 
            className={viewMode === 'rpg' ? 'active' : ''} 
            onClick={() => setViewMode('rpg')}
          >
            RPG
          </button>
        </nav>
      </header>

      <PlayerDashboard stats={stats} />

      <main className="view-container">
        {viewMode === 'finance' ? (
          <div className="finance-layout">
            <section className="tasks-section">
              <header className="section-header">
                <h3>Commitment Bridge</h3>
                <span className="subtitle">Habits & Tasks</span>
              </header>

              <div className="task-group create-task">
                <h4>Create New Task</h4>
                <form onSubmit={handleAddTask} className="task-form-inline">
                  <input 
                    type="text" 
                    placeholder="Task Title" 
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="Description" 
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  />
                  <div className="form-row">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={newTask.isNecessity}
                        onChange={e => setNewTask({ ...newTask, isNecessity: e.target.checked })}
                      />
                      Necessity
                    </label>
                    <label>
                      AP:
                      <input 
                        type="number" 
                        style={{ width: '50px' }}
                        value={newTask.baseAPReward}
                        onChange={e => setNewTask({ ...newTask, baseAPReward: parseInt(e.target.value) || 0 })}
                      />
                    </label>
                    <button type="submit">Add</button>
                  </div>
                </form>
              </div>

              <div className="task-group">
                <h4>Daily Tasks</h4>
                {tasks.filter(t => !t.isCompleted).map(t => (
                  <div key={t.id} className="task-card">
                    <div>
                      <strong>{t.title}</strong>
                      <p>{t.description}</p>
                    </div>
                    <button onClick={() => handleCompleteTask(t.id)}>
                      Complete ({evaluator.evaluateTaskReward(t)} AP)
                    </button>
                  </div>
                ))}
              </div>
              <div className="task-group">
                <h4>Financial Habits</h4>
                {habits.map(h => {
                  const { adjustedAP } = adjuster.adjustHabit(h);
                  return (
                    <div key={h.id} className="task-card habit">
                      <div>
                        <strong>{h.name}</strong>
                        <p>Streak: {h.streak} | Skip Count: {h.skipCount}</p>
                      </div>
                      <button onClick={() => handleCompleteHabit(h.id)}>
                        Log ({adjustedAP} AP)
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="input-section">
              <ExpenseForm onAddExpense={handleAddExpense} />
              <ExpenseList expenses={expenses} />
            </section>
          </div>
        ) : (
          <div className="rpg-layout">
            {campaign.worldState === 'battle' && campaign.activeEnemy ? (
              <BattleSystem 
                party={party} 
                enemy={campaign.activeEnemy} 
                onVictory={handleBattleVictory}
                onDefeat={handleBattleDefeat}
              />
            ) : (
              <>
                <section className="narrative-section">
                  <header className="section-header">
                    <h3>Adventure: {campaign.currentLocation}</h3>
                    <span className="subtitle">Progress: {campaign.progressPercentage}%</span>
                  </header>
                  
                  <GameView stats={stats} />
                  
                  <WorldMap campaign={campaign} onTravel={handleTravel} />

                  <div className="story-text">
                    <p>The path ahead is clear. You feel the weight of your decisions in your pouch.</p>
                  </div>
                  <div className="rpg-actions">
                    <button onClick={handleFight}>Fight (3 AP)</button>
                    <button onClick={() => showNotify('Talking costs 1 AP...')}>Talk (1 AP)</button>
                    <button onClick={handleRecruit}>Recruit (500 Gold)</button>
                  </div>
                  <div className="party-group">
                    <h4>Your Party</h4>
                    <div className="party-list">
                      {party.map(m => (
                        <div key={m.id} className="party-card">
                          <strong>{m.name}</strong> ({m.role})
                          <p>HP: {m.hp}/{m.maxHp} | MP: {m.mp}/{m.maxMp}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
                <QuestList 
                  quests={quests} 
                  onStartQuest={handleStartQuest} 
                  onCompleteQuest={handleCompleteQuest} 
                />
              </>
            )}
          </div>
        )}
      </main>

      <footer className="audit-footer">
        <details>
          <summary>Logic Engine Traces (Audit)</summary>
          <div className="trace-container">
            {traces.slice(0, 10).map((t, i) => (
              <div key={i} className="trace-item">
                <code>[{new Date(t.timestamp).toLocaleTimeString()}] {t.type}: {t.rationale}</code>
              </div>
            ))}
          </div>
        </details>
      </footer>
    </div>
  );
}

export default App;
