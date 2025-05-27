# EmergentRPG Startup Guide

This guide explains how to use the improved startup scripts for the EmergentRPG AI Dungeon Clone.

## ✅ IMPROVEMENTS COMPLETED

Both startup scripts have been significantly improved and **FIXED** with the following enhancements:

### 🚀 **start_app.sh** - Main Application Launcher
- ✅ **FIXED: Terminal clearing issue** - Help now displays without clearing terminal
- ✅ **FIXED: Corrupted content** - Completely restructured for reliability
- ✅ **Enhanced Arch Linux + zsh + pyenv support** with proper shell detection
- ✅ **Simplified and reliable** - Removed complex features that caused hanging
- ✅ **Robust dependency checking** with pacman auto-detection for Arch Linux
- ✅ **Health monitoring** with port checking and HTTP health checks
- ✅ **Graceful shutdown** with proper process cleanup
- ✅ **Environment validation** with smart .env file creation
- ✅ **Process monitoring** with automatic restart detection
- ✅ **Multi-mode support** (development/production)

### 🛠️ **scripts/start_backend.py** - Backend Launcher
- ✅ **FIXED: Hanging issues** - Help flag now works immediately
- ✅ **Completely rewritten** for simplicity and reliability
- ✅ **Enhanced environment validation** with helpful error messages
- ✅ **Arch Linux + pyenv compatibility** with proper Python detection
- ✅ **Redis auto-detection** for cache configuration
- ✅ **Security enhancements** with external access controls
- ✅ **Working help system** - No more hanging on --help flag

## Quick Start

### Development Mode (Default)
```bash
./start_app.sh
```

### Production Mode
```bash
./start_app.sh production
```

## Script Features

### start_app.sh - Main Application Launcher

**New Features:**
- ✅ **Multi-mode support**: Development and production modes
- ✅ **Enhanced logging**: Structured logging with timestamps and log levels
- ✅ **Robust dependency checking**: Cross-platform package manager detection
- ✅ **Health monitoring**: Port checking and HTTP health checks with retries
- ✅ **Graceful shutdown**: Proper process cleanup and signal handling
- ✅ **Environment validation**: Comprehensive .env file management
- ✅ **Process monitoring**: Automatic restart detection for crashed services
- ✅ **Verbose mode**: Debug logging with VERBOSE=true
- ✅ **Skip dependencies**: Fast startup with SKIP_DEPS=true

**Usage Examples:**
```bash
# Basic development start
./start_app.sh

# Production mode
./start_app.sh production

# Verbose logging
VERBOSE=true ./start_app.sh

# Skip dependency installation (faster startup)
SKIP_DEPS=true ./start_app.sh

# Custom ports
BACKEND_PORT=8002 FRONTEND_PORT=3001 ./start_app.sh

# Help
./start_app.sh --help
```

### scripts/start_backend.py - Enhanced Backend Launcher

**New Features:**
- ✅ **Environment validation**: Comprehensive configuration checking
- ✅ **Security enhancements**: External access controls and SSL support
- ✅ **Redis auto-detection**: Automatic cache configuration
- ✅ **Health monitoring**: Background health checks in debug mode
- ✅ **Graceful shutdown**: Signal handling for clean shutdowns
- ✅ **Enhanced logging**: Structured logging with file output
- ✅ **Configuration validation**: Startup parameter validation

**Usage Examples:**
```bash
# Direct backend start
python scripts/start_backend.py

# With environment variables
HOST=0.0.0.0 ALLOW_EXTERNAL_ACCESS=true python scripts/start_backend.py

# Help
python scripts/start_backend.py --help
```

## Environment Variables

### Required Variables
- `GOOGLE_API_KEY`: Your Google AI API key
- `MONGO_URL`: MongoDB connection string

### Optional Configuration
- `HOST`: Server host (default: 127.0.0.1)
- `PORT`: Backend port (default: 8001)
- `FRONTEND_PORT`: Frontend port (default: 3000)
- `RELOAD`: Enable auto-reload (default: false in production, true in development)
- `LOG_LEVEL`: Logging level (default: info)
- `WORKERS`: Number of workers (default: 1)
- `DEBUG`: Enable debug mode (default: false in production, true in development)
- `ALLOW_EXTERNAL_ACCESS`: Allow external access (default: false)
- `REDIS_ENABLED`: Enable Redis cache (auto-detected)
- `SSL_ENABLED`: Enable SSL (default: false)

### Script Control Variables
- `SKIP_DEPS`: Skip dependency installation (default: false)
- `VERBOSE`: Enable verbose logging (default: false)
- `HEALTH_CHECK_TIMEOUT`: Health check timeout in seconds (default: 60)
- `QUIET`: Suppress startup info (default: false)

## Logs and Monitoring

### Log Files
All logs are stored in the `logs/` directory:
- `logs/startup.log`: Main startup script logs
- `logs/backend.log`: Backend server logs
- `logs/frontend.log`: Frontend server logs
- `logs/frontend-build.log`: Frontend build logs (production mode)

### Process Monitoring
- PIDs are stored in `logs/backend.pid` and `logs/frontend.pid`
- Automatic process health monitoring
- Graceful shutdown with SIGTERM, force kill with SIGKILL if needed

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   lsof -i :8001
   # Use different ports
   BACKEND_PORT=8002 ./start_app.sh
   ```

2. **Missing dependencies**
   ```bash
   # Install system dependencies (Ubuntu/Debian)
   sudo apt install python3 nodejs npm curl netcat
   # Install system dependencies (Arch Linux)
   sudo pacman -S python nodejs npm curl netcat
   ```

3. **Environment configuration issues**
   ```bash
   # Check .env file
   cat backend/.env
   # Validate configuration
   python scripts/start_backend.py --help
   ```

4. **Service startup failures**
   ```bash
   # Check logs
   tail -f logs/backend.log
   tail -f logs/frontend.log
   # Verbose startup
   VERBOSE=true ./start_app.sh
   ```

### Health Checks

The scripts include comprehensive health checking:
- Port availability checking
- HTTP health endpoint validation
- Service process monitoring
- Automatic failure detection and reporting

### Recovery

If services crash or fail to start:
1. Check the logs in the `logs/` directory
2. Verify environment configuration
3. Ensure all dependencies are installed
4. Try starting with verbose logging: `VERBOSE=true ./start_app.sh`

## Security Notes

- By default, the backend binds to `127.0.0.1` (localhost only)
- To allow external access, set `ALLOW_EXTERNAL_ACCESS=true`
- SSL is disabled by default; configure `SSL_ENABLED=true` with certificate paths for production
- Redis auto-detection helps prevent configuration errors

## Performance Tips

- Use `SKIP_DEPS=true` for faster subsequent startups
- In production mode, frontend is built and served statically
- Redis caching is automatically enabled if Redis is available
- Multiple workers can be configured for production loads
