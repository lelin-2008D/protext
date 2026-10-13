import React from 'react';
import { LayoutDashboard, History, Plus, ShoppingBag, Users, Settings } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav aria-label="Primary navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 finance-glass border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="grid grid-cols-6 items-end h-[4.25rem] px-1 max-w-2xl mx-auto">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          aria-label="Dashboard"
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 transition-all ${
            activeTab === 'dashboard'
              ? 'text-sky-700 dark:text-sky-300 font-semibold bg-sky-100/80 dark:bg-sky-950/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-[18px] h-[18px]" />
          <span className="text-[9px] leading-none">Home</span>
        </button>

        {/* History Tab */}
        <button
          onClick={() => setActiveTab('history')}
          aria-label="Transaction history"
          aria-current={activeTab === 'history' ? 'page' : undefined}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 transition-all ${
            activeTab === 'history'
              ? 'text-sky-700 dark:text-sky-300 font-semibold bg-sky-100/80 dark:bg-sky-950/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <History className="w-[18px] h-[18px]" />
          <span className="text-[9px] leading-none">History</span>
        </button>

        {/* Elevated Quick Add Button */}
        <button
          onClick={() => setActiveTab('add')}
          aria-label="Add transaction"
          aria-current={activeTab === 'add' ? 'page' : undefined}
          className="flex min-w-0 flex-col items-center justify-center -mt-5 group px-1"
        >
          <div className="w-11 h-11 rounded-2xl finance-gradient-action flex items-center justify-center group-active:scale-95 transition-transform p-2">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] group-hover:animate-hisab-wave" />
          </div>
          <span className="text-[9px] leading-none font-semibold text-slate-600 dark:text-slate-300 mt-0.5">Add</span>
        </button>

        {/* Shopping Planner Tab */}
        <button
          onClick={() => setActiveTab('shopping')}
          aria-label="Shopping planner"
          aria-current={activeTab === 'shopping' ? 'page' : undefined}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 transition-all ${
            activeTab === 'shopping'
              ? 'text-sky-700 dark:text-sky-300 font-semibold bg-sky-100/80 dark:bg-sky-950/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-[18px] h-[18px]" />
          <span className="text-[9px] leading-none">Shop</span>
        </button>

        {/* Friends Tab */}
        <button
          onClick={() => setActiveTab('friends')}
          aria-label="Friends"
          aria-current={activeTab === 'friends' ? 'page' : undefined}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 transition-all ${
            activeTab === 'friends'
              ? 'text-sky-700 dark:text-sky-300 font-semibold bg-sky-100/80 dark:bg-sky-950/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-[18px] h-[18px]" />
          <span className="text-[9px] leading-none">Friends</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => setActiveTab('settings')}
          aria-label="Settings"
          aria-current={activeTab === 'settings' ? 'page' : undefined}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 transition-all ${
            activeTab === 'settings'
              ? 'text-sky-700 dark:text-sky-300 font-semibold bg-sky-100/80 dark:bg-sky-950/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Settings className="w-[18px] h-[18px]" />
          <span className="text-[9px] leading-none">Settings</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
