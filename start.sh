#!/bin/zsh

# EmergentRPG Start Script
# Optimized for Arch Linux + zsh + pyenv setup
# Author: AI Assistant
# Description: Comprehensive startup script for emergentRPG backend and frontend

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="emergentRPG"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
PYTHON_VERSION="3.11.12"
BACKEND_PORT="8001"
FRONTEND_PORT="3000"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# Logging function
log() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

log_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# Banner
print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                        EmergentRPG                          ║"
    echo "║                    Development Server                       ║"
    echo "║                                                              ║"
    echo "║  AI-Driven Storytelling Framework                          ║"
    echo "║  Backend: FastAPI + MongoDB + Redis + Gemini               ║"
    echo "║  Frontend: Next.js + React + TypeScript                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system dependencies
check_system_dependencies() {
    log "🔍 Checking system dependencies..."
    
    local missing_deps=()
    
    # Check pyenv
    if ! command_exists pyenv; then
        missing_deps+=("pyenv")
        log_error "pyenv not found. Install with: curl https://pyenv.run | bash"
    else
        log_success "pyenv found"
    fi
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("node")
        log_error "Node.js not found. Install with: pacman -S nodejs npm"
    else
        local node_version=$(node --version)
        log_success "Node.js found: $node_version"
    fi
    
    # Check npm
    if ! command_exists npm; then
        missing_deps+=("npm")
        log_error "npm not found. Install with Node.js"
    else
        local npm_version=$(npm --version)
        log_success "npm found: v$npm_version"
    fi
    
    # Check MongoDB (optional but recommended)
    if ! command_exists mongod; then
        log_warning "MongoDB not found. Install with: pacman -S mongodb-bin"
        log_info "You can also use MongoDB Atlas (cloud) instead"
    else
        log_success "MongoDB found"
    fi
    
    # Check Redis (optional but recommended)
    if ! command_exists redis-server; then
        log_warning "Redis not found. Install with: pacman -S redis"
        log_info "Redis is used for caching and can improve performance"
    else
        log_success "Redis found"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_info "Please install missing dependencies and run the script again"
        exit 1
    fi
}

# Initialize pyenv
init_pyenv() {
    log "🐍 Initializing pyenv..."
    
    # Initialize pyenv for zsh
    if [[ -d "$HOME/.pyenv" ]]; then
        export PYENV_ROOT="$HOME/.pyenv"
        export PATH="$PYENV_ROOT/bin:$PATH"
        eval "$(pyenv init --path)"
        eval "$(pyenv init -)"
        
        # Check if pyenv-virtualenv is available
        if [[ -d "$PYENV_ROOT/plugins/pyenv-virtualenv" ]]; then
            eval "$(pyenv virtualenv-init -)"
        fi
        
        log_success "pyenv initialized"
    else
        log_error "pyenv not found in $HOME/.pyenv"
        exit 1
    fi
}

# Check Python version
check_python_version() {
    log "🐍 Checking Python version..."
    
    cd "$PROJECT_ROOT"
    
    # Check if .python-version exists
    if [[ ! -f ".python-version" ]]; then
        log_warning ".python-version not found, creating one..."
        echo "$PYTHON_VERSION" > .python-version
    fi
    
    local required_version=$(cat .python-version)
    log_info "Required Python version: $required_version"
    
    # Check if required Python version is installed
    if ! pyenv versions --bare | grep -q "^$required_version$"; then
        log_warning "Python $required_version not installed via pyenv"
        log_info "Installing Python $required_version..."
        pyenv install "$required_version"
    fi
    
    # Set local Python version
    pyenv local "$required_version"
    
    local current_version=$(python --version 2>&1 | cut -d' ' -f2)
    log_success "Using Python $current_version"
}

# Setup Python virtual environment
setup_python_venv() {
    log "📦 Setting up Python virtual environment..."
    
    cd "$PROJECT_ROOT"
    
    # Check if venv exists
    if [[ ! -d "venv" ]]; then
        log_info "Creating virtual environment..."
        python -m venv venv
        log_success "Virtual environment created"
    else
        log_success "Virtual environment already exists"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    log_success "Virtual environment activated"
    
    # Upgrade pip
    log_info "Upgrading pip..."
    pip install --upgrade pip
    
    # Install backend dependencies
    log_info "Installing backend dependencies..."
    cd "$PROJECT_ROOT/$BACKEND_DIR"
    pip install -r requirements.txt
    log_success "Backend dependencies installed"
}

# Setup frontend dependencies
setup_frontend_deps() {
    log "📦 Setting up frontend dependencies..."
    
    cd "$PROJECT_ROOT/$FRONTEND_DIR"
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing frontend dependencies..."
        npm install
        log_success "Frontend dependencies installed"
    else
        log_info "Checking for dependency updates..."
        npm ci
        log_success "Frontend dependencies verified"
    fi
}

# Check environment configuration
check_environment() {
    log "🔧 Checking environment configuration..."
    
    cd "$PROJECT_ROOT/$BACKEND_DIR"
    
    # Check if .env file exists
    if [[ ! -f ".env" ]]; then
        log_warning ".env file not found in backend directory"
        log_info "Creating .env template..."
        
        cat > .env << 'EOF'
# Database Configuration
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=emergent_rpg

# AI Configuration
GOOGLE_API_KEY=your_google_ai_api_key_here
GEMINI_MODEL=gemini-2.5-flash-preview-05-20
GEMINI_REQUESTS_PER_MINUTE=60
MAX_CONTEXT_LENGTH=32000
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2048

# API Configuration
CORS_ORIGINS=http://localhost:3000
DEBUG=True
LOG_LEVEL=INFO
HOST=127.0.0.1
PORT=8001

# Cache Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
EOF
        
        log_warning "Please edit backend/.env with your actual configuration"
        log_info "Especially set your GOOGLE_API_KEY for AI functionality"
    else
        log_success "Environment file found"
    fi
    
    # Check critical environment variables
    source .env 2>/dev/null || true
    
    if [[ -z "$GOOGLE_API_KEY" || "$GOOGLE_API_KEY" == "your_google_ai_api_key_here" ]]; then
        log_warning "GOOGLE_API_KEY not configured - AI features will not work"
    fi
}

# Start services function
start_services() {
    log "🚀 Starting services..."

    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"

    # Function to cleanup background processes
    cleanup() {
        log_info "Shutting down services..."
        jobs -p | xargs -r kill
        exit 0
    }

    # Set trap for cleanup
    trap cleanup SIGINT SIGTERM

    # Start backend
    log_info "Starting backend server on port $BACKEND_PORT..."
    cd "$PROJECT_ROOT"
    source venv/bin/activate
    cd "$BACKEND_DIR"

    # Start backend in background
    uvicorn main:app --host 127.0.0.1 --port "$BACKEND_PORT" --reload > "../logs/backend.log" 2>&1 &
    BACKEND_PID=$!

    # Wait a moment for backend to start
    sleep 3

    # Check if backend started successfully
    if kill -0 $BACKEND_PID 2>/dev/null; then
        log_success "Backend server started (PID: $BACKEND_PID)"
    else
        log_error "Failed to start backend server"
        log_info "Check logs/backend.log for details"
        exit 1
    fi

    # Start frontend
    log_info "Starting frontend server on port $FRONTEND_PORT..."
    cd "$PROJECT_ROOT/$FRONTEND_DIR"

    # Start frontend in background
    npm run dev > "../logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!

    # Wait a moment for frontend to start
    sleep 5

    # Check if frontend started successfully
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        log_success "Frontend server started (PID: $FRONTEND_PID)"
    else
        log_error "Failed to start frontend server"
        log_info "Check logs/frontend.log for details"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi

    # Display service information
    echo ""
    log_success "🎉 EmergentRPG is now running!"
    echo ""
    echo -e "${GREEN}📊 Service Status:${NC}"
    echo -e "  ${BLUE}Backend:${NC}  http://localhost:$BACKEND_PORT"
    echo -e "  ${BLUE}Frontend:${NC} http://localhost:$FRONTEND_PORT"
    echo -e "  ${BLUE}API Docs:${NC} http://localhost:$BACKEND_PORT/docs"
    echo -e "  ${BLUE}Health:${NC}   http://localhost:$BACKEND_PORT/api/health"
    echo ""
    echo -e "${YELLOW}📝 Logs:${NC}"
    echo -e "  ${BLUE}Backend:${NC}  tail -f logs/backend.log"
    echo -e "  ${BLUE}Frontend:${NC} tail -f logs/frontend.log"
    echo ""
    echo -e "${CYAN}Press Ctrl+C to stop all services${NC}"
    echo ""

    # Wait for user interrupt
    wait
}

# Main execution
main() {
    print_banner

    log "🚀 Starting EmergentRPG development environment..."

    check_system_dependencies
    init_pyenv
    check_python_version
    setup_python_venv
    setup_frontend_deps
    check_environment
    start_services
}

# Run main function
main "$@"
