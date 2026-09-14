import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTransactions } from '../context/TransactionContext.js';
import { PieChart as PieIcon } from 'lucide-react';

export const CategoryPieChart: React.FC = () => {
  const { categoryTotals, totalExpenses } = useTransactions();

  if (categoryTotals.length === 0 || totalExpenses === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-2">
          <PieIcon className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Expense Data Yet</h4>
        <p className="text-xs text-slate-400 mt-0.5">Track your expenses to see spending breakdown</p>
      </div>
    );
  }

  const chartData = categoryTotals.map(c => ({
    name: c.name,
    value: c.amount,
    color: c.color
  }));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Expense Breakdown</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Total: Rs. {totalExpenses.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`Rs. ${Number(value || 0).toLocaleString('en-IN')}`, 'Spent']}
              contentStyle={{
                backgroundColor: '#1E293B',
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category List */}
      <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
        {categoryTotals.map(cat => (
          <div key={cat.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                {cat.name}
              </span>
              <span className="text-[10px] text-slate-400">({cat.count})</span>
            </div>

            <div className="flex items-center gap-2 font-semibold">
              <span className="text-slate-900 dark:text-white">
                Rs. {cat.amount.toLocaleString('en-IN')}
              </span>
              <span className="text-slate-400 text-[11px] w-8 text-right">
                {cat.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
