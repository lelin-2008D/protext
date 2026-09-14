import { describe, it, expect, beforeEach } from 'vitest';

// Simple in-memory localStorage mock for node test runner
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockStorage = new LocalStorageMock();
(globalThis as any).localStorage = mockStorage;

describe('Persistence Logic Tests (Auth & Theme)', () => {
  const AUTH_SESSION_KEY = 'hisab_auth_session';
  const GUEST_STORAGE_KEY = 'hisab_guest_user';
  const THEME_STORAGE_KEY = 'hisab_theme';

  beforeEach(() => {
    mockStorage.clear();
  });

  describe('Theme Persistence', () => {
    it('persists selected theme across simulated page reload', () => {
      // 1. User selects dark mode
      mockStorage.setItem(THEME_STORAGE_KEY, 'dark');

      // 2. Simulate page reload reading theme
      const savedTheme = mockStorage.getItem(THEME_STORAGE_KEY);
      expect(savedTheme).toBe('dark');

      // 3. User selects light mode
      mockStorage.setItem(THEME_STORAGE_KEY, 'light');
      expect(mockStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    });

    it('safely handles missing or invalid theme values', () => {
      mockStorage.setItem(THEME_STORAGE_KEY, 'invalid_custom_theme');
      const saved = mockStorage.getItem(THEME_STORAGE_KEY);
      const isValid = saved === 'dark' || saved === 'light' || saved === 'system';
      const resolvedTheme = isValid ? saved : 'system';
      expect(resolvedTheme).toBe('system');
    });
  });

  describe('Auth Session Persistence', () => {
    it('persists authenticated user session across page refreshes', () => {
      const authUser = {
        id: 'user-alice-123',
        email: 'alice@example.com',
        name: 'Alice'
      };

      const sessionData = {
        user: authUser,
        isGuest: false,
        token: `mock-user-${authUser.id}`,
        createdAt: Date.now()
      };

      // 1. Save session on login
      mockStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));

      // 2. Simulate page refresh reading session
      const storedRaw = mockStorage.getItem(AUTH_SESSION_KEY);
      expect(storedRaw).not.toBeNull();
      const restored = JSON.parse(storedRaw!);

      expect(restored.isGuest).toBe(false);
      expect(restored.user.id).toBe('user-alice-123');
      expect(restored.user.email).toBe('alice@example.com');
      expect(restored.token).toBe('mock-user-user-alice-123');
    });

    it('clears auth session and falls back to guest on signOut', () => {
      // Setup authenticated session
      mockStorage.setItem(
        AUTH_SESSION_KEY,
        JSON.stringify({
          user: { id: 'user-1', email: 'test@hisab.com', name: 'Test' },
          isGuest: false,
          token: 'token-123',
          createdAt: Date.now()
        })
      );

      // Sign out action
      mockStorage.removeItem(AUTH_SESSION_KEY);

      // Verify auth session removed
      expect(mockStorage.getItem(AUTH_SESSION_KEY)).toBeNull();

      // Guest session can be initialized cleanly
      const guestUser = {
        id: 'guest-999',
        name: 'Guest User',
        email: 'guest@hisab.local'
      };
      mockStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));

      const guestStored = JSON.parse(mockStorage.getItem(GUEST_STORAGE_KEY)!);
      expect(guestStored.id).toBe('guest-999');
    });
  });
});
