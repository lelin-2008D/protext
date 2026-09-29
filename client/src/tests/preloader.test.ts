import { describe, it, expect } from 'vitest';

describe('Preloader Lifecycle & Logic', () => {
  it('should compute app ready state correctly based on core context loading states', () => {
    // When any core context is loading, app is NOT ready
    const checkIsAppReady = (authLoading: boolean, txLoading: boolean, friendLoading: boolean) => {
      return !authLoading && !txLoading && !friendLoading;
    };

    expect(checkIsAppReady(true, false, false)).toBe(false);
    expect(checkIsAppReady(false, true, false)).toBe(false);
    expect(checkIsAppReady(false, false, true)).toBe(false);
    expect(checkIsAppReady(true, true, true)).toBe(false);

    // When all are resolved, app is ready
    expect(checkIsAppReady(false, false, false)).toBe(true);
  });

  it('should guarantee minimum aesthetic duration before triggering exit animation', () => {
    const minDuration = 750;
    const startTime = 1000;

    const shouldExit = (currentTime: number, isAppReady: boolean) => {
      const elapsed = currentTime - startTime;
      return isAppReady && elapsed >= minDuration;
    };

    // Ready immediately at 100ms: must wait for minDuration
    expect(shouldExit(1100, true)).toBe(false);
    // Still not ready at 800ms: must wait
    expect(shouldExit(1800, false)).toBe(false);
    // Ready and elapsed >= 750ms: triggers exit
    expect(shouldExit(1800, true)).toBe(true);
  });
});
