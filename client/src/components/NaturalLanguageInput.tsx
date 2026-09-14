import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
import { ParsedTransaction } from '../types/index.js';
import { parseLocalInput } from '../lib/parserLocal.js';
import { ApiService } from '../lib/api.js';
import { ConfirmationCard } from './ConfirmationCard.js';
import { useTransactions } from '../context/TransactionContext.js';
import { useSync } from '../context/SyncContext.js';

interface NaturalLanguageInputProps {
  onTransactionSaved?: () => void;
  compact?: boolean;
}

const EXAMPLE_PHRASES = [
  'Coffee 120',
  'Momo Rs 200',
  'Paid 50 for bus',
  'Bought books for 450',
  'Received salary 15000',
  'Dad gave me 2000',
  'Got 500 from freelancing',
  'Petrol Rs. 500',
  'Internet bill 1500'
];

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  onTransactionSaved,
  compact = false
}) => {
  const { categories, addTransaction } = useTransactions();
  const { isOnline } = useSync();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedTransaction | null>(null);
  const [livePreview, setLivePreview] = useState<ParsedTransaction | null>(null);

  // Instant real-time typing preview
  useEffect(() => {
    if (input.trim().length > 1) {
      const preview = parseLocalInput(input, categories);
      setLivePreview(preview.amount > 0 ? preview : null);
    } else {
      setLivePreview(null);
    }
  }, [input, categories]);

  const handleParse = async (textToParse?: string) => {
    const raw = (textToParse || input).trim();
    if (!raw) return;

    setLoading(true);

    try {
      let result: ParsedTransaction;

      if (isOnline) {
        try {
          result = await ApiService.parseText(raw, categories);
        } catch {
          // Fallback to local deterministic parser if backend API is unreachable
          result = parseLocalInput(raw, categories);
        }
      } else {
        result = parseLocalInput(raw, categories);
      }

      setParsedResult(result);
    } catch (err) {
      console.error('Parsing error:', err);
      // Fallback
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

      // Clear state after saving
      setInput('');
      setParsedResult(null);
      setLivePreview(null);

      if (onTransactionSaved) {
        onTransactionSaved();
      }
    } catch (err) {
      alert('Error saving transaction: ' + err);
    }
  };

  const handleCancel = () => {
    setParsedResult(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* If parsed result is waiting for confirmation, show Confirmation Card */}
      {parsedResult ? (
        <ConfirmationCard
          parsed={parsedResult}
          categories={categories}
          onConfirm={handleConfirmSave}
          onCancel={handleCancel}
        />
      ) : (
        /* Natural Language Input Form */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <label htmlFor="hisab-nlp-input" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                Natural Language Entry
              </label>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
              Press <CornerDownLeft className="w-3 h-3" /> to track
            </span>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleParse();
            }}
            className="relative"
          >
            <input
              id="hisab-nlp-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. Momo 200, Petrol Rs 500, Got 15k salary..."
              autoComplete="off"
              className="w-full pl-4 pr-24 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Track</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Live Parsing Preview Chip */}
          {livePreview && (
            <div className="mt-2.5 flex items-center gap-2 px-3 py-1.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg text-xs text-blue-900 dark:text-blue-200 animate-in fade-in duration-150">
              <span className="font-semibold">{livePreview.type === 'income' ? 'Income' : 'Expense'}:</span>
              <span className="font-bold">Rs. {livePreview.amount.toLocaleString()}</span>
              <span>•</span>
              <span>{livePreview.category}</span>
              <span>•</span>
              <span className="text-slate-600 dark:text-slate-400 truncate font-medium">"{livePreview.description}"</span>
            </div>
          )}

          {/* Quick Example Chips Carousel */}
          {!compact && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-400 mb-2">Try examples:</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PHRASES.map(phrase => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => {
                      setInput(phrase);
                      handleParse(phrase);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition active:scale-95"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
