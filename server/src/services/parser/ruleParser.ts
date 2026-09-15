import { Category, ParsedTransaction, TransactionType } from '../../types/index.js';

export const DEFAULT_CATEGORIES: Category[] = [
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
      'semester', 'class', 'udemy', 'coursera', 'tutorial', 'admission',
      'tuition fee', 'form'
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
      'dress', 'saree', 'kurtha', 'glasses', 'accessories', 'buy', 'bought',
      'shoes', 'sneakers', 'sandal'
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

export class RuleParser {
  private categories: Category[];

  constructor(customCategories?: Category[]) {
    this.categories = customCategories && customCategories.length > 0
      ? [...customCategories]
      : DEFAULT_CATEGORIES;
  }

  public parse(input: string): ParsedTransaction {
    const rawInput = input.trim();
    if (!rawInput) {
      return {
        type: 'expense',
        amount: 0,
        description: 'Transaction',
        category: 'Other',
        categoryId: null,
        confidence: 0,
        date: new Date().toISOString().split('T')[0],
        rawInput: ''
      };
    }

    const lower = rawInput.toLowerCase();

    // 1. Extract Date first (e.g. "yesterday", "hijo", "today", "aaja", "2025-01-20")
    const dateExtraction = this.extractDate(rawInput);
    const date = dateExtraction.date;

    // 2. Extract Amount (ignoring any matched date string so years like 2025 are not mistaken for amounts)
    const amountExtraction = this.extractAmount(rawInput, dateExtraction.matchedText);
    const amount = amountExtraction.amount;
    const amountMatchText = amountExtraction.matchedText;

    // 3. Determine Type (income vs expense)
    const typeExtraction = this.detectType(lower);
    let type: TransactionType = typeExtraction.type;
    let typeConfidence = typeExtraction.confidence;

    // 4. Determine Category & Clean Description
    const categoryResult = this.detectCategory(lower, type);

    // If type was defaulted or unsure, and category strongly indicates income, adjust type
    if (categoryResult.matchedCategory) {
      if (categoryResult.matchedCategory.type !== type && typeExtraction.isExplicit === false) {
        type = categoryResult.matchedCategory.type;
        typeConfidence = 0.85;
      }
    }

    // 5. Clean up description
    const description = this.cleanDescription(rawInput, amountMatchText, dateExtraction.matchedText);

    // 6. Calculate overall confidence score
    let overallConfidence = 0.40;
    if (amount > 0) {
      if (categoryResult.matchedCategory && categoryResult.confidence >= 0.8 && typeExtraction.isExplicit) {
        overallConfidence = 0.98;
      } else if (categoryResult.matchedCategory && categoryResult.confidence >= 0.8) {
        overallConfidence = 0.92;
      } else if (categoryResult.matchedCategory) {
        overallConfidence = 0.80;
      } else if (typeExtraction.isExplicit) {
        overallConfidence = 0.70;
      } else {
        overallConfidence = 0.45; // Uncertain category / type, needs user check
      }
    } else {
      overallConfidence = 0.0;
    }

    const categoryName = categoryResult.matchedCategory
      ? categoryResult.matchedCategory.name
      : (type === 'income' ? 'Other Income' : 'Other');

    return {
      type,
      amount,
      description: description || (categoryResult.matchedCategory ? categoryResult.matchedCategory.name : 'Expense'),
      category: categoryName,
      categoryId: categoryResult.matchedCategory?.id || null,
      confidence: Math.round(overallConfidence * 100) / 100,
      date,
      rawInput
    };
  }

  private extractAmount(input: string, dateMatchText?: string): { amount: number; matchedText: string } {
    let sanitized = input;
    if (dateMatchText) {
      sanitized = sanitized.replace(dateMatchText, ' ');
    }

    // Regex patterns for Nepali / English amounts:
    // "Rs 120", "Rs. 120", "Rs.120", "NPR 120", "NPR. 120", "120 rupees", "120 rs", "120/-", "1,200", "15k", "25 k"
    const patterns = [
      /(?:rs\.?|npr\.?)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|\d+(?:\.\d+)?k?)/i,
      /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|\d+(?:\.\d+)?k?)\s*(?:rs\.?|rupees|npr\.?|\/-)/i,
      /\b(\d+(?:\.\d+)?)\s*k\b/i,
      /\b([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?)\b/,
      /\b([0-9]+(?:\.[0-9]{1,2})?)\b/
    ];

    for (const pattern of patterns) {
      const match = sanitized.match(pattern);
      if (match) {
        const fullMatch = match[0];
        let numStr = (match[1] || match[0]).toLowerCase().replace(/,/g, '').trim();

        let numericVal = 0;
        if (numStr.endsWith('k') || fullMatch.toLowerCase().includes('k')) {
          const cleanK = numStr.replace('k', '').trim();
          const val = parseFloat(cleanK);
          numericVal = isNaN(val) ? 0 : val * 1000;
        } else {
          numericVal = parseFloat(numStr);
        }

        if (!isNaN(numericVal) && numericVal > 0) {
          return { amount: numericVal, matchedText: fullMatch };
        }
      }
    }

    return { amount: 0, matchedText: '' };
  }

  private extractDate(input: string): { date: string; matchedText: string } {
    const today = new Date();
    const lower = input.toLowerCase();

    // Check for "yesterday" or Nepali "hijo"
    const yesterdayMatch = lower.match(/\b(yesterday|hijo)\b/i);
    if (yesterdayMatch) {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      return { date: d.toISOString().split('T')[0], matchedText: yesterdayMatch[0] };
    }

    // Check for "today" or Nepali "aaja"
    const todayMatch = lower.match(/\b(today|aaja)\b/i);
    if (todayMatch) {
      return { date: today.toISOString().split('T')[0], matchedText: todayMatch[0] };
    }

    // Check for explicit YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = input.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = ymdMatch[2].padStart(2, '0');
      const d = ymdMatch[3].padStart(2, '0');
      return { date: `${y}-${m}-${d}`, matchedText: ymdMatch[0] };
    }

    // Check for explicit DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = input.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      return { date: `${y}-${m}-${d}`, matchedText: dmyMatch[0] };
    }

    return { date: today.toISOString().split('T')[0], matchedText: '' };
  }

  private detectType(lower: string): { type: TransactionType; confidence: number; isExplicit: boolean } {
    for (const indicator of INCOME_INDICATORS) {
      if (lower.includes(indicator)) {
        return { type: 'income', confidence: 0.95, isExplicit: true };
      }
    }

    for (const indicator of EXPENSE_INDICATORS) {
      if (lower.includes(indicator)) {
        return { type: 'expense', confidence: 0.95, isExplicit: true };
      }
    }

    // Default to expense if not explicit (most personal tracker transactions are expenses)
    return { type: 'expense', confidence: 0.60, isExplicit: false };
  }

  private detectCategory(
    lower: string,
    currentType: TransactionType
  ): { matchedCategory: Category | null; confidence: number } {
    let bestCategory: Category | null = null;
    let maxScore = 0;

    for (const cat of this.categories) {
      for (const kw of cat.keywords) {
        const kwLower = kw.toLowerCase();
        // Exact word boundary match gets higher score
        const regex = new RegExp(`\\b${kwLower}\\b`, 'i');
        if (regex.test(lower)) {
          let score = 0.95;
          // Prefer category matching current type if already determined
          if (cat.type === currentType) {
            score += 0.05;
          }
          if (score > maxScore) {
            maxScore = score;
            bestCategory = cat;
          }
        } else if (lower.includes(kwLower) && kwLower.length > 3) {
          let score = 0.80;
          if (cat.type === currentType) {
            score += 0.05;
          }
          if (score > maxScore) {
            maxScore = score;
            bestCategory = cat;
          }
        }
      }
    }

    return { matchedCategory: bestCategory, confidence: maxScore };
  }

  private cleanDescription(input: string, amountMatch: string, dateMatch: string): string {
    let cleaned = input;

    // Remove amount string
    if (amountMatch) {
      cleaned = cleaned.replace(amountMatch, '');
    }

    // Remove date string
    if (dateMatch) {
      cleaned = cleaned.replace(new RegExp(`\\b${dateMatch}\\b`, 'gi'), '');
    }

    // Remove common stop words / filler phrases at start or end
    const noiseWords = [
      /^paid\s+for\s+/i,
      /^paid\s+/i,
      /^spent\s+on\s+/i,
      /^spent\s+/i,
      /^bought\s+/i,
      /^buy\s+/i,
      /^received\s+/i,
      /^got\s+/i,
      /^earned\s+/i,
      /\s+for\s*$/i,
      /\s+rs\.?\s*$/i,
      /\s+rupees\s*$/i,
      /\s+npr\.?\s*$/i,
      /^\s*for\s+/i,
      /^\s*from\s+/i
    ];

    for (const nw of noiseWords) {
      cleaned = cleaned.replace(nw, ' ');
    }

    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }
}
