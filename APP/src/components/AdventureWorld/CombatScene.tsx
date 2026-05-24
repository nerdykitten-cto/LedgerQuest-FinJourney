import React, { useState, useEffect } from 'react';
import type { PartyMember, Enemy, InventoryItem } from '../../types/schemas';
import { updateInventoryItemDB, updatePartyMemberDB, removeInventoryItemDB } from '../../persistenceService';

interface CombatSceneProps {
  party: PartyMember[];
  enemy: Enemy;
  ap: number;
  inventory: InventoryItem[];
  onVictory: () => void;
  onDefeat: () => void;
  onActionCost: (cost: number) => void;
  showDialogue: (msg: string) => void;
}

export const CombatScene: React.FC<CombatSceneProps> = ({ 
  party: initialParty, 
  enemy: initialEnemy, 
  ap,
  inventory,
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

    // Look for equipped weapon to add bonus
    const weapon = inventory.find(i => i.equippedTo === member.id && i.type === 'Equipment' && i.statBonus?.attack !== undefined);
    const weaponBonus = weapon?.statBonus?.attack || 0;

    const damage = Math.max(1, member.level * 10 + weaponBonus + Math.floor(Math.random() * 10));
    const newEnemyHp = Math.max(0, enemy.hp - damage);
    
    setEnemy({ ...enemy, hp: newEnemyHp });
    setBattleLog(`STRIKE: ${member.name}${weapon ? ` (with ${weapon.name})` : ''} DEALT ${damage} DMG${weaponBonus ? ` (+${weaponBonus} Weapon Bonus)` : ''}.`);
    setVibrate(true);
    setTimeout(() => setVibrate(false), 200);

    if (newEnemyHp <= 0) {
      setBattleLog('OBJECTIVE SECURED. VICTORY CONFIRMED.');
      setTimeout(onVictory, 1500);
    } else {
      setIsEnemyTurn(true);
    }
  };

  const handleUsePotion = async (potion: InventoryItem) => {
    if (isEnemyTurn || enemy.hp <= 0) return;

    // Filter alive party members that are damaged
    const damagedMembers = party.filter(m => m.hp > 0 && m.hp < m.maxHp);
    if (damagedMembers.length === 0) {
      showDialogue("ALL PARTY MEMBERS ARE ALREADY AT MAXIMUM HEALTH.");
      return;
    }

    // Target the character with lowest HP percentage
    const target = damagedMembers.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
    const healAmt = potion.statBonus?.hpHeal || 40;
    const newHp = Math.min(target.maxHp, target.hp + healAmt);

    // Update local state for immediate feedback
    setParty(party.map(m => m.id === target.id ? { ...m, hp: newHp } : m));
    setBattleLog(`POTION: consumed ${potion.name}. ${target.name} healed for ${healAmt} HP.`);

    // Persist healing
    await updatePartyMemberDB(target.id, { hp: newHp });

    // Decrement or remove item from inventory
    if (potion.quantity > 1) {
      await updateInventoryItemDB(potion.id, { quantity: potion.quantity - 1 });
    } else {
      await removeInventoryItemDB(potion.id);
    }
  };

  useEffect(() => {
    if (isEnemyTurn && enemy.hp > 0) {
      const timer = setTimeout(() => {
        const aliveMembers = party.filter(m => m.hp > 0);
        if (aliveMembers.length === 0) return;

        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        
        // Look for equipped armor to reduce damage
        const armor = inventory.find(i => i.equippedTo === target.id && i.type === 'Equipment' && i.statBonus?.defense !== undefined);
        const defenseBonus = armor?.statBonus?.defense || 0;

        const damage = Math.max(1, enemy.attack - defenseBonus + Math.floor(Math.random() * 5));
        
        const newParty = party.map(m => 
          m.id === target.id ? { ...m, hp: Math.max(0, m.hp - damage) } : m
        );
        
        setParty(newParty);
        setBattleLog(`COUNTER-STRIKE: ${enemy.name} HIT ${target.name} FOR ${damage}${defenseBonus ? ` (-${defenseBonus} Armor Block)` : ''}.`);
        setIsEnemyTurn(false);

        // Also persist party member damage
        updatePartyMemberDB(target.id, { hp: Math.max(0, target.hp - damage) });

        if (newParty.every(m => m.hp <= 0)) {
          setBattleLog('CRITICAL FAILURE. ESCAPING COMBAT ZONE...');
          setTimeout(onDefeat, 1500);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEnemyTurn, enemy, party, inventory, onDefeat]);

  // Find combat potions
  const potions = inventory.filter(i => i.type === 'Consumable' && i.statBonus?.hpHeal !== undefined);

  return (
    <div className={`relative w-full h-full bg-gradient-to-b from-[#060d20] to-[#1a0a1a] flex flex-col items-center p-6 ${vibrate ? 'animate-bounce' : ''}`}>
      
      {/* HUD Info */}
      <div className="absolute top-4 left-4 flex gap-4">
         <div className="bg-[#171f33]/80 px-3 py-1 doodle-border border-[#f4d03f]/30 flex items-center gap-2">
            <img src="/assets/ui/Icon_Energy_Yellow.png" className="w-3 h-3" alt="AP" />
            <span className="font-label text-xs font-black text-[#f4d03f]">{ap} AP</span>
         </div>
      </div>

      <h2 className="font-headline text-2xl font-black text-[#ffb4aa] tracking-tighter mb-4 uppercase italic">Critical Incursion</h2>

      {/* Potion Battle Shelf */}
      {potions.length > 0 && (
        <div className="flex gap-2 mb-6 bg-[#171f33]/80 border border-[#ffeebb]/25 px-4 py-2 rounded-lg items-center z-10 animate-in slide-in-from-top-2">
          <span className="font-label text-[8px] uppercase text-[#ffeebb]/50 tracking-wider font-bold">Heal Potions:</span>
          {potions.map(potion => (
            <button
              key={potion.id}
              onClick={() => handleUsePotion(potion)}
              disabled={isEnemyTurn || enemy.hp <= 0}
              className="bg-[#0b1326] hover:bg-[#1a233a] text-[#ffeebb] hover:text-[#f4d03f] font-headline font-black text-[9px] px-2.5 py-1 border border-[#4c4634] active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:scale-100"
            >
              {potion.sprite ? (
                <img src={potion.sprite} className="w-3 h-3 object-contain" alt={potion.name} />
              ) : (
                <span className="material-symbols-outlined text-[10px]">science</span>
              )}
              {potion.name} (x{potion.quantity})
            </button>
          ))}
        </div>
      )}

      {/* Enemy Area */}
      <div className="flex flex-col items-center mb-8 animate-in zoom-in-95">
        <div className="w-20 h-20 relative mb-4">
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
        {party.map((member) => {
          const equippedWeapon = inventory.find(i => i.equippedTo === member.id && i.icon === 'swords');
          const equippedArmor = inventory.find(i => i.equippedTo === member.id && i.icon === 'shield');
          return (
            <div key={member.id} className={`flex flex-col items-center min-w-[105px] p-3 rounded bg-[#0b1326]/60 border ${isEnemyTurn ? 'border-transparent' : 'border-white/10'} relative group transition-all`}>
              
              {/* Equipped Indicators */}
              <div className="absolute top-1 right-1 flex gap-1 z-10 pointer-events-none">
                {equippedWeapon && (
                  <span className="bg-[#f4d03f] text-black text-[6px] font-black px-1 rounded uppercase" title={equippedWeapon.name}>W</span>
                )}
                {equippedArmor && (
                  <span className="bg-[#ffb4aa] text-black text-[6px] font-black px-1 rounded uppercase" title={equippedArmor.name}>A</span>
                )}
              </div>

              <div className="w-14 h-14 relative mb-2">
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
                  disabled={ap < 1 || enemy.hp <= 0}
                  className="w-full bg-[#171f33] border border-[#4c4634] text-[#ffeebb] font-headline font-black text-[9px] py-1.5 hover:bg-[#222a3e] hover:text-[#f4d03f] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                >
                  STRIKE (-1)
                </button>
              )}
            </div>
          );
        })}
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
