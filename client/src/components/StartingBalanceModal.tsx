import React, { useState, useEffect } from 'react';
import { useTransactions } from '../context/TransactionContext.js';
import { X, Wallet, Check } from 'lucide-react';

interface StartingBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StartingBalanceModal: React.FC<StartingBalanceModalProps> = ({
  isOpen,
  onClose
}) => {
  const { startingBalance, updateStartingBalance, settings } = useTransactions();
  const [balance, setBalance] = useState<number>(startingBalance);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBalance(startingBalance);
  }, [startingBalance]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (balance < 0) {
      alert('Starting balance cannot be negative');
      return;
    }

    setSaving(true);
    try {
      await updateStartingBalance(Number(balance));
      onClose();
    } catch (err) {
      alert('Failed to update starting balance: ' + err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Starting Balance</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Initial Bank or Cash Balance ({settings.currency})
            </label>
            <input
              type="number"
              step="any"
              value={balance}
              onChange={e => setBalance(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              HISAB calculates: <br />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Available Balance = Starting Balance + Total Income - Total Expenses
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Set Balance'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
