#!/bin/bash

# Auto-fix linting issues for EmergentRPG backend (Python)

set -e  # Exit on error

echo "🔧 Auto-fixing Python code formatting for backend..."

# Check if pyenv is available and initialize it
if command -v pyenv >/dev/null 2>&1; then
    eval "$(pyenv init -)"
    echo "Using pyenv Python version: $(pyenv version-name)"
fi

# Check and install formatting tools if needed
if ! python -m black --version >/dev/null 2>&1; then
    echo "⚠️  black not installed. Installing now..."
    pip install black==23.11.0
fi

if ! python -m isort --version >/dev/null 2>&1; then
    echo "⚠️  isort not installed. Installing now..."
    pip install isort==5.12.0
fi

echo "📊 Running isort..."
python -m isort .

echo "🎨 Running black..."
python -m black .

echo "📋 Running flake8 for final check..."
python -m flake8 --extend-ignore=W293,W291,E128,E302,E305,F401,F841 . || echo "⚠️  Some linting issues remain - consider fixing manually"

echo "✅ Backend code formatting completed!"
