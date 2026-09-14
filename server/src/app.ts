import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.js';
import parseRoutes from './routes/parse.js';
import transactionsRoutes from './routes/transactions.js';
import settingsRoutes from './routes/settings.js';
import categoriesRoutes from './routes/categories.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    config.clientOrigin
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // Check if origin is allowed
        if (
          config.nodeEnv !== 'production' ||
          allowedOrigins.includes(origin) ||
          origin.endsWith('.github.io')
        ) {
          return callback(null, true);
        }

        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Global Rate Limiting
  app.use('/api/', apiLimiter);

  // API Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/parse', parseRoutes);
  app.use('/api/transactions', transactionsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/categories', categoriesRoutes);

  // 404 Handler
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route ${req.method} ${req.originalUrl} not found`
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
