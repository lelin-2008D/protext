import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { StoreService } from '../services/store.js';

const router = Router();

const friendSchema = z.object({
  name: z.string().min(1, 'Friend name is required').max(100, 'Friend name too long'),
  note: z.string().nullable().optional()
});

const friendEntrySchema = z.object({
  friend_id: z.string().min(1, 'Friend ID is required'),
  type: z.enum(['given', 'returned'], { required_error: 'Type must be given or returned' }),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be greater than 0'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  note: z.string().nullable().optional()
});

const updateFriendEntrySchema = friendEntrySchema.partial();

// All friends routes require authentication
router.use(requireAuth);

// GET /api/friends
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const friends = await StoreService.getFriends(userId);
    res.json({ success: true, data: friends });
  } catch (err) {
    next(err);
  }
});

// POST /api/friends
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const validated = friendSchema.parse(req.body);
    const friend = await StoreService.createFriend(userId, validated);
    res.status(201).json({ success: true, data: friend });
  } catch (err) {
    next(err);
  }
});

// PUT /api/friends/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const validated = friendSchema.partial().parse(req.body);
    const updated = await StoreService.updateFriend(userId, id, validated);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Friend not found' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/friends/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await StoreService.deleteFriend(userId, id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Friend not found' });
      return;
    }
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// GET /api/friends/entries or /api/friends/:friendId/entries
router.get('/entries', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const entries = await StoreService.getFriendEntries(userId);
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

router.get('/:friendId/entries', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const friendId = Array.isArray(req.params.friendId) ? req.params.friendId[0] : req.params.friendId;
    const entries = await StoreService.getFriendEntries(userId, friendId);
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

// POST /api/friends/:friendId/entries
router.post('/:friendId/entries', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const friendId = Array.isArray(req.params.friendId) ? req.params.friendId[0] : req.params.friendId;
    const validated = friendEntrySchema.parse({
      ...req.body,
      friend_id: friendId
    });
    const entry = await StoreService.createFriendEntry(userId, {
      friend_id: validated.friend_id,
      type: validated.type,
      amount: validated.amount,
      date: validated.date || new Date().toISOString().split('T')[0],
      note: validated.note || null
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

// PUT /api/friends/entries/:id
router.put('/entries/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const validated = updateFriendEntrySchema.parse(req.body);
    const updated = await StoreService.updateFriendEntry(userId, id, validated);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Friend entry not found' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/friends/entries/:id
router.delete('/entries/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await StoreService.deleteFriendEntry(userId, id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Friend entry not found' });
      return;
    }
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

export default router;
