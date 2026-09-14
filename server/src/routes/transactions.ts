import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { StoreService } from '../services/store.js';

const router = Router();

const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: 'Type must be income or expense' }),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  category_id: z.string().nullable().optional(),
  category_name: z.string().default('Other'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  confidence: z.number().min(0).max(1).optional(),
  raw_input: z.string().nullable().optional()
});

const updateTransactionSchema = transactionSchema.partial();

// All transaction routes require authentication
router.use(requireAuth);

// GET /api/transactions
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const transactions = await StoreService.getTransactions(userId);

    // Apply query filters if provided
    const { type, category, search, startDate, endDate } = req.query;

    let filtered = transactions;

    if (type && (type === 'income' || type === 'expense')) {
      filtered = filtered.filter(t => t.type === type);
    }

    if (category && typeof category === 'string') {
      filtered = filtered.filter(t => t.category_name.toLowerCase() === category.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category_name.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }

    if (startDate && typeof startDate === 'string') {
      filtered = filtered.filter(t => t.date >= startDate);
    }

    if (endDate && typeof endDate === 'string') {
      filtered = filtered.filter(t => t.date <= endDate);
    }

    res.status(200).json({
      success: true,
      data: filtered
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/transactions
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const validation = transactionSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid transaction data',
        details: validation.error.errors
      });
      return;
    }

    const created = await StoreService.createTransaction(userId, {
      type: validation.data.type,
      amount: validation.data.amount,
      description: validation.data.description,
      category_id: validation.data.category_id || null,
      category_name: validation.data.category_name || 'Other',
      date: validation.data.date || new Date().toISOString().split('T')[0],
      confidence: validation.data.confidence ?? 1.0,
      raw_input: validation.data.raw_input || null
    });

    res.status(201).json({
      success: true,
      data: created
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };

    const tx = await StoreService.getTransactionById(userId, id);
    if (!tx) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found or unauthorized'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: tx
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };

    const validation = updateTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid update data'
      });
      return;
    }

    const updated = await StoreService.updateTransaction(userId, id, validation.data);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found or unauthorized'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };

    const success = await StoreService.deleteTransaction(userId, id);
    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found or unauthorized'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: 'Transaction deleted successfully', id }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
