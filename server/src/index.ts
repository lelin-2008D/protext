import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[HISAB Backend] Server running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`[HISAB Backend] Health check: http://localhost:${config.port}/api/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[HISAB Backend] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[HISAB Backend] Process terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('[HISAB Backend] SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('[HISAB Backend] Process terminated.');
  });
});
