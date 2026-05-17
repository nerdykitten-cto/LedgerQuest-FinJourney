import { useState, useEffect } from 'react';
import './App.css';
import type { Expense, PlayerStats, Quest, AntigravityTrace } from './types/schemas';
import { AntigravityAgent } from './antigravityAgent';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import QuestList from './components/QuestList';
import PlayerDashboard from './components/PlayerDashboard';
import * as dbService from './persistenceService';

const agent = new AntigravityAgent('narrative-agent-01');

function App() {
  // Stats
  const [stats, setStats] = useState<PlayerStats>({
    level: 1,
    exp: 0,
    ap: 10,
    gold: 0
  });

  // Data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [traces, setTraces] = useState<AntigravityTrace[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Persistence Sync
  useEffect(() => {
    const sync = () => {
      dbService.subscribeExpenses(setExpenses);
      dbService.subscribeQuests(setQuests);
      dbService.subscribeStats(setStats);
    };

    sync();

    // Listen for local storage changes (for local mode)
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Add Expense & AP Engine
  const handleAddExpense = async (expense: Expense) => {
    // 1. Save expense
    await dbService.addExpenseDB(expense);

    // 2. AP Engine check (Evaluate Financial Win)
    const allExpenses = [expense, ...expenses];
    const { apGained, reason } = agent.evaluateFinancialWin(allExpenses);
    
    if (apGained > 0) {
      const newAp = stats.ap + apGained;
      await dbService.updateStatsDB({ ap: newAp });
      setNotification(`+${apGained} AP: ${reason}`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Trigger Agent when expenses change
  useEffect(() => {
    if (expenses.length > 0) {
      const runAgent = async () => {
        const { quest, trace } = await agent.generateQuest(expenses, stats);
        
        // Only add if not already there
        if (!quests.find(q => q.title === quest.title)) {
          await dbService.addQuestDB(quest);
          await dbService.addTraceDB(trace);
          setTraces((prev) => [trace, ...prev]);
        }
      };
      runAgent();
    }
  }, [expenses]);

  // Quest Actions
  const handleStartQuest = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (quest && stats.ap >= 5) {
      await dbService.updateQuestDB(questId, { status: 'active' });
      await dbService.updateStatsDB({ ap: stats.ap - 5 });
    } else {
      alert('Not enough AP to start this quest! Cost: 5 AP');
    }
  };

  const handleCompleteQuest = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (quest) {
      // Logic: Success based on difficulty vs level (simple random for demo)
      const successChance = Math.min(0.5 + (stats.level / quest.difficulty) * 0.1, 0.95);
      const isSuccess = Math.random() < successChance;

      if (isSuccess) {
        const newExp = stats.exp + quest.reward.exp;
        const newGold = stats.gold + quest.reward.gold;
        const newLevel = Math.floor(newExp / 1000) + 1;

        await dbService.updateQuestDB(questId, { status: 'completed' });
        await dbService.updateStatsDB({ 
          exp: newExp, 
          gold: newGold, 
          level: newLevel 
        });
        setNotification(`Quest Completed! Gained ${quest.reward.exp} EXP and ${quest.reward.gold} Gold.`);
      } else {
        await dbService.updateQuestDB(questId, { status: 'failed' });
        setNotification(`Quest Failed! The menace was too strong.`);
      }
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="container">
      {notification && <div className="notification">{notification}</div>}
      <header>
        <h1>FinJourney</h1>
        <p>Your Finance RPG Adventure</p>
      </header>

      <main className="dashboard-grid">
        <section className="finance-section">
          <PlayerDashboard stats={stats} />
          <ExpenseForm onAddExpense={handleAddExpense} />
          <ExpenseList expenses={expenses} />
        </section>

        <section className="rpg-section">
          <QuestList 
            quests={quests} 
            onStartQuest={handleStartQuest} 
            onCompleteQuest={handleCompleteQuest} 
          />
          
          <div className="trace-logs">
            <h3>Agent Traces (O-I-D-A)</h3>
            <div className="trace-container">
              {traces.map((t, i) => (
                <details key={i}>
                  <summary>Trace {new Date(t.timestamp).toLocaleTimeString()}</summary>
                  <pre>{JSON.stringify(t, null, 2)}</pre>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
