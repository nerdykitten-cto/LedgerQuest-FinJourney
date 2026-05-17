import { AntigravityAgent } from './antigravityAgent';
import { Expense, PlayerStats } from './types/schemas';

async function testAgent() {
  const agent = new AntigravityAgent('narrative-agent-001');
  
  const mockExpenses: Expense[] = [
    { id: '1', amount: 50, category: 'Food', description: 'Pizza', timestamp: Date.now() },
    { id: '2', amount: 200, category: 'Shopping', description: 'Clothes', timestamp: Date.now() },
    { id: '3', amount: 30, category: 'Food', description: 'Coffee', timestamp: Date.now() },
  ];

  const mockStats: PlayerStats = {
    level: 1,
    exp: 0,
    ap: 10,
    gold: 100
  };

  console.log('--- TESTING ANTIGRAVITY AGENT ---');
  const { quest, trace } = await agent.generateQuest(mockExpenses, mockStats);
  
  console.log('Generated Quest:', JSON.stringify(quest, null, 2));
  console.log('O-I-D-A Trace:', JSON.stringify(trace, null, 2));
}

testAgent();
