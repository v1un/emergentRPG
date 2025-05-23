.PHONY: help install dev test lint format clean docker-build docker-up docker-down

# Default target
help:
	@echo "EmergentRPG Development Commands"
	@echo "================================"
	@echo "install     - Install all dependencies"
	@echo "dev         - Start development environment"
	@echo "test        - Run all tests"
	@echo "test-watch  - Run tests in watch mode"
	@echo "lint        - Run linting checks"
	@echo "format      - Format code"
	@echo "clean       - Clean build artifacts"
	@echo "docker-build - Build Docker containers"
	@echo "docker-up   - Start Docker development environment"
	@echo "docker-down - Stop Docker containers"
	@echo "docker-logs - View Docker logs"
	@echo "setup-git   - Set up Git hooks and configuration"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements-dev.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing pre-commit hooks..."
	pre-commit install

# Start development environment
dev:
	@echo "Starting development environment..."
	./start_app.sh

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && pytest
	@echo "Running frontend tests..."
	cd frontend && npm test -- --coverage --watchAll=false

# Run tests in watch mode
test-watch:
	@echo "Running tests in watch mode..."
	cd backend && pytest --watch &
	cd frontend && npm test

# Run linting
lint:
	@echo "Linting backend code..."
	cd backend && flake8 .
	cd backend && mypy .
	@echo "Linting frontend code..."
	cd frontend && npm run lint

# Format code
format:
	@echo "Formatting backend code..."
	cd backend && black .
	@echo "Formatting frontend code..."
	cd frontend && npx prettier --write src/

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/__pycache__/
	rm -rf backend/**/__pycache__/
	rm -rf backend/.pytest_cache/
	rm -rf backend/htmlcov/
	rm -rf frontend/build/
	rm -rf frontend/node_modules/.cache/
	find . -name "*.pyc" -delete
	find . -name "*.pyo" -delete

# Docker commands
docker-build:
	@echo "Building Docker containers..."
	docker-compose build

docker-up:
	@echo "Starting Docker development environment..."
	docker-compose -f docker-compose.dev.yml up -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose -f docker-compose.dev.yml down

docker-logs:
	@echo "Viewing Docker logs..."
	docker-compose -f docker-compose.dev.yml logs -f

# Production Docker commands
docker-prod-up:
	@echo "Starting production Docker environment..."
	docker-compose up -d

docker-prod-down:
	@echo "Stopping production Docker containers..."
	docker-compose down

# Git setup
setup-git:
	@echo "Setting up Git configuration..."
	git config --local core.autocrlf false
	git config --local pull.rebase true
	git config --local init.defaultBranch main
	@echo "Installing pre-commit hooks..."
	pre-commit install
	@echo "Git setup complete!"

# Database commands
db-init:
	@echo "Initializing database..."
	docker-compose -f docker-compose.dev.yml exec mongodb mongo emergentRPG /docker-entrypoint-initdb.d/init-mongo.js

db-reset:
	@echo "Resetting database..."
	docker-compose -f docker-compose.dev.yml exec mongodb mongo emergentRPG --eval "db.dropDatabase()"
	$(MAKE) db-init

# Backup and restore
backup:
	@echo "Creating database backup..."
	mkdir -p backups
	docker-compose -f docker-compose.dev.yml exec mongodb mongodump --db emergentRPG --out /data/db/backup
	docker cp $$(docker-compose -f docker-compose.dev.yml ps -q mongodb):/data/db/backup ./backups/backup-$(shell date +%Y%m%d-%H%M%S)

restore:
	@echo "Restoring database from backup..."
	@read -p "Enter backup directory name: " backup_dir; \
	docker cp ./backups/$$backup_dir $$(docker-compose -f docker-compose.dev.yml ps -q mongodb):/data/db/restore && \
	docker-compose -f docker-compose.dev.yml exec mongodb mongorestore --db emergentRPG /data/db/restore/emergentRPG
