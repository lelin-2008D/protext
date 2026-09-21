import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Wallet, Mail, Lock, User, ArrowRight, Eye, EyeOff, X, CheckCircle } from 'lucide-react';

interface AuthPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthPageProps> = ({ isOpen, onClose }) => {
  const { signInWithPassword, signUpWithPassword, continueAsGuest, resetPasswordForEmail } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await resetPasswordForEmail(cleanEmail);
        if (res.success) {
          setSuccessMsg('Password reset link sent! Please check your email inbox.');
        } else {
          setErrorMsg(res.error || 'Failed to send reset link');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'signin') {
        const res = await signInWithPassword(cleanEmail, password);
        if (res.success) {
          setSuccessMsg('Logged in successfully!');
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          setErrorMsg(res.error || 'Invalid email or password');
        }
      } else {
        const res = await signUpWithPassword(cleanEmail, password, name.trim());
        if (res.success) {
          setSuccessMsg('Account created successfully!');
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          setErrorMsg(res.error || 'Failed to create account');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'forgot') return 'Reset Password';
    if (mode === 'signin') return 'Sign In to HISAB';
    return 'Create HISAB Account';
  };

  const getSubtitle = () => {
    if (mode === 'forgot') return 'Enter your email to receive a password reset link.';
    if (mode === 'signin') return 'Access and synchronize your transactions across all devices.';
    return 'Start tracking and cloud syncing your money seamlessly.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
          <Wallet className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {getTitle()}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {getSubtitle()}
        </p>

        {/* Tab switch (only in signin/signup modes) */}
        {mode !== 'forgot' && (
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {successMsg ? (
          <div className="py-6 space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">{successMsg}</p>
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setSuccessMsg('');
                  setErrorMsg('');
                }}
                className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to Sign In
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name (optional)"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Create password (min 6 chars)' : 'Password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {mode === 'signin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <p className="text-xs text-rose-500 text-left font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
            >
              <span>
                {loading
                  ? mode === 'forgot'
                    ? 'Sending Link...'
                    : mode === 'signin'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'forgot'
                  ? 'Send Reset Link'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {mode === 'forgot' ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
                >
                  ← Back to Sign In
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    continueAsGuest();
                    onClose();
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
                >
                  Continue using Offline / Guest Mode
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
