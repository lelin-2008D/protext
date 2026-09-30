import React from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const DashboardWelcomeHeader: React.FC = () => {
  const { user } = useAuth();

  const now = new Date();
  const hour = now.getHours();

  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17) {
    greeting = 'Good evening';
  }

  const rawName = user?.name
    ? user.name.split(' ')[0]
    : user?.email
    ? user.email.split('@')[0]
    : 'Lelin';

  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const dayFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long'
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Greeting Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here&apos;s your financial overview for today.
        </p>
      </div>

      {/* Date Card on Right */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 shadow-sm text-slate-800 dark:text-slate-200">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="text-right sm:text-left">
          <p className="text-xs font-bold leading-tight">{dateFormatted}</p>
          <p className="text-[10px] text-slate-400 leading-tight">{dayFormatted}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardWelcomeHeader;
