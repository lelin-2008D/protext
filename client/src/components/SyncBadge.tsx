import React from 'react';
import { useSync } from '../context/SyncContext.js';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

export const SyncBadge: React.FC = () => {
  const { syncStatus, pendingCount, triggerSync } = useSync();

  const getStatusDisplay = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          text: 'Synced',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        };
      case 'syncing':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />,
          text: 'Syncing...',
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
        };
      case 'waiting':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          text: `Waiting to sync (${pendingCount})`,
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
        };
      case 'offline':
      default:
        return {
          icon: <CloudOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />,
          text: pendingCount > 0 ? `Offline (${pendingCount} pending)` : 'Offline',
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <button
      onClick={() => triggerSync()}
      title="Click to manually synchronize"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-95 ${status.bg}`}
    >
      {status.icon}
      <span>{status.text}</span>
    </button>
  );
};
