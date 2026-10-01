import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { TransactionType } from '../types/index.js';

interface TransactionTypeToggleProps {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  label?: string;
  compact?: boolean;
}

export const TransactionTypeToggle: React.FC<TransactionTypeToggleProps> = ({ value, onChange, label, compact = false }) => (
  <div>
    {label && <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>}
    <div className={`grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 ${compact ? 'w-[174px]' : 'w-full'}`} role="group" aria-label="Transaction type">
      <button
        type="button"
        aria-pressed={value === 'expense'}
        onClick={() => onChange('expense')}
        className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 font-bold transition ${compact ? 'min-h-8 text-[11px]' : 'min-h-10 text-sm'} ${value === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-slate-700'}`}
      >
        <ArrowDownRight className="h-4 w-4" />
        Expense
      </button>
      <button
        type="button"
        aria-pressed={value === 'income'}
        onClick={() => onChange('income')}
        className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 font-bold transition ${compact ? 'min-h-8 text-[11px]' : 'min-h-10 text-sm'} ${value === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-slate-700'}`}
      >
        <ArrowUpRight className="h-4 w-4" />
        Income
      </button>
    </div>
  </div>
);
