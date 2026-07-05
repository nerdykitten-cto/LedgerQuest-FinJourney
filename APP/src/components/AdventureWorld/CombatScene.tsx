import React, { useState, useEffect, useRef } from 'react';
import type { PartyMember, Enemy, InventoryItem } from '../../types/schemas';
import { updateInventoryItemDB, updatePartyMemberDB, removeInventoryItemDB } from '../../persistenceService';
import { chooseTarget } from '../../engine/enemyAI';
import type { BattleResult } from '../../engine/director';

interface CombatSceneProps {
  party: PartyMember[];
  enemy: Enemy;
  ap: number;
  inventory: InventoryItem[];
  onVictory: (result: BattleResult) => void;
  onDefeat: (result: BattleResult) => void;
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
  const [shake, setShake] = useState<'none' | 'enemy' | 'party'>('none');
  const [flash, setFlash] = useState(false);
  const [damageNumber, setDamageNumber] = useState<{ value: number; type: 'player' | 'enemy' } | null>(null);

  // Battle telemetry for the Game Director (playerModel signals + enemy memory)
  const strikesRef = useRef(0);
  const potionsRef = useRef(0);
  const strikersRef = useRef(new Set<string>());
  const battleResult = (): BattleResult => ({
    strikes: strikesRef.current,
    potionsUsed: potionsRef.current,
    distinctStrikers: strikersRef.current.size,
  });

  const triggerShake = (target: 'enemy' | 'party') => {
    setShake(target);
    setTimeout(() => setShake('none'), 300);
  };

  const triggerDamage = (val: number, type: 'player' | 'enemy') => {
    setDamageNumber({ value: val, type });
    setTimeout(() => setDamageNumber(null), 1000);
  };

  const handlePlayerAttack = (member: PartyMember) => {
    if (isEnemyTurn || enemy.hp <= 0 || member.hp <= 0) return;

    if (ap < 1) {
      showDialogue("EXHAUSTION DETECTED. LOG MORE FEATS TO REPLENISH ACTION POINTS.");
      return;
    }

    onActionCost(1);
    strikesRef.current += 1;
    strikersRef.current.add(member.id);

    const weapon = inventory.find(i => i.equippedTo === member.id && i.type === 'Equipment' && i.statBonus?.attack !== undefined);
    const weaponBonus = weapon?.statBonus?.attack || 0;

    const damage = Math.max(1, member.level * 10 + weaponBonus + Math.floor(Math.random() * 10));
    const isCrit = Math.random() > 0.9;
    const finalDmg = isCrit ? Math.floor(damage * 1.5) : damage;

    const newEnemyHp = Math.max(0, enemy.hp - finalDmg);
    
    setEnemy({ ...enemy, hp: newEnemyHp });
    setBattleLog(`${isCrit ? 'CRITICAL ' : ''}STRIKE: ${member.name} DEALT ${finalDmg} DMG.`);
    
    triggerShake('enemy');
    triggerDamage(finalDmg, 'enemy');

    if (newEnemyHp <= 0) {
      setBattleLog('OBJECTIVE SECURED. VICTORY CONFIRMED.');
      setTimeout(() => onVictory(battleResult()), 1500);
    } else {
      setIsEnemyTurn(true);
    }
  };

  const handleUsePotion = async (potion: InventoryItem) => {
    if (isEnemyTurn || enemy.hp <= 0) return;

    const damagedMembers = party.filter(m => m.hp > 0 && m.hp < m.maxHp);
    if (damagedMembers.length === 0) {
      showDialogue("ALL PARTY MEMBERS ARE ALREADY AT MAXIMUM HEALTH.");
      return;
    }

    const target = damagedMembers.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
    const healAmt = potion.statBonus?.hpHeal || 40;
    const newHp = Math.min(target.maxHp, target.hp + healAmt);

    potionsRef.current += 1;
    setParty(party.map(m => m.id === target.id ? { ...m, hp: newHp } : m));
    setBattleLog(`POTION: consumed ${potion.name}. ${target.name} healed for ${healAmt} HP.`);
    setFlash(true);
    setTimeout(() => setFlash(false), 500);

    await updatePartyMemberDB(target.id, { hp: newHp });

    if (potion.quantity > 1) {
      await updateInventoryItemDB(potion.id, { quantity: potion.quantity - 1 });
    } else {
      await removeInventoryItemDB(potion.id);
    }
  };

  useEffect(() => {
    if (isEnemyTurn && enemy.hp > 0) {
      const timer = setTimeout(() => {
        // Archetype-driven targeting (engine/enemyAI)
        const target = chooseTarget(enemy.archetype ?? 'Aggressor', party, inventory);
        if (!target) return;
        
        const armor = inventory.find(i => i.equippedTo === target.id && i.type === 'Equipment' && i.statBonus?.defense !== undefined);
        const defenseBonus = armor?.statBonus?.defense || 0;

        const damage = Math.max(1, enemy.attack - defenseBonus + Math.floor(Math.random() * 5));
        const newParty = party.map(m => 
          m.id === target.id ? { ...m, hp: Math.max(0, m.hp - damage) } : m
        );
        
        setParty(newParty);
        setBattleLog(`COUNTER-STRIKE: ${enemy.name} HIT ${target.name} FOR ${damage} DMG.`);
        triggerShake('party');
        triggerDamage(damage, 'player');
        setIsEnemyTurn(false);

        updatePartyMemberDB(target.id, { hp: Math.max(0, target.hp - damage) });

        if (newParty.every(m => m.hp <= 0)) {
          setBattleLog('CRITICAL FAILURE. ESCAPING COMBAT ZONE...');
          setTimeout(() => onDefeat(battleResult()), 1500);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEnemyTurn, enemy, party, inventory, onDefeat]);

  const potions = inventory.filter(i => i.type === 'Consumable' && i.statBonus?.hpHeal !== undefined);

  return (
    <div className={`relative w-full h-full bg-gradient-to-b from-[#060d20] to-[#1a0a1a] flex flex-col items-center p-3 pt-20 md:p-4 overflow-x-hidden overflow-y-auto custom-scrollbar transition-all duration-300 ${flash ? 'brightness-200' : ''}`}>
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#4c4634 1px, transparent 1px), linear-gradient(90deg, #4c4634 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* HUD Info - sits below the TV's LIVE_SIGNAL OSD */}
      <div className="absolute top-8 left-3 md:top-12 md:left-6 z-50">
         <div className="bg-[#171f33]/80 px-4 py-2 doodle-border border-[#f4d03f]/50 flex items-center gap-2 shadow-xl">
            <img src="/assets/ui/Icon_Energy_Yellow.png" className="w-4 h-4 animate-pulse" alt="AP" />
            <span className="font-headline text-sm font-black text-[#f4d03f] tracking-tighter">{ap} AP</span>
         </div>
      </div>

      <div className="absolute top-4 right-4 z-50">
        <div className={`px-4 py-1 rounded font-headline text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all ${isEnemyTurn ? 'bg-[#84231d] text-white animate-pulse' : 'bg-[#f4d03f] text-[#060d20]'}`}>
          {isEnemyTurn ? 'Enemy Phase' : 'Player Phase'}
        </div>
      </div>

      <h2 className="hidden md:block font-headline text-sm md:text-lg font-black text-[#ffb4aa] tracking-tighter mb-2 mt-1 uppercase italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] shrink-0">Combat Interface</h2>

      {/* Potion Battle Shelf */}
      {potions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-2 bg-[#0b1326]/90 border-2 border-[#ffeebb]/20 px-3 py-1.5 md:px-6 md:py-2 rounded-xl items-center z-10 shadow-2xl animate-in slide-in-from-top-4 shrink-0">
          <span className="font-label text-[10px] uppercase text-[#ffeebb]/40 tracking-widest font-black mr-2">Inventory:</span>
          {potions.map(potion => (
            <button
              key={potion.id}
              onClick={() => handleUsePotion(potion)}
              disabled={isEnemyTurn || enemy.hp <= 0}
              className="bg-[#171f33] hover:bg-[#222a3e] text-[#ffeebb] hover:text-[#f4d03f] font-headline font-black text-[10px] px-3 py-1.5 border-2 border-[#4c4634] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30 shadow-md"
            >
              {potion.sprite ? (
                <img src={potion.sprite} className="w-4 h-4 object-contain" alt={potion.name} />
              ) : (
                <span className="material-symbols-outlined text-xs">science</span>
              )}
              {potion.name} <span className="text-[#f4d03f]">x{potion.quantity}</span>
            </button>
          ))}
        </div>
      )}

      {/* Enemy Area */}
      <div className={`flex flex-col items-center mb-3 relative shrink-0 ${shake === 'enemy' ? 'animate-shake' : ''}`}>
        {damageNumber && damageNumber.type === 'enemy' && (
          <div className="absolute -top-12 font-headline text-3xl font-black text-[#ffb4aa] animate-float-up pointer-events-none drop-shadow-lg z-50">
            -{damageNumber.value}
          </div>
        )}
        <div className="w-12 h-12 md:w-14 md:h-14 relative mb-1">
           <div className={`absolute inset-0 bg-[#84231d]/20 rounded-full blur-2xl transition-all duration-500 ${isEnemyTurn ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`} />
           <img src="/assets/ui/Icon_Battle.png" className={`w-full h-full object-contain relative z-10 drop-shadow-2xl transition-transform duration-500 ${isEnemyTurn ? 'scale-110' : 'scale-100'}`} alt="Enemy" />
        </div>
        <h3 className="font-headline text-base md:text-lg font-black text-[#ffb4aa] mb-1 uppercase tracking-[0.2em]">{enemy.name}</h3>
        <div className="w-40 md:w-64 h-3 bg-[#0b1326] border-2 border-[#4c4634] rounded-full overflow-hidden shadow-inner p-0.5">
          <div 
            className="h-full bg-gradient-to-r from-[#5a1a1a] to-[#84231d] transition-all duration-700 shadow-[0_0_15px_#84231d]" 
            style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
          />
        </div>
      </div>

      {/* Party Area */}
      <div className={`flex [justify-content:safe_center] gap-2 md:gap-3 w-full mb-2 overflow-x-auto pb-2 custom-scrollbar shrink-0 ${shake === 'party' ? 'animate-shake' : ''}`}>
        {party.map((member) => {
          const equippedWeapon = inventory.find(i => i.equippedTo === member.id && (i.icon === 'swords' || i.statBonus?.attack));
          const equippedArmor = inventory.find(i => i.equippedTo === member.id && (i.icon === 'shield' || i.statBonus?.defense));
          const isTarget = damageNumber && damageNumber.type === 'player' && party.sort((a,b)=>a.hp-b.hp)[0]?.id === member.id;
          
          return (
            <div key={member.id} className={`flex flex-col items-center min-w-[104px] p-2.5 md:p-3 rounded-xl bg-[#0b1326]/80 border-2 transition-all duration-300 relative group
              ${isEnemyTurn ? 'border-transparent scale-95 opacity-60' : 'border-white/5 hover:border-[#f4d03f]/30 hover:bg-[#171f33]'}
              ${member.hp <= 0 ? 'opacity-30 grayscale' : ''}
            `}>
              
              {isTarget && damageNumber && (
                <div className="absolute -top-10 font-headline text-2xl font-black text-[#84231d] animate-float-up pointer-events-none z-50">
                  -{damageNumber.value}
                </div>
              )}

              {/* Equipped Indicators */}
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                {equippedWeapon && (
                  <div className="bg-[#f4d03f] text-[#060d20] w-5 h-5 flex items-center justify-center rounded shadow-md" title={equippedWeapon.name}>
                    <span className="material-symbols-outlined text-[12px] font-black">swords</span>
                  </div>
                )}
                {equippedArmor && (
                  <div className="bg-[#ffb4aa] text-[#060d20] w-5 h-5 flex items-center justify-center rounded shadow-md" title={equippedArmor.name}>
                    <span className="material-symbols-outlined text-[12px] font-black">shield</span>
                  </div>
                )}
              </div>

              <div className="w-12 h-12 relative mb-2">
                 <div className={`absolute inset-0 rounded-full blur-xl transition-all ${member.hp > 0 ? 'bg-[#f4d03f]/10' : 'bg-transparent'}`} />
                 <img src={member.avatar} className={`w-full h-full object-cover relative z-10 rounded-full border-2 border-[#4c4634] shadow-xl ${member.hp <= 0 ? '' : 'group-hover:scale-110'}`} alt={member.name} />
              </div>
              
              <span className="font-headline text-[10px] font-black text-[#ffeebb] mb-1 uppercase tracking-widest">{member.name}</span>

              <div className="w-full h-2 bg-[#171f33] border border-[#4c4634] rounded-full overflow-hidden mb-2 md:mb-3">
                <div 
                  className={`h-full transition-all duration-700 ${member.hp / member.maxHp < 0.3 ? 'bg-[#84231d]' : 'bg-[#f4d03f]'}`} 
                  style={{ width: `${(member.hp / member.maxHp) * 100}%` }}
                />
              </div>
              
              {member.hp > 0 && !isEnemyTurn && (
                <button 
                  onClick={() => handlePlayerAttack(member)}
                  disabled={ap < 1 || enemy.hp <= 0}
                  className="w-full bg-[#171f33] border-2 border-[#4c4634] text-[#f4d03f] font-headline font-black text-[10px] py-1.5 md:py-2 hover:bg-[#f4d03f] hover:text-[#060d20] hover:border-[#f4d03f] transition-all active:scale-90 disabled:opacity-20 shadow-lg uppercase tracking-tighter"
                >
                  STRIKE
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Battle Log */}
      <div className="mt-auto sticky bottom-0 z-20 w-full max-w-3xl bg-[#0b1326]/95 border-2 border-[#4c4634] p-2 text-center min-h-[44px] md:min-h-[48px] flex items-center justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)] shrink-0">
        <p className="font-label text-sm text-[#f4d03f] uppercase tracking-[0.2em] font-black animate-in fade-in slide-in-from-bottom-2 duration-300">
          {battleLog}
        </p>
      </div>
    </div>
  );
};
