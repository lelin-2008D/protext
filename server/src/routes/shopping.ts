import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { StoreService } from '../services/store.js';

const router = Router();

const shoppingListSchema = z.object({
  title: z.string().min(1, 'List title is required').max(100, 'List title too long'),
  description: z.string().max(500, 'Description too long').nullable().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional()
});

const shoppingItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Item name too long'),
  quantity: z.number().positive('Quantity must be greater than 0').default(1),
  unit: z.string().max(20).nullable().optional(),
  estimated_unit_price: z.number().nonnegative('Estimated price cannot be negative').nullable().optional(),
  actual_unit_price: z.number().nonnegative('Actual price cannot be negative').nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  status: z.enum(['pending', 'purchased']).default('pending'),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').nullable().optional(),
  transaction_id: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  category_name: z.string().max(50).nullable().optional(),
  sort_order: z.number().int().optional()
});

const updateShoppingItemSchema = shoppingItemSchema.partial();

// All shopping routes require authentication
router.use(requireAuth);

// GET /api/shopping/lists
router.get('/lists', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const lists = await StoreService.getShoppingLists(userId);
    res.json({ success: true, data: lists });
  } catch (err) {
    next(err);
  }
});

// POST /api/shopping/lists
router.post('/lists', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const validation = shoppingListSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid shopping list data',
        details: validation.error.errors
      });
      return;
    }
    const list = await StoreService.createShoppingList(userId, validation.data);
    res.status(201).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/shopping/lists/:id
router.get('/lists/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const list = await StoreService.getShoppingListById(userId, id);
    if (!list) {
      res.status(404).json({ success: false, error: 'Shopping list not found' });
      return;
    }
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// PUT /api/shopping/lists/:id
router.put('/lists/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const validation = shoppingListSchema.partial().safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid shopping list data',
        details: validation.error.errors
      });
      return;
    }
    const updated = await StoreService.updateShoppingList(userId, id, validation.data);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Shopping list not found' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/shopping/lists/:id
router.delete('/lists/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await StoreService.deleteShoppingList(userId, id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Shopping list not found' });
      return;
    }
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// GET /api/shopping/lists/:listId/items
router.get('/lists/:listId/items', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const listId = Array.isArray(req.params.listId) ? req.params.listId[0] : req.params.listId;
    const items = await StoreService.getShoppingItems(userId, listId);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// POST /api/shopping/lists/:listId/items
router.post('/lists/:listId/items', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const listId = Array.isArray(req.params.listId) ? req.params.listId[0] : req.params.listId;
    const validation = shoppingItemSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid shopping item data',
        details: validation.error.errors
      });
      return;
    }
    const item = await StoreService.createShoppingItem(userId, {
      ...validation.data,
      list_id: listId
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// GET /api/shopping/items
router.get('/items', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const items = await StoreService.getShoppingItems(userId);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// GET /api/shopping/items/:id
router.get('/items/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await StoreService.getShoppingItemById(userId, id);
    if (!item) {
      res.status(404).json({ success: false, error: 'Shopping item not found' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// PUT /api/shopping/items/:id
router.put('/items/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const validation = updateShoppingItemSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid shopping item data',
        details: validation.error.errors
      });
      return;
    }
    const updated = await StoreService.updateShoppingItem(userId, id, validation.data);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Shopping item not found' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/shopping/items/:id
router.delete('/items/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await StoreService.deleteShoppingItem(userId, id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Shopping item not found' });
      return;
    }
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

export default router;
