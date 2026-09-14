import React from 'react';
import { StatCards } from '../components/StatCards.js';
import { NaturalLanguageInput } from '../components/NaturalLanguageInput.js';
import { TransactionItem } from '../components/TransactionItem.js';
import { CategoryPieChart } from '../components/CategoryPieChart.js';
import { useTransactions } from '../context/TransactionContext.js';
import { Transaction } from '../types/index.js';
import { ArrowRight, History } from 'lucide-react';

interface DashboardPageProps {
  onNavigateToHistory: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onOpenStartingBalance: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToHistory,
  onEditTransaction,
  onDeleteTransaction,
  onOpenStartingBalance
}) => {
  const { transactions } = useTransactions();
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-200">
      {/* 1. Stat Cards & Balance Hero */}
      <StatCards onEditStartingBalance={onOpenStartingBalance} />

      {/* 2. Primary Natural Language Quick Input */}
      <section>
        <NaturalLanguageInput />
      </section>

      {/* 3. Category Breakdown & Recent Transactions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Expense Breakdown */}
        <section>
          <CategoryPieChart />
        </section>

        {/* Recent Transactions List */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              </div>
              <button
                onClick={onNavigateToHistory}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                <span>View All ({transactions.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs">No transactions recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Type above (e.g. <span className="font-semibold text-slate-600 dark:text-slate-300">Coffee 120</span>) to start tracking!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentTransactions.map(tx => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onEdit={onEditTransaction}
                    onDelete={onDeleteTransaction}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
