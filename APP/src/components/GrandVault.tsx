import React, { useState } from 'react';

interface Item {
  id: string;
  name: string;
  type: 'Consumable' | 'Equipment' | 'Quest';
  icon: string;
  description: string;
  stats?: string;
  weight: string;
}

interface Props {
  onClose: () => void;
}

const GrandVault: React.FC<Props> = ({ onClose }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const items: Item[] = [
    { id: '1', name: 'Midas Elixir', type: 'Consumable', icon: 'science', description: 'A golden liquid that tastes like sun-warmed honey and financial stability.', stats: '+10 HP', weight: '0.5 lbs' },
    { id: '2', name: 'Budget Slicer', type: 'Equipment', icon: 'swords', description: 'A keen blade used to trim unnecessary expenses.', stats: '+5 Attack', weight: '3.0 lbs' },
    { id: '3', name: 'Tax Scroll', type: 'Quest', icon: 'auto_stories', description: 'Ancient parchment detailing the royal taxes of Aethelgard.', weight: '0.1 lbs' },
    { id: '4', name: 'Ledger Shield', type: 'Equipment', icon: 'shield', description: 'Protects against sudden market crashes.', stats: '+10 Defense', weight: '5.0 lbs' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-surface-dim/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-20 w-full max-w-4xl max-h-[80vh] bg-surface-container doodle-border p-6 paper-stack flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="relative">
            <h2 className="font-headline text-3xl font-black text-primary doodle-underline inline-block">The Grand Vault: Inventory</h2>
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-2">Carrying: 8.6 / 100.0 lbs</p>
          </div>
          <button className="bg-error/20 text-error p-2 doodle-border hover:rotate-6 transition-transform" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Content Layout */}
        <div className="flex flex-col md:flex-row gap-6 flex-grow overflow-hidden">
          {/* Left: Sidebar Categories */}
          <nav className="flex md:flex-col gap-2 md:w-48">
            <button className="flex items-center gap-3 p-3 bg-primary-container text-on-primary-container doodle-border font-label text-[10px] uppercase font-black text-left active:scale-95 transition-transform">
              <span className="material-symbols-outlined">grid_view</span>
              All Items
            </button>
            <button className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-bright doodle-border border-dashed font-label text-[10px] uppercase font-bold text-left transition-colors">
              <span className="material-symbols-outlined">liquor</span>
              Consumables
            </button>
            <button className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-bright doodle-border border-dashed font-label text-[10px] uppercase font-bold text-left transition-colors">
              <span className="material-symbols-outlined">shield</span>
              Equipment
            </button>
          </nav>

          {/* Middle: Item Grid */}
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`aspect-square bg-surface-container-high doodle-border flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-all relative tape-accent pt-0
                    ${selectedItem?.id === item.id ? 'ring-2 ring-primary border-primary scale-105' : ''}
                  `}
                >
                  <span className={`material-symbols-outlined text-4xl ${selectedItem?.id === item.id ? 'text-primary' : 'text-on-surface-variant'}`}>{item.icon}</span>
                  {item.type === 'Consumable' && <span className="absolute bottom-1 right-1 font-label text-[8px] bg-primary text-on-primary px-1 rounded">x5</span>}
                </div>
              ))}
              {/* Empty Slots */}
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-surface-container-low opacity-20 doodle-border border-dashed"></div>
              ))}
            </div>
          </div>

          {/* Right: Details Panel */}
          {selectedItem ? (
            <div className="md:w-64 bg-surface-container-high doodle-border p-4 flex flex-col h-full shadow-lg relative animate-in slide-in-from-right-4">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-surface-bright doodle-border flex items-center justify-center text-primary shadow-inner">
                  <span className="material-symbols-outlined text-6xl">{selectedItem.icon}</span>
                </div>
              </div>
              <div className="flex-grow text-center">
                <h3 className="font-headline text-xl font-black text-primary mb-1">{selectedItem.name}</h3>
                <span className="font-label text-[8px] uppercase tracking-widest text-on-tertiary-container bg-tertiary-container px-2 py-0.5 rounded-full mb-4 inline-block">{selectedItem.type}</span>
                <div className="space-y-3 mt-4 text-left">
                  {selectedItem.stats && (
                    <div className="flex justify-between items-center border-b border-outline-variant pb-1">
                      <span className="text-on-surface-variant font-label text-[9px] uppercase tracking-tighter">Effect</span>
                      <span className="text-primary font-bold text-xs">{selectedItem.stats}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-b border-outline-variant pb-1">
                    <span className="text-on-surface-variant font-label text-[9px] uppercase tracking-tighter">Weight</span>
                    <span className="text-on-surface font-bold text-xs">{selectedItem.weight}</span>
                  </div>
                </div>
                <p className="text-on-surface-variant text-xs italic mt-6 leading-relaxed">
                  "{selectedItem.description}"
                </p>
              </div>
              <div className="mt-8 flex flex-col gap-2">
                <button className="w-full bg-primary-container text-on-primary-container font-label text-[10px] uppercase font-black py-3 doodle-border hover:jiggle shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none">
                  Use Item
                </button>
                <button className="w-full bg-secondary-container/20 text-on-secondary-container font-label text-[10px] uppercase font-black py-2 doodle-border opacity-50 cursor-not-allowed">
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div className="md:w-64 bg-surface-container-high doodle-border p-8 flex flex-col items-center justify-center text-center opacity-40 border-dashed">
               <span className="material-symbols-outlined text-5xl mb-4">info</span>
               <p className="font-body text-xs italic">Select an item to inspect its attributes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrandVault;
