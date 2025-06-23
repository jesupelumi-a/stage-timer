#!/bin/bash

# Stage Timer Development Environment Setup Script

set -e

echo "🎯 Setting up Stage Timer development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is installed
check_postgresql() {
    print_status "Checking PostgreSQL installation..."
    
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL is installed"
        psql --version
    else
        print_error "PostgreSQL is not installed"
        echo "Please install PostgreSQL:"
        echo "  macOS: brew install postgresql"
        echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
        echo "  Windows: Download from https://www.postgresql.org/download/"
        exit 1
    fi
}

# Check if PostgreSQL service is running
check_postgresql_service() {
    print_status "Checking PostgreSQL service..."
    
    if pg_isready -q; then
        print_success "PostgreSQL service is running"
    else
        print_warning "PostgreSQL service is not running"
        echo "Starting PostgreSQL service..."
        
        # Try to start PostgreSQL (macOS with Homebrew)
        if command -v brew &> /dev/null; then
            brew services start postgresql || true
        fi
        
        # Check again
        if pg_isready -q; then
            print_success "PostgreSQL service started"
        else
            print_error "Could not start PostgreSQL service"
            echo "Please start PostgreSQL manually:"
            echo "  macOS: brew services start postgresql"
            echo "  Ubuntu: sudo systemctl start postgresql"
            exit 1
        fi
    fi
}

# Create development database
create_database() {
    print_status "Creating development database..."
    
    DB_NAME="stage_timer_dev"
    
    if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        print_warning "Database '$DB_NAME' already exists"
    else
        createdb $DB_NAME
        print_success "Created database '$DB_NAME'"
    fi
}

# Setup environment variables
setup_env_vars() {
    print_status "Setting up environment variables..."
    
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env from example"
    else
        print_warning "backend/.env already exists"
    fi
    
    # Update DATABASE_URL in .env if needed
    if grep -q "postgresql://localhost:5432/stage_timer_dev" backend/.env; then
        print_success "Database URL is correctly configured"
    else
        print_warning "Please update DATABASE_URL in backend/.env"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if command -v pnpm &> /dev/null; then
        pnpm install
        print_success "Dependencies installed with pnpm"
    else
        print_error "pnpm is not installed"
        echo "Please install pnpm: npm install -g pnpm"
        exit 1
    fi
}

# Build packages
build_packages() {
    print_status "Building packages..."
    
    pnpm --filter db build
    print_success "Database package built"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    pnpm --filter backend db:generate
    print_success "Database migrations generated"
    
    # Note: We don't run migrations automatically as they require a running database
    print_warning "To run migrations, use: pnpm --filter backend db:migrate"
}

# Main setup function
main() {
    echo "🚀 Starting development environment setup..."
    echo ""
    
    check_postgresql
    check_postgresql_service
    create_database
    setup_env_vars
    install_dependencies
    build_packages
    run_migrations
    
    echo ""
    print_success "Development environment setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Run migrations: pnpm --filter backend db:migrate"
    echo "2. Start development servers: pnpm dev"
    echo "3. Open frontend: http://localhost:5173"
    echo "4. Open backend: http://localhost:3001"
    echo ""
    echo "Useful commands:"
    echo "  pnpm dev                    - Start both frontend and backend"
    echo "  pnpm dev:frontend          - Start only frontend"
    echo "  pnpm dev:backend           - Start only backend"
    echo "  pnpm --filter backend db:studio - Open Drizzle Studio"
    echo ""
}

# Run main function
main
