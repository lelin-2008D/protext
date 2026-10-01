import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, ChevronDown, Menu, X } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext.js';
import { useAuth } from '../context/AuthContext.js';
import { SyncBadge } from './SyncBadge.js';
import { Logo } from './Logo.js';

interface TopHeaderProps {
  onSearchQuery?: (q: string) => void;
  onOpenMobileMenu?: () => void;
  onOpenSettings?: () => void;
  onOpenAuthModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onSearchQuery,
  onOpenMobileMenu,
  onOpenSettings,
  onOpenAuthModal
}) => {
  const { settings, updateTheme } = useTransactions();
  const { user } = useAuth();

  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const isDark = document.documentElement.classList.contains('dark') || settings.theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    updateTheme(nextTheme);
  };

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Lelin Adhikari');

  return (
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 finance-glass sticky top-0 z-30">
      {/* Mobile Hamburger & Brand */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">HISAB</span>
        </div>
      </div>

      {/* Global Search Input Bar */}
      <div className="flex-1 max-w-md hidden sm:block relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search transactions, categories..."
            value={searchVal}
            onChange={e => {
              setSearchVal(e.target.value);
              if (onSearchQuery) onSearchQuery(e.target.value);
            }}
          className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm finance-glass border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
          {searchVal && (
            <button
              onClick={() => {
                setSearchVal('');
                if (onSearchQuery) onSearchQuery('');
              }}
              className="absolute right-3 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Action Icons & User Profile Pill */}
      <div className="flex items-center gap-3">
        {/* Sync status */}
        <SyncBadge />

        {/* Notifications Icon with active dot */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3.5 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>Notifications</span>
                <span className="text-[10px] text-blue-500 font-medium">Mark all read</span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
                  <p className="font-semibold">Offline Sync Ready</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Your data is safely saved in local storage.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Profile Pill */}
        <button
          onClick={onOpenSettings || onOpenAuthModal}
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 transition text-xs font-semibold text-slate-800 dark:text-slate-200"
        >
          <div className="w-6 h-6 rounded-full finance-gradient-action flex items-center justify-center font-bold text-[10px]">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:inline truncate max-w-[100px]">{displayName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
