import { useState, useEffect } from 'react';
import './App.css';
import type { 
  Expense, 
  PlayerStats, 
  Quest, 
  LogicEngineTrace, 
  FinanceTask, 
  CampaignState,
  Habit 
} from './types/schemas';
import { APEvaluator, ValueAdjuster } from './logicEngines';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import QuestList from './components/QuestList';
import PlayerDashboard from './components/PlayerDashboard';
import * as dbService from './persistenceService';

const evaluator = new APEvaluator();
const adjuster = new ValueAdjuster();

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
  const [notification, setNotification] = useState<string | null>(null);

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

    return () => {
      unsubExpenses();
      unsubQuests();
      unsubStats();
      unsubCampaign();
      unsubTasks();
      unsubHabits();
      unsubTraces();
    };
  }, []);

  // Finance Actions
  const handleAddExpense = async (expense: Expense) => {
    await dbService.addExpenseDB(expense);
    const reward = 2;
    await dbService.updateStatsDB({ ap: stats.ap + reward });
    showNotify(`+${reward} AP for logging expense!`);
  };

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const reward = evaluator.evaluateTaskReward(task);
      await dbService.updateTaskDB(taskId, { isCompleted: true });
      await dbService.updateStatsDB({ ap: stats.ap + reward });
      showNotify(`+${reward} AP: Task "${task.title}" completed!`);
      
      const trace = adjuster.generateTrace('AP_EVALUATOR', task, 'Task reward evaluation', { reward });
      await dbService.addTraceDB(trace);
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const { adjustedAP, newDifficulty, rationale } = adjuster.adjustHabit(habit);
      await dbService.updateHabitDB(habitId, { 
        streak: habit.streak + 1, 
        lastCompleted: Date.now(),
        skipCount: 0,
        difficulty: newDifficulty
      });
      await dbService.updateStatsDB({ ap: stats.ap + adjustedAP });
      showNotify(`+${adjustedAP} AP: Habit "${habit.name}" updated!`);
      
      const trace = adjuster.generateTrace('VALUE_ADJUSTER', habit, rationale, { adjustedAP, newDifficulty });
      await dbService.addTraceDB(trace);
    }
  };

  // RPG Actions
  const handleTravel = async (destination: string) => {
    const cost = evaluator.calculateTravelCost(20);
    if (stats.ap >= cost) {
      await dbService.updateStatsDB({ ap: stats.ap - cost });
      await dbService.updateCampaign({ 
        currentLocation: destination, 
        progressPercentage: Math.min(100, campaign.progressPercentage + 5) 
      });
      showNotify(`Traveled to ${destination}. Cost: ${cost} AP`);
    } else {
      showNotify('Not enough AP to travel!');
    }
  };

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

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
              <h3>Commitment Bridge</h3>
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
            <section className="narrative-section">
              <h3>Current Location: {campaign.currentLocation}</h3>
              <div className="story-text">
                <p>The path ahead is clear. You feel the weight of your decisions in your pouch.</p>
                <p>Progress: {campaign.progressPercentage}%</p>
              </div>
              <div className="rpg-actions">
                <button onClick={() => handleTravel('Deep Woods')}>Travel to Woods (2 AP)</button>
                <button onClick={() => showNotify('Talking to NPC costs 1 AP...')}>Talk to Elder (1 AP)</button>
              </div>
            </section>
            <QuestList quests={quests} onStartQuest={() => {}} onCompleteQuest={() => {}} />
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
