import React, { useState } from 'react';
import { TransactionType, Category } from '../types/index.js';
import { X, Plus, Tag } from 'lucide-react';

interface AddCustomCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (category: Omit<Category, 'id' | 'user_id'>) => Promise<void>;
}

const COLOR_PALETTES = [
  '#F97316', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981',
  '#6366F1', '#A855F7', '#EF4444', '#06B6D4', '#F59E0B',
  '#14B8A6', '#84CC16', '#64748B'
];

export const AddCustomCategoryModal: React.FC<AddCustomCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [keywordsStr, setKeywordsStr] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTES[0]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a category name');
      return;
    }

    const keywords = keywordsStr
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    // Always include category name itself as keyword
    if (!keywords.includes(name.trim().toLowerCase())) {
      keywords.push(name.trim().toLowerCase());
    }

    setLoading(true);
    try {
      await onAddCategory({
        name: name.trim(),
        type,
        keywords,
        color: selectedColor,
        icon: 'Tag'
      });
      setName('');
      setKeywordsStr('');
      onClose();
    } catch (err) {
      alert('Failed to add category: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">New Category</h3>
          </div>
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
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Expense Category
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Income Category
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Gym & Fitness, Gaming, Subscriptions"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Keywords (comma-separated for NLP detection)
            </label>
            <input
              type="text"
              value={keywordsStr}
              onChange={e => setKeywordsStr(e.target.value)}
              placeholder="e.g. gym, workout, protein, fitness"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Natural language parser will automatically match these keywords to this category.
            </p>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Category Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Category'}</span>
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
