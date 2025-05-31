# EmergentRPG Quick Start Guide

## 🚀 One-Command Startup

This guide will help you get EmergentRPG running quickly on your Arch Linux + zsh + pyenv setup.

### Prerequisites

Make sure you have the following installed:

```bash
# Essential dependencies
sudo pacman -S nodejs npm python python-pip

# Optional but recommended
sudo pacman -S mongodb-bin redis

# pyenv (if not already installed)
curl https://pyenv.run | bash
```

### Quick Start

1. **Clone and navigate to the project:**
   ```bash
   git clone <your-repo-url>
   cd emergentRPG
   ```

2. **Run the start script:**
   ```bash
   ./start.sh
   ```

That's it! The script will:
- ✅ Check all dependencies
- ✅ Initialize pyenv with Python 3.11.12
- ✅ Create and activate virtual environment
- ✅ Install all Python dependencies
- ✅ Install all Node.js dependencies
- ✅ Create environment configuration template
- ✅ Start both backend and frontend servers

### What You'll See

```
╔══════════════════════════════════════════════════════════════╗
║                        EmergentRPG                          ║
║                    Development Server                       ║
║                                                              ║
║  AI-Driven Storytelling Framework                          ║
║  Backend: FastAPI + MongoDB + Redis + Gemini               ║
║  Frontend: Next.js + React + TypeScript                    ║
╚══════════════════════════════════════════════════════════════╝

🎉 EmergentRPG is now running!

📊 Service Status:
  Backend:  http://localhost:8001
  Frontend: http://localhost:3000
  API Docs: http://localhost:8001/docs
  Health:   http://localhost:8001/api/health

📝 Logs:
  Backend:  tail -f logs/backend.log
  Frontend: tail -f logs/frontend.log

Press Ctrl+C to stop all services
```

### Environment Configuration

On first run, the script creates `backend/.env` with default values. **Important**: Edit this file to add your Google AI API key:

```bash
# Edit the environment file
nano backend/.env

# Add your actual Google AI API key
GOOGLE_API_KEY=your_actual_api_key_here
```

### Available Scripts

- **`./start.sh`** - Start all services
- **`./stop.sh`** - Stop all services gracefully
- **`./format_all.sh`** - Format all code
- **`./lint_all.sh`** - Lint all code

### Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main application interface |
| Backend API | http://localhost:8001 | REST API endpoints |
| API Documentation | http://localhost:8001/docs | Interactive API docs |
| Health Check | http://localhost:8001/api/health | Service health status |

### Troubleshooting

#### Port Already in Use
```bash
# Stop all services
./stop.sh

# Or manually kill processes
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8001 | xargs kill -9
```

#### Python Version Issues
```bash
# Reinstall Python version
pyenv uninstall 3.11.12
pyenv install 3.11.12
pyenv local 3.11.12
```

#### Dependencies Issues
```bash
# Clean and reinstall backend dependencies
cd backend
rm -rf ../venv
python -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt

# Clean and reinstall frontend dependencies
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

#### MongoDB/Redis Not Running
```bash
# Start MongoDB
sudo systemctl start mongodb

# Start Redis
sudo systemctl start redis
```

### Development Workflow

1. **Start development:**
   ```bash
   ./start.sh
   ```

2. **Make changes to code** - Both servers support hot reload

3. **View logs:**
   ```bash
   # Backend logs
   tail -f logs/backend.log
   
   # Frontend logs
   tail -f logs/frontend.log
   ```

4. **Stop when done:**
   ```bash
   # Press Ctrl+C in the terminal running start.sh
   # OR run the stop script
   ./stop.sh
   ```

### Next Steps

- Configure your Google AI API key in `backend/.env`
- Set up MongoDB (local or Atlas)
- Configure Redis for caching
- Explore the API documentation at http://localhost:8001/docs
- Start building your AI-driven storytelling experience!

### Support

If you encounter issues:
1. Check the logs in the `logs/` directory
2. Ensure all dependencies are installed
3. Verify your environment configuration
4. Check that ports 3000 and 8001 are available
