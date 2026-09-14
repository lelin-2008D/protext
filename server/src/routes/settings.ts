import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { StoreService } from '../services/store.js';

const router = Router();

const updateSettingsSchema = z.object({
  starting_balance: z.number().min(0, 'Starting balance cannot be negative').optional(),
  currency: z.string().min(1).max(10).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional()
});

router.use(requireAuth);

// GET /api/settings
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const settings = await StoreService.getSettings(userId);

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings
router.put('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const validation = updateSettingsSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid settings data'
      });
      return;
    }

    const updated = await StoreService.updateSettings(userId, validation.data);

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

export default router;
