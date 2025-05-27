#!/usr/bin/env python3
"""
Simple Backend Startup Script for EmergentRPG
Optimized for Arch Linux + zsh + pyenv
"""
import sys
import os
import signal
import logging
from pathlib import Path
from typing import Optional, Dict, Any

# Check for help flag FIRST
if len(sys.argv) > 1 and sys.argv[1] in ['--help', '-h']:
    print(__doc__)
    print("\nUsage: python start_backend.py")
    print("\nEnvironment Variables:")
    print("  HOST                    - Server host (default: 127.0.0.1)")
    print("  PORT                    - Server port (default: 8001)")
    print("  RELOAD                  - Enable auto-reload (default: false)")
    print("  LOG_LEVEL               - Logging level (default: info)")
    print("  WORKERS                 - Number of workers (default: 1)")
    print("  DEBUG                   - Enable debug mode (default: false)")
    print("  ALLOW_EXTERNAL_ACCESS   - Allow external access (default: false)")
    print("\nRequired Environment Variables:")
    print("  GOOGLE_API_KEY          - Google AI API key")
    print("  MONGO_URL               - MongoDB connection URL")
    sys.exit(0)

# Simple logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def setup_python_path() -> Path:
    """Set up Python path and working directory."""
    # Get the backend directory
    backend_dir = None
    
    if os.environ.get('BACKEND_DIR'):
        backend_dir = Path(os.environ['BACKEND_DIR'])
    elif Path(__file__).parent.parent.joinpath('backend').exists():
        backend_dir = Path(__file__).parent.parent / 'backend'
    elif Path.cwd().joinpath('backend').exists():
        backend_dir = Path.cwd() / 'backend'
    elif Path.cwd().joinpath('main.py').exists():
        backend_dir = Path.cwd()
    else:
        backend_dir = Path(__file__).parent.parent / 'backend'
    
    backend_dir = backend_dir.resolve()
    
    if not backend_dir.exists():
        logger.error(f"Backend directory not found: {backend_dir}")
        sys.exit(1)
    
    # Add to Python path
    backend_str = str(backend_dir)
    if backend_str not in sys.path:
        sys.path.insert(0, backend_str)
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    # Set PYTHONPATH
    current_pythonpath = os.environ.get('PYTHONPATH', '')
    if current_pythonpath:
        os.environ['PYTHONPATH'] = f"{backend_str}:{current_pythonpath}"
    else:
        os.environ['PYTHONPATH'] = backend_str
    
    logger.info(f"Backend directory: {backend_dir}")
    return backend_dir


def validate_environment() -> Dict[str, Any]:
    """Validate environment configuration."""
    config = {}
    
    # Check required variables
    required_vars = ['GOOGLE_API_KEY', 'MONGO_URL']
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value or value in ['your_google_api_key_here', '<YOUR_GOOGLE_API_KEY_HERE>']:
            missing_vars.append(var)
        else:
            config[var] = value
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        logger.error("Please check your .env file in the backend directory")
        sys.exit(1)
    
    # Set defaults
    config.update({
        'HOST': os.getenv('HOST', '127.0.0.1'),
        'PORT': int(os.getenv('PORT', 8001)),
        'RELOAD': os.getenv('RELOAD', 'false').lower() == 'true',
        'LOG_LEVEL': os.getenv('LOG_LEVEL', 'info').lower(),
        'WORKERS': int(os.getenv('WORKERS', 1)),
        'DEBUG': os.getenv('DEBUG', 'false').lower() == 'true',
        'ALLOW_EXTERNAL_ACCESS': os.getenv('ALLOW_EXTERNAL_ACCESS', 'false').lower() == 'true',
    })
    
    # Security check
    if config['HOST'] == '0.0.0.0' and not config['ALLOW_EXTERNAL_ACCESS']:
        logger.warning("Binding to 0.0.0.0 requires ALLOW_EXTERNAL_ACCESS=true. Using localhost.")
        config['HOST'] = '127.0.0.1'
    
    return config


def setup_redis():
    """Setup Redis configuration."""
    if os.getenv('REDIS_ENABLED') is None:
        try:
            import socket
            redis_host = os.getenv('REDIS_HOST', 'localhost')
            redis_port = int(os.getenv('REDIS_PORT', 6379))
            
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex((redis_host, redis_port))
            
            if result == 0:
                os.environ['REDIS_ENABLED'] = 'true'
                logger.info(f"Redis detected at {redis_host}:{redis_port}")
            else:
                os.environ['REDIS_ENABLED'] = 'false'
                logger.info("Redis not detected, using memory cache")
        except Exception:
            os.environ['REDIS_ENABLED'] = 'false'
            logger.info("Redis check failed, using memory cache")


def main():
    """Main entry point."""
    logger.info("Starting EmergentRPG Backend Server...")
    
    # Setup
    setup_python_path()
    config = validate_environment()
    setup_redis()
    
    # Import after path setup
    try:
        import uvicorn
    except ImportError as e:
        logger.error(f"Failed to import uvicorn: {e}")
        logger.error("Please install uvicorn: pip install uvicorn")
        sys.exit(1)
    
    # Configure uvicorn
    uvicorn_config = {
        "app": "main:app",
        "host": config['HOST'],
        "port": config['PORT'],
        "reload": config['RELOAD'],
        "log_level": config['LOG_LEVEL'],
        "access_log": True,
    }
    
    if not config['RELOAD'] and config['WORKERS'] > 1:
        uvicorn_config["workers"] = config['WORKERS']
    
    # Log startup info
    logger.info(f"Server: http://{config['HOST']}:{config['PORT']}")
    logger.info(f"Mode: {'Development' if config['RELOAD'] else 'Production'}")
    logger.info(f"Workers: {config['WORKERS'] if not config['RELOAD'] else 1}")
    
    try:
        uvicorn.run(**uvicorn_config)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
