#!/bin/bash

# Simple linting script for EmergentRPG backend (Python)

set -e  # Exit on error

echo "🔍 Running Python linting for backend..."

# Check if pyenv is available and initialize it
if command -v pyenv >/dev/null 2>&1; then
    eval "$(pyenv init -)"
    echo "Using pyenv Python version: $(pyenv version-name)"
fi

# Check if flake8 is available
if ! python -m flake8 --version >/dev/null 2>&1; then
    echo "⚠️  flake8 not installed. Installing now..."
    pip install flake8==6.1.0
fi

echo "📋 Running flake8 (ignoring formatting issues for now)..."
python -m flake8 --extend-ignore=W293,W291,E128,E302,E305,F401,F841 .

echo "✅ Backend linting completed!"
