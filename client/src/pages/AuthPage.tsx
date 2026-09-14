import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Wallet, Mail, ArrowRight, CheckCircle, X } from 'lucide-react';

interface AuthPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthPageProps> = ({ isOpen, onClose }) => {
  const { signInWithEmail, continueAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await signInWithEmail(email.trim());
      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Failed to send magic link');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
          <Wallet className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Sync Your HISAB Account
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
          Sign in to synchronize your expenses and income across iPhone, laptop, and all your devices.
        </p>

        {submitted ? (
          <div className="py-6 space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">Magic Link Sent!</p>
            <p className="text-xs text-slate-500">Check your inbox to complete sign in.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 text-left font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending link...' : 'Continue with Email'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

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
          </form>
        )}
      </div>
    </div>
  );
};
