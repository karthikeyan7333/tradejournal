import React from 'react';
import { LayoutDashboard, ListFilter, Calendar, Plus } from 'lucide-react';

export type NavTab = 'dashboard' | 'trades' | 'calendar';

interface BottomNavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddTrade: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTrade,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0c10]/95 backdrop-blur-lg border-t border-[#1b1f26] pb-[max(env(safe-area-inset-bottom),8px)] pt-1 px-4 select-none">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* HOME / DASHBOARD */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
            currentTab === 'dashboard' ? 'text-[#00E676]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-semibold tracking-wider">HOME</span>
        </button>

        {/* TRADES HISTORY */}
        <button
          onClick={() => onSelectTab('trades')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
            currentTab === 'trades' ? 'text-[#00E676]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <ListFilter className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-semibold tracking-wider">TRADES</span>
        </button>

        {/* PROMINENT CENTER ADD BUTTON */}
        <div className="flex-1 flex justify-center -translate-y-3">
          <button
            onClick={onOpenAddTrade}
            className="w-13 h-13 rounded-full bg-[#00E676] hover:bg-[#2bfb8d] text-black flex items-center justify-center shadow-lg shadow-[#00E676]/25 border-4 border-[#08090b] transition active:scale-92 focus:outline-none"
            aria-label="Add Trade"
            title="Add New Trade"
          >
            <Plus className="w-7 h-7 stroke-[2.8]" />
          </button>
        </div>

        {/* CALENDAR */}
        <button
          onClick={() => onSelectTab('calendar')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
            currentTab === 'calendar' ? 'text-[#00E676]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-semibold tracking-wider">CALENDAR</span>
        </button>
      </div>
    </nav>
  );
};
