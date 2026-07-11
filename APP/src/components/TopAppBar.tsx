import React from 'react';

interface Props {
  currentTab: string;
  onTabChange: (tab: string) => void;
  ap: number;
  onOpenSettings: () => void;
}

const TopAppBar: React.FC<Props> = ({ currentTab, onTabChange, ap, onOpenSettings }) => {
  const tabs = [
    { id: 'ledger', label: 'Ledger', icon: '/assets/ui/Icon_Bag.png' },
    { id: 'trials', label: 'Trials', icon: '/assets/ui/Icon_Quest.png' },
    { id: 'archive', label: 'Archive', icon: '/assets/ui/Icon_Cards.png' },
    { id: 'quests', label: 'Quests', icon: '/assets/ui/Icon_Map.png' },
  ];

  return (
    <header className="bg-surface border-b-2 border-outline-variant flex justify-between items-center px-4 md:px-10 h-20 w-full z-50 sticky top-0 shadow-lg select-none">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-xl lg:text-3xl font-black text-primary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-tighter">LedgerQuest <span className="text-xs text-on-surface-variant align-top opacity-50">- DEMO</span></h1>
      </div>
      
      <nav className="hidden md:flex gap-3 lg:gap-8 h-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`font-label text-xs uppercase tracking-widest h-full flex items-center px-2 transition-all duration-200 border-b-2 gap-0 lg:gap-3 group ${
              currentTab === tab.id 
                ? 'text-primary border-primary scale-105 font-black' 
                : 'text-on-surface-variant border-transparent hover:text-primary'
            }`}
          >
            <img src={tab.icon} alt="" className={`w-6 h-6 object-contain transition-transform group-hover:scale-110 ${currentTab === tab.id ? 'brightness-125' : 'opacity-60'}`} />
            <span className="hidden lg:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div 
          onClick={() => onTabChange('quests')}
          className="hidden xl:flex font-label text-[10px] uppercase tracking-widest text-primary-container border-2 border-primary-container px-3 py-1 doodle-border shadow-[0_0_10px_rgba(244,208,63,0.3)] hover:bg-primary-container hover:text-on-primary-container transition-all items-center gap-2 cursor-pointer group"
        >
          <img src="/assets/ui/Icon_Gps.png" alt="" className="w-4 h-4 object-contain group-hover:rotate-12 transition-transform" />
          Map
        </div>
        
        <div className="flex items-center gap-2.5 lg:gap-3">
          <div className="flex items-center gap-1.5 lg:gap-2 bg-surface-container-high px-2.5 lg:px-4 py-1.5 lg:py-2 doodle-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:jiggle transition-all cursor-help group border-primary/30">
            <img src="/assets/ui/Icon_Energy_Yellow.png" alt="" className="w-5 h-5 lg:w-6 lg:h-6 object-contain group-hover:animate-pulse" />
            <span data-testid="ap-value" className="font-headline text-lg lg:text-2xl font-bold text-primary leading-none">{ap}</span>
            <span className="font-label text-[10px] text-on-surface-variant opacity-60 uppercase tracking-tighter">AP</span>
          </div>
          
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            title="Settings"
            className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 border-outline/30 hover:border-primary/50 transition-all text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-xl md:text-2xl">settings</span>
          </button>

          <a
            href="https://forms.gle/1DH1yBBggYtuH12D9"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Send feedback"
            title="Send feedback"
            className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 border-outline/30 hover:border-primary/50 transition-all overflow-hidden group"
          >
            <img src="/assets/ui/Icon_ImageIcon_Chat.png" alt="Feedback" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default TopAppBar;
