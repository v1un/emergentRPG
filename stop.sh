#!/bin/zsh

# EmergentRPG Stop Script
# Optimized for Arch Linux + zsh + pyenv setup
# Author: AI Assistant
# Description: Stop all emergentRPG services gracefully

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project configuration
BACKEND_PORT="8001"
FRONTEND_PORT="3000"

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

# Stop processes by port
stop_by_port() {
    local port=$1
    local service_name=$2
    
    log_info "Stopping $service_name on port $port..."
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [[ -n "$pids" ]]; then
        echo "$pids" | while read -r pid; do
            if [[ -n "$pid" ]]; then
                log_info "Killing process $pid ($service_name)"
                kill -TERM "$pid" 2>/dev/null || true
                
                # Wait a moment for graceful shutdown
                sleep 2
                
                # Force kill if still running
                if kill -0 "$pid" 2>/dev/null; then
                    log_warning "Force killing process $pid"
                    kill -KILL "$pid" 2>/dev/null || true
                fi
            fi
        done
        log_success "$service_name stopped"
    else
        log_info "No $service_name processes found on port $port"
    fi
}

# Stop Node.js processes (frontend)
stop_node_processes() {
    log_info "Stopping Node.js processes..."
    
    # Find Node.js processes related to our project
    local node_pids=$(pgrep -f "next dev\|npm.*dev" 2>/dev/null || true)
    
    if [[ -n "$node_pids" ]]; then
        echo "$node_pids" | while read -r pid; do
            if [[ -n "$pid" ]]; then
                log_info "Killing Node.js process $pid"
                kill -TERM "$pid" 2>/dev/null || true
                sleep 1
                if kill -0 "$pid" 2>/dev/null; then
                    kill -KILL "$pid" 2>/dev/null || true
                fi
            fi
        done
        log_success "Node.js processes stopped"
    else
        log_info "No Node.js development processes found"
    fi
}

# Stop Python processes (backend)
stop_python_processes() {
    log_info "Stopping Python processes..."
    
    # Find Python processes related to our project
    local python_pids=$(pgrep -f "uvicorn.*main:app\|python.*main.py" 2>/dev/null || true)
    
    if [[ -n "$python_pids" ]]; then
        echo "$python_pids" | while read -r pid; do
            if [[ -n "$pid" ]]; then
                log_info "Killing Python process $pid"
                kill -TERM "$pid" 2>/dev/null || true
                sleep 1
                if kill -0 "$pid" 2>/dev/null; then
                    kill -KILL "$pid" 2>/dev/null || true
                fi
            fi
        done
        log_success "Python processes stopped"
    else
        log_info "No Python development processes found"
    fi
}

# Main stop function
main() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                   Stopping EmergentRPG                      ║"
    echo "║                  Development Services                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log "🛑 Stopping EmergentRPG development services..."
    
    # Stop by ports first (most reliable)
    stop_by_port "$BACKEND_PORT" "Backend (FastAPI)"
    stop_by_port "$FRONTEND_PORT" "Frontend (Next.js)"
    
    # Stop by process patterns (backup method)
    stop_python_processes
    stop_node_processes
    
    # Clean up any remaining processes
    log_info "Cleaning up any remaining development processes..."
    pkill -f "uvicorn.*emergentRPG\|next.*emergentRPG" 2>/dev/null || true
    
    log_success "🎉 All EmergentRPG services stopped!"
    
    # Show final status
    echo ""
    log_info "Port status check:"
    if lsof -ti:$BACKEND_PORT >/dev/null 2>&1; then
        log_warning "Port $BACKEND_PORT still in use"
    else
        log_success "Port $BACKEND_PORT is free"
    fi
    
    if lsof -ti:$FRONTEND_PORT >/dev/null 2>&1; then
        log_warning "Port $FRONTEND_PORT still in use"
    else
        log_success "Port $FRONTEND_PORT is free"
    fi
}

# Run main function
main "$@"
