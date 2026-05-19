import { useState, useEffect } from 'react';
import type { PartyMember, Enemy } from '../types/schemas';

interface BattleSystemProps {
  party: PartyMember[];
  enemy: Enemy;
  onVictory: () => void;
  onDefeat: () => void;
}

export default function BattleSystem({ party, enemy, onVictory, onDefeat }: BattleSystemProps) {
  const [enemyHp, setEnemyHp] = useState(enemy.hp);
  const [partyHps, setPartyHps] = useState<Record<string, number>>(
    Object.fromEntries(party.map(m => [m.id, m.hp]))
  );
  const [battleLog, setBattleLog] = useState<string[]>(['A wild ' + enemy.name + ' appeared!']);
  const [turn, setTurn] = useState<'party' | 'enemy'>('party');

  const addLog = (msg: string) => setBattleLog(prev => [msg, ...prev].slice(0, 5));

  const handleAttack = (member: PartyMember) => {
    if (turn !== 'party' || enemyHp <= 0) return;

    const damage = Math.max(1, member.level * 5 + Math.floor(Math.random() * 5));
    setEnemyHp(prev => Math.max(0, prev - damage));
    addLog(member.name + ' attacks ' + enemy.name + ' for ' + damage + ' damage!');
    
    setTurn('enemy');
  };

  useEffect(() => {
    if (enemyHp <= 0) {
      addLog(enemy.name + ' defeated!');
      setTimeout(onVictory, 1500);
      return;
    }

    if (turn === 'enemy') {
      const timer = setTimeout(() => {
        const aliveMembers = party.filter(m => partyHps[m.id] > 0);
        if (aliveMembers.length === 0) {
          onDefeat();
          return;
        }

        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        const damage = Math.max(1, enemy.attack - 2 + Math.floor(Math.random() * 5));
        
        setPartyHps(prev => ({
          ...prev,
          [target.id]: Math.max(0, prev[target.id] - damage)
        }));
        addLog(enemy.name + ' attacks ' + target.name + ' for ' + damage + ' damage!');

        if (Object.values({ ...partyHps, [target.id]: Math.max(0, partyHps[target.id] - damage) }).every(hp => hp <= 0)) {
          addLog('Your party has been wiped out!');
          setTimeout(onDefeat, 1500);
        } else {
          setTurn('party');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [enemyHp, turn, party, partyHps, enemy, onVictory, onDefeat]);

  return (
    <div className="battle-system">
      <div className="enemy-area">
        <div className="enemy-sprite">👹</div>
        <div className="enemy-stats">
          <strong>{enemy.name}</strong>
          <div className="hp-bar">
            <div 
              className="hp-fill" 
              style={{ width: (enemyHp / enemy.maxHp) * 100 + '%' }}
            ></div>
          </div>
          <span>{enemyHp} / {enemy.maxHp} HP</span>
        </div>
      </div>

      <div className="party-area">
        {party.map(m => (
          <div key={m.id} className="party-member-battle">
            <strong>{m.name}</strong>
            <div className="hp-bar">
              <div 
                className="hp-fill party" 
                style={{ width: (partyHps[m.id] / m.maxHp) * 100 + '%' }}
              ></div>
            </div>
            <span>{partyHps[m.id]} / {m.maxHp} HP</span>
            <button 
              onClick={() => handleAttack(m)} 
              disabled={turn !== 'party' || partyHps[m.id] <= 0}
            >
              Attack
            </button>
          </div>
        ))}
      </div>

      <div className="battle-log">
        {battleLog.map((log, i) => (
          <p key={i}>{log}</p>
        ))}
      </div>
    </div>
  );
}
