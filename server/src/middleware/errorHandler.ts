import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log sanitized error internally
  console.error(`[Error] ${req.method} ${req.path}:`, err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  const isProd = config.nodeEnv === 'production';

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack })
  });
}
