import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { LineChart, ChevronDown } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext.js';

export const MonthlyOverviewChart: React.FC = () => {
  const { transactions } = useTransactions();
  const [selectedMonth, setSelectedMonth] = useState('current');

  // Compute actual monthly progression from user's real transactions
  const generateMonthlyData = () => {
    const points = [1, 5, 10, 15, 20, 25, 30];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    return points.map(day => {
      let cumulativeIncome = 0;
      let cumulativeExpense = 0;

      transactions.forEach(tx => {
        if (tx.date) {
          const d = new Date(tx.date);
          if (d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() <= day) {
            if (tx.type === 'income') cumulativeIncome += tx.amount;
            else if (tx.type === 'expense') cumulativeExpense += tx.amount;
          }
        }
      });

      return {
        day: `${day}`,
        income: cumulativeIncome,
        expenses: cumulativeExpense
      };
    });
  };

  const chartData = generateMonthlyData();
  const hasAnyActivity = chartData.some(d => d.income > 0 || d.expenses > 0);

  const formatYAxis = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return `${val}`;
  };

  const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
            <LineChart className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Overview</h3>
        </div>

        {/* Month Selector */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="appearance-none text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 pl-3 pr-7 py-1 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="current">{currentMonthLabel}</option>
            <option value="prev">Last Month</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1.5 pointer-events-none" />
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-44 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#334155', opacity: 0.2 }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
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
                borderRadius: '10px',
                color: '#fff',
                fontSize: '11px'
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#incomeGrad)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#expenseGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {!hasAnyActivity && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-white/40 dark:bg-[#0E1626]/40 backdrop-blur-[1px]">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No monthly data yet</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Track your money to see monthly trends</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Income</span>
        </span>
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Expenses</span>
        </span>
      </div>
    </div>
  );
};

export default MonthlyOverviewChart;
