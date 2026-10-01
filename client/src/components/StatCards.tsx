import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext.js';

interface StatCardsProps {
  onEditStartingBalance?: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ onEditStartingBalance }) => {
  const { availableBalance, totalIncome, totalExpenses, startingBalance, settings } = useTransactions();

  const formatCurrency = (val: number) => {
    return `${settings.currency === 'NPR' ? 'Rs.' : settings.currency} ${val.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="space-y-4">
      {/* Primary Balance Hero Card */}
      <div className="relative overflow-hidden rounded-2xl finance-balance-card text-slate-900 dark:text-white p-5 sm:p-6">

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-blue-100">Available Balance</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            {/* Quick edit starting balance button */}
            <button
              onClick={onEditStartingBalance}
              className="inline-flex items-center gap-1 text-[11px] font-medium bg-white/60 hover:bg-white/75 dark:bg-white/15 dark:hover:bg-white/25 active:scale-95 px-2.5 py-1 rounded-full text-slate-800 dark:text-blue-100 transition backdrop-blur-sm"
              title="Edit Starting Balance"
            >
              <Edit3 className="w-3 h-3" />
              <span>Start: {formatCurrency(startingBalance)}</span>
            </button>
          </div>

          <div className="my-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {formatCurrency(availableBalance)}
            </h1>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-900/10 dark:border-white/15 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-700 dark:text-blue-100 font-medium">Total Income</p>
                <p className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">+{formatCurrency(totalIncome)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-700 dark:text-blue-100 font-medium">Total Expenses</p>
                <p className="text-sm sm:text-base font-bold text-rose-700 dark:text-rose-300">-{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Balance Breakdown Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="finance-surface rounded-xl border p-3.5">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
            <Wallet className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[11px] font-medium">Starting</span>
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
            {formatCurrency(startingBalance)}
          </p>
        </div>

        <div className="finance-surface rounded-xl border p-3.5">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium">Income</span>
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
            +{formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="finance-surface rounded-xl border p-3.5">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[11px] font-medium">Expense</span>
          </div>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate">
            -{formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>
    </div>
  );
};
