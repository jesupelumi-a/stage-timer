# 🛠️ Development Guide

This guide will help you set up and run the Stage Timer application in development mode.

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm** - Install with `npm install -g pnpm`
- **PostgreSQL** - [Installation guide](https://www.postgresql.org/download/)

## 🚀 Quick Setup

### Automated Setup (Recommended)

Run the setup script to automatically configure your development environment:

```bash
./scripts/setup-dev.sh
```

This script will:
- ✅ Check PostgreSQL installation and service
- ✅ Create development database
- ✅ Set up environment variables
- ✅ Install dependencies
- ✅ Build packages
- ✅ Generate database migrations

### Manual Setup

If you prefer manual setup or the script fails:

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database URL
   ```

3. **Create Database**
   ```bash
   createdb stage_timer_dev
   ```

4. **Build Packages**
   ```bash
   pnpm --filter db build
   ```

5. **Generate Migrations**
   ```bash
   pnpm --filter backend db:generate
   ```

6. **Run Migrations**
   ```bash
   pnpm --filter backend db:migrate
   ```

## 🏃‍♂️ Running the Application

### Start All Services
```bash
pnpm dev
```

This starts:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

### Start Individual Services
```bash
# Frontend only
pnpm dev:frontend

# Backend only
pnpm dev:backend
```

## 🗄️ Database Management

### Generate Migrations
```bash
pnpm --filter backend db:generate
```

### Run Migrations
```bash
pnpm --filter backend db:migrate
```

### Open Drizzle Studio
```bash
pnpm --filter backend db:studio
```

### Reset Database
```bash
dropdb stage_timer_dev
createdb stage_timer_dev
pnpm --filter backend db:migrate
```

## 🔧 Development Commands

### Building
```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter frontend build
pnpm --filter backend build
pnpm --filter db build
```

### Linting & Type Checking
```bash
# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check

# Specific package
pnpm --filter frontend lint
pnpm --filter backend type-check
```

### Cleaning
```bash
# Clean all build artifacts
pnpm clean:dist

# Clean all node_modules
pnpm clean
```

## 🌐 API Endpoints

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/health/db` - Database health check
- `GET /api/health/info` - System information (dev only)

### Rooms
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/:slug` - Get room with timers
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:slug` - Update room
- `DELETE /api/rooms/:slug` - Delete room

### Timers
- `GET /api/timers/room/:roomSlug` - Get timers for room
- `GET /api/timers/:id` - Get timer with sessions/messages
- `POST /api/timers` - Create new timer
- `PUT /api/timers/:id` - Update timer
- `DELETE /api/timers/:id` - Delete timer

## 🔌 Socket.io Events

### Room Events
- `join-room` - Join a room
- `leave-room` - Leave a room
- `room-update` - Room configuration changed

### Timer Events
- `timer-start` - Start timer
- `timer-pause` - Pause timer
- `timer-stop` - Stop timer
- `timer-reset` - Reset timer
- `timer-update` - Timer configuration changed
- `timer-sync` - Sync timer state

### Message Events
- `message-show` - Show message
- `message-hide` - Hide message
- `message-update` - Update message

## 📁 Project Structure

```
stage-timer/
├── frontend/           # React + Vite client
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom hooks
│   │   ├── stores/     # Zustand stores
│   │   ├── lib/        # Utilities and API client
│   │   └── routes/     # Route components
├── backend/            # Express + Socket.io server
│   ├── src/
│   │   ├── routes/     # REST API endpoints
│   │   ├── socket/     # Socket.io handlers
│   │   └── db/         # Database connection
├── packages/db/        # Shared database schema
│   └── src/
│       ├── schema.ts   # Drizzle schema
│       └── types.ts    # TypeScript types
└── old/               # Previous Firebase implementation
```

## 🐛 Troubleshooting

### PostgreSQL Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql

# Start PostgreSQL (Ubuntu)
sudo systemctl start postgresql
```

### Port Conflicts
- Frontend (5173): Change in `frontend/vite.config.ts`
- Backend (3001): Change `PORT` in `backend/.env`

### Database Connection Issues
- Check `DATABASE_URL` in `backend/.env`
- Ensure PostgreSQL is running
- Verify database exists: `psql -l`

### Build Issues
```bash
# Clear all caches and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

## 📝 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://localhost:5432/stage_timer_dev
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SOCKET_CORS_ORIGIN=http://localhost:5173
```

## 🎯 Next Steps

1. **Run the setup script**: `./scripts/setup-dev.sh`
2. **Start development**: `pnpm dev`
3. **Open the app**: http://localhost:5173
4. **Check API health**: http://localhost:3001/api/health

Happy coding! 🚀
