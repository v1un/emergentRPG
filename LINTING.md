# ESLint Setup for EmergentRPG

This document describes the ESLint setup for both frontend and backend of the EmergentRPG project.

## Quick Start

To run linting for the entire project:
```bash
./lint_all.sh
```

## Frontend (React/JavaScript)

The frontend uses ESLint with React-specific rules.

### Configuration Files
- `frontend/eslint.config.js` - Main ESLint configuration
- `frontend/.eslintignore` - Files to ignore during linting

### Available Commands
```bash
cd frontend
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting issues
```

### Rules Configured
- React best practices
- React Hooks rules
- Modern JavaScript standards
- Code style consistency

## Backend (Python)

The backend uses flake8 for Python linting with relaxed formatting rules.

### Configuration Files
- `backend/.flake8` - Flake8 configuration
- `backend/pyproject.toml` - Black and isort configuration

### Available Commands
```bash
cd backend
./lint.sh           # Check for linting errors
./format.sh         # Auto-format Python code
```

### Tools Used
- **flake8**: Main Python linter
- **black**: Code formatter (optional)
- **isort**: Import sorter (optional)

## Integration with pyenv

The setup is configured to work with pyenv. The scripts automatically detect and use the Python version set by pyenv for the project.

## IDE Integration

### VS Code
The ESLint extension will automatically pick up the configuration and show linting errors in the editor.

### PyCharm/IntelliJ
Configure the Python interpreter to use the pyenv Python version and enable flake8 integration.

## CI/CD Integration

You can add the linting commands to your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Run Linting
  run: |
    chmod +x ./lint_all.sh
    ./lint_all.sh
```
