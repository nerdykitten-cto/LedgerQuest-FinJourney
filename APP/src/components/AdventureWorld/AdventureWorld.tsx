import React, { useState, useEffect } from 'react';
import type { PlayerStats, CampaignState, PartyMember, Enemy, InventoryItem } from '../../types/schemas';
import { WorldMapScene } from './WorldMapScene';
import { CombatScene } from './CombatScene';
import { TownScene } from './TownScene';
import { DialogueBox } from './Shared/DialogueBox';

import type { BattleResult } from '../../engine/director';

interface AdventureWorldProps {
  stats: PlayerStats;
  campaign: CampaignState;
  party: PartyMember[];
  inventory: InventoryItem[];
  onTravel: (destination: string, cost: number) => void;
  onTalk: (npcName: string, message: string) => void;
  onBattleVictory: (result: BattleResult) => void;
  onBattleDefeat: (result: BattleResult) => void;
  onBattleAction: () => void;
  onActionCost: (cost: number) => void;
  onShopPurchase: (item: any, cost: number) => void;
  onEnterTown: (name: string) => void;
  onExitTown: () => void;
}

type SceneType = 'map' | 'combat' | 'town';

export const AdventureWorld: React.FC<AdventureWorldProps> = ({
  stats,
  campaign,
  party,
  inventory,
  onTravel,
  onTalk,
  onBattleVictory,
  onBattleDefeat,
  onBattleAction,
  onActionCost,
  onShopPurchase,
  onEnterTown,
  onExitTown
}) => {
  const [currentScene, setCurrentScene] = useState<SceneType>('map');
  const [dialogue, setDialogue] = useState<{ message: string; isVisible: boolean }>({
    message: '',
    isVisible: false
  });

  // Sync scene with worldState; drop any dialogue left over from the previous scene
  useEffect(() => {
    setDialogue({ message: '', isVisible: false });
    if (campaign.worldState === 'battle') {
      setCurrentScene('combat');
    } else if (campaign.worldState === 'town') {
      setCurrentScene('town');
    } else {
      setCurrentScene('map');
    }
  }, [campaign.worldState]);

  const showDialogue = (message: string) => {
    setDialogue({ message, isVisible: true });
  };

  const closeDialogue = () => {
    setDialogue(prev => ({ ...prev, isVisible: false }));
  };

  const handleNPCTalk = (npcName: string, message: string) => {
    showDialogue(message);
    onTalk(npcName, message);
  };

  // Default enemy if none provided (for safety)
  const activeEnemy: Enemy = campaign.activeEnemy || {
    id: 'unknown',
    name: 'Debt Shadow',
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      {currentScene === 'map' && (
        <WorldMapScene 
          stats={stats} 
          campaign={campaign} 
          onTravel={onTravel}
          onEnterTown={onEnterTown}
          showDialogue={showDialogue}
        />
      )}

      {currentScene === 'combat' && (
        <CombatScene 
          party={party}
          enemy={activeEnemy}
          ap={stats.ap}
          inventory={inventory}
          onVictory={onBattleVictory}
          onDefeat={onBattleDefeat}
          onActionCost={onActionCost}
          showDialogue={showDialogue}
        />
      )}

      {currentScene === 'town' && (
        <TownScene 
          name={campaign.currentLocation}
          stats={stats}
          onTalk={handleNPCTalk}
          onShopPurchase={onShopPurchase}
          onBattleAction={onBattleAction}
          onExit={onExitTown}
          showDialogue={showDialogue}
        />
      )}

      <DialogueBox 
        message={dialogue.message}
        isVisible={dialogue.isVisible}
        onClose={closeDialogue}
      />
    </div>
  );
};
