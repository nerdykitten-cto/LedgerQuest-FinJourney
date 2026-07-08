import React, { useState } from 'react';
import type { InventoryItem, PartyMember } from '../types/schemas';
import { updateInventoryItemDB, updatePartyMemberDB, removeInventoryItemDB } from '../persistenceService';
import { ItemIcon } from '../assets/placeholders';

interface Props {
  inventory: InventoryItem[];
  party: PartyMember[];
  onClose: () => void;
}

const GrandVault: React.FC<Props> = ({ inventory, party, onClose }) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Consumable' | 'Equipment'>('All');

  // Filter items by category tab
  const filteredItems = inventory.filter(item => {
    if (activeTab === 'All') return true;
    return item.type === activeTab;
  });

  const getSlot = (item: InventoryItem): 'weapon' | 'armor' => {
    return (item.icon === 'swords' || item.statBonus?.attack !== undefined) ? 'weapon' : 'armor';
  };

  const handleEquip = async (memberId: string) => {
    if (!selectedItem) return;
    const slot = getSlot(selectedItem);

    // Find the member to equip
    const member = party.find(m => m.id === memberId);
    if (!member) return;

    // 1. Unequip any item of the same slot currently equipped on this member
    const currentlyEquipped = inventory.find(i => 
      i.equippedTo === memberId && getSlot(i) === slot
    );
    if (currentlyEquipped) {
      await updateInventoryItemDB(currentlyEquipped.id, { equippedTo: undefined });
    }

    // 2. Equip the new item
    await updateInventoryItemDB(selectedItem.id, { equippedTo: memberId });
    await updatePartyMemberDB(memberId, {
      equipment: {
        ...member.equipment,
        [slot]: selectedItem.name
      }
    });

    // Update selected item state to show equipped changes
    setSelectedItem({ ...selectedItem, equippedTo: memberId });
  };

  const handleUnequip = async () => {
    if (!selectedItem || !selectedItem.equippedTo) return;
    const slot = getSlot(selectedItem);
    const memberId = selectedItem.equippedTo;
    const member = party.find(m => m.id === memberId);

    await updateInventoryItemDB(selectedItem.id, { equippedTo: undefined });
    if (member) {
      await updatePartyMemberDB(memberId, {
        equipment: {
          ...member.equipment,
          [slot]: undefined
        }
      });
    }

    setSelectedItem({ ...selectedItem, equippedTo: undefined });
  };

  const handleUseConsumable = async (memberId: string) => {
    if (!selectedItem || selectedItem.type !== 'Consumable') return;
    const member = party.find(m => m.id === memberId);
    if (!member) return;

    const hpHeal = selectedItem.statBonus?.hpHeal || 40;
    const newHp = Math.min(member.maxHp, member.hp + hpHeal);

    // Apply healing
    await updatePartyMemberDB(memberId, { hp: newHp });

    // Decrement item quantity or remove it
    if (selectedItem.quantity > 1) {
      await updateInventoryItemDB(selectedItem.id, { quantity: selectedItem.quantity - 1 });
      setSelectedItem({ ...selectedItem, quantity: selectedItem.quantity - 1 });
    } else {
      await removeInventoryItemDB(selectedItem.id);
      setSelectedItem(null);
    }
  };

  // Calculate carrying weight
  const totalWeight = inventory.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-[#060d20]/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-20 w-full max-w-4xl max-h-[85vh] bg-[#171f33] border-4 border-[#4c4634] p-4 md:p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start gap-3 mb-4 md:mb-6">
          <div className="relative min-w-0">
            <h2 className="font-headline text-xl md:text-3xl font-black text-[#f4d03f] doodle-underline inline-block uppercase tracking-tighter italic">The Grand Vault: Inventory</h2>
            <p className="font-label text-[10px] uppercase tracking-widest text-[#ffeebb]/60 mt-2">Carrying: {totalWeight.toFixed(1)} / 100.0 lbs</p>
          </div>
          <button className="bg-[#84231d]/20 text-[#ffb4aa] px-3 py-1 doodle-border border-[#ffb4aa]/30 hover:rotate-6 transition-transform hover:bg-[#84231d]/40" onClick={onClose}>
            <span className="material-symbols-outlined align-middle">close</span>
          </button>
        </div>

        {/* Modal Content Layout */}
        <div className="flex flex-col md:flex-row gap-6 flex-grow overflow-hidden">
          {/* Left: Sidebar Categories */}
          <nav className="grid grid-cols-3 md:flex md:flex-col gap-1.5 md:gap-2 md:w-48">
            <button 
              onClick={() => setActiveTab('All')}
              className={`flex items-center justify-center md:justify-start gap-1.5 md:gap-3 p-2 md:p-3 font-label text-[9px] md:text-[10px] uppercase font-black text-center md:text-left active:scale-95 transition-transform doodle-border ${activeTab === 'All' ? 'bg-[#f4d03f] text-[#060d20] border-[#f4d03f]' : 'bg-[#0b1326] text-[#ffeebb] border-[#4c4634]'}`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              All Items
            </button>
            <button 
              onClick={() => setActiveTab('Consumable')}
              className={`flex items-center justify-center md:justify-start gap-1.5 md:gap-3 p-2 md:p-3 font-label text-[9px] md:text-[10px] uppercase font-black text-center md:text-left active:scale-95 transition-transform doodle-border ${activeTab === 'Consumable' ? 'bg-[#f4d03f] text-[#060d20] border-[#f4d03f]' : 'bg-[#0b1326] text-[#ffeebb] border-[#4c4634]'}`}
            >
              <span className="material-symbols-outlined text-sm">liquor</span>
              Consumables
            </button>
            <button 
              onClick={() => setActiveTab('Equipment')}
              className={`flex items-center justify-center md:justify-start gap-1.5 md:gap-3 p-2 md:p-3 font-label text-[9px] md:text-[10px] uppercase font-black text-center md:text-left active:scale-95 transition-transform doodle-border ${activeTab === 'Equipment' ? 'bg-[#f4d03f] text-[#060d20] border-[#f4d03f]' : 'bg-[#0b1326] text-[#ffeebb] border-[#4c4634]'}`}
            >
              <span className="material-symbols-outlined text-sm">shield</span>
              Equipment
            </button>
          </nav>

          {/* Middle: Item Grid */}
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar bg-[#0b1326]/50 p-4 border border-[#4c4634]/30">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredItems.map(item => {
                  const equippedChar = item.equippedTo ? party.find(p => p.id === item.equippedTo) : null;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`aspect-square bg-[#0b1326] border-2 flex items-center justify-center cursor-pointer hover:bg-[#1a233a] transition-all relative p-2
                        ${selectedItem?.id === item.id ? 'border-[#f4d03f] scale-105 shadow-md shadow-[#f4d03f]/10' : 'border-[#4c4634]/60'}
                      `}
                    >
                      <ItemIcon item={item} size={48} />
                      {item.type === 'Consumable' && item.quantity > 1 && (
                        <span className="absolute bottom-1 right-1 font-label text-[8px] bg-[#f4d03f] text-black px-1.5 font-bold rounded">x{item.quantity}</span>
                      )}
                      {equippedChar && (
                        <span className="absolute top-1 left-1 font-label text-[7px] bg-[#ffb4aa] text-black px-1 font-black rounded uppercase tracking-tighter" title={`Equipped to ${equippedChar.name}`}>E</span>
                      )}
                    </div>
                  );
                })}
                {/* Empty Slots */}
                {[...Array(Math.max(0, 10 - filteredItems.length))].map((_, i) => (
                  <div key={i} className="aspect-square bg-transparent opacity-20 border border-dashed border-[#ffeebb]/25"></div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-5 md:p-8">
                <span className="material-symbols-outlined text-5xl mb-3 text-[#ffeebb]">inventory_2</span>
                <p className="font-body text-xs italic text-[#ffeebb]">Vault segment is currently empty.</p>
              </div>
            )}
          </div>

          {/* Right: Details Panel */}
          {selectedItem ? (
            <div className="md:w-72 bg-[#0b1326] border-2 border-[#4c4634] p-4 flex flex-col h-full shadow-2xl relative animate-in slide-in-from-right-4">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-[#171f33] border border-[#4c4634]/50 flex items-center justify-center text-[#f4d03f] shadow-inner relative p-3">
                  <ItemIcon item={selectedItem} size={72} />
                </div>
              </div>
              
              <div className="flex-grow text-center flex flex-col overflow-y-auto custom-scrollbar max-h-[300px] md:max-h-[350px]">
                <h3 className="font-headline text-lg font-black text-[#ffeebb] uppercase tracking-tighter mb-1">{selectedItem.name}</h3>
                <div>
                  <span className="font-label text-[8px] uppercase tracking-widest text-[#060d20] bg-[#f4d03f] px-2.5 py-0.5 rounded font-black inline-block mb-4">{selectedItem.type}</span>
                </div>
                
                <div className="space-y-2 mt-2 text-left bg-[#171f33] p-3 border border-[#4c4634]/30 rounded">
                  {selectedItem.stats && (
                    <div className="flex justify-between items-center border-b border-[#4c4634]/25 pb-1">
                      <span className="text-[#ffeebb]/50 font-label text-[9px] uppercase tracking-tighter">Effect</span>
                      <span className="text-[#f4d03f] font-headline font-bold text-xs">{selectedItem.stats}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-b border-[#4c4634]/25 pb-1">
                    <span className="text-[#ffeebb]/50 font-label text-[9px] uppercase tracking-tighter">Weight</span>
                    <span className="text-[#ffeebb] font-bold text-xs">{(selectedItem.weight * selectedItem.quantity).toFixed(1)} lbs</span>
                  </div>
                  {selectedItem.equippedTo && (
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-[#ffb4aa] font-label text-[9px] uppercase tracking-tighter">Equipped To</span>
                      <span className="text-[#ffb4aa] font-black text-xs uppercase">{party.find(p => p.id === selectedItem.equippedTo)?.name}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-[#ffeebb]/70 text-xs italic mt-4 leading-relaxed border-t border-[#4c4634]/20 pt-4 px-2">
                  "{selectedItem.description}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 border-t border-[#4c4634]/20 pt-4 flex flex-col gap-2">
                {selectedItem.type === 'Equipment' && (
                  selectedItem.equippedTo ? (
                    <button 
                      onClick={handleUnequip}
                      className="w-full bg-[#84231d] text-white font-headline font-black text-xs py-3 doodle-border hover:scale-105 active:scale-95 transition-all shadow-lg uppercase"
                    >
                      Unequip Gear
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <span className="font-label text-[8px] uppercase tracking-wider text-[#ffeebb]/40 text-center block mb-1">Equip to party member:</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {party.map(member => (
                          <button
                            key={member.id}
                            onClick={() => handleEquip(member.id)}
                            className="bg-[#171f33] hover:bg-[#222a3e] text-[#ffeebb] hover:text-[#f4d03f] font-headline font-bold text-[10px] py-2 border border-[#4c4634] active:scale-95 transition-all uppercase truncate px-1"
                          >
                            {member.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {selectedItem.type === 'Consumable' && (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-label text-[8px] uppercase tracking-wider text-[#ffeebb]/40 text-center block mb-1">Use consumable on:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {party.map(member => (
                        <button
                          key={member.id}
                          onClick={() => handleUseConsumable(member.id)}
                          className="bg-[#171f33] hover:bg-[#222a3e] text-[#ffeebb] hover:text-[#f4d03f] font-headline font-bold text-[10px] py-2 border border-[#4c4634] active:scale-95 transition-all uppercase truncate px-1 flex flex-col items-center"
                        >
                          <span>{member.name}</span>
                          <span className="text-[7px] text-[#ffeebb]/50 font-mono mt-0.5">{member.hp}/{member.maxHp} HP</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="md:w-72 bg-[#0b1326]/50 border-2 border-dashed border-[#4c4634]/30 p-5 md:p-8 flex flex-col items-center justify-center text-center opacity-40">
               <span className="material-symbols-outlined text-5xl mb-4 text-[#ffeebb]">info</span>
               <p className="font-body text-xs italic text-[#ffeebb]">Select an item to inspect its attributes or equip gear.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrandVault;
