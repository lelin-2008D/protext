import React from 'react';
import { Plus, Zap, ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react';

interface QuickActionsCardProps {
  onAddExpense?: () => void;
  onAddIncome?: () => void;
  onTransferOrFriend?: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onAddExpense,
  onAddIncome,
  onTransferOrFriend
}) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h3>
      </div>

      <div className="space-y-2.5">
        {/* Add Expense Button */}
        <button
          onClick={onAddExpense}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#121E32]/70 hover:bg-slate-100 dark:hover:bg-[#152540] border border-slate-200 dark:border-slate-800/80 group transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Add Expense</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Track your spending</p>
            </div>
          </div>
          <TrendingDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
        </button>

        {/* Add Income Button */}
        <button
          onClick={onAddIncome}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#121E32]/70 hover:bg-slate-100 dark:hover:bg-[#152540] border border-slate-200 dark:border-slate-800/80 group transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Add Income</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Record your earnings</p>
            </div>
          </div>
          <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition" />
        </button>

        {/* Transfer / Friend Loan Button */}
        <button
          onClick={onTransferOrFriend}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#121E32]/70 hover:bg-slate-100 dark:hover:bg-[#152540] border border-slate-200 dark:border-slate-800/80 group transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-500 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Transfer</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Move money between accounts</p>
            </div>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition" />
        </button>
      </div>
    </div>
  );
};

export default QuickActionsCard;
