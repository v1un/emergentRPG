#!/bin/bash

# EmergentRPG Start Script for Arch Linux
# This script handles Python virtual environments to avoid pip/pacman conflicts

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

echo -e "${GREEN}🎮 Starting EmergentRPG AI Dungeon Clone${NC}"
echo -e "${YELLOW}Project Root: $PROJECT_ROOT${NC}\n"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system dependencies
check_system_deps() {
    echo -e "${YELLOW}Checking system dependencies...${NC}"
    
    local missing_deps=()
    
    # Check for Python
    if ! command_exists python3; then
        missing_deps+=("python")
    fi
    
    # Check for Node.js
    if ! command_exists node; then
        missing_deps+=("nodejs")
    fi
    
    # Check for npm
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    # Check for MongoDB (optional, as it might be cloud-based)
    if ! command_exists mongod; then
        echo -e "${YELLOW}⚠️  MongoDB not found locally. Make sure you have configured a MongoDB connection in backend/.env${NC}"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}Missing system dependencies: ${missing_deps[*]}${NC}"
        echo -e "${YELLOW}Please install them using pacman:${NC}"
        echo -e "${GREEN}sudo pacman -S ${missing_deps[*]}${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All system dependencies found${NC}\n"
}

# Function to setup Python virtual environment
setup_python_env() {
    echo -e "${YELLOW}Setting up Python virtual environment...${NC}"
    
    VENV_DIR="$PROJECT_ROOT/venv"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "$VENV_DIR" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv "$VENV_DIR"
    fi
    
    # Activate virtual environment
    source "$VENV_DIR/bin/activate"
    
    echo -e "${GREEN}✓ Virtual environment activated${NC}\n"
}

# Function to install Python dependencies
install_python_deps() {
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    
    # Upgrade pip first
    pip install --upgrade pip
    
    # Install required packages
    # Since there's no requirements.txt, we'll install the packages mentioned in the code
    pip install fastapi uvicorn pymongo motor google-generativeai python-dotenv
    
    echo -e "${GREEN}✓ Python dependencies installed${NC}\n"
}

# Function to check/create .env file
setup_env_file() {
    echo -e "${YELLOW}Checking environment configuration...${NC}"
    
    ENV_FILE="$PROJECT_ROOT/backend/.env"
    
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}Creating .env file...${NC}"
        cat > "$ENV_FILE" << EOF
# Google AI Studio API Key
GOOGLE_API_KEY=your_actual_google_api_key_here

# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017/ai_dungeon_db

# Backend Configuration
BACKEND_PORT=8001
BACKEND_HOST=0.0.0.0

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
EOF
        echo -e "${RED}⚠️  Please edit $ENV_FILE and add your Google API key!${NC}"
        echo -e "${YELLOW}Visit https://makersuite.google.com/app/apikey to get your API key${NC}"
    else
        # Check if API key is still the placeholder
        if grep -q "your_actual_google_api_key_here" "$ENV_FILE"; then
            echo -e "${RED}⚠️  Google API key not configured in $ENV_FILE${NC}"
            echo -e "${YELLOW}The app will run but AI features won't work without a valid API key${NC}"
        fi
    fi
    
    echo -e "${GREEN}✓ Environment file checked${NC}\n"
}

# Function to install frontend dependencies
install_frontend_deps() {
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    
    cd "$PROJECT_ROOT/frontend"
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${GREEN}Frontend dependencies already installed${NC}"
    fi
    
    cd "$PROJECT_ROOT"
    echo -e "${GREEN}✓ Frontend dependencies ready${NC}\n"
}

# Function to start the backend
start_backend() {
    echo -e "${YELLOW}Starting backend server...${NC}"
    
    # Make sure we're in the virtual environment
    source "$PROJECT_ROOT/venv/bin/activate"
    
    # Set Python path
    export PYTHONPATH="$PROJECT_ROOT/backend:$PYTHONPATH"
    
    # Start the backend
    cd "$PROJECT_ROOT/backend"
    python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
    BACKEND_PID=$!
    
    cd "$PROJECT_ROOT"
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}\n"
}

# Function to start the frontend
start_frontend() {
    echo -e "${YELLOW}Starting frontend server...${NC}"
    
    cd "$PROJECT_ROOT/frontend"
    npm start &
    FRONTEND_PID=$!
    
    cd "$PROJECT_ROOT"
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}\n"
}

# Function to wait for services to be ready
wait_for_services() {
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    
    # Wait for backend
    while ! curl -s http://localhost:8001/api/health > /dev/null 2>&1; do
        sleep 1
        echo -n "."
    done
    echo -e "\n${GREEN}✓ Backend is ready${NC}"
    
    # Wait for frontend (give it a bit more time to compile)
    sleep 5
    echo -e "${GREEN}✓ Frontend should be ready${NC}\n"
}

# Function to display access information
display_info() {
    echo -e "${GREEN}==================================================${NC}"
    echo -e "${GREEN}🎮 EmergentRPG is running!${NC}"
    echo -e "${GREEN}==================================================${NC}"
    echo -e "Frontend: ${YELLOW}http://localhost:3000${NC}"
    echo -e "Backend API: ${YELLOW}http://localhost:8001${NC}"
    echo -e "API Docs: ${YELLOW}http://localhost:8001/docs${NC}"
    echo -e "\nPress ${RED}Ctrl+C${NC} to stop all services"
    echo -e "${GREEN}==================================================${NC}\n"
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    # Kill backend if running
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    # Kill frontend if running
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Deactivate virtual environment
    deactivate 2>/dev/null || true
    
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

# Main execution
main() {
    check_system_deps
    setup_python_env
    install_python_deps
    setup_env_file
    install_frontend_deps
    start_backend
    start_frontend
    wait_for_services
    display_info
    
    # Keep the script running
    while true; do
        sleep 1
    done
}

# Run main function
main