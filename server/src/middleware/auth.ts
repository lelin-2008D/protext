import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../services/supabase.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Missing or malformed Authorization header'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'No token provided'
    });
    return;
  }

  // Handle local dev / test mock tokens
  if (token.startsWith('mock-user-') || token === 'demo-test-token') {
    const userId = token === 'demo-test-token' ? 'demo-user-123' : token.replace('mock-user-', '');
    req.user = {
      id: userId,
      email: `${userId}@hisab.local`,
      name: 'Test User'
    };
    next();
    return;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    // If Supabase credentials are not provided in environment, allow guest/demo session for local dev
    // or inspect basic JWT structure safely
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload && (payload.sub || payload.id)) {
          req.user = {
            id: payload.sub || payload.id,
            email: payload.email,
            name: payload.user_metadata?.full_name || payload.email
          };
          next();
          return;
        }
      }
    } catch {
      // ignore decode error and fail
    }

    // Default fallback mock user for local sandbox mode
    req.user = {
      id: 'local-dev-user-001',
      email: 'dev@hisab.local',
      name: 'Local Developer'
    };
    next();
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: error?.message || 'Invalid or expired session'
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0]
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed: ' + (err.message || 'Unknown error')
    });
  }
}
