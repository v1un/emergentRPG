#!/bin/bash

# EmergentRPG Simple Start Script
# Quick and reliable startup for development

# Check for help flag FIRST
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "EmergentRPG Simple Start Script"
    echo
    echo "Usage: $0 [MODE]"
    echo
    echo "MODES:"
    echo "  development    Start in development mode (default)"
    echo "  production     Start in production mode"
    echo
    echo "ENVIRONMENT VARIABLES:"
    echo "  SKIP_DEPS=true         Skip dependency installation"
    echo "  VERBOSE=true           Enable verbose logging"
    echo "  BACKEND_PORT=8001      Backend port (default: 8001)"
    echo "  FRONTEND_PORT=3000     Frontend port (default: 3000)"
    echo
    echo "EXAMPLES:"
    echo "  $0                     # Start in development mode"
    echo "  $0 production          # Start in production mode"
    echo "  VERBOSE=true $0        # Start with verbose logging"
    echo "  SKIP_DEPS=true $0      # Start without installing dependencies"
    echo
    exit 0
fi

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_DIR="$PROJECT_ROOT/venv"
LOG_DIR="$PROJECT_ROOT/logs"

# Runtime configuration
MODE="${1:-development}"
SKIP_DEPS="${SKIP_DEPS:-false}"
VERBOSE="${VERBOSE:-false}"
BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# Process tracking
BACKEND_PID=""
FRONTEND_PID=""

# Create logs directory
mkdir -p "$LOG_DIR"

echo -e "${GREEN}🎮 Starting EmergentRPG AI Dungeon Clone${NC}"
echo -e "${YELLOW}Project Root: $PROJECT_ROOT${NC}"
echo -e "${BLUE}Mode: $MODE${NC}\n"

# Utility functions
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Check system dependencies
check_deps() {
    log_info "Checking system dependencies..."

    local missing_deps=()

    if ! command_exists python3; then
        missing_deps+=("python3")
    fi

    if ! command_exists node; then
        missing_deps+=("nodejs")
    fi

    if ! command_exists npm; then
        missing_deps+=("npm")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        if command_exists pacman; then
            echo -e "${GREEN}Install with: sudo pacman -S ${missing_deps[*]}${NC}"
        fi
        exit 1
    fi

    log_info "✓ All dependencies found"
}

# Setup Python environment
setup_python() {
    log_info "Setting up Python environment..."

    # Initialize pyenv properly for zsh
    if command_exists pyenv; then
        log_debug "Initializing pyenv..."
        export PYENV_ROOT="$HOME/.pyenv"
        export PATH="$PYENV_ROOT/bin:$PATH"

        # Initialize pyenv for current shell
        if [[ -n "${ZSH_VERSION:-}" ]]; then
            eval "$(pyenv init - zsh)"
        else
            eval "$(pyenv init -)"
        fi

        # Check current pyenv version
        local pyenv_version
        pyenv_version=$(pyenv version-name 2>/dev/null || echo "system")
        log_info "Using pyenv Python version: $pyenv_version"

        # Get Python binary from pyenv
        local python_bin
        python_bin=$(pyenv which python 2>/dev/null || pyenv which python3 2>/dev/null)

        if [[ -z "$python_bin" ]]; then
            log_error "Could not find Python through pyenv"
            log_error "Current pyenv version: $pyenv_version"
            log_error "Try: pyenv install 3.11.12 && pyenv local 3.11.12"
            exit 1
        fi

        log_debug "Using Python: $python_bin"
        log_debug "Python version: $($python_bin --version)"
    else
        log_warn "pyenv not found, using system Python"
        python_bin=$(which python3 2>/dev/null || which python)
        if [[ -z "$python_bin" ]]; then
            log_error "No Python found"
            exit 1
        fi
    fi

    # Create venv if needed
    if [ ! -d "$VENV_DIR" ]; then
        log_info "Creating virtual environment with $python_bin..."
        $python_bin -m venv "$VENV_DIR"

        if [ ! -d "$VENV_DIR" ]; then
            log_error "Failed to create virtual environment"
            log_error "Make sure you have python3-venv: sudo pacman -S python-virtualenv"
            exit 1
        fi
    else
        log_debug "Virtual environment already exists"
    fi

    # Activate venv
    source "$VENV_DIR/bin/activate"

    # Verify activation
    if [[ -z "${VIRTUAL_ENV:-}" ]]; then
        log_error "Virtual environment activation failed"
        exit 1
    fi

    log_info "✓ Virtual environment activated"
    log_debug "Virtual env Python: $(which python)"
    log_debug "Virtual env Python version: $(python --version)"

    # Install dependencies
    if [[ "$SKIP_DEPS" != "true" ]]; then
        log_info "Installing Python dependencies..."

        # Show progress for pip upgrade
        echo -n "  Upgrading pip... "
        local pip_quiet_flag=""
        if [[ "$VERBOSE" != "true" ]]; then
            pip_quiet_flag="--quiet"
        fi

        if pip install --upgrade pip $pip_quiet_flag; then
            echo "✓"
        else
            echo "✗"
            log_error "Failed to upgrade pip"
            exit 1
        fi

        # Install from requirements.txt if it exists
        if [ -f "$BACKEND_DIR/requirements.txt" ]; then
            echo -n "  Installing from requirements.txt... "
            log_debug "Running: pip install -r $BACKEND_DIR/requirements.txt"

            if [[ "$VERBOSE" == "true" ]]; then
                echo  # New line for verbose output
                log_info "This may take a few minutes for large packages..."
                timeout 300 pip install -r "$BACKEND_DIR/requirements.txt" --progress-bar on
                local pip_result=$?
            else
                # Use timeout to prevent infinite hanging
                timeout 300 pip install -r "$BACKEND_DIR/requirements.txt" --quiet --progress-bar off
                local pip_result=$?
            fi

            if [ $pip_result -eq 0 ]; then
                if [[ "$VERBOSE" != "true" ]]; then echo "✓"; fi
                log_info "✓ Python dependencies installed successfully"
            elif [ $pip_result -eq 124 ]; then
                if [[ "$VERBOSE" != "true" ]]; then echo "⏰"; fi
                log_error "Pip installation timed out after 5 minutes"
                log_error "Try running manually: pip install -r $BACKEND_DIR/requirements.txt"
                exit 1
            else
                if [[ "$VERBOSE" != "true" ]]; then echo "✗"; fi
                log_error "Failed to install Python dependencies (exit code: $pip_result)"
                log_error "Try running: pip install -r $BACKEND_DIR/requirements.txt"
                exit 1
            fi
        else
            log_warn "No requirements.txt found, installing essential packages..."
            echo -n "  Installing essential packages... "

            if [[ "$VERBOSE" == "true" ]]; then
                echo  # New line for verbose output
                pip install fastapi uvicorn pymongo motor google-generativeai python-dotenv
                local pip_result=$?
            else
                pip install --quiet fastapi uvicorn pymongo motor google-generativeai python-dotenv
                local pip_result=$?
            fi

            if [ $pip_result -eq 0 ]; then
                if [[ "$VERBOSE" != "true" ]]; then echo "✓"; fi
            else
                if [[ "$VERBOSE" != "true" ]]; then echo "✗"; fi
                log_error "Failed to install essential packages"
                exit 1
            fi
        fi

        log_info "✓ Python dependencies installed"
    else
        log_info "Skipping Python dependency installation"
    fi
}

# Setup environment file
setup_env() {
    log_info "Checking environment configuration..."

    local env_file="$BACKEND_DIR/.env"
    if [ ! -f "$env_file" ]; then
        log_warn "Creating default .env file..."
        cat > "$env_file" << EOF
# Google AI Studio API Key
GOOGLE_API_KEY=your_google_api_key_here

# MongoDB Configuration
MONGO_URL=mongodb+srv://viunuvi:031310Bm@cluster0.omhvrhb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Backend Configuration
HOST=127.0.0.1
PORT=$BACKEND_PORT
RELOAD=$([[ "$MODE" == "development" ]] && echo "true" || echo "false")
LOG_LEVEL=INFO

# Frontend URL (for CORS)
CORS_ORIGINS=http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT

# Development settings
DEBUG=$([[ "$MODE" == "development" ]] && echo "true" || echo "false")
EOF
        log_warn "Please edit $env_file and configure your API keys!"
    fi

    log_info "✓ Environment configuration ready"
}

# Install frontend dependencies
setup_frontend() {
    if [[ "$SKIP_DEPS" != "true" ]]; then
        log_info "Installing frontend dependencies..."
        cd "$FRONTEND_DIR"

        if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
            echo -n "  Installing npm packages... "
            if npm install --silent; then
                echo "✓"
            else
                echo "✗"
                log_error "Failed to install frontend dependencies"
                log_error "Try running: cd $FRONTEND_DIR && npm install"
                exit 1
            fi
        else
            log_info "  Frontend dependencies already up to date"
        fi

        cd "$PROJECT_ROOT"
        log_info "✓ Frontend dependencies ready"
    else
        log_info "Skipping frontend dependency installation"
    fi
}

# Start backend
start_backend() {
    log_info "Starting backend server..."

    source "$VENV_DIR/bin/activate"
    export PYTHONPATH="$BACKEND_DIR:${PYTHONPATH:-}"

    cd "$BACKEND_DIR"

    if [ -f "$PROJECT_ROOT/scripts/start_backend.py" ]; then
        python "$PROJECT_ROOT/scripts/start_backend.py" > "$LOG_DIR/backend.log" 2>&1 &
    else
        python -m uvicorn main:app --host 127.0.0.1 --port "$BACKEND_PORT" --reload > "$LOG_DIR/backend.log" 2>&1 &
    fi

    BACKEND_PID=$!
    echo "$BACKEND_PID" > "$LOG_DIR/backend.pid"

    cd "$PROJECT_ROOT"
    log_info "✓ Backend started (PID: $BACKEND_PID)"
}

# Start frontend
start_frontend() {
    log_info "Starting frontend server..."

    cd "$FRONTEND_DIR"
    export PORT="$FRONTEND_PORT"
    export BROWSER=none

    npm start > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "$FRONTEND_PID" > "$LOG_DIR/frontend.pid"

    cd "$PROJECT_ROOT"
    log_info "✓ Frontend started (PID: $FRONTEND_PID)"
}

# Wait for services
wait_for_services() {
    log_info "Waiting for services to be ready..."

    # Wait for backend with progress indication
    echo -n "  Waiting for backend (http://localhost:$BACKEND_PORT/api/health)... "
    local attempts=0
    local max_attempts=30

    while ! curl -sf "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1; do
        if [ $attempts -ge $max_attempts ]; then
            echo "✗"
            log_error "Backend failed to start after $((max_attempts * 2)) seconds"
            log_error "Check backend logs: tail -f $LOG_DIR/backend.log"
            return 1
        fi

        # Show progress dots
        if [ $((attempts % 5)) -eq 0 ] && [ $attempts -gt 0 ]; then
            echo -n "."
        fi

        sleep 2
        ((attempts++))
    done
    echo "✓"
    log_info "✓ Backend is ready"

    # Wait for frontend with progress indication
    echo -n "  Waiting for frontend (http://localhost:$FRONTEND_PORT)... "
    attempts=0
    max_attempts=60

    while ! curl -sf "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; do
        if [ $attempts -ge $max_attempts ]; then
            echo "⚠"
            log_warn "Frontend may still be starting (this is normal for React apps)"
            break
        fi

        # Show progress dots
        if [ $((attempts % 10)) -eq 0 ] && [ $attempts -gt 0 ]; then
            echo -n "."
        fi

        sleep 2
        ((attempts++))
    done

    if [ $attempts -lt $max_attempts ]; then
        echo "✓"
        log_info "✓ Frontend is ready"
    else
        log_info "✓ Frontend should be starting (check http://localhost:$FRONTEND_PORT)"
    fi
}

# Display info
display_info() {
    echo
    echo -e "${GREEN}==================================================${NC}"
    echo -e "${GREEN}🎮 EmergentRPG is running successfully!${NC}"
    echo -e "${GREEN}==================================================${NC}"
    echo -e "Mode: ${BLUE}$MODE${NC}"
    echo -e "Frontend: ${YELLOW}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "Backend API: ${YELLOW}http://localhost:$BACKEND_PORT${NC}"
    echo -e "API Docs: ${YELLOW}http://localhost:$BACKEND_PORT/docs${NC}"
    echo
    echo -e "Logs: ${BLUE}$LOG_DIR${NC}"
    echo -e "Backend PID: ${BLUE}$BACKEND_PID${NC}"
    echo -e "Frontend PID: ${BLUE}$FRONTEND_PID${NC}"
    echo
    echo -e "Press ${RED}Ctrl+C${NC} to stop all services"
    echo -e "${GREEN}==================================================${NC}"
    echo
}

# Cleanup function
cleanup() {
    echo
    log_info "Shutting down services..."

    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null
        rm -f "$LOG_DIR/backend.pid"
    fi

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null
        rm -f "$LOG_DIR/frontend.pid"
    fi

    log_info "✓ All services stopped"
    exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

# Validate mode
if [[ "$MODE" != "development" ]] && [[ "$MODE" != "production" ]]; then
    log_error "Invalid mode: $MODE. Use 'development' or 'production'"
    exit 1
fi

# Main execution
main() {
    log_info "Starting EmergentRPG in $MODE mode..."

    check_deps
    setup_python
    setup_env
    setup_frontend
    start_backend
    start_frontend

    if wait_for_services; then
        display_info

        # Keep running
        while true; do
            sleep 10

            # Check if processes are still running
            if [ -n "$BACKEND_PID" ] && ! kill -0 "$BACKEND_PID" 2>/dev/null; then
                log_error "Backend process died"
                cleanup
                exit 1
            fi

            if [ -n "$FRONTEND_PID" ] && ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
                log_error "Frontend process died"
                cleanup
                exit 1
            fi
        done
    else
        log_error "Failed to start services"
        cleanup
        exit 1
    fi
}

# Run main function
main
