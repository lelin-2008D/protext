import React from 'react';
import { LayoutDashboard, History, Plus, Settings } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-3 max-w-lg mx-auto">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Dashboard</span>
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
          <History className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">History</span>
        </button>

        {/* Elevated Quick Add Button */}
        <button
          onClick={() => setActiveTab('add')}
          className="flex flex-col items-center justify-center -mt-6 group focus:outline-none"
        >
          <div className="w-13 h-13 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-active:scale-90 transition-transform p-3">
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-1">Add</span>
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
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Settings</span>
        </button>
      </div>
    </div>
  );
};
