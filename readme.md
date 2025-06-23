# 🎯 StageTimer - Monorepo

A production-ready stage timer application with real-time multi-device sync, built with React, Node.js, Socket.io, and PostgreSQL.

## 🏗️ Architecture

This is a monorepo containing:

- **`frontend/`** - React + Vite client with Zustand + TanStack Query
- **`backend/`** - Express + Socket.io server with PostgreSQL
- **`packages/db/`** - Shared Drizzle ORM schema and types
- **`old/`** - Previous Firebase-based implementation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- PostgreSQL database

### Installation

1. Clone and install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database URL
   ```

3. Set up the database:
   ```bash
   pnpm --filter backend db:generate
   pnpm --filter backend db:migrate
   ```

4. Start development servers:
   ```bash
   pnpm dev
   ```

This starts both frontend (http://localhost:5173) and backend (http://localhost:3001).

## 🎮 Usage

- **Controller**: http://localhost:5173/control - Timer management interface
- **Display**: http://localhost:5173/ - Full-screen display for TV/projector
- **Room-based**: Multiple timer setups can coexist with unique room slugs

## 📁 Project Structure

```
stage-timer/
├── frontend/           # React client
│   ├── src/
│   │   ├── components/ # UI components (timer-preview.tsx, etc.)
│   │   ├── hooks/      # Custom hooks (use-timer-sessions.ts, etc.)
│   │   ├── stores/     # Zustand stores
│   │   └── lib/        # Utilities and API client
├── backend/            # Express server
│   ├── src/
│   │   ├── routes/     # REST API endpoints
│   │   ├── socket/     # Socket.io event handlers
│   │   └── db/         # Database connection and migrations
├── packages/db/        # Shared database schema
│   └── src/
│       ├── schema.ts   # Drizzle schema definitions
│       └── types.ts    # TypeScript types
└── old/               # Previous Firebase implementation
```

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev

# Start individual services
pnpm dev:frontend
pnpm dev:backend

# Build all packages
pnpm build

# Database operations
pnpm --filter backend db:generate  # Generate migrations
pnpm --filter backend db:migrate   # Run migrations
pnpm --filter backend db:studio    # Open Drizzle Studio

# Linting and type checking
pnpm lint
pnpm type-check
```

## 🚀 Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render
- **Database**: PostgreSQL on Render (free tier available)

## 🎯 Key Features

- **Real-time Sync**: Socket.io for instant updates across devices
- **Room-based**: Multi-tenant architecture with room isolation
- **Modern Stack**: React 19, Express, PostgreSQL, TypeScript
- **State Management**: Zustand + TanStack Query + Socket.io
- **Type Safety**: Full TypeScript with shared types
- **Scalable**: Designed for production use

## 📝 Migration from Firebase

The `old/` directory contains the previous Firebase implementation. Key improvements in the new architecture:

- ✅ Eliminated Firebase costs and vendor lock-in
- ✅ Better performance with local state + caching
- ✅ Improved component decoupling
- ✅ Room-based multi-tenancy
- ✅ Full control over backend logic

## 📄 License

MIT
