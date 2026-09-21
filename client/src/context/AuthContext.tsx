import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { ApiService } from '../lib/api.js';
import { UserProfile } from '../types/index.js';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (val: boolean) => void;
  updatePasswordWithoutCurrent: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

interface StoredSession {
  user: UserProfile;
  isGuest: boolean;
  token: string;
  createdAt: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = 'hisab_auth_session';
const GUEST_STORAGE_KEY = 'hisab_guest_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Check if user landed on app via recovery link in URL hash/search
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        setIsPasswordRecovery(true);
      }
    }

    const initializeAuth = async () => {
      try {
        // 1. Check if Supabase session exists
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const userProfile: UserProfile = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
              };
              setUser(userProfile);
              setIsGuest(false);
              ApiService.setAuthToken(session.access_token);
              saveAuthSession(userProfile, false, session.access_token);
              setLoading(false);
              return;
            }
          } catch (supaErr) {
            console.warn('[AuthContext] Error reading Supabase session:', supaErr);
          }
        }

        // 2. Check for locally persisted authenticated session
        const storedAuth = getStoredAuthSession();
        if (storedAuth && !storedAuth.isGuest && storedAuth.user?.id) {
          setUser(storedAuth.user);
          setIsGuest(false);
          ApiService.setAuthToken(storedAuth.token);
          setLoading(false);
          return;
        }

        // 3. Fallback to guest session
        restoreOrCreateGuestSession();
      } catch (err) {
        console.error('[AuthContext] Initialization error:', err);
        restoreOrCreateGuestSession();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Supabase auth state change listener
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (_event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }

        if (session?.user) {
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
          };
          setUser(userProfile);
          setIsGuest(false);
          ApiService.setAuthToken(session.access_token);
          saveAuthSession(userProfile, false, session.access_token);
        } else if (_event === 'SIGNED_OUT') {
          localStorage.removeItem(AUTH_SESSION_KEY);
          restoreOrCreateGuestSession();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const saveAuthSession = (userProfile: UserProfile, guest: boolean, token: string) => {
    try {
      const sessionData: StoredSession = {
        user: userProfile,
        isGuest: guest,
        token,
        createdAt: Date.now()
      };
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('[AuthContext] Failed to save auth session to localStorage:', e);
    }
  };

  const getStoredAuthSession = (): StoredSession | null => {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;
      const parsed: StoredSession = JSON.parse(raw);
      if (parsed && parsed.user && typeof parsed.isGuest === 'boolean') {
        return parsed;
      }
    } catch {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
    return null;
  };

  const restoreOrCreateGuestSession = () => {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          setUser(parsed);
          setIsGuest(true);
          ApiService.setAuthToken(`mock-user-${parsed.id}`);
          return;
        }
      }
    } catch {
      // ignore
    }

    const guestUser: UserProfile = {
      id: 'guest-' + Math.random().toString(36).substring(2, 8),
      name: 'Guest User',
      email: 'guest@hisab.local'
    };
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    } catch {
      // ignore
    }
    setUser(guestUser);
    setIsGuest(true);
    ApiService.setAuthToken(`mock-user-${guestUser.id}`);
  };

  const signInWithPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    if (!isSupabaseConfigured || !supabase) {
      const mockUser: UserProfile = {
        id: 'user-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '-'),
        email: cleanEmail,
        name: cleanEmail.split('@')[0]
      };
      const token = `mock-user-${mockUser.id}`;
      saveAuthSession(mockUser, false, token);
      setUser(mockUser);
      setIsGuest(false);
      ApiService.setAuthToken(token);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User'
        };
        setUser(userProfile);
        setIsGuest(false);
        if (data.session) {
          ApiService.setAuthToken(data.session.access_token);
          saveAuthSession(userProfile, false, data.session.access_token);
        }
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const signUpWithPassword = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Email and password are required' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return signInWithPassword(email, password);
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name || cleanEmail.split('@')[0]
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          name: name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User'
        };
        setUser(userProfile);
        setIsGuest(false);
        if (data.session) {
          ApiService.setAuthToken(data.session.access_token);
          saveAuthSession(userProfile, false, data.session.access_token);
        }
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign up failed' };
    }
  };

  const signInWithEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      const cleanEmail = email.trim().toLowerCase();
      const mockUser: UserProfile = {
        id: 'user-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '-'),
        email: cleanEmail,
        name: cleanEmail.split('@')[0]
      };
      const token = `mock-user-${mockUser.id}`;
      saveAuthSession(mockUser, false, token);
      setUser(mockUser);
      setIsGuest(false);
      ApiService.setAuthToken(token);
      return { success: true };
    }

    try {
      const redirectUrl = window.location.origin + (window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/');
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const signUpWithEmail = async (email: string, _name?: string): Promise<{ success: boolean; error?: string }> => {
    return signInWithEmail(email);
  };

  const continueAsGuest = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    restoreOrCreateGuestSession();
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('[AuthContext] Supabase signOut error:', e);
    }
    localStorage.removeItem(AUTH_SESSION_KEY);
    restoreOrCreateGuestSession();
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentPassword) {
      return { success: false, error: 'Current password is required.' };
    }
    if (!newPassword) {
      return { success: false, error: 'New password is required.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }
    if (isGuest || !user || !user.email) {
      return { success: false, error: 'You must be signed in with an account to change your password.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      // Offline / Local mock mode
      return { success: true };
    }

    try {
      // 1. Verify current password by authenticating
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (verifyError) {
        return { success: false, error: 'Incorrect current password. Please try again.' };
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return { success: false, error: updateError.message || 'Failed to update password.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to change password.' };
    }
  };

  const resetPasswordForEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      // Offline / mock mode
      return { success: true };
    }

    try {
      const redirectUrl = window.location.origin + (window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/');
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send reset link.' };
    }
  };

  const updatePasswordWithoutCurrent = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword) {
      return { success: false, error: 'New password is required.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      setIsPasswordRecovery(false);
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message || 'Failed to update password.' };
      }

      setIsPasswordRecovery(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        signInWithPassword,
        signUpWithPassword,
        signInWithEmail,
        signUpWithEmail,
        continueAsGuest,
        signOut,
        changePassword,
        resetPasswordForEmail,
        isPasswordRecovery,
        setIsPasswordRecovery,
        updatePasswordWithoutCurrent
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
