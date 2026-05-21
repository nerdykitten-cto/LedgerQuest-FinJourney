import React, { useState, useEffect } from 'react';
import type { PartyMember, Enemy } from '../../types/schemas';

interface CombatSceneProps {
  party: PartyMember[];
  enemy: Enemy;
  onVictory: () => void;
  onDefeat: () => void;
}

export const CombatScene: React.FC<CombatSceneProps> = ({ 
  party: initialParty, 
  enemy: initialEnemy, 
  onVictory, 
  onDefeat
}) => {
  const [enemy, setEnemy] = useState<Enemy>({ ...initialEnemy });
  const [party, setParty] = useState<PartyMember[]>([...initialParty]);
  const [isEnemyTurn, setIsEnemyTurn] = useState(false);
  const [battleLog, setBattleLog] = useState('INITIALIZING COMBAT PROTOCOLS...');
  const [vibrate, setVibrate] = useState(false);

  const handlePlayerAttack = (member: PartyMember) => {
    if (isEnemyTurn || enemy.hp <= 0) return;

    const damage = Math.max(1, member.level * 10 + Math.floor(Math.random() * 10));
    const newEnemyHp = Math.max(0, enemy.hp - damage);
    
    setEnemy({ ...enemy, hp: newEnemyHp });
    setBattleLog(`STRIKE SUCCESS: ${member.name} DEALT ${damage} UNITS.`);
    setVibrate(true);
    setTimeout(() => setVibrate(false), 200);

    if (newEnemyHp <= 0) {
      setBattleLog('OBJECTIVE SECURED. VICTORY CONFIRMED.');
      setTimeout(onVictory, 1500);
    } else {
      setIsEnemyTurn(true);
    }
  };

  useEffect(() => {
    if (isEnemyTurn && enemy.hp > 0) {
      const timer = setTimeout(() => {
        const aliveMembers = party.filter(m => m.hp > 0);
        if (aliveMembers.length === 0) return;

        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        const damage = Math.max(1, enemy.attack + Math.floor(Math.random() * 5));
        
        const newParty = party.map(m => 
          m.id === target.id ? { ...m, hp: Math.max(0, m.hp - damage) } : m
        );
        
        setParty(newParty);
        setBattleLog(`COUNTER-STRIKE: ${enemy.name} HIT ${target.name} FOR ${damage}.`);
        setIsEnemyTurn(false);

        if (newParty.every(m => m.hp <= 0)) {
          setBattleLog('CRITICAL FAILURE. ESCAPING COMBAT ZONE...');
          setTimeout(onDefeat, 1500);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEnemyTurn, enemy, party, onDefeat]);

  return (
    <div className={`relative w-[800px] h-[600px] bg-gradient-to-b from-[#060d20] to-[#1a0a1a] flex flex-col items-center p-10 ${vibrate ? 'animate-bounce' : ''}`}>
      <h2 className="font-headline text-3xl font-black text-[#ffb4aa] tracking-tighter mb-10">CRITICAL INCURSION</h2>

      {/* Enemy Area */}
      <div className="flex flex-col items-center mb-20 animate-in zoom-in-95">
        <div className="w-32 h-32 relative mb-4">
           {/* Placeholder for Enemy Sprite */}
           <div className="absolute inset-0 bg-red-900/20 rounded-full blur-xl animate-pulse" />
           <img src="/assets/ui/Icon_Battle.png" className="w-full h-full object-contain relative z-10" alt="Enemy" />
        </div>
        <h3 className="font-headline text-xl font-bold text-[#ffb4aa] mb-2 uppercase">{enemy.name}</h3>
        <div className="w-64 h-3 bg-[#171f33] border border-[#4c4634] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#84231d] transition-all duration-500" 
            style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
          />
        </div>
        <span className="font-label text-[10px] text-[#ff9a8e] mt-1 uppercase tracking-widest">
          EN_HEALTH: {Math.round((enemy.hp / enemy.maxHp) * 100)}%
        </span>
      </div>

      {/* Party Area */}
      <div className="flex justify-center gap-10 w-full mb-10">
        {party.map((member) => (
          <div key={member.id} className="flex flex-col items-center">
            <div className="w-20 h-20 relative mb-2">
               <div className="absolute inset-0 bg-[#f4d03f]/10 rounded-full blur-lg" />
               <img src={`/assets/game/hero.png`} className={`w-full h-full object-contain relative z-10 ${member.hp <= 0 ? 'grayscale opacity-50' : ''}`} alt={member.name} />
            </div>
            <span className="font-label text-xs font-bold text-[#ffeebb] mb-1">{member.name}</span>
            <div className="w-24 h-2 bg-[#171f33] border border-[#4c4634] rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-[#f4d03f] transition-all duration-500" 
                style={{ width: `${(member.hp / member.maxHp) * 100}%` }}
              />
            </div>
            
            {member.hp > 0 && !isEnemyTurn && (
              <button 
                onClick={() => handlePlayerAttack(member)}
                className="bg-[#171f33] border-2 border-[#4c4634] text-[#ffeebb] font-headline font-bold text-xs px-4 py-2 hover:bg-[#222a3e] hover:text-[#f4d03f] transition-all active:scale-95"
              >
                STRIKE
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Battle Log */}
      <div className="mt-auto w-full bg-[#0b1326]/90 border-2 border-[#4c4634] p-4 text-center">
        <p className="font-label text-sm text-[#f4d03f] uppercase tracking-wider">
          {battleLog}
        </p>
      </div>
    </div>
  );
};
