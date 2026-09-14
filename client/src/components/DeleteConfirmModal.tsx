import React from 'react';
import { Transaction } from '../types/index.js';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onConfirmDelete
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Delete Transaction?
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-200">"{transaction.description}"</span> (Rs. {transaction.amount})? This will update your balances.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await onConfirmDelete(transaction.id);
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
