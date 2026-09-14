import React from 'react';
import { SyncBadge } from './SyncBadge.js';
import { useAuth } from '../context/AuthContext.js';
import { Wallet, Sparkles, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onOpenSettings?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, activeTab, setActiveTab }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => setActiveTab && setActiveTab('dashboard')}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">HISAB</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">NP</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">Smart Money Tracker</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab && setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab && setActiveTab('add')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'add'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Quick Add
          </button>
          <button
            onClick={() => setActiveTab && setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab && setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Settings
          </button>
        </nav>

        {/* Sync Status & User Profile Trigger */}
        <div className="flex items-center gap-3">
          <SyncBadge />
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={user?.name || 'Account'}
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
