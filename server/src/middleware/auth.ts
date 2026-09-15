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

export async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  // Handle local dev / test mock tokens
  if (token.startsWith('mock-user-') || token === 'demo-test-token') {
    const userId = token === 'demo-test-token' ? 'demo-user-123' : token.replace('mock-user-', '');
    return {
      id: userId,
      email: `${userId}@hisab.local`,
      name: 'Test User'
    };
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
          return {
            id: payload.sub || payload.id,
            email: payload.email,
            name: payload.user_metadata?.full_name || payload.email
          };
        }
      }
    } catch {
      // ignore decode error and fail
    }

    // Default fallback mock user for local sandbox mode
    return {
      id: 'local-dev-user-001',
      email: 'dev@hisab.local',
      name: 'Local Developer'
    };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0]
    };
  } catch {
    return null;
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

  const user = await verifyToken(token);
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session'
    });
    return;
  }

  req.user = user;
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const user = await verifyToken(token);
      if (user) {
        req.user = user;
      }
    }
  }

  next();
}
