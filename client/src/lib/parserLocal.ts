import { Category, ParsedTransaction, TransactionType } from '../types/index.js';

export const DEFAULT_CLIENT_CATEGORIES: Category[] = [
  // Expense Categories
  {
    name: 'Food & Drinks',
    type: 'expense',
    keywords: [
      'coffee', 'tea', 'chiya', 'momo', 'lunch', 'dinner', 'breakfast', 'khaja',
      'coke', 'snack', 'restaurant', 'cafe', 'chowmein', 'burger', 'pizza',
      'groceries', 'bhat', 'tarkari', 'sekuwa', 'thukpa', 'biryani', 'cold drink',
      'beer', 'ice cream', 'meat', 'chicken', 'vegetables', 'milk', 'water bottle',
      'bakery', 'cake', 'samosa', 'roti', 'paratha', 'chow'
    ],
    icon: 'Utensils',
    color: '#F97316'
  },
  {
    name: 'Transport',
    type: 'expense',
    keywords: [
      'bus', 'taxi', 'petrol', 'fuel', 'bike', 'scooter', 'pathao', 'indrive',
      'micro', 'auto', 'tempo', 'fare', 'toll', 'parking', 'diesel', 'sajha',
      'yatri', 'train', 'flight', 'ticket', 'van', 'cab', 'transport', 'ride'
    ],
    icon: 'Bus',
    color: '#3B82F6'
  },
  {
    name: 'Education',
    type: 'expense',
    keywords: [
      'books', 'book', 'college', 'course', 'tuition', 'school', 'exam',
      'stationery', 'copy', 'pen', 'pencil', 'notes', 'fee', 'fees',
      'semester', 'class', 'udemy', 'coursera', 'tutorial', 'admission'
    ],
    icon: 'GraduationCap',
    color: '#8B5CF6'
  },
  {
    name: 'Shopping',
    type: 'expense',
    keywords: [
      'shirt', 'shoes', 'clothes', 'clothing', 'pants', 'jacket', 'daraz',
      'shopping', 'watch', 'bag', 'sunglasses', 'tshirt', 'jeans', 'hoodie',
      'dress', 'saree', 'kurtha', 'glasses', 'accessories', 'buy', 'bought'
    ],
    icon: 'ShoppingBag',
    color: '#EC4899'
  },
  {
    name: 'Home',
    type: 'expense',
    keywords: [
      'rent', 'furniture', 'maintenance', 'repair', 'room', 'flat', 'gas',
      'cylinder', 'cooker', 'fan', 'light', 'bed', 'mattress', 'kitchen',
      'plumbing', 'electrician', 'cleaning', 'household'
    ],
    icon: 'Home',
    color: '#10B981'
  },
  {
    name: 'Bills',
    type: 'expense',
    keywords: [
      'internet', 'wifi', 'electricity', 'water', 'recharge', 'ntc', 'ncell',
      'worldlink', 'vianet', 'khanepani', 'bijuli', 'dishhome', 'sim', 'topup',
      'smartcell', 'broadband', 'bill', 'sub', 'subscription', 'utility'
    ],
    icon: 'Receipt',
    color: '#6366F1'
  },
  {
    name: 'Entertainment',
    type: 'expense',
    keywords: [
      'netflix', 'movie', 'cinema', 'qfx', 'game', 'gaming', 'spotify',
      'concert', 'outing', 'party', 'youtube', 'picnic', 'club', 'steam',
      'playstation', 'prime', 'theatre', 'show'
    ],
    icon: 'Film',
    color: '#A855F7'
  },
  {
    name: 'Health',
    type: 'expense',
    keywords: [
      'medicine', 'doctor', 'hospital', 'pharmacy', 'checkup', 'clinic',
      'tablet', 'syrup', 'dentist', 'dental', 'lab', 'blood', 'consultation',
      'aushadhi', 'treatment', 'test', 'xray'
    ],
    icon: 'HeartPulse',
    color: '#EF4444'
  },
  {
    name: 'Other',
    type: 'expense',
    keywords: ['other', 'misc', 'miscellaneous', 'cash', 'something'],
    icon: 'MoreHorizontal',
    color: '#64748B'
  },

  // Income Categories
  {
    name: 'Salary',
    type: 'income',
    keywords: ['salary', 'job', 'monthly', 'paycheck', 'bonus', 'overtime', 'allowance', 'stipend', 'wage'],
    icon: 'Briefcase',
    color: '#22C55E'
  },
  {
    name: 'Freelance',
    type: 'income',
    keywords: ['freelance', 'freelancing', 'client', 'project', 'gig', 'upwork', 'fiverr', 'consulting', 'contract', 'bounty'],
    icon: 'Laptop',
    color: '#06B6D4'
  },
  {
    name: 'Gift',
    type: 'income',
    keywords: [
      'gift', 'dad', 'mom', 'brother', 'sister', 'uncle', 'aunt', 'dakshina',
      'dashain', 'tihar', 'birthday', 'baba', 'aama', 'mama', 'didi', 'dai',
      'bhai', 'bahini', 'pocket money', 'dad gave', 'mom gave', 'baba gave'
    ],
    icon: 'Gift',
    color: '#F59E0B'
  },
  {
    name: 'Refund',
    type: 'income',
    keywords: ['refund', 'return', 'cashback', 'reimbursement', 'reverse', 'returned', 'payback'],
    icon: 'RotateCcw',
    color: '#14B8A6'
  },
  {
    name: 'Other Income',
    type: 'income',
    keywords: ['income', 'interest', 'dividend', 'rent received', 'sold', 'sale', 'earning', 'profit', 'prize', 'won', 'credited'],
    icon: 'Wallet',
    color: '#84CC16'
  }
];

const INCOME_INDICATORS = [
  'received', 'salary', 'earned', 'got', 'income', 'payment received', 'client paid',
  'refund', 'dad gave', 'mom gave', 'baba gave', 'aama gave', 'brother gave', 'sister gave',
  'cashback', 'bonus', 'sold', 'credited', 'from freelancing', 'from client', 'gift', 'dakshina',
  'talab', 'kamai', 'aamdani', 'bhatta', 'pension', 'stipend'
];

const EXPENSE_INDICATORS = [
  'paid', 'spent', 'bought', 'purchase', 'purchased', 'expense', 'bill', 'fare',
  'debited', 'for', 'kharcha', 'khana', 'eating', 'ordered', 'took', 'cost',
  'tireko', 'kineko', 'bujhaye', 'tiro', 'kino'
];

export function parseLocalInput(input: string, categories: Category[] = DEFAULT_CLIENT_CATEGORIES): ParsedTransaction {
  const rawInput = input.trim();
  if (!rawInput) {
    return {
      type: 'expense',
      amount: 0,
      description: '',
      category: 'Other',
      categoryId: null,
      confidence: 0,
      date: new Date().toISOString().split('T')[0],
      rawInput: ''
    };
  }

  const lower = rawInput.toLowerCase();

  // 1. Extract Date first (e.g. "yesterday", "hijo", "today", "aaja", "2025-01-20")
  const today = new Date();
  let date = today.toISOString().split('T')[0];
  let dateMatchText = '';

  const yesterdayMatch = lower.match(/\b(yesterday|hijo)\b/i);
  if (yesterdayMatch) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split('T')[0];
    dateMatchText = yesterdayMatch[0];
  } else {
    const todayMatch = lower.match(/\b(today|aaja)\b/i);
    if (todayMatch) {
      dateMatchText = todayMatch[0];
    } else {
      const ymd = rawInput.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
      if (ymd) {
        const y = ymd[1];
        const m = ymd[2].padStart(2, '0');
        const d = ymd[3].padStart(2, '0');
        date = `${y}-${m}-${d}`;
        dateMatchText = ymd[0];
      } else {
        const dmy = rawInput.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
        if (dmy) {
          const d = dmy[1].padStart(2, '0');
          const m = dmy[2].padStart(2, '0');
          const y = dmy[3];
          date = `${y}-${m}-${d}`;
          dateMatchText = dmy[0];
        }
      }
    }
  }

  // 2. Extract Amount (ignoring any matched date string so years like 2025 are not mistaken for amounts)
  let sanitizedForAmount = rawInput;
  if (dateMatchText) {
    sanitizedForAmount = sanitizedForAmount.replace(dateMatchText, ' ');
  }

  const amountPatterns = [
    /(?:rs\.?|npr\.?)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|\d+(?:\.\d+)?k?)/i,
    /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|\d+(?:\.\d+)?k?)\s*(?:rs\.?|rupees|npr\.?|\/-)/i,
    /\b(\d+(?:\.\d+)?)\s*k\b/i,
    /\b([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?)\b/,
    /\b([0-9]+(?:\.[0-9]{1,2})?)\b/
  ];

  let amount = 0;
  let amountMatchText = '';

  for (const pattern of amountPatterns) {
    const match = sanitizedForAmount.match(pattern);
    if (match) {
      amountMatchText = match[0];
      let numStr = (match[1] || match[0]).toLowerCase().replace(/,/g, '').trim();

      if (numStr.endsWith('k') || amountMatchText.toLowerCase().includes('k')) {
        const cleanK = numStr.replace('k', '').trim();
        const val = parseFloat(cleanK);
        amount = isNaN(val) ? 0 : val * 1000;
      } else {
        amount = parseFloat(numStr) || 0;
      }
      break;
    }
  }

  // 3. Detect Type
  let type: TransactionType = 'expense';
  let isExplicitType = false;

  for (const ind of INCOME_INDICATORS) {
    if (lower.includes(ind)) {
      type = 'income';
      isExplicitType = true;
      break;
    }
  }

  if (!isExplicitType) {
    for (const ind of EXPENSE_INDICATORS) {
      if (lower.includes(ind)) {
        type = 'expense';
        isExplicitType = true;
        break;
      }
    }
  }

  // 4. Detect Category
  let bestCategory: Category | null = null;
  let maxScore = 0;

  for (const cat of categories) {
    for (const kw of cat.keywords) {
      const kwLower = kw.toLowerCase();
      const regex = new RegExp(`\\b${kwLower}\\b`, 'i');
      if (regex.test(lower)) {
        let score = 0.95;
        if (cat.type === type) score += 0.05;
        if (score > maxScore) {
          maxScore = score;
          bestCategory = cat;
        }
      } else if (lower.includes(kwLower) && kwLower.length > 3) {
        let score = 0.80;
        if (cat.type === type) score += 0.05;
        if (score > maxScore) {
          maxScore = score;
          bestCategory = cat;
        }
      }
    }
  }

  if (bestCategory && !isExplicitType && bestCategory.type !== type) {
    type = bestCategory.type;
    isExplicitType = true;
  }

  // 5. Clean Description
  let description = rawInput;
  if (amountMatchText) description = description.replace(amountMatchText, '');
  if (dateMatchText) description = description.replace(new RegExp(`\\b${dateMatchText}\\b`, 'gi'), '');

  const noise = [
    /^paid\s+for\s+/i, /^paid\s+/i, /^spent\s+on\s+/i, /^spent\s+/i,
    /^bought\s+/i, /^buy\s+/i, /^received\s+/i, /^got\s+/i, /^earned\s+/i,
    /\s+for\s*$/i, /\s+rs\.?\s*$/i, /\s+rupees\s*$/i, /\s+npr\.?\s*$/i,
    /^\s*for\s+/i, /^\s*from\s+/i
  ];

  for (const n of noise) {
    description = description.replace(n, ' ');
  }
  description = description.replace(/\s+/g, ' ').trim();
  if (description.length > 0) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  // 6. Confidence
  let confidence = 0.40;
  if (amount > 0) {
    if (bestCategory && maxScore >= 0.8 && isExplicitType) {
      confidence = 0.98;
    } else if (bestCategory && maxScore >= 0.8) {
      confidence = 0.92;
    } else if (bestCategory) {
      confidence = 0.80;
    } else if (isExplicitType) {
      confidence = 0.70;
    } else {
      confidence = 0.45;
    }
  } else {
    confidence = 0.0;
  }

  const categoryName = bestCategory ? bestCategory.name : (type === 'income' ? 'Other Income' : 'Other');

  return {
    type,
    amount,
    description: description || (bestCategory ? bestCategory.name : (type === 'income' ? 'Income' : 'Expense')),
    category: categoryName,
    categoryId: bestCategory?.id || null,
    confidence: Math.round(confidence * 100) / 100,
    date,
    rawInput
  };
}
