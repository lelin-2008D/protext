import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { ApiService } from '../lib/api.js';
import { UserProfile } from '../types/index.js';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  signInWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'hisab_guest_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // 1. Check if Supabase session exists
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
          };
          setUser(userProfile);
          setIsGuest(false);
          ApiService.setAuthToken(session.access_token);
        } else {
          checkGuestSession();
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
          };
          setUser(userProfile);
          setIsGuest(false);
          ApiService.setAuthToken(session.access_token);
        } else {
          checkGuestSession();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Standalone / local sandbox mode
      checkGuestSession();
      setLoading(false);
    }
  }, []);

  const checkGuestSession = () => {
    const saved = localStorage.getItem(GUEST_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setIsGuest(true);
        ApiService.setAuthToken(`mock-user-${parsed.id}`);
      } catch {
        initDefaultGuest();
      }
    } else {
      initDefaultGuest();
    }
  };

  const initDefaultGuest = () => {
    const guestUser: UserProfile = {
      id: 'guest-' + Math.random().toString(36).substring(2, 8),
      name: 'Guest User',
      email: 'guest@hisab.local'
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
    setIsGuest(true);
    ApiService.setAuthToken(`mock-user-${guestUser.id}`);
  };

  const signInWithEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      // Mock login for demo mode
      const mockUser: UserProfile = {
        id: 'user-' + email.replace(/[^a-zA-Z0-9]/g, '-'),
        email,
        name: email.split('@')[0]
      };
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      setIsGuest(false);
      ApiService.setAuthToken(`mock-user-${mockUser.id}`);
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
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
    initDefaultGuest();
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(GUEST_STORAGE_KEY);
    initDefaultGuest();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        signInWithEmail,
        signUpWithEmail,
        continueAsGuest,
        signOut
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
