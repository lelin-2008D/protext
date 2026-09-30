import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useTransactions } from '../context/TransactionContext.js';
import { BarChart3, ChevronDown } from 'lucide-react';

export const IncomeExpenseBarChart: React.FC = () => {
  const { transactions } = useTransactions();
  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');

  // Compute actual daily data purely from user's real transactions
  const generateChartData = () => {
    const days = timeRange === '7days' ? 7 : 30;
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;

      // Filter user's real transactions on this day
      let dayIncome = 0;
      let dayExpense = 0;

      transactions.forEach(tx => {
        if (tx.date && tx.date.startsWith(dateStr)) {
          if (tx.type === 'income') dayIncome += tx.amount;
          else if (tx.type === 'expense') dayExpense += tx.amount;
        }
      });

      result.push({
        name: label,
        income: dayIncome,
        expenses: dayExpense
      });
    }

    return result;
  };

  const chartData = generateChartData();
  const hasAnyActivity = chartData.some(d => d.income > 0 || d.expenses > 0);

  const formatYAxis = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000) {
      return `${Math.round(val / 1000)}k`;
    }
    return `${val}`;
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Income vs Expenses</h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <span>Income</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Expenses</span>
            </span>
          </div>

          {/* Time range selector */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as any)}
              className="appearance-none text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 pl-3 pr-7 py-1.5 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#334155', opacity: 0.2 }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: any, name: string) => [
                `Rs. ${Number(value || 0).toLocaleString('en-IN')}`,
                name === 'income' ? 'Income' : 'Expenses'
              ]}
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
              }}
            />
            <Bar dataKey="income" fill="#14B8A6" radius={[4, 4, 0, 0]} maxBarSize={14} />
            <Bar dataKey="expenses" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>

        {!hasAnyActivity && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-white/40 dark:bg-[#0E1626]/40 backdrop-blur-[1px]">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No transactions recorded for this period</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Your income and expenses will appear here as you track them</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeExpenseBarChart;
