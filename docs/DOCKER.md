# Docker Configuration Guide

This guide provides comprehensive instructions for configuring Docker builds in your project, with special attention to healthcheck requirements for different application types.

## Table of Contents

- [Understanding the Default Configuration](#understanding-the-default-configuration)
- [Healthcheck Requirements](#healthcheck-requirements)
- [Configuration for Different Application Types](#configuration-for-different-application-types)
  - [Web Services](#web-services)
  - [CLI Tools](#cli-tools)
  - [Worker/Daemon Applications](#workerdaemon-applications)
  - [API Services](#api-services)
- [Building and Running](#building-and-running)
- [Container Orchestration](#container-orchestration)
- [Troubleshooting](#troubleshooting)

## Understanding the Default Configuration

The template includes a production-ready Dockerfile with:

- **Multi-stage build**: Reduces final image size
- **Non-root user**: Improves security
- **Signal handling**: Proper shutdown via dumb-init
- **Health check**: Default configuration expects a web server

### ⚠️ Important: Default Healthcheck Assumption

The Dockerfile includes a healthcheck that **expects a web server with a `/health` endpoint on port 3000**. If your application:

- ✅ **Is a web service**: Implement a `/health` endpoint (see examples below)
- ❌ **Is NOT a web service**: Modify or remove the healthcheck (see configuration options)

## Healthcheck Requirements

The default healthcheck configuration:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1
```

This healthcheck:

- Runs every 30 seconds
- Times out after 3 seconds
- Allows 5 seconds for startup
- Retries 3 times before marking unhealthy
- Expects HTTP 200 response from `http://localhost:3000/health`

## Configuration for Different Application Types

### Web Services

For web applications (Express, Fastify, Koa, etc.), implement a health endpoint:

#### Basic HTTP Server Example

```typescript
// src/health.example.ts
import http from 'node:http';
import { createChildLogger } from './logger.js';

const logger = createChildLogger('health');

const server = http.createServer((req, res) => {
  // Health endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Your application routes here
  // ...
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

#### Express Example

```typescript
// src/server.ts (Express example - Simple version)
import express from 'express';

const app = express();

// Simple health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(3000);
```

Or with dependency verification:

```typescript
// src/server.ts (Express example - With dependency checks)
import express from 'express';

const app = express();

// Health check with dependency verification
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    // await db.ping();

    // Check external services
    // await redis.ping();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

app.listen(3000);
```

#### Fastify Example

```typescript
// src/server.ts (Fastify example)
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

// Register health route
fastify.get('/health', async (request, reply) => {
  return { status: 'OK' };
});

await fastify.listen({ port: 3000, host: '0.0.0.0' });
```

### CLI Tools

For command-line tools that don't run a server, remove the healthcheck:

```dockerfile
# In your Dockerfile, replace the HEALTHCHECK line with:
# No healthcheck needed for CLI tools
# HEALTHCHECK NONE
```

Or remove the healthcheck section entirely:

```dockerfile
# Production stage
FROM node:22-alpine

# ... other configuration ...

# Expose port (remove this line for CLI tools)
# EXPOSE 3000

# No healthcheck for CLI applications
# The container will be considered healthy as long as it's running

# Start the application
CMD ["node", "dist/cli.js"]
```

### Worker/Daemon Applications

For long-running workers or daemons, use alternative healthcheck strategies:

#### Option 1: File-based Healthcheck

```dockerfile
# Create a healthcheck that verifies the worker is processing
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD test -f /tmp/worker-healthy || exit 1
```

In your worker code:

```typescript
// src/worker.ts
import { writeFileSync, unlinkSync } from 'fs';

// Write health file on successful processing
function markHealthy() {
  writeFileSync('/tmp/worker-healthy', Date.now().toString());
}

// Remove health file on errors
function markUnhealthy() {
  try {
    unlinkSync('/tmp/worker-healthy');
  } catch {
    // File might not exist
  }
}

// Update health status in your worker loop
async function processWork() {
  try {
    // Do work...
    markHealthy();
  } catch (error) {
    markUnhealthy();
    throw error;
  }
}
```

#### Option 2: Process-based Healthcheck

```dockerfile
# Check if the Node.js process is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD pgrep -x node || exit 1
```

#### Option 3: Custom Script Healthcheck

```dockerfile
# Copy a custom health check script
COPY healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/healthcheck.sh

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh
```

### API Services

For API services with external dependencies:

```typescript
// src/health.ts
import express from 'express';
import { Pool } from 'pg'; // Example: PostgreSQL
import Redis from 'ioredis'; // Example: Redis

const app = express();
const db = new Pool(/* config */);
const redis = new Redis(/* config */);

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
  timestamp: string;
  uptime: number;
}

app.get('/health', async (req, res) => {
  const health: HealthStatus = {
    status: 'healthy',
    checks: {},
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  // Check database
  try {
    const start = Date.now();
    await db.query('SELECT 1');
    health.checks.database = {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'down',
      error: error.message,
    };
  }

  // Check Redis
  try {
    const start = Date.now();
    await redis.ping();
    health.checks.redis = {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
    health.checks.redis = {
      status: 'down',
      error: error.message,
    };
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

## Building and Running

### Basic Docker Commands

```bash
# Build the image
docker build -t my-app .

# Run with default healthcheck (for web services)
docker run -p 3000:3000 my-app

# Run without healthcheck (override at runtime)
docker run --no-healthcheck -p 3000:3000 my-app

# Check health status
docker inspect --format='{{.State.Health.Status}}' <container-id>
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    # Override healthcheck if needed
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    # Or disable healthcheck
    # healthcheck:
    #   disable: true
```

## Container Orchestration

### Kubernetes

For Kubernetes deployments, use native probes instead of Docker healthchecks:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: my-app:latest
          ports:
            - containerPort: 3000
          # Liveness probe (restarts container if unhealthy)
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 30
          # Readiness probe (removes from load balancer if not ready)
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

### AWS ECS

For ECS task definitions:

```json
{
  "family": "my-app",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "my-app:latest",
      "portMappings": [
        {
          "containerPort": 3000
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 3,
        "retries": 3,
        "startPeriod": 5
      }
    }
  ]
}
```

## Troubleshooting

### Common Issues

#### Container Exits Immediately

If your container exits immediately, it might be due to:

1. **Missing health endpoint**: Implement `/health` endpoint if using default config
2. **Wrong port**: Ensure your app listens on port 3000 or update the healthcheck
3. **Startup time**: Increase `--start-period` if your app needs more time to start

#### Container Never Becomes Healthy

Check these common causes:

1. **Port mismatch**: Verify your app listens on the expected port
2. **Path mismatch**: Ensure health endpoint path matches the healthcheck
3. **Network issues**: Container might not be able to reach localhost

Debug with:

```bash
# Check container logs
docker logs <container-id>

# Execute healthcheck manually
docker exec <container-id> node -e "require('http').get('http://localhost:3000/health', (r) => {console.log('Status:', r.statusCode)})"

# Inspect health status
docker inspect <container-id> | jq '.[0].State.Health'
```

#### Custom Port Configuration

If your app uses a different port:

```dockerfile
# Update EXPOSE directive
EXPOSE 8080

# Update healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1
```

### Testing Healthchecks Locally

```bash
# Build and run with health status monitoring
docker build -t test-health .
docker run -d --name test-health-container test-health

# Watch health status
watch docker inspect --format='{{.State.Health.Status}}' test-health-container

# View health check logs
docker inspect test-health-container | jq '.[0].State.Health.Log'

# Clean up
docker stop test-health-container
docker rm test-health-container
```

## Best Practices

1. **Keep health endpoints simple**: Avoid expensive operations in health checks
2. **Use appropriate timeouts**: Balance between quick failure detection and false positives
3. **Consider dependencies**: Only check critical dependencies in health endpoints
4. **Log health checks**: Help with debugging but avoid log spam
5. **Secure health endpoints**: Consider authentication for detailed health information
6. **Version your health API**: Include version information in health responses
7. **Monitor trends**: Track health check failures over time

## Additional Resources

- [Docker HEALTHCHECK documentation](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Kubernetes Probes documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [The Twelve-Factor App: Disposability](https://12factor.net/disposability)
- [Health Check Response Format for HTTP APIs (RFC)](https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check)
