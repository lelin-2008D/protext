import React, { useState, useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext.js';
import { Transaction, TransactionType } from '../types/index.js';
import { FilterBar } from '../components/FilterBar.js';
import { TransactionItem } from '../components/TransactionItem.js';
import { exportTransactionsToCSV } from '../lib/export.js';
import { Download, History, Plus } from 'lucide-react';

interface HistoryPageProps {
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onNavigateToAdd: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onEditTransaction,
  onDeleteTransaction,
  onNavigateToAdd
}) => {
  const { transactions, categories } = useTransactions();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && t.category_name.toLowerCase() !== categoryFilter.toLowerCase()) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCat = t.category_name.toLowerCase().includes(q);
        const matchAmount = t.amount.toString().includes(q);
        const matchDate = t.date.includes(q);
        if (!matchDesc && !matchCat && !matchAmount && !matchDate) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, categoryFilter, search]);

  // Group by Date for cleaner chronological timeline
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = [];
    const dateMap = new Map<string, Transaction[]>();

    for (const tx of filteredTransactions) {
      const d = tx.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, []);
      }
      dateMap.get(d)!.push(tx);
    }

    dateMap.forEach((items, date) => {
      groups.push({ date, items });
    });

    return groups.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [filteredTransactions]);

  const handleExport = () => {
    exportTransactionsToCSV(filteredTransactions, `hisab_history_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8 animate-in fade-in duration-200">
      {/* Header with Title and Export Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transaction History</h2>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredTransactions.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          title="Export CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        totalMatches={filteredTransactions.length}
      />

      {/* Grouped Transaction List */}
      {groupedTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <History className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Transactions Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {transactions.length === 0
              ? 'You have not added any transactions yet.'
              : 'No transactions match your current filters.'}
          </p>
          <button
            onClick={onNavigateToAdd}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map(group => (
            <div key={group.date} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {group.date === new Date().toISOString().split('T')[0] ? 'Today' : group.date}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {group.items.length} item{group.items.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map(tx => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onEdit={onEditTransaction}
                    onDelete={onDeleteTransaction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
