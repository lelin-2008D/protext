import React, { useState } from 'react';
import { Zap, Plus, Loader2 } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext.js';
import { useSync } from '../context/SyncContext.js';
import { parseLocalInput } from '../lib/parserLocal.js';
import { ApiService } from '../lib/api.js';
import { ConfirmationCard } from './ConfirmationCard.js';
import { ParsedTransaction } from '../types/index.js';

export const DashboardQuickNLP: React.FC = () => {
  const { categories, addTransaction } = useTransactions();
  const { isOnline } = useSync();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedTransaction | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = input.trim();
    if (!raw) return;

    setLoading(true);
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
      setParsedResult(result);
    } catch {
      setParsedResult(parseLocalInput(raw, categories));
    } finally {
      setLoading(false);
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
      {/* Sleek NLP Input Container matching image */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#0E1626] to-[#0E1626] dark:from-blue-950/30 dark:via-[#0E1626] dark:to-[#0E1626] border border-blue-500/30 dark:border-blue-500/20 shadow-lg shadow-blue-500/5 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
      >
        {/* Lightning Icon Badge */}
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 fill-blue-500 text-blue-400" />
        </div>

        {/* Input Box */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="What did you spend?"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
            e.g. &ldquo;Lunch 250&rdquo;, &ldquo;Bus 40&rdquo;, &ldquo;Salary 15000&rdquo;
          </p>
        </div>

        {/* Plus Submit Button */}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30 transition-all"
          title="Parse & Add"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
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
