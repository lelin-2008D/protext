import React from 'react';
import { WifiOff, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

export const BottomHighlights: React.FC = () => {
  const highlights = [
    {
      title: 'Offline First',
      desc: 'Works without internet',
      icon: WifiOff,
      color: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-500/20'
    },
    {
      title: 'Secure & Private',
      desc: 'Your data, your control',
      icon: ShieldCheck,
      color: 'bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-slate-500/20'
    },
    {
      title: 'Sync Across Devices',
      desc: 'Browser + Mobile (PWA)',
      icon: RefreshCw,
      color: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-blue-500/20'
    },
    {
      title: 'Fast & Lightweight',
      desc: 'Built for performance',
      icon: Zap,
      color: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
      {highlights.map((h, i) => {
        const Icon = h.icon;
        return (
          <div
            key={i}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 shadow-sm"
          >
            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${h.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{h.title}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{h.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BottomHighlights;
