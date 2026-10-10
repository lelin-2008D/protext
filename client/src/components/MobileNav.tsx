import React from 'react';
import { LayoutDashboard, History, Plus, ShoppingBag, Users, Settings } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 finance-glass backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
          <span className="text-[9px] sm:text-[10px]">Dashboard</span>
        </button>

        {/* History Tab */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'history'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
          <span className="text-[9px] sm:text-[10px]">History</span>
        </button>

        {/* Elevated Quick Add Button */}
        <button
          onClick={() => setActiveTab('add')}
          className="flex flex-col items-center justify-center -mt-6 group focus:outline-none px-1"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full finance-gradient-action flex items-center justify-center group-active:scale-90 transition-transform p-2">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] group-hover:animate-hisab-wave" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-0.5 group-hover:animate-hisab-wave">Add</span>
        </button>

        {/* Shopping Planner Tab */}
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'shopping'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
          <span className="text-[9px] sm:text-[10px]">Shopping</span>
        </button>

        {/* Friends Tab */}
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'friends'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
          <span className="text-[9px] sm:text-[10px]">Friends</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'settings'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
          <span className="text-[9px] sm:text-[10px]">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNav;
