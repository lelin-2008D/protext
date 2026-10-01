import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTransactions } from '../context/TransactionContext.js';
import { useFriendMoney } from '../context/FriendMoneyContext.js';
import { Logo } from './Logo.js';

interface PreloaderProps {
  /**
   * Optional manual override for loading state (defaults to real app loading states)
   */
  isLoading?: boolean;
  /**
   * Minimum time to display the preloader in ms so entrance animation completes smoothly (default 850ms)
   */
  minDuration?: number;
  /**
   * Callback fired when preloader finishes and unmounts
   */
  onComplete?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({
  isLoading: manualLoading,
  minDuration = 850,
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

  // Guarantee minimum duration for graceful entrance and smooth progress
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
      }, 500); // Matches exit transition duration

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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 selection:bg-blue-500 selection:text-white transition-opacity duration-500 ease-out bg-slate-50/95 dark:bg-[#050816]/95 backdrop-blur-xl ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dynamic Ambient Radiant Glow behind central card */}
      <div
        className={`absolute w-[280px] sm:w-[480px] h-[280px] sm:h-[380px] bg-blue-500/15 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          isExiting ? 'opacity-0 scale-95' : 'animate-preloader-ambient'
        }`}
      />

      {/* Central Card Container: Enlarged dimensions, elegant rounded bounds, clean border & elevation */}
      <div
        className={`relative w-full max-w-[620px] min-h-[340px] sm:min-h-[440px] mx-auto p-8 sm:p-14 rounded-3xl sm:rounded-[36px] bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-blue-500/10 dark:shadow-black/70 flex flex-col items-center justify-center text-center transition-all duration-500 ease-out ${
          isExiting
            ? 'scale-[0.96] opacity-0 -translate-y-2'
            : 'scale-100 opacity-100 translate-y-0'
        }`}
      >
        {/* 1. HISAB Logo: Enlarged square emblem, subtle floating motion, shine gleam and glow */}
        <div className="relative mb-6 sm:mb-8">
          <div
            className={`relative overflow-hidden w-20 h-20 sm:w-28 sm:h-28 rounded-[24px] sm:rounded-[32px] bg-slate-900/90 dark:bg-slate-900 border-2 border-red-500/30 flex items-center justify-center p-3 sm:p-4 shadow-xl transition-all ${
              isExiting ? 'scale-95 opacity-0' : 'animate-preloader-logo'
            }`}
          >
            {/* Shimmer / light sweep reflection */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-preloader-shine" />

            <Logo size="100%" className="w-full h-full" />
          </div>
        </div>

        {/* 2. HISAB Brand Name & Tagline: Enlarged scale, crisp typography */}
        <div
          className={`space-y-1.5 sm:space-y-2.5 transition-all ${
            isExiting ? 'opacity-0 scale-95' : 'animate-preloader-text'
          }`}
        >
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            <h1 className="font-black text-3xl sm:text-4xl md:text-5xl tracking-[0.22em] text-slate-900 dark:text-white uppercase pl-[0.22em] leading-tight drop-shadow-sm">
              HISAB
            </h1>
            <span className="text-xs sm:text-sm font-extrabold uppercase px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-blue-100 dark:bg-blue-950/90 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm">
              NP
            </span>
          </div>
          <p className="text-xs sm:text-sm md:text-base font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase animate-preloader-subtitle">
            Smart Money Tracker
          </p>
        </div>

        {/* 3. Smooth Loading Indicator Bar: Enlarged length and height with glowing head */}
        <div
          className={`mt-7 sm:mt-10 w-56 sm:w-72 md:w-84 transition-all ${
            isExiting ? 'opacity-0' : 'animate-preloader-bar'
          }`}
        >
          <div className="h-2 sm:h-2.5 w-full bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute inset-y-0 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-white dark:from-blue-600 dark:via-blue-400 dark:to-white shadow-[0_0_12px_rgba(96,165,250,0.8)] animate-preloader-progress-smooth" />
          </div>

          <p className="mt-3 text-xs sm:text-sm font-medium tracking-wider text-slate-400 dark:text-slate-500 animate-pulse">
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
