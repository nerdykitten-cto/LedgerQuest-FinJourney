import React, { useState } from 'react';
import type { InventoryItem, PartyMember } from '../types/schemas';
import { Sprite, ItemIcon } from '../assets/placeholders';
import { equipSlotOf } from '../engine/equipment';

interface Props {
  party: PartyMember[];
  inventory: InventoryItem[];
  recruitCost: number;
  onClose: () => void;
  onAddMember: (slot: 'front' | 'support') => void;
  onRemoveMember: (id: string) => void;
  onHeal: (memberId: string, itemId: string) => void;
  onEquip: (itemId: string, memberId: string) => void;
  onUnequip: (itemId: string) => void;
}

const WarRoom: React.FC<Props> = ({
  party, inventory, recruitCost, onClose,
  onAddMember, onRemoveMember, onHeal, onEquip, onUnequip,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = party.find(m => m.id === selectedId) ?? null;

  const equippedOf = (memberId: string, slot: 'weapon' | 'armor') =>
    inventory.find(i => i.equippedTo === memberId && i.type === 'Equipment' && equipSlotOf(i) === slot);

  const potions = inventory.filter(i => i.type === 'Consumable' && i.quantity > 0);
  const equipables = inventory.filter(i => i.type === 'Equipment' && !i.equippedTo);

  const ACCENT = {
    primary: {
      cardSel: 'border-primary ring-4 ring-primary/40',
      cardIdle: 'border-primary/20',
      ring: 'border-primary bg-primary/5',
      name: 'text-primary',
    },
    tertiary: {
      cardSel: 'border-tertiary ring-4 ring-tertiary/40',
      cardIdle: 'border-tertiary/20',
      ring: 'border-tertiary bg-tertiary/5',
      name: 'text-tertiary',
    },
  } as const;

  const renderCard = (m: PartyMember, accent: 'primary' | 'tertiary') => {
    const isSel = m.id === selectedId;
    const a = ACCENT[accent];
    return (
      <div
        key={m.id}
        onClick={() => setSelectedId(m.id)}
        className={`bg-surface-container-low border-2 p-4 md:p-6 relative group hover:jiggle transition-all duration-300 cursor-pointer ${isSel ? a.cardSel : a.cardIdle}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`w-24 h-24 rounded-full border-4 ${a.ring} shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] overflow-hidden`}>
            <Sprite art={m.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" emojiClassName="text-5xl" alt={m.name} />
          </div>
          <div className="text-center">
            <span className={`font-headline text-lg font-black ${a.name} block uppercase tracking-tighter`}>{m.name}</span>
            <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">{m.role} • LV.{m.level}</span>
          </div>
          <div className="w-full flex items-center gap-2 justify-center">
            <span className="material-symbols-outlined text-error text-sm">favorite</span>
            <div className="flex-1 h-2 bg-surface-dim rounded-full overflow-hidden max-w-[120px]">
              <div className="h-full bg-error" style={{ width: `${Math.round((m.hp / m.maxHp) * 100)}%` }}></div>
            </div>
            <span className="font-label text-[10px] text-on-surface-variant tabular-nums">{m.hp}/{m.maxHp}</span>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveMember(m.id); if (isSel) setSelectedId(null); }}
              className="bg-error text-on-error px-4 py-1 rounded-full text-[10px] font-black uppercase hover:scale-110 transition-transform"
            >Dismiss</button>
          </div>
        </div>
      </div>
    );
  };

  const slotBox = (slot: 'weapon' | 'armor', label: string, icon: string) => {
    if (!selected) return null;
    const item = equippedOf(selected.id, slot);
    return (
      <div className="flex items-center gap-3 bg-surface-container-low border-2 border-outline-variant/30 p-3 rounded-lg">
        <span className="material-symbols-outlined text-on-surface-variant text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant/70">{label}</p>
          {item ? (
            <div className="flex items-center gap-2">
              <ItemIcon item={item} size={24} />
              <span className="font-label text-xs font-black text-on-surface truncate">{item.name}</span>
            </div>
          ) : (
            <span className="font-label text-xs text-on-surface-variant/40 italic">Empty</span>
          )}
        </div>
        {item && (
          <button
            onClick={() => onUnequip(item.id)}
            className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-[9px] font-black uppercase hover:text-error transition-colors"
          >Unequip</button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-surface-dim/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-6xl bg-surface-container border-4 border-on-surface-variant shadow-[12px_12px_0px_0px_rgba(0,0,0,0.6)] rounded-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="flex justify-between items-center px-8 py-5 bg-surface-container-high border-b-4 border-double border-outline">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-4xl">swords</span>
            <h1 className="font-headline text-2xl font-black text-primary uppercase tracking-tighter italic">War Room: Tactical Formation</h1>
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-error hover:rotate-90 transition-all text-3xl" onClick={onClose}>close</button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8">

          {/* Row 1: Front Line */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-label text-xs uppercase text-secondary tracking-[0.2em] font-black flex items-center gap-2 bg-secondary/10 px-3 py-1 rounded">
                <span className="material-symbols-outlined text-sm">shield</span>
                Front Line (Melee & Tanks)
              </h3>
              <div className="h-[1px] flex-1 bg-outline-variant ml-6 opacity-20"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {party.filter(p => p.role === 'Leader' || p.role === 'Vanguard').map(m => renderCard(m, 'primary'))}
              {party.filter(p => p.role === 'Leader' || p.role === 'Vanguard').length < 2 && (
                <button onClick={() => onAddMember('front')} className="bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex items-center justify-center hover:bg-surface-variant cursor-pointer transition-colors group min-h-[180px]">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 group-hover:scale-125 group-hover:text-primary transition-all">add_circle</span>
                    <p className="font-label text-[10px] uppercase text-on-surface-variant/60 tracking-widest">Recruit Tank</p>
                    <p className="font-label text-[10px] text-primary/70 mt-1">{recruitCost}g signing fee</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Mid & Back Row */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-label text-xs uppercase text-tertiary tracking-[0.2em] font-black flex items-center gap-2 bg-tertiary/10 px-3 py-1 rounded">
                <span className="material-symbols-outlined text-sm">auto_fix_normal</span>
                Support & Ranged (Mid/Back)
              </h3>
              <div className="h-[1px] flex-1 bg-outline-variant ml-6 opacity-20"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {party.filter(p => p.role !== 'Leader' && p.role !== 'Vanguard').map(m => renderCard(m, 'tertiary'))}
              {party.filter(p => p.role !== 'Leader' && p.role !== 'Vanguard').length < 3 && (
                <button onClick={() => onAddMember('support')} className="bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex items-center justify-center hover:bg-surface-variant cursor-pointer transition-colors group min-h-[180px]">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 group-hover:scale-125 group-hover:text-tertiary transition-all">add_circle</span>
                    <p className="font-label text-[10px] uppercase text-on-surface-variant/60 tracking-widest">Recruit Support</p>
                    <p className="font-label text-[10px] text-tertiary/70 mt-1">{recruitCost}g signing fee</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Management Panel */}
          <div className="border-t-4 border-double border-outline pt-6" data-testid="manage-panel">
            {!selected ? (
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant/50 text-center py-4">
                Select a hero above to equip gear or use a potion
              </p>
            ) : (
              <div className="space-y-5">
                <h3 className="font-headline text-lg font-black text-on-surface uppercase tracking-tighter flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">construction</span>
                  Manage {selected.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Loadout */}
                  <div className="space-y-3">
                    <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Loadout</p>
                    {slotBox('weapon', 'Weapon', 'swords')}
                    {slotBox('armor', 'Armor', 'security')}
                  </div>
                  {/* Actions */}
                  <div className="space-y-3">
                    <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Inventory</p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {potions.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-surface-container-low border-2 border-tertiary/20 p-2 rounded-lg" data-testid="warroom-potion">
                          <ItemIcon item={item} size={28} />
                          <div className="flex-1 min-w-0">
                            <p className="font-label text-xs font-black text-on-surface truncate">{item.name}</p>
                            <p className="font-label text-[9px] text-on-surface-variant/70">x{item.quantity} • {item.stats ?? 'Restore HP'}</p>
                          </div>
                          <button
                            onClick={() => onHeal(selected.id, item.id)}
                            disabled={selected.hp >= selected.maxHp}
                            className="bg-tertiary text-on-tertiary px-4 py-1 rounded-full text-[10px] font-black uppercase hover:scale-110 transition-transform disabled:opacity-30 disabled:hover:scale-100"
                          >Use</button>
                        </div>
                      ))}
                      {equipables.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-surface-container-low border-2 border-primary/20 p-2 rounded-lg" data-testid="warroom-equip">
                          <ItemIcon item={item} size={28} />
                          <div className="flex-1 min-w-0">
                            <p className="font-label text-xs font-black text-on-surface truncate">{item.name}</p>
                            <p className="font-label text-[9px] text-on-surface-variant/70 uppercase">{equipSlotOf(item)} • {item.stats ?? ''}</p>
                          </div>
                          <button
                            onClick={() => onEquip(item.id, selected.id)}
                            className="bg-primary text-on-primary px-4 py-1 rounded-full text-[10px] font-black uppercase hover:scale-110 transition-transform"
                          >Equip</button>
                        </div>
                      ))}
                      {potions.length === 0 && equipables.length === 0 && (
                        <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/40 italic py-2">Nothing to use or equip</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-5 bg-surface-container-high border-t-4 border-outline flex justify-end gap-6">
          <button className="px-8 py-3 text-on-surface font-label text-[10px] uppercase tracking-widest hover:text-primary transition-colors font-bold" onClick={onClose}>Close</button>
          <button onClick={onClose} className="bg-primary-container text-on-primary-container px-10 py-4 doodle-border border-on-primary-container font-headline font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-3 group">
            CONFIRM FORMATION
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarRoom;
