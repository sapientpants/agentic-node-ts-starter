/**
 * ============================================================================
 * EXAMPLE HEALTH ENDPOINT - OPTIONAL REFERENCE IMPLEMENTATION
 * ============================================================================
 * This file demonstrates how to implement a health endpoint for Docker healthchecks.
 * It is NOT included in the build by default - copy and modify as needed.
 *
 * For more examples and configurations, see docs/DOCKER.md
 * ============================================================================
 */

import http from 'node:http';
import { createChildLogger } from './logger.js';

const logger = createChildLogger('server');

// Server configuration constants
const DEFAULT_SERVER_PORT = 3000; // Default HTTP server port
const SHUTDOWN_TIMEOUT_MS = 10000; // Force shutdown after 10 seconds (10000ms)

// Content type constants
const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_TEXT = 'text/plain';

/**
 * Example health check implementation for a basic HTTP server
 * Modify this to fit your application's needs
 */
const server = http.createServer((req, res) => {
  // Simple health endpoint
  if (req.url === '/health') {
    // You can add additional checks here:
    // - Database connectivity
    // - External service availability
    // - Resource usage thresholds
    // - Queue backlogs

    res.writeHead(200, { 'Content-Type': CONTENT_TYPE_JSON });
    res.end(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      }),
    );
    return;
  }

  // Simple readiness check (can be same as health or different)
  if (req.url === '/ready') {
    // Check if the application is ready to serve traffic
    // This might be different from health during startup
    res.writeHead(200, { 'Content-Type': CONTENT_TYPE_TEXT });
    res.end('OK');
    return;
  }

  // Your application routes would go here
  // This is just an example response
  res.writeHead(404, { 'Content-Type': CONTENT_TYPE_TEXT });
  res.end('Not Found');
});

// Port configuration with proper error handling
let PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_SERVER_PORT;
if (isNaN(PORT)) {
  logger.error(
    { portEnv: process.env.PORT },
    `Invalid PORT environment variable, falling back to ${DEFAULT_SERVER_PORT}`,
  );
  PORT = DEFAULT_SERVER_PORT;
}
const HOST = process.env.HOST || '0.0.0.0';

// Start server
server.listen(PORT, HOST, () => {
  logger.info({ port: PORT, host: HOST }, 'Server started');
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutdown signal received');

  server.close(() => {
    logger.info('Server closed');
    // eslint-disable-next-line n/no-process-exit -- Graceful shutdown requires process.exit
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    // eslint-disable-next-line n/no-process-exit -- Forced shutdown requires process.exit
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
};

// Handle shutdown signals
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  shutdown('SIGINT');
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  // eslint-disable-next-line n/no-process-exit -- Fatal error handler requires process.exit
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  // eslint-disable-next-line n/no-process-exit -- Fatal error handler requires process.exit
  process.exit(1);
});
