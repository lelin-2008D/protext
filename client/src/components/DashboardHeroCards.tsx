import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, PiggyBank } from 'lucide-react';
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
      <div
        onClick={onOpenStartingBalance}
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Balance</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(availableBalance)}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 dark:text-emerald-400">
            <span>↑ 12.4%</span>
            <span className="text-slate-400 font-normal">vs last week</span>
          </div>
          {/* Sparkline SVG */}
          <svg className="w-16 h-5 stroke-emerald-500 fill-none" viewBox="0 0 60 20">
            <path d="M 0 16 Q 15 14, 25 18 T 45 6 T 60 4" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 2. Total Income Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
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

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-500 dark:text-teal-400">
            <span>↑ 8.2%</span>
            <span className="text-slate-400 font-normal">vs last week</span>
          </div>
          {/* Sparkline SVG */}
          <svg className="w-16 h-5 stroke-teal-500 fill-none" viewBox="0 0 60 20">
            <path d="M 0 18 Q 15 15, 30 10 T 45 8 T 60 3" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 3. Total Expenses Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
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

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 dark:text-rose-400">
            <span>↓ 4.1%</span>
            <span className="text-slate-400 font-normal">vs last week</span>
          </div>
          {/* Sparkline SVG */}
          <svg className="w-16 h-5 stroke-rose-500 fill-none" viewBox="0 0 60 20">
            <path d="M 0 6 Q 20 8, 35 15 T 50 12 T 60 17" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 4. Savings Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
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

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-500 dark:text-blue-400">
            <span>↑ 15.8%</span>
            <span className="text-slate-400 font-normal">vs last week</span>
          </div>
          {/* Sparkline SVG */}
          <svg className="w-16 h-5 stroke-blue-500 fill-none" viewBox="0 0 60 20">
            <path d="M 0 17 Q 15 15, 30 12 T 45 8 T 60 4" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeroCards;
