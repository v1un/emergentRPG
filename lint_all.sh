#!/bin/bash

# Master linting script for EmergentRPG project

set -e  # Exit on error

echo "🔍 Running ESLint setup for EmergentRPG..."
echo "=================================================="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Frontend linting
echo -e "${YELLOW}📱 Running frontend (React) linting...${NC}"
cd "$PROJECT_ROOT/frontend"
npm run lint
echo -e "${GREEN}✅ Frontend linting completed!${NC}\n"

# Backend linting
echo -e "${YELLOW}🐍 Running backend (Python) linting...${NC}"
cd "$PROJECT_ROOT/backend"
./lint.sh
echo -e "${GREEN}✅ Backend linting completed!${NC}\n"

echo -e "${GREEN}🎉 All linting checks passed!${NC}"
