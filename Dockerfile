# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile && \
    pnpm store prune

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port (adjust as needed for your application)
EXPOSE 3000

# Health check configuration
# ⚠️ IMPORTANT: This healthcheck expects a web server with a /health endpoint on port 3000
# 
# For web services: Implement a /health endpoint (see docs/DOCKER.md for examples)
# For CLI tools: Remove or comment out this healthcheck
# For workers/daemons: Use alternative healthcheck (see docs/DOCKER.md)
#
# To disable: Comment out or replace with HEALTHCHECK NONE
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]