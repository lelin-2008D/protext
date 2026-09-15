import { Transaction } from '../types/index.js';

export function exportTransactionsToCSV(transactions: Transaction[], filename = 'hisab_transactions.csv'): void {
  if (!transactions || transactions.length === 0) {
    alert('No transactions to export.');
    return;
  }

  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (NPR)', 'Confidence'];
  const rows = transactions.map(t => [
    t.date,
    t.type.toUpperCase(),
    `"${(t.category_name || 'Other').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.confidence !== undefined ? (t.confidence * 100).toFixed(0) + '%' : '100%'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
