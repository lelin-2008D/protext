import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTransactions } from '../context/TransactionContext.js';
import { PieChart as PieIcon } from 'lucide-react';

export const CategoryDonutChart: React.FC = () => {
  const { categoryTotals, totalExpenses, settings } = useTransactions();

  const formatCurrency = (val: number) => {
    return `${settings.currency === 'NPR' ? 'Rs.' : settings.currency} ${val.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  const hasData = categoryTotals.length > 0 && totalExpenses > 0;

  // Chart data purely from user transactions
  const chartData = hasData
    ? categoryTotals.map(c => ({
        name: c.name,
        value: c.amount,
        color: c.color || '#3B82F6',
        percentage: c.percentage
      }))
    : [{ name: 'No Expenses', value: 1, color: '#334155', percentage: 0 }];

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <PieIcon className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Spending by Category</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Donut Chart with Center Text */}
        <div className="sm:col-span-6 relative h-48 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={hasData ? 4 : 0}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {hasData && (
                <Tooltip
                  formatter={(value: any) => [`Rs. ${Number(value || 0).toLocaleString('en-IN')}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
              {formatCurrency(totalExpenses)}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Expense
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="sm:col-span-6 space-y-2 text-xs">
          {hasData ? (
            categoryTotals.slice(0, 5).map(cat => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{cat.percentage}%</span>
              </div>
            ))
          ) : (
            <div className="py-4 text-slate-400 dark:text-slate-500 text-center sm:text-left">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No expenses recorded yet</p>
              <p className="text-[11px] mt-0.5">Track your expenses to see category breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDonutChart;
