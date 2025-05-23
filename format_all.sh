#!/bin/bash

# Master formatting script for EmergentRPG project

set -e  # Exit on error

echo "🎨 Running code formatting for EmergentRPG..."
echo "=================================================="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Frontend formatting
echo -e "${YELLOW}📱 Running frontend (React) formatting...${NC}"
cd "$PROJECT_ROOT/frontend"
npm run lint:fix
echo -e "${GREEN}✅ Frontend formatting completed!${NC}\n"

# Backend formatting
echo -e "${YELLOW}🐍 Running backend (Python) formatting...${NC}"
cd "$PROJECT_ROOT/backend"
./format.sh
echo -e "${GREEN}✅ Backend formatting completed!${NC}\n"

echo -e "${GREEN}🎉 All code formatting completed!${NC}"
