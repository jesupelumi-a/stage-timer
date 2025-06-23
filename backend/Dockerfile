# Backend Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend/ ./backend/
COPY packages/db/ ./packages/db/

# Build the database package first
WORKDIR /app/packages/db
RUN pnpm build

# Build the backend
WORKDIR /app/backend
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY packages/db/package.json ./packages/db/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=base /app/backend/dist ./backend/dist
COPY --from=base /app/packages/db/dist ./packages/db/dist

# Copy database migrations
COPY --from=base /app/backend/drizzle ./backend/drizzle

WORKDIR /app/backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
