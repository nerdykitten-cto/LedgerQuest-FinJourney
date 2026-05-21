import React, { useState, useEffect } from 'react';
import type { PartyMember, Enemy } from '../../types/schemas';

interface CombatSceneProps {
  party: PartyMember[];
  enemy: Enemy;
  ap: number;
  onVictory: () => void;
  onDefeat: () => void;
  onActionCost: (cost: number) => void;
  showDialogue: (msg: string) => void;
}

export const CombatScene: React.FC<CombatSceneProps> = ({ 
  party: initialParty, 
  enemy: initialEnemy, 
  ap,
  onVictory, 
  onDefeat,
  onActionCost,
  showDialogue 
}) => {
  const [enemy, setEnemy] = useState<Enemy>({ ...initialEnemy });
  const [party, setParty] = useState<PartyMember[]>([...initialParty]);
  const [isEnemyTurn, setIsEnemyTurn] = useState(false);
  const [battleLog, setBattleLog] = useState('INITIALIZING COMBAT PROTOCOLS...');
  const [vibrate, setVibrate] = useState(false);

  const handlePlayerAttack = (member: PartyMember) => {
    if (isEnemyTurn || enemy.hp <= 0) return;

    if (ap < 1) {
      showDialogue("EXHAUSTION DETECTED. LOG MORE FEATS TO REPLENISH ACTION POINTS.");
      return;
    }

    onActionCost(1); // Each strike costs 1 AP

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
    <div className={`relative w-full h-full bg-gradient-to-b from-[#060d20] to-[#1a0a1a] flex flex-col items-center p-6 ${vibrate ? 'animate-bounce' : ''}`}>
      
      {/* HUD Info */}
      <div className="absolute top-4 left-4 flex gap-4">
         <div className="bg-[#171f33]/80 px-3 py-1 doodle-border border-[#f4d03f]/30 flex items-center gap-2">
            <img src="/assets/ui/Icon_Energy_Yellow.png" className="w-3 h-3" alt="AP" />
            <span className="font-label text-xs font-black text-[#f4d03f]">{ap} AP</span>
         </div>
      </div>

      <h2 className="font-headline text-2xl font-black text-[#ffb4aa] tracking-tighter mb-6 uppercase italic">Critical Incursion</h2>

      {/* Enemy Area */}
      <div className="flex flex-col items-center mb-12 animate-in zoom-in-95">
        <div className="w-24 h-24 relative mb-4">
           <div className="absolute inset-0 bg-red-900/20 rounded-full blur-xl animate-pulse" />
           <img src="/assets/ui/Icon_Battle.png" className="w-full h-full object-contain relative z-10" alt="Enemy" />
        </div>
        <h3 className="font-headline text-lg font-bold text-[#ffb4aa] mb-1 uppercase tracking-widest">{enemy.name}</h3>
        <div className="w-48 h-2 bg-[#171f33] border border-[#4c4634] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#84231d] transition-all duration-500 shadow-[0_0_10px_#84231d]" 
            style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
          />
        </div>
      </div>

      {/* Party Area */}
      <div className="flex justify-center gap-4 w-full mb-6 overflow-x-auto pb-4 custom-scrollbar">
        {party.map((member) => (
          <div key={member.id} className={`flex flex-col items-center min-w-[100px] p-3 rounded bg-white/5 border ${isEnemyTurn ? 'border-transparent' : 'border-white/10'} transition-all`}>
            <div className="w-16 h-16 relative mb-2">
               <div className={`absolute inset-0 rounded-full blur-lg ${member.hp > 0 ? 'bg-[#f4d03f]/10' : 'bg-transparent'}`} />
               <img src={member.avatar} className={`w-full h-full object-cover relative z-10 rounded-full border-2 border-[#4c4634] ${member.hp <= 0 ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} alt={member.name} />
            </div>
            <span className="font-label text-[8px] font-black text-[#ffeebb] mb-1 uppercase tracking-widest">{member.name}</span>
            <div className="w-full h-1.5 bg-[#171f33] border border-[#4c4634] rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-[#f4d03f] transition-all duration-500" 
                style={{ width: `${(member.hp / member.maxHp) * 100}%` }}
              />
            </div>
            
            {member.hp > 0 && !isEnemyTurn && (
              <button 
                onClick={() => handlePlayerAttack(member)}
                disabled={ap < 1}
                className="w-full bg-[#171f33] border border-[#4c4634] text-[#ffeebb] font-headline font-black text-[10px] py-1.5 hover:bg-[#222a3e] hover:text-[#f4d03f] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                STRIKE (-1)
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Battle Log */}
      <div className="mt-auto w-full bg-[#0b1326]/90 border-t-2 border-[#4c4634] p-4 text-center min-h-[60px] flex items-center justify-center">
        <p className="font-label text-xs text-[#f4d03f] uppercase tracking-[0.15em] font-bold">
          {battleLog}
        </p>
      </div>
    </div>
  );
};
