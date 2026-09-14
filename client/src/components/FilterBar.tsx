import React from 'react';
import { Category, TransactionType } from '../types/index.js';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  search: string;
  setSearch: (s: string) => void;
  typeFilter: 'all' | TransactionType;
  setTypeFilter: (t: 'all' | TransactionType) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  categories: Category[];
  totalMatches: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  totalMatches
}) => {
  const hasActiveFilters = search !== '' || typeFilter !== 'all' || categoryFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

  const filteredCategoriesList = typeFilter === 'all'
    ? categories
    : categories.filter(c => c.type === typeFilter);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by description, amount, or category..."
          className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              typeFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-lg transition ${
              typeFilter === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1.5 rounded-lg transition ${
              typeFilter === 'income'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Income
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {filteredCategoriesList.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-400 font-medium px-1">
        Showing {totalMatches} transaction{totalMatches === 1 ? '' : 's'}
      </div>
    </div>
  );
};
