import React from 'react';
import { WifiOff, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

export const BottomHighlights: React.FC = () => {
  const highlights = [
    {
      title: 'Offline First',
      desc: 'Works without internet',
      icon: WifiOff,
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
    },
    {
      title: 'Secure & Private',
      desc: 'Your data, your control',
      icon: ShieldCheck,
      color: 'bg-teal-500/15 text-teal-400 border-teal-500/20'
    },
    {
      title: 'Sync Across Devices',
      desc: 'Browser + Mobile (PWA)',
      icon: RefreshCw,
      color: 'bg-blue-500/15 text-blue-400 border-blue-500/20'
    },
    {
      title: 'Fast & Lightweight',
      desc: 'Built for performance',
      icon: Zap,
      color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20'
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
