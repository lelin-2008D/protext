import React, { useState, useEffect } from 'react';
import { ParsedTransaction, Category, TransactionType } from '../types/index.js';
import { Check, Edit3, X, AlertTriangle, Sparkles, Tag, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ConfirmationCardProps {
  parsed: ParsedTransaction;
  categories: Category[];
  onConfirm: (finalData: ParsedTransaction) => void;
  onCancel: () => void;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  parsed,
  categories,
  onConfirm,
  onCancel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState<number>(parsed.amount);
  const [type, setType] = useState<TransactionType>(parsed.type);
  const [category, setCategory] = useState<string>(parsed.category);
  const [description, setDescription] = useState<string>(parsed.description);
  const [date, setDate] = useState<string>(parsed.date);

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setIsSaving(false);
    setIsSuccess(false);
    setAmount(parsed.amount);
    setType(parsed.type);
    setCategory(parsed.category);
    setDescription(parsed.description);
    setDate(parsed.date);
  }, [parsed]);

  const isLowConfidence = parsed.confidence < 0.70;

  const handleSave = () => {
    if (isSaving || isSuccess) return;

    if (amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    const matchedCat = categories.find(c => c.name === category);
    const finalData = {
      type,
      amount,
      description: description.trim(),
      category,
      categoryId: matchedCat?.id || null,
      confidence: 1.0,
      date,
      rawInput: parsed.rawInput
    };

    // Trigger delightful celebration animation
    setIsSaving(true);
    setIsSuccess(true);

    window.setTimeout(() => {
      onConfirm(finalData);
    }, 750);
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200">
      {/* Save Success Celebratory Overlay */}
      {isSuccess && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 text-center animate-in fade-in zoom-in-90 duration-300">
          {/* Confetti & Particle Sparks */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-blue-500 animate-ping opacity-75" />
            <span className="absolute top-1/3 right-1/4 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping opacity-75" style={{ animationDelay: '150ms' }} />
            <span className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-75" style={{ animationDelay: '250ms' }} />
            <span className="absolute bottom-1/4 right-1/3 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75" style={{ animationDelay: '350ms' }} />
          </div>

          {/* Animated Glowing Ring & Checkmark Land / Appear */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-save-pulse" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-hisab-appear">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
          </div>

          <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight animate-hisab-slide-down">
            Transaction Saved!
          </h4>
          <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium animate-hisab-land">
            <span className={`font-bold ${type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {type === 'income' ? '+' : '-'}Rs. {amount.toLocaleString('en-IN')}
            </span>
            <span>•</span>
            <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-300 font-semibold">{description}</span>
          </div>
        </div>
      )}

      {/* Header banner */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Detected Transaction</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Review & confirm before adding</p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isLowConfidence ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-3 h-3" />
              Verify details
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              <Check className="w-3 h-3" />
              {(parsed.confidence * 100).toFixed(0)}% Match
            </span>
          )}
        </div>
      </div>

      {!isEditing ? (
        /* Read-only Review Screen */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-xl gap-3">
            <div className="min-w-0 flex-1">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5 ${
                type === 'income'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}>
                {type === 'income' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {type}
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">{description}</h4>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 truncate max-w-[120px]">
                  <Tag className="w-3 h-3 shrink-0" /> {category}
                </span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Calendar className="w-3 h-3 shrink-0" /> {date}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Amount</p>
              <p className={`text-xl sm:text-2xl font-black whitespace-nowrap tracking-tight ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {type === 'income' ? '+' : '-'}Rs. {amount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Action Buttons: Save, Edit, Cancel */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`group relative overflow-hidden flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition active:scale-98 ${
                isSuccess
                  ? 'bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {/* Contrail element when takeoff */}
              {isSaving && (
                <span className="absolute left-6 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-white animate-hisab-contrail" />
              )}
              <Check className={`w-4 h-4 ${isSaving ? 'animate-hisab-takeoff' : isSuccess ? 'animate-hisab-appear' : 'group-hover:animate-hisab-wave'}`} />
              <span className={`whitespace-nowrap ${isSaving ? 'animate-hisab-disappear' : isSuccess ? 'animate-hisab-slide-down' : 'group-hover:animate-hisab-wave'}`}>
                {isSuccess ? 'Saved!' : 'Save Transaction'}
              </span>
            </button>

            <button
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
              className="group flex items-center justify-center gap-1.5 py-3 px-3.5 sm:px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition shrink-0"
              title="Edit detected details"
            >
              <Edit3 className="w-4 h-4 group-hover:animate-hisab-wave" />
              <span className="group-hover:animate-hisab-wave">Edit</span>
            </button>

            <button
              onClick={onCancel}
              disabled={isSaving}
              className="group p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition shrink-0"
              title="Cancel"
            >
              <X className="w-4 h-4 group-hover:animate-hisab-spin" />
            </button>
          </div>
        </div>
      ) : (
        /* Quick Inline Edit Screen */
        <div className="space-y-3.5">
          {/* Type Toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const expCats = categories.filter(c => c.type === 'expense');
                if (expCats.length > 0) setCategory(expCats[0].name);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                const incCats = categories.filter(c => c.type === 'income');
                if (incCats.length > 0) setCategory(incCats[0].name);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Amount (Rs.)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Coffee, Bus fare, Momo"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filteredCategories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Edit Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`group relative overflow-hidden flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-white shadow-md transition ${
                isSuccess
                  ? 'bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {isSaving && (
                <span className="absolute left-6 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-white animate-hisab-contrail" />
              )}
              <span className={`inline-block ${isSaving ? 'animate-hisab-takeoff' : isSuccess ? 'animate-hisab-slide-down' : 'group-hover:animate-hisab-wave'}`}>
                {isSuccess ? 'Saved!' : 'Done & Save'}
              </span>
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="group py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition"
            >
              <span className="group-hover:animate-hisab-wave inline-block">Back</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
