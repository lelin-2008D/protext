import React from 'react';
import { useTransactions } from '../context/TransactionContext.js';
import { useAuth } from '../context/AuthContext.js';
import { exportTransactionsToCSV } from '../lib/export.js';
import {
  Wallet, Sun, Moon, Monitor, Download, LogOut,
  Plus, Sparkles, ShieldCheck
} from 'lucide-react';

interface SettingsPageProps {
  onOpenStartingBalance: () => void;
  onOpenAddCategory: () => void;
  onOpenAuthModal: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenStartingBalance,
  onOpenAddCategory,
  onOpenAuthModal
}) => {
  const { settings, startingBalance, categories, transactions, updateTheme } = useTransactions();
  const { user, isGuest, signOut } = useAuth();

  const handleExport = () => {
    exportTransactionsToCSV(transactions, `hisab_backup_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 md:pb-8 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
      </div>

      {/* Account / Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {user?.name || 'Local User'}
              </h3>
              <p className="text-xs text-slate-400">{user?.email || 'Local Offline Device'}</p>
            </div>
          </div>

          {isGuest ? (
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
            >
              Sign In / Sync
            </button>
          ) : (
            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Row-Level Security & User Ownership
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {user?.id?.substring(0, 10)}...
          </span>
        </div>
      </div>

      {/* Financial Preferences (Starting Balance & Currency) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Settings</h4>

        {/* Starting Balance Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Starting Balance</p>
              <p className="text-xs text-slate-400">Initial base balance in your account</p>
            </div>
          </div>
          <button
            onClick={onOpenStartingBalance}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 transition"
          >
            Rs. {startingBalance.toLocaleString('en-IN')}
          </button>
        </div>

        {/* Currency Row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Currency</p>
              <p className="text-xs text-slate-400">Default national currency</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
            NPR (Rs.)
          </span>
        </div>
      </div>

      {/* Categories Manager */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories ({categories.length})</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Used for natural language categorization</p>
          </div>
          <button
            onClick={onOpenAddCategory}
            className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
          {categories.map(cat => (
            <div
              key={cat.name}
              className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{cat.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{cat.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Theme</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => updateTheme('light')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
              settings.theme === 'light'
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light</span>
          </button>

          <button
            onClick={() => updateTheme('dark')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
              settings.theme === 'dark'
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => updateTheme('system')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
              settings.theme === 'system'
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* Data Export & Backup */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Export Transactions</h4>
          <p className="text-xs text-slate-400">Download complete transaction history as CSV</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="text-center pt-2">
        <p className="text-[11px] text-slate-400 font-medium">
          HISAB v1.0 • Built for Nepal
        </p>
      </div>
    </div>
  );
};
