import React, { useState } from 'react';
import { Zap, Plus } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext.js';
import { useSync } from '../context/SyncContext.js';
import { parseLocalInput } from '../lib/parserLocal.js';
import { ApiService } from '../lib/api.js';
import { ConfirmationCard } from './ConfirmationCard.js';
import { ParsedTransaction, TransactionType } from '../types/index.js';
import { applyPreferredType } from '../lib/transactionInput.js';
import { TransactionTypeToggle } from './TransactionTypeToggle.js';

export const DashboardQuickNLP: React.FC = () => {
  const { categories, addTransaction } = useTransactions();
  const { isOnline } = useSync();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedTransaction | null>(null);
  const [preferredType, setPreferredType] = useState<TransactionType>('expense');

  const handleSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const raw = (customText !== undefined ? customText : input).trim();
    if (!raw) return;

    setLoading(true);
    setSpinning(true);
    try {
      let result: ParsedTransaction;
      if (isOnline) {
        try {
          result = await ApiService.parseText(raw, categories);
        } catch {
          result = parseLocalInput(raw, categories);
        }
      } else {
        result = parseLocalInput(raw, categories);
      }
      setParsedResult(applyPreferredType(result, categories, preferredType));
    } catch {
      setParsedResult(applyPreferredType(parseLocalInput(raw, categories), categories, preferredType));
    } finally {
      setLoading(false);
      window.setTimeout(() => setSpinning(false), 520);
    }
  };

  const handleConfirmSave = async (finalData: ParsedTransaction) => {
    try {
      await addTransaction({
        type: finalData.type,
        amount: finalData.amount,
        description: finalData.description,
        category_name: finalData.category,
        category_id: finalData.categoryId,
        date: finalData.date,
        confidence: finalData.confidence,
        raw_input: finalData.rawInput
      });

      setInput('');
      setParsedResult(null);
    } catch (err) {
      alert('Error saving transaction: ' + err);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Compact dashboard entry: type choice, description, and submit stay in one line. */}
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 finance-surface p-2 transition-all focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-800"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
          <Zap className="h-4 w-4 fill-current" />
        </div>

        <TransactionTypeToggle value={preferredType} onChange={setPreferredType} compact />

        <div className="min-w-[160px] flex-1 px-1">
          <input
            type="text"
            aria-label="Quick add transaction"
            placeholder={preferredType === 'income' ? 'What did you receive?' : 'What did you spend?'}
            value={input}
            onChange={e => setInput(e.target.value)}
            className="h-9 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-busy={loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl finance-gradient-action transition duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0 disabled:hover:scale-100"
          title="Add transaction"
          aria-label="Add transaction"
        >
          <Plus className={`h-5 w-5 stroke-[2.5] transition-transform duration-500 ${spinning ? 'animate-spin' : ''}`} />
        </button>
      </form>

      {/* Confirmation Card on parse */}
      {parsedResult && (
        <ConfirmationCard
          parsed={parsedResult}
          categories={categories}
          onConfirm={handleConfirmSave}
          onCancel={() => setParsedResult(null)}
        />
      )}
    </div>
  );
};

export default DashboardQuickNLP;
