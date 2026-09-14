import React, { useState, useEffect } from 'react';
import { Transaction, Category, TransactionType } from '../types/index.js';
import { X, Check } from 'lucide-react';

interface EditModalProps {
  transaction: Transaction | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Transaction>) => Promise<void>;
}

export const EditModal: React.FC<EditModalProps> = ({
  transaction,
  categories,
  isOpen,
  onClose,
  onSave
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState('Other');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount);
      setDescription(transaction.description);
      setCategoryName(transaction.category_name);
      setDate(transaction.date);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    setSaving(true);
    try {
      const matchedCat = categories.find(c => c.name === categoryName);
      await onSave(transaction.id, {
        type,
        amount: Number(amount),
        description: description.trim(),
        category_name: categoryName,
        category_id: matchedCat?.id || null,
        date
      });
      onClose();
    } catch (err) {
      alert('Failed to update: ' + err);
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Transaction</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const exp = categories.filter(c => c.type === 'expense');
                if (exp.length > 0) setCategoryName(exp[0].name);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                const inc = categories.filter(c => c.type === 'income');
                if (inc.length > 0) setCategoryName(inc[0].name);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Amount (Rs.)
            </label>
            <input
              type="number"
              step="any"
              value={amount || ''}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filteredCategories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
