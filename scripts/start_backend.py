#!/usr/bin/env python3
import sys
import os
sys.path.append('/app/backend')
os.chdir('/app/backend')

# Set up environment
os.environ['PYTHONPATH'] = '/app/backend'

from main import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info"
    )