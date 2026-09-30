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

  const handleSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const raw = (customText !== undefined ? customText : input).trim();
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

  const exampleChips = ['Lunch 250', 'Bus 40', 'Salary 15000', 'Coffee 150'];

  return (
    <div className="w-full space-y-3">
      {/* Sleek NLP Input Container: Perfect contrast in both Dark and Light themes */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-3 p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0E1626] border border-blue-500/40 dark:border-blue-500/30 shadow-md shadow-blue-500/5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
      >
        {/* Lightning Icon Badge */}
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 fill-blue-600 dark:fill-blue-500 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Input Box */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="What did you spend or earn?"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">Try:</span>
            {exampleChips.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setInput(chip);
                  handleSubmit(undefined, chip);
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-700/60 transition shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Plus Submit Button */}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30 transition-all"
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
