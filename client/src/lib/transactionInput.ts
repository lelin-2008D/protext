import { Category, ParsedTransaction, TransactionType } from '../types/index.js';

export function applyPreferredType(
  parsed: ParsedTransaction,
  categories: Category[],
  preferredType: TransactionType
): ParsedTransaction {
  if (parsed.type === preferredType) return parsed;

  const category = categories.find(item => item.type === preferredType && item.name === parsed.category)
    || categories.find(item => item.type === preferredType && item.name === (preferredType === 'income' ? 'Other Income' : 'Other'))
    || categories.find(item => item.type === preferredType);

  return {
    ...parsed,
    type: preferredType,
    category: category?.name || (preferredType === 'income' ? 'Other Income' : 'Other'),
    categoryId: category?.id || null
  };
}
