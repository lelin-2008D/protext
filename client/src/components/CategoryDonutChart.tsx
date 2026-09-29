import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTransactions } from '../context/TransactionContext.js';
import { PieChart as PieIcon } from 'lucide-react';

export const CategoryDonutChart: React.FC = () => {
  const { categoryTotals, totalExpenses, settings } = useTransactions();

  const formatCurrency = (val: number) => {
    return `${settings.currency === 'NPR' ? 'Rs.' : settings.currency} ${val.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  // Demo fallback categories if user hasn't recorded expense transactions yet
  const defaultCategories = [
    { name: 'Food', amount: 7800, percentage: 38, color: '#F97316' },
    { name: 'Transport', amount: 4500, percentage: 22, color: '#3B82F6' },
    { name: 'Utilities', amount: 3100, percentage: 15, color: '#8B5CF6' },
    { name: 'Education', amount: 2050, percentage: 10, color: '#F59E0B' },
    { name: 'Others', amount: 3050, percentage: 15, color: '#06B6D4' }
  ];

  const hasData = categoryTotals.length > 0 && totalExpenses > 0;
  const displayTotals = hasData ? categoryTotals : defaultCategories;
  const displayTotalAmount = hasData ? totalExpenses : 20500;

  const chartData = displayTotals.map(c => ({
    name: c.name,
    value: c.amount,
    color: c.color || '#3B82F6',
    percentage: c.percentage
  }));

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
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
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
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[13px] font-black text-slate-900 dark:text-white leading-tight">
              {formatCurrency(displayTotalAmount)}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Expense
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="sm:col-span-6 space-y-2 text-xs">
          {chartData.slice(0, 5).map(cat => (
            <div key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{cat.name}</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">{cat.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryDonutChart;
