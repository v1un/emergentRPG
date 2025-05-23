#!/usr/bin/env python3
"""
Backend startup script with improved error handling, security, and configuration management.
"""
import sys
import os
import logging
from pathlib import Path
from typing import Optional

# Configure logging early
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_python_path() -> Path:
    """
    Set up Python path and working directory dynamically.
    
    Returns:
        Path: The backend directory path
    
    Raises:
        SystemExit: If backend directory cannot be accessed
    """
    # Get the backend directory - try multiple strategies
    backend_dir = None
    
    # Strategy 1: Environment variable
    if os.environ.get('BACKEND_DIR'):
        backend_dir = Path(os.environ['BACKEND_DIR'])
    # Strategy 2: Relative to script location (assuming script is in scripts/ folder)
    elif Path(__file__).parent.parent.joinpath('backend').exists():
        backend_dir = Path(__file__).parent.parent / 'backend'
    # Strategy 3: Current directory has backend folder
    elif Path.cwd().joinpath('backend').exists():
        backend_dir = Path.cwd() / 'backend'
    # Strategy 4: We're already in the backend directory
    elif Path.cwd().joinpath('main.py').exists():
        backend_dir = Path.cwd()
    else:
        backend_dir = Path(os.environ.get('BACKEND_DIR', str(Path(__file__).parent)))
    
    try:
        backend_dir = backend_dir.resolve()
        
        if not backend_dir.exists():
            raise FileNotFoundError(f"Backend directory not found: {backend_dir}")
        
        if not backend_dir.is_dir():
            raise NotADirectoryError(f"Backend path is not a directory: {backend_dir}")
        
        # Add to Python path if not already there
        backend_str = str(backend_dir)
        if backend_str not in sys.path:
            sys.path.insert(0, backend_str)
        
        # Change to backend directory
        os.chdir(backend_dir)
        
        # Set PYTHONPATH
        os.environ['PYTHONPATH'] = backend_str
        
        logger.info(f"Backend directory set to: {backend_dir}")
        return backend_dir
        
    except (FileNotFoundError, PermissionError, NotADirectoryError) as e:
        logger.error(f"Error setting up backend path: {e}")
        sys.exit(1)


def get_ssl_config() -> tuple[Optional[str], Optional[str]]:
    """
    Get SSL configuration from environment or config files.
    
    Returns:
        tuple: (ssl_keyfile, ssl_certfile) or (None, None) if SSL is disabled
    """
    ssl_enabled = os.getenv('SSL_ENABLED', 'false').lower() == 'true'
    
    if not ssl_enabled:
        logger.warning("SSL is disabled. Running in HTTP mode.")
        return None, None
    
    ssl_keyfile = os.getenv('SSL_KEYFILE', '/path/to/private.key')
    ssl_certfile = os.getenv('SSL_CERTFILE', '/path/to/certificate.crt')
    
    if ssl_keyfile and ssl_certfile:
        # Validate SSL files exist
        if not Path(ssl_keyfile).exists():
            logger.warning(f"SSL key file not found: {ssl_keyfile}")
        if not Path(ssl_certfile).exists():
            logger.warning(f"SSL certificate file not found: {ssl_certfile}")
        
        logger.info("SSL enabled with provided certificates")
        return ssl_keyfile, ssl_certfile
    
    logger.warning("SSL enabled but certificates not provided")
    return None, None


def main():
    """Main entry point for the backend server."""
    # Set up Python path first
    backend_dir = setup_python_path()
    
    # Now we can import after path is set up
    try:
        from main import app  # type: ignore
        import uvicorn
    except ImportError as e:
        logger.error(f"Failed to import required modules: {e}")
        logger.error(f"Current working directory: {os.getcwd()}")
        logger.error(f"Python path: {sys.path}")
        sys.exit(1)
    
    # Get configuration from environment
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', 8001))
    reload = os.getenv('RELOAD', 'false').lower() == 'true'
    log_level = os.getenv('LOG_LEVEL', 'info').lower()
    workers = int(os.getenv('WORKERS', 1))
    
    # Validate host configuration
    if host == '0.0.0.0' and os.getenv('ALLOW_EXTERNAL_ACCESS') != 'true':
        logger.warning(
            "Binding to 0.0.0.0 requires ALLOW_EXTERNAL_ACCESS=true. "
            "Defaulting to localhost for security."
        )
        host = '127.0.0.1'
    
    # Get SSL configuration
    ssl_keyfile, ssl_certfile = get_ssl_config()
    
    # Build uvicorn configuration
    uvicorn_config = {
        "app": "main:app",
        "host": host,
        "port": port,
        "reload": reload,
        "log_level": log_level,
        "access_log": True,
        "use_colors": True,
    }
    
    # Add SSL config if available
    if ssl_keyfile and ssl_certfile:
        uvicorn_config.update({
            "ssl_keyfile": ssl_keyfile,
            "ssl_certfile": ssl_certfile,
        })
    
    # Add workers for production (only if reload is False)
    if not reload and workers > 1:
        uvicorn_config["workers"] = workers
    
    # Log startup configuration
    logger.info(f"Starting backend server on {host}:{port}")
    logger.info(f"SSL: {'Enabled' if ssl_keyfile else 'Disabled'}")
    logger.info(f"Reload: {reload}")
    logger.info(f"Workers: {workers if not reload else 1}")
    logger.info(f"Log level: {log_level}")
    
    try:
        uvicorn.run(**uvicorn_config)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
