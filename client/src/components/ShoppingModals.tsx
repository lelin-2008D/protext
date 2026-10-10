import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingList, ShoppingItem, Category } from '../types/index.js';
import {
  X, ShoppingBag, CheckCircle2, AlertTriangle, Trash2,
  Plus, RotateCcw
} from 'lucide-react';

export const NEPAL_SHOPPING_UNITS = [
  'piece',
  'kg',
  'g',
  'litre',
  'ml',
  'packet',
  'dozen',
  'bundle',
  'custom'
] as const;

export const formatNPR = (val: number): string => {
  return `Rs. ${val.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

// ─────────────────────────────────────────────────────────────
// 1. CREATE LIST MODAL
// ─────────────────────────────────────────────────────────────
interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description?: string) => Promise<any>;
}

export const CreateListModal: React.FC<CreateListModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('List title is required');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await onSubmit(title.trim(), description.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create list');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Shopping List</h3>
              <p className="text-xs text-slate-500">Plan items before shopping in Nepal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              List Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Weekly Groceries, Bhatbhateni, Dashain Supplies"
              maxLength={100}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Vegetables from Ason Bazar, dairy, household items"
              rows={2}
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white finance-gradient-action hover:opacity-95 disabled:opacity-50 transition shadow-md shadow-blue-500/20"
            >
              {submitting ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 2. EDIT LIST MODAL
// ─────────────────────────────────────────────────────────────
interface EditListModalProps {
  isOpen: boolean;
  list: ShoppingList | null;
  onClose: () => void;
  onSubmit: (id: string, updates: { title: string; description?: string }) => Promise<any>;
}

export const EditListModal: React.FC<EditListModalProps> = ({ isOpen, list, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (list && isOpen) {
      setTitle(list.title || '');
      setDescription(list.description || '');
      setError('');
    }
  }, [list, isOpen]);

  if (!isOpen || !list) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('List title is required');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await onSubmit(list.id, { title: title.trim(), description: description.trim() || undefined });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update list');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Shopping List</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              List Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white finance-gradient-action hover:opacity-95 disabled:opacity-50 transition shadow-md shadow-blue-500/20"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. DELETE LIST MODAL (With explicit choice regarding linked expenses)
// ─────────────────────────────────────────────────────────────
interface DeleteListModalProps {
  isOpen: boolean;
  list: ShoppingList | null;
  purchasedCount: number;
  totalSpent: number;
  onClose: () => void;
  onConfirm: (id: string, deleteLinkedTransactions: boolean) => Promise<void>;
}

export const DeleteListModal: React.FC<DeleteListModalProps> = ({
  isOpen,
  list,
  purchasedCount,
  totalSpent,
  onClose,
  onConfirm
}) => {
  const [deleteTransactions, setDeleteTransactions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !list) return null;

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      await onConfirm(list.id, deleteTransactions);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Shopping List?</h3>
            <p className="text-xs text-slate-500">{list.title}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Are you sure you want to delete this shopping list and its items? This action cannot be undone.
        </p>

        {purchasedCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                This list has <strong>{purchasedCount} purchased items</strong> totaling <strong>{formatNPR(totalSpent)}</strong> already recorded in your Transactions list.
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={deleteTransactions}
                onChange={e => setDeleteTransactions(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Also remove the {purchasedCount} corresponding expense records from my main Transaction List
              </span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
              (Leave unchecked to safely keep your historical expense records and balances intact)
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition shadow-md shadow-rose-600/20"
          >
            {deleting ? 'Deleting...' : 'Delete List'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 4. ADD ITEM MODAL
// ─────────────────────────────────────────────────────────────
interface AddItemModalProps {
  isOpen: boolean;
  listId: string;
  categories: Category[];
  onClose: () => void;
  onSubmit: (item: {
    name: string;
    quantity: number;
    unit?: string;
    estimated_unit_price?: number | null;
    notes?: string;
    category_name?: string;
  }) => Promise<any>;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  listId: _listId,
  categories,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<string>('piece');
  const [customUnit, setCustomUnit] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [categoryName, setCategoryName] = useState('Shopping');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setQuantity('1');
      setUnit('piece');
      setCustomUnit('');
      setEstimatedPrice('');
      setCategoryName('Shopping');
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedUnit = unit === 'custom' ? customUnit.trim() : unit;

  const calculatedEstTotal = useMemo(() => {
    const q = parseFloat(quantity);
    const p = parseFloat(estimatedPrice);
    if (!isNaN(q) && q > 0 && !isNaN(p) && p >= 0) {
      return Math.round(q * p * 100) / 100;
    }
    return null;
  }, [quantity, estimatedPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }
    const q = parseFloat(quantity);
    if (isNaN(q) || q <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    const estP = estimatedPrice.trim() !== '' ? parseFloat(estimatedPrice) : null;
    if (estP !== null && (isNaN(estP) || estP < 0)) {
      setError('Estimated price cannot be negative');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit({
        name: name.trim(),
        quantity: q,
        unit: resolvedUnit || undefined,
        estimated_unit_price: estP,
        notes: notes.trim() || undefined,
        category_name: categoryName
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Shopping Item</h3>
              <p className="text-xs text-slate-500">Prices can be estimated or added later while shopping</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Basmati Rice, Mustard Oil, Dettol Soap"
              maxLength={100}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Quantity *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Unit (Nepal Common)
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NEPAL_SHOPPING_UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {unit === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Custom Unit
              </label>
              <input
                type="text"
                value={customUnit}
                onChange={e => setCustomUnit(e.target.value)}
                placeholder="e.g. dharo, bora, bora"
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Estimated Unit Price (Rs.)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={estimatedPrice}
                onChange={e => setEstimatedPrice(e.target.value)}
                placeholder="Leave blank if unknown"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.filter(c => c.type === 'expense').map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {calculatedEstTotal !== null && (
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between text-xs">
              <span className="text-blue-700 dark:text-blue-300 font-medium">Estimated Item Total:</span>
              <span className="text-blue-900 dark:text-blue-100 font-bold">{formatNPR(calculatedEstTotal)}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Brand preference, 25kg bag, red color"
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white finance-gradient-action hover:opacity-95 disabled:opacity-50 transition shadow-md shadow-blue-500/20"
            >
              {submitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 5. EDIT ITEM MODAL
// ─────────────────────────────────────────────────────────────
interface EditItemModalProps {
  isOpen: boolean;
  item: ShoppingItem | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (id: string, updates: Partial<ShoppingItem>) => Promise<any>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  item,
  categories,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<string>('piece');
  const [customUnit, setCustomUnit] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [actualPrice, setActualPrice] = useState('');
  const [categoryName, setCategoryName] = useState('Shopping');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item && isOpen) {
      setName(item.name || '');
      setQuantity(String(item.quantity || 1));
      if (item.unit && NEPAL_SHOPPING_UNITS.includes(item.unit as any)) {
        setUnit(item.unit);
        setCustomUnit('');
      } else if (item.unit) {
        setUnit('custom');
        setCustomUnit(item.unit);
      } else {
        setUnit('piece');
        setCustomUnit('');
      }
      setEstimatedPrice(item.estimated_unit_price != null ? String(item.estimated_unit_price) : '');
      setActualPrice(item.actual_unit_price != null ? String(item.actual_unit_price) : '');
      setCategoryName(item.category_name || 'Shopping');
      setNotes(item.notes || '');
      setError('');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const resolvedUnit = unit === 'custom' ? customUnit.trim() : unit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }
    const q = parseFloat(quantity);
    if (isNaN(q) || q <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    const estP = estimatedPrice.trim() !== '' ? parseFloat(estimatedPrice) : null;
    if (estP !== null && (isNaN(estP) || estP < 0)) {
      setError('Estimated price cannot be negative');
      return;
    }

    const actP = actualPrice.trim() !== '' ? parseFloat(actualPrice) : null;
    if (actP !== null && (isNaN(actP) || actP < 0)) {
      setError('Actual price cannot be negative');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(item.id, {
        name: name.trim(),
        quantity: q,
        unit: resolvedUnit || null,
        estimated_unit_price: estP,
        actual_unit_price: actP,
        category_name: categoryName,
        notes: notes.trim() || null
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Shopping Item</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {item.status === 'purchased' && item.transaction_id && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <span className="font-bold">Note:</span> This item is already marked as purchased. Updating quantity or actual price will automatically update the linked expense transaction.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Quantity *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NEPAL_SHOPPING_UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {unit === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Custom Unit
              </label>
              <input
                type="text"
                value={customUnit}
                onChange={e => setCustomUnit(e.target.value)}
                placeholder="e.g. dharo, packet"
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Estimated Unit Price (Rs.)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={estimatedPrice}
                onChange={e => setEstimatedPrice(e.target.value)}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Actual Unit Price (Rs.)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={actualPrice}
                onChange={e => setActualPrice(e.target.value)}
                placeholder="Entered while shopping"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.filter(c => c.type === 'expense').map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Brand preference"
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white finance-gradient-action hover:opacity-95 disabled:opacity-50 transition shadow-md shadow-blue-500/20"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 6. MARK PURCHASED MODAL (Purchase Workflow Review & Confirmation)
// ─────────────────────────────────────────────────────────────
interface MarkPurchasedModalProps {
  isOpen: boolean;
  item: ShoppingItem | null;
  categories: Category[];
  onClose: () => void;
  onConfirm: (params: {
    itemId: string;
    actual_unit_price: number;
    quantity: number;
    category_name: string;
    purchase_date: string;
  }) => Promise<any>;
}

export const MarkPurchasedModal: React.FC<MarkPurchasedModalProps> = ({
  isOpen,
  item,
  categories,
  onClose,
  onConfirm
}) => {
  const [actualPrice, setActualPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [categoryName, setCategoryName] = useState('Shopping');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item && isOpen) {
      setQuantity(String(item.quantity || 1));
      // Pre-fill actual price with existing actual price or estimated price
      const prefillPrice = item.actual_unit_price != null
        ? String(item.actual_unit_price)
        : (item.estimated_unit_price != null ? String(item.estimated_unit_price) : '');
      setActualPrice(prefillPrice);
      setCategoryName(item.category_name || 'Shopping');
      setPurchaseDate(item.purchase_date || new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const parsedQty = parseFloat(quantity) || 0;
  const parsedPrice = parseFloat(actualPrice) || 0;
  const calculatedTotal = parsedQty > 0 && parsedPrice >= 0
    ? Math.round(parsedQty * parsedPrice * 100) / 100
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualPrice.trim() === '' || isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid actual unit price (0 or greater).');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onConfirm({
        itemId: item.id,
        actual_unit_price: parsedPrice,
        quantity: parsedQty,
        category_name: categoryName,
        purchase_date: purchaseDate
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete purchase');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Purchase</h3>
              <p className="text-xs text-slate-500">Confirm price to add expense transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Title Pill */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
            <p className="text-xs text-slate-500">
              {item.unit ? `Unit: ${item.unit}` : 'Standard piece'}
              {item.estimated_unit_price != null && ` • Est. Rs. ${item.estimated_unit_price}`}
            </p>
          </div>
          {item.notes && (
            <span className="text-[11px] text-slate-400 italic max-w-[140px] truncate">{item.notes}</span>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Quantity Bought *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Actual Unit Price (Rs.) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={actualPrice}
                onChange={e => setActualPrice(e.target.value)}
                placeholder="e.g. 80"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Realtime Calculated Total Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                Calculated Expense Total:
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {parsedQty} × Rs. {parsedPrice}
              </p>
            </div>
            <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {formatNPR(calculatedTotal)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Expense Category
              </label>
              <select
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.filter(c => c.type === 'expense').map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Confirming will automatically create an expense of <strong>{formatNPR(calculatedTotal)}</strong> in your main HISAB Transaction List and update your balance.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || actualPrice.trim() === '' || isNaN(parsedPrice) || parsedPrice < 0}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-md shadow-emerald-600/20"
            >
              {submitting ? 'Recording...' : `Confirm & Record ${formatNPR(calculatedTotal)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 7. UNDO PURCHASE MODAL
// ─────────────────────────────────────────────────────────────
interface UndoPurchaseModalProps {
  isOpen: boolean;
  item: ShoppingItem | null;
  onClose: () => void;
  onConfirm: (itemId: string) => Promise<void>;
}

export const UndoPurchaseModal: React.FC<UndoPurchaseModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const totalSpent = Math.round(Number(item.quantity || 1) * Number(item.actual_unit_price || 0) * 100) / 100;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirm(item.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Undo Purchase?</h3>
            <p className="text-xs text-slate-500">{item.name}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          This will revert <strong>{item.name}</strong> back to the pending shopping list and remove the linked <strong>{formatNPR(totalSpent)}</strong> expense transaction from your HISAB history.
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your entered unit price (Rs. {item.actual_unit_price}) will be preserved as a draft for when you purchase it later.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition shadow-md shadow-amber-600/20"
          >
            {submitting ? 'Undoing...' : 'Confirm & Undo Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
};
