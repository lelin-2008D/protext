import React from 'react';
import { NaturalLanguageInput } from '../components/NaturalLanguageInput.js';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface AddPageProps {
  onTransactionSaved: () => void;
}

export const AddPage: React.FC<AddPageProps> = ({ onTransactionSaved }) => {
  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 md:pb-8 animate-in fade-in duration-200">
      <div className="text-center pt-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3 shadow-md shadow-blue-500/10">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Quick Add Transaction</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Simply type what you bought, spent, or received in plain words. HISAB detects the rest.
        </p>
      </div>

      <NaturalLanguageInput onTransactionSaved={onTransactionSaved} />

      {/* Helper tips */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Supported Formats & Tips
        </h4>
        <ul className="space-y-1.5 pl-5 list-disc text-slate-500 dark:text-slate-400">
          <li><strong className="text-slate-700 dark:text-slate-300">Amounts:</strong> 120, Rs 200, Rs. 1,500, 15k, 250/-</li>
          <li><strong className="text-slate-700 dark:text-slate-300">Expenses:</strong> Coffee 120, Bus fare 50, Momo Rs 200, Bought shoes 2500</li>
          <li><strong className="text-slate-700 dark:text-slate-300">Income:</strong> Received salary 25000, Dad gave 2000, Got 500 from freelancing</li>
          <li><strong className="text-slate-700 dark:text-slate-300">Dates:</strong> Petrol 500 yesterday, Coffee 150 today</li>
        </ul>
      </div>
    </div>
  );
};
