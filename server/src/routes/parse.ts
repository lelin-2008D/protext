import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { defaultParserService } from '../services/parser/parserService.js';
import { parseLimiter } from '../middleware/rateLimiter.js';
import { optionalAuth } from '../middleware/auth.js';
import { StoreService } from '../services/store.js';

const router = Router();

const parseSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(500, 'Text too long'),
  customCategories: z.array(z.any()).optional()
});

router.post('/', parseLimiter, optionalAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = parseSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({
        success: false,
        error: validated.error.errors[0]?.message || 'Invalid input'
      });
      return;
    }

    const { text, customCategories } = validated.data;

    // Load available categories (default + user if logged in)
    let categories = customCategories;
    if (!categories && req.user) {
      categories = await StoreService.getCategories(req.user.id);
    }

    const result = await defaultParserService.parse(text, categories);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
