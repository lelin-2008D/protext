import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTransactions } from '../context/TransactionContext.js';
import { useFriendMoney } from '../context/FriendMoneyContext.js';

interface PreloaderProps {
  /**
   * Optional manual override for loading state (defaults to real app loading states)
   */
  isLoading?: boolean;
  /**
   * Minimum time to display the preloader in ms so entrance animation completes smoothly (default 750ms)
   */
  minDuration?: number;
  /**
   * Callback fired when preloader finishes and unmounts
   */
  onComplete?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({
  isLoading: manualLoading,
  minDuration = 750,
  onComplete
}) => {
  // Connect to real application initialization states
  const { loading: authLoading } = useAuth();
  const { loading: txLoading } = useTransactions();
  const { loading: friendLoading } = useFriendMoney();

  // App is ready when all core services have initialized
  const isAppReady = manualLoading !== undefined
    ? !manualLoading
    : !authLoading && !txLoading && !friendLoading;

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Guarantee minimum duration for graceful entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  // Handle smooth exit transition when app is ready and minimum display time has passed
  useEffect(() => {
    if (isAppReady && minTimeElapsed && !isExiting) {
      setIsExiting(true);

      const exitTimer = setTimeout(() => {
        setIsMounted(false);
        if (onComplete) {
          onComplete();
        }
      }, 450); // Matches exit transition duration

      return () => clearTimeout(exitTimer);
    }
  }, [isAppReady, minTimeElapsed, isExiting, onComplete]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!isExiting}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white transition-opacity duration-500 ease-out bg-slate-50/95 dark:bg-[#0B0F19]/95 backdrop-blur-md ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Central Card Container: Responsive clamp bounds, clean border & subtle shadow */}
      <div
        className={`w-full max-w-[520px] min-h-[260px] sm:min-h-[300px] mx-auto p-7 sm:p-10 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl shadow-blue-500/5 dark:shadow-black/60 flex flex-col items-center justify-center text-center transition-all duration-400 ease-out ${
          isExiting
            ? 'scale-[0.97] opacity-0 -translate-y-1'
            : 'scale-100 opacity-100 translate-y-0'
        }`}
      >
        {/* 1. HISAB Logo: Rounded square, thin border, entrance reveal and subtle glow */}
        <div className="relative mb-5 sm:mb-6">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[22px] bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 flex items-center justify-center text-white border border-blue-400/30 shadow-lg shadow-blue-500/25 transition-transform ${
              isExiting ? 'scale-95 opacity-0' : 'animate-preloader-logo'
            }`}
          >
            {/* Iconic stylized "H" with subtle Rupee crossbar accent */}
            <svg
              viewBox="0 0 100 100"
              className="w-8 h-8 sm:w-10 sm:h-10 fill-none stroke-current"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M30 22 L30 78" />
              <path d="M70 22 L70 78" />
              <path d="M30 50 L70 50" />
              <path d="M22 36 L78 36" strokeWidth="6.5" strokeOpacity="0.75" />
            </svg>
          </div>
        </div>

        {/* 2. HISAB Brand Name: Appears with staggered slide-up and letter spacing */}
        <div
          className={`space-y-1 sm:space-y-1.5 transition-all ${
            isExiting ? 'opacity-0 scale-95' : 'animate-preloader-text'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="font-extrabold text-2xl sm:text-3xl tracking-[0.2em] text-slate-900 dark:text-white uppercase pl-[0.2em]">
              HISAB
            </h1>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
              NP
            </span>
          </div>
          <p className="text-[11px] sm:text-xs font-medium tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            Smart Money Tracker
          </p>
        </div>

        {/* 3. Minimal Loading Indicator Bar */}
        <div
          className={`mt-6 sm:mt-8 w-36 sm:w-48 transition-all ${
            isExiting ? 'opacity-0' : 'animate-preloader-bar'
          }`}
        >
          <div className="h-1 sm:h-1.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-blue-600 dark:via-blue-400 dark:to-blue-500 rounded-full animate-preloader-progress" />
          </div>

          <p className="mt-2.5 text-[10px] sm:text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500 animate-pulse">
            Organizing your finances...
          </p>
        </div>

        {/* Screen Reader status */}
        <span className="sr-only">Loading HISAB Personal Money Tracker...</span>
      </div>
    </div>
  );
};

export default Preloader;
