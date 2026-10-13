import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, PiggyBank, ArrowUpRight as OpenBalance } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext.js';

interface DashboardHeroCardsProps {
  onOpenStartingBalance?: () => void;
}

export const DashboardHeroCards: React.FC<DashboardHeroCardsProps> = ({ onOpenStartingBalance }) => {
  const { availableBalance, totalIncome, totalExpenses, settings } = useTransactions();

  const formatCurrency = (val: number) => {
    return `${settings.currency === 'NPR' ? 'Rs.' : settings.currency} ${val.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  const savings = Math.max(0, totalIncome - totalExpenses);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Balance Card */}
      <button
        onClick={onOpenStartingBalance}
        type="button"
        aria-label="View balance and edit starting balance"
        className="relative w-full overflow-hidden rounded-2xl finance-balance-card border border-sky-900/10 p-5 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-offset-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[var(--balance-muted)]">Available balance</span>
          <div className="w-8 h-8 rounded-xl bg-black/5 border border-[var(--balance-rule)] text-[var(--on-balance)] flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-2xl sm:text-[26px] font-black text-[var(--on-balance)] tracking-tight">
            {formatCurrency(availableBalance)}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--balance-rule)]">
          <span className="text-[11px] text-[var(--balance-muted)]">Current balance across your recorded activity</span>
          <OpenBalance aria-hidden="true" className="w-4 h-4 shrink-0 text-[var(--on-balance)]" />
        </div>
      </button>

      {/* 2. Total Income Card */}
      <div className="relative overflow-hidden rounded-2xl finance-surface finance-surface-hover border p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Income</span>
          <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-500 dark:text-teal-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalIncome)}
          </h3>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">All recorded income</span>
        </div>
      </div>

      {/* 3. Total Expenses Card */}
      <div className="relative overflow-hidden rounded-2xl finance-surface finance-surface-hover border p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Expenses</span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalExpenses)}
          </h3>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">All recorded expenses</span>
        </div>
      </div>

      {/* 4. Savings Card */}
      <div className="relative overflow-hidden rounded-2xl finance-surface finance-surface-hover border p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Savings</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(savings)}
          </h3>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Income minus expenses</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeroCards;
