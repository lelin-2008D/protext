import React from 'react';
import { DashboardWelcomeHeader } from '../components/DashboardWelcomeHeader.js';
import { DashboardQuickNLP } from '../components/DashboardQuickNLP.js';
import { DashboardHeroCards } from '../components/DashboardHeroCards.js';
import { IncomeExpenseBarChart } from '../components/IncomeExpenseBarChart.js';
import { DashboardRecentTransactions } from '../components/DashboardRecentTransactions.js';
import { QuickActionsCard } from '../components/QuickActionsCard.js';
import { CategoryDonutChart } from '../components/CategoryDonutChart.js';
import { MonthlyOverviewChart } from '../components/MonthlyOverviewChart.js';
import { BottomHighlights } from '../components/BottomHighlights.js';
import { Transaction } from '../types/index.js';

interface DashboardPageProps {
  onNavigateToHistory: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onOpenStartingBalance: () => void;
  onNavigateToAdd?: () => void;
  onNavigateToFriends?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToHistory,
  onEditTransaction,
  onDeleteTransaction,
  onOpenStartingBalance,
  onNavigateToAdd,
  onNavigateToFriends
}) => {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Greeting & Date Banner */}
      <DashboardWelcomeHeader />

      {/* 2. Natural Language Quick Spend Input */}
      <DashboardQuickNLP />

      {/* 3. Four Top Metric Cards with Sparklines */}
      <DashboardHeroCards onOpenStartingBalance={onOpenStartingBalance} />

      {/* 4. Two-Column Dashboard Analytics & Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Bar Chart & Recent Transactions) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Income vs Expenses Double Bar Chart */}
          <IncomeExpenseBarChart />

          {/* Recent Transactions List with Rich Category Badges */}
          <DashboardRecentTransactions
            onNavigateToHistory={onNavigateToHistory}
            onEditTransaction={onEditTransaction}
            onDeleteTransaction={onDeleteTransaction}
          />
        </div>

        {/* Right Column (Quick Actions, Spending Donut, Monthly Area Overview) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions (Add Expense, Add Income, Transfer) */}
          <QuickActionsCard
            onAddExpense={onNavigateToAdd}
            onAddIncome={onNavigateToAdd}
            onTransferOrFriend={onNavigateToFriends}
          />

          {/* Category Spending Donut Chart with Breakdown Legend */}
          <CategoryDonutChart />

          {/* Monthly Spline Overview Curve */}
          <MonthlyOverviewChart />
        </div>
      </div>

      {/* 5. Bottom Feature Highlights Bar */}
      <BottomHighlights />
    </div>
  );
};

export default DashboardPage;
