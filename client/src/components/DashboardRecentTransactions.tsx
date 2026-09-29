import React from 'react';
import {
  UtensilsCrossed,
  Bus,
  Banknote,
  Coffee,
  Wifi,
  Briefcase,
  ArrowRight,
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext.js';
import { Transaction } from '../types/index.js';

interface DashboardRecentTransactionsProps {
  onNavigateToHistory: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
}

export const DashboardRecentTransactions: React.FC<DashboardRecentTransactionsProps> = ({
  onNavigateToHistory,
  onEditTransaction
}) => {
  const { transactions } = useTransactions();

  // Helper to pick category icon and colors matching the design image
  const getCategoryTheme = (category: string = '', desc: string = '') => {
    const c = (category + ' ' + desc).toLowerCase();
    if (c.includes('momo') || c.includes('food') || c.includes('lunch') || c.includes('dinner') || c.includes('snack')) {
      return { icon: UtensilsCrossed, bg: 'bg-orange-500/15 text-orange-400 border-orange-500/20', pillBg: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
    }
    if (c.includes('coffee') || c.includes('tea') || c.includes('cafe')) {
      return { icon: Coffee, bg: 'bg-amber-600/15 text-amber-400 border-amber-600/20', pillBg: 'bg-amber-600/15 text-amber-300 border-amber-600/30' };
    }
    if (c.includes('bus') || c.includes('transport') || c.includes('taxi') || c.includes('ride') || c.includes('petrol')) {
      return { icon: Bus, bg: 'bg-blue-500/15 text-blue-400 border-blue-500/20', pillBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
    }
    if (c.includes('salary') || c.includes('income') || c.includes('received')) {
      return { icon: Banknote, bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', pillBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
    if (c.includes('internet') || c.includes('wifi') || c.includes('bill') || c.includes('utility') || c.includes('electricity')) {
      return { icon: Wifi, bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20', pillBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
    }
    if (c.includes('freelance') || c.includes('project') || c.includes('work')) {
      return { icon: Briefcase, bg: 'bg-teal-500/15 text-teal-400 border-teal-500/20', pillBg: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    }
    return { icon: ShoppingCart, bg: 'bg-slate-500/15 text-slate-400 border-slate-500/20', pillBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
  };

  // Demo fallback entries when user has no transactions yet
  const demoTransactions: Partial<Transaction>[] = [
    { id: 'demo-1', description: 'Momo', category_name: 'Food', amount: 250, type: 'expense', date: new Date().toISOString() },
    { id: 'demo-2', description: 'Bus Fare', category_name: 'Transport', amount: 40, type: 'expense', date: new Date().toISOString() },
    { id: 'demo-3', description: 'Salary', category_name: 'Income', amount: 25000, type: 'income', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 'demo-4', description: 'Coffee', category_name: 'Food', amount: 150, type: 'expense', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 'demo-5', description: 'Internet Bill', category_name: 'Utilities', amount: 800, type: 'expense', date: new Date(Date.now() - 172800000).toISOString() },
    { id: 'demo-6', description: 'Freelance Work', category_name: 'Income', amount: 5000, type: 'income', date: new Date(Date.now() - 259200000).toISOString() }
  ];

  const hasTransactions = transactions.length > 0;
  const displayList = hasTransactions ? transactions.slice(0, 6) : (demoTransactions as Transaction[]);

  const formatRowDate = (dateStr?: string) => {
    if (!dateStr) return 'Today';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
        </div>

        <button
          onClick={onNavigateToHistory}
          className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1 group transition"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Table Header Row */}
      <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="col-span-5 sm:col-span-4">Description</div>
        <div className="col-span-3 sm:col-span-3">Date</div>
        <div className="col-span-2 sm:col-span-3 text-center sm:text-left">Category</div>
        <div className="col-span-2 sm:col-span-2 text-right">Amount</div>
      </div>

      {/* Transaction Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
        {displayList.map(tx => {
          const theme = getCategoryTheme(tx.category_name, tx.description);
          const Icon = theme.icon;
          const isIncome = tx.type === 'income';

          return (
            <div
              key={tx.id}
              onClick={() => hasTransactions && onEditTransaction && onEditTransaction(tx)}
              className="grid grid-cols-12 gap-2 items-center px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
            >
              {/* Description + Icon */}
              <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${theme.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {tx.description}
                </span>
              </div>

              {/* Date */}
              <div className="col-span-3 sm:col-span-3 text-[11px] sm:text-xs text-slate-400 truncate">
                {formatRowDate(tx.date)}
              </div>

              {/* Category Pill */}
              <div className="col-span-2 sm:col-span-3">
                <span className={`inline-block text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${theme.pillBg} truncate max-w-[100px]`}>
                  {tx.category_name || 'General'}
                </span>
              </div>

              {/* Amount */}
              <div className="col-span-2 sm:col-span-2 text-right">
                <span className={`text-xs sm:text-sm font-bold tracking-tight ${isIncome ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {isIncome ? '+ ' : '- '}Rs. {tx.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardRecentTransactions;
