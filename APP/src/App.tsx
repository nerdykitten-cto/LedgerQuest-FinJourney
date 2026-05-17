import { useState, useEffect } from 'react';
import './App.css';
import type { Expense, PlayerStats, Quest, AntigravityTrace } from './types/schemas';
import { AntigravityAgent } from './antigravityAgent';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import QuestList from './components/QuestList';
import PlayerDashboard from './components/PlayerDashboard';

const agent = new AntigravityAgent('narrative-agent-01');

function App() {
  // Stats
  const [stats] = useState<PlayerStats>({
    level: 1,
    exp: 0,
    ap: 10,
    gold: 0
  });

  // Data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [traces, setTraces] = useState<AntigravityTrace[]>([]);

  // Add Expense
  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
  };

  // Trigger Agent when expenses change
  useEffect(() => {
    if (expenses.length > 0) {
      const runAgent = async () => {
        const { quest, trace } = await agent.generateQuest(expenses, stats);
        setQuests((prev) => {
          // Only add if not already there (simple check for demo)
          if (prev.find(q => q.title === quest.title)) return prev;
          return [quest, ...prev];
        });
        setTraces((prev) => [trace, ...prev]);
        console.log('Antigravity Trace:', trace);
      };
      runAgent();
    }
  }, [expenses]);

  return (
    <div className="container">
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
          <QuestList quests={quests} />
          
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
