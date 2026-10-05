import React, { useState } from 'react';
import { useTransactions } from '../context/TransactionContext.js';
import { useAuth } from '../context/AuthContext.js';
import { exportTransactionsToCSV } from '../lib/export.js';
import {
  Wallet, Sun, Moon, Monitor, Download, LogOut,
  Plus, Sparkles, ShieldCheck, KeyRound, Trash2, RotateCcw, AlertTriangle, Volume2, VolumeX
} from 'lucide-react';

interface SettingsPageProps {
  onOpenStartingBalance: () => void;
  onOpenAddCategory: () => void;
  onOpenAuthModal: () => void;
  onOpenChangePassword?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenStartingBalance,
  onOpenAddCategory,
  onOpenAuthModal,
  onOpenChangePassword
}) => {
  const { settings, startingBalance, categories, transactions, updateTheme, updateTransactionSavedSound, clearAllData, resetAllData } = useTransactions();
  const { user, isGuest, signOut } = useAuth();
  const [workingAction, setWorkingAction] = useState<'clear' | 'reset' | null>(null);
  const [dataActionError, setDataActionError] = useState('');

  const handleExport = () => {
    exportTransactionsToCSV(transactions, `hisab_backup_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDataAction = async (action: 'clear' | 'reset') => {
    const message = action === 'clear'
      ? 'Delete all transactions, friends, friend records, and custom categories? Your account and theme will stay.'
      : 'Reset everything in HISAB? This deletes all data and restores the starting balance and theme defaults.';
    if (!window.confirm(message)) return;

    setWorkingAction(action);
    setDataActionError('');
    try {
      if (action === 'clear') await clearAllData();
      else await resetAllData();
    } catch (error) {
      setDataActionError(error instanceof Error ? error.message : 'Could not clear your data. Please try again.');
    } finally {
      setWorkingAction(null);
    }
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

        {!isGuest && onOpenChangePassword && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Change Password</p>
              <p className="text-[11px] text-slate-400">Update your account login password</p>
            </div>
            <button
              onClick={onOpenChangePassword}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Change Password</span>
            </button>
          </div>
        )}

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

      {/* Transaction sound setting */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              {settings.transaction_saved_sound_enabled !== false ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Transaction saved sound</p>
              <p className="text-xs text-slate-400">Play a sound after a transaction is saved</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.transaction_saved_sound_enabled !== false}
            aria-label="Toggle transaction saved sound"
            onClick={() => void updateTransactionSavedSound(settings.transaction_saved_sound_enabled === false)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              settings.transaction_saved_sound_enabled !== false ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              settings.transaction_saved_sound_enabled !== false ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
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

      {/* Destructive data controls */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-sm dark:border-rose-950/70 dark:bg-rose-950/20">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">Danger zone</h4>
            <p className="mt-0.5 text-xs text-rose-700/80 dark:text-rose-300/70">These actions permanently remove data and cannot be undone.</p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-rose-200/80 dark:divide-rose-900/60">
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Delete all data</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Remove transactions, friends, records, and custom categories.</p>
            </div>
            <button
              onClick={() => handleDataAction('clear')}
              disabled={workingAction !== null}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {workingAction === 'clear' ? 'Deleting...' : 'Delete data'}
            </button>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Reset everything</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Delete all data and restore theme and balance defaults.</p>
            </div>
            <button
              onClick={() => handleDataAction('reset')}
              disabled={workingAction !== null}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {workingAction === 'reset' ? 'Resetting...' : 'Reset app'}
            </button>
          </div>
        </div>

        {dataActionError && <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-slate-900/70 dark:text-rose-300">{dataActionError}</p>}
        {isGuest && <p className="mt-3 text-[11px] text-rose-700/70 dark:text-rose-300/60">Guest data is stored only on this device.</p>}
      </div>

      <div className="text-center pt-2">
        <p className="text-[11px] text-slate-400 font-medium">
          HISAB v1.0 • Built for Nepal
        </p>
      </div>
    </div>
  );
};
