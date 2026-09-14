import React from 'react';
import { Transaction } from '../types/index.js';
import {
  Utensils, Bus, GraduationCap, ShoppingBag, Home, Receipt, Film,
  HeartPulse, Briefcase, Laptop, Gift, RotateCcw, Wallet, MoreHorizontal,
  Edit2, Trash2, CloudOff
} from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Food & Drinks': <Utensils className="w-4 h-4" />,
  'Transport': <Bus className="w-4 h-4" />,
  'Education': <GraduationCap className="w-4 h-4" />,
  'Shopping': <ShoppingBag className="w-4 h-4" />,
  'Home': <Home className="w-4 h-4" />,
  'Bills': <Receipt className="w-4 h-4" />,
  'Entertainment': <Film className="w-4 h-4" />,
  'Health': <HeartPulse className="w-4 h-4" />,
  'Salary': <Briefcase className="w-4 h-4" />,
  'Freelance': <Laptop className="w-4 h-4" />,
  'Gift': <Gift className="w-4 h-4" />,
  'Refund': <RotateCcw className="w-4 h-4" />,
  'Other Income': <Wallet className="w-4 h-4" />,
  'Other': <MoreHorizontal className="w-4 h-4" />
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete
}) => {
  const isIncome = transaction.type === 'income';
  const icon = CATEGORY_ICONS[transaction.category_name] || <MoreHorizontal className="w-4 h-4" />;

  const formatAmount = (val: number) => {
    return `Rs. ${val.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="group flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl hover:border-blue-200 dark:hover:border-slate-700 transition shadow-sm">
      {/* Left Icon & Details */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isIncome
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {transaction.description}
            </h4>
            {transaction._isOfflinePending && (
              <span title="Offline - waiting to sync">
                <CloudOff className="w-3 h-3 text-amber-500 flex-shrink-0" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="font-medium">{transaction.category_name}</span>
            <span>•</span>
            <span>{transaction.date}</span>
          </div>
        </div>
      </div>

      {/* Right Amount & Actions */}
      <div className="flex items-center gap-3">
        <span
          className={`text-sm sm:text-base font-bold whitespace-nowrap ${
            isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {isIncome ? '+' : '-'}{formatAmount(transaction.amount)}
        </span>

        {/* Action Buttons (visible on hover / touch accessible) */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:text-slate-400 transition"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(transaction)}
            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 dark:text-slate-400 transition"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
