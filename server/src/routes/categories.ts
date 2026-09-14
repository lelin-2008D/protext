import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { StoreService } from '../services/store.js';

const router = Router();

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  type: z.enum(['income', 'expense']),
  keywords: z.array(z.string()).default([]),
  icon: z.string().default('Tag'),
  color: z.string().default('#64748B')
});

// GET /api/categories (Can be accessed anonymously for defaults or with auth for user-custom categories)
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Best effort extract user if token present
      const token = authHeader.split(' ')[1];
      if (token.startsWith('mock-user-') || token === 'demo-test-token') {
        userId = token === 'demo-test-token' ? 'demo-user-123' : token.replace('mock-user-', '');
      }
    }

    const categories = await StoreService.getCategories(userId);
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories (Requires auth)
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const validation = createCategorySchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid category data'
      });
      return;
    }

    const created = await StoreService.createCategory(userId, validation.data);
    res.status(201).json({
      success: true,
      data: created
    });
  } catch (error) {
    next(error);
  }
});

export default router;
