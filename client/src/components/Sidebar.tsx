import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  FolderKanban,
  LineChart,
  FileSpreadsheet,
  Users2,
  Settings,
  Mountain,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Logo } from './Logo.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenStartingBalance?: () => void;
  onOpenAddCategory?: () => void;
  onOpenSettings?: () => void;
  onOpenAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenStartingBalance,
  onOpenAddCategory,
  onOpenSettings,
  onOpenAuthModal
}) => {
  const { user, isGuest } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank, action: onOpenStartingBalance },
    { id: 'categories', label: 'Categories', icon: FolderKanban, action: onOpenAddCategory },
  ];

  const insightItems = [
    { id: 'analytics', label: 'Analytics', icon: LineChart, action: () => setActiveTab('dashboard') },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet, action: () => setActiveTab('dashboard') },
  ];

  const toolItems = [
    { id: 'friends', label: 'Friend Calculator', icon: Users2 },
    { id: 'settings', label: 'Settings', icon: Settings, action: onOpenSettings },
  ];

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Lelin Adhikari');
  const userSubtitle = isGuest ? 'Guest Account' : (user?.email || 'Student');

  return (
    <aside className="w-64 xl:w-72 bg-slate-100/90 dark:bg-[#050816]/95 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 p-5 text-slate-700 dark:text-slate-300 select-none overflow-y-auto backdrop-blur-xl">
      {/* Brand Header */}
      <div>
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group mb-8 px-2"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/60 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform shadow-sm">
            <Logo size={28} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">HISAB</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">Personal Money Tracker</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'finance-gradient-action text-white'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* INSIGHTS Section */}
        <div className="mt-7">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3.5 mb-2">
            Insights
          </p>
          <div className="space-y-1">
            {insightItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors"
                >
                  <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TOOLS Section */}
        <div className="mt-7">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3.5 mb-2">
            Tools
          </p>
          <div className="space-y-1">
            {toolItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'finance-gradient-action text-white'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="mt-6 space-y-4">
        {/* Designed for Nepal Promo Card */}
        <div className="relative overflow-hidden rounded-2xl finance-gradient border border-slate-300 dark:border-slate-800 p-4 shadow-md shadow-slate-300/30 dark:shadow-none">
          <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
            <Mountain className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">Designed for Nepal</h4>
          <p className="text-[11px] text-slate-700 dark:text-blue-100 mt-0.5 leading-snug">Your money. Your rules.</p>
        </div>

        {/* User Profile Card */}
        <div
          onClick={onOpenAuthModal}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors dark:bg-slate-900/80 dark:hover:bg-slate-800/80 dark:border-slate-800/80"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full finance-gradient-action flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{userSubtitle}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
