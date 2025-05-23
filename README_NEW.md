# 🎮 EmergentRPG - AI-Powered Dynamic Storytelling Platform

An advanced AI-powered RPG platform that creates dynamic, emergent narratives using Google's Gemini AI. Experience limitless adventures with intelligent story generation, character development, and immersive gameplay.

[![CI/CD Pipeline](https://github.com/v1un/emergentRPG/actions/workflows/ci.yml/badge.svg)](https://github.com/v1un/emergentRPG/actions/workflows/ci.yml)
[![Security Scan](https://github.com/v1un/emergentRPG/actions/workflows/security.yml/badge.svg)](https://github.com/v1un/emergentRPG/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **Dynamic Story Generation**: AI-powered narrative creation that adapts to player choices
- **Character Creation & Development**: Deep character customization with stats and progression
- **Real-time Gameplay**: Interactive storytelling with immediate AI responses
- **Lorebook System**: Expandable world-building and character knowledge base
- **Series Analysis**: Advanced content analysis for enhanced storytelling
- **Modern Web Interface**: Responsive React frontend with beautiful animations

## 🏗️ Architecture

```
emergentRPG/
├── backend/           # FastAPI backend with AI integration
│   ├── flows/        # Game logic and AI workflow orchestration
│   ├── models/       # Data models and schemas
│   ├── services/     # Core business logic and external integrations
│   └── utils/        # Utilities and helpers
├── frontend/         # React frontend application
├── scripts/          # Database and deployment scripts
└── .github/workflows/ # CI/CD pipelines
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (local or cloud)
- Google AI Studio API Key

### 1. Clone and Setup

```bash
git clone https://github.com/v1un/emergentRPG.git
cd emergentRPG

# Copy environment template
cp .env.template .env

# Edit .env with your configuration
nano .env
```

### 2. Get Google AI API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

### 3. Start the Application

#### Option A: Using the start script (Recommended)
```bash
chmod +x start_app.sh
./start_app.sh
```

#### Option B: Using Make commands
```bash
make install  # Install dependencies
make dev      # Start development environment
```

#### Option C: Using Docker
```bash
make docker-up  # Start with Docker Compose
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **MongoDB Express** (if using Docker): http://localhost:8081

## 🛠️ Development

### Project Structure

```
backend/
├── flows/                    # AI workflow orchestration
│   ├── character_generation/ # Character creation logic
│   ├── gameplay/            # Real-time gameplay flows
│   ├── lorebook_generation/ # World-building systems
│   └── series_analysis/     # Content analysis
├── models/                  # Pydantic data models
├── services/               # Core business services
│   ├── database_service.py # MongoDB integration
│   ├── game_state/        # Game state management
│   └── scenario_generation/ # AI scenario creation
└── utils/                  # Shared utilities
    └── gemini_client.py    # Google AI integration

frontend/
├── src/
│   ├── components.js       # React components
│   ├── App.js             # Main application
│   └── index.js           # Entry point
└── public/                # Static assets
```

### Available Commands

```bash
# Development
make dev          # Start development environment
make test         # Run all tests
make test-watch   # Run tests in watch mode
make lint         # Run code linting
make format       # Format code
make clean        # Clean build artifacts

# Docker
make docker-build # Build containers
make docker-up    # Start development containers
make docker-down  # Stop containers
make docker-logs  # View container logs

# Database
make db-init      # Initialize database
make db-reset     # Reset database
make backup       # Create database backup
make restore      # Restore from backup

# Git setup
make setup-git    # Configure Git hooks and settings
```

### Code Quality

This project uses several tools to maintain code quality:

- **Black**: Python code formatting
- **Flake8**: Python linting
- **MyPy**: Python type checking
- **Prettier**: JavaScript/CSS formatting
- **Pre-commit hooks**: Automated checks before commits
- **Pytest**: Python testing framework
- **Jest**: JavaScript testing framework

### Environment Variables

Key environment variables (see `.env.template`):

```bash
# Required
GOOGLE_API_KEY=your_google_api_key
MONGO_URL=mongodb://localhost:27017/emergentRPG

# Optional
BACKEND_PORT=8001
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=INFO
ENVIRONMENT=development
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production
```bash
docker-compose up -d
```

The Docker setup includes:
- Backend API server
- Frontend with Nginx
- MongoDB database
- MongoDB Express (development only)

## 🚀 Deployment

### CI/CD Pipeline

The project includes GitHub Actions workflows for:

- **Continuous Integration**: Automated testing, linting, and security scanning
- **Deployment**: Automated deployments to various platforms
- **Security Monitoring**: Regular dependency and security audits

### Supported Deployment Platforms

- **VPS/Dedicated Servers**: Using Docker Compose
- **Cloud Platforms**: AWS, GCP, Azure (with container services)
- **Heroku**: Ready-to-deploy configuration
- **Vercel/Netlify**: Frontend-only deployments with API proxy

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest                          # Run all tests
pytest --cov=.                  # Run with coverage
pytest -m unit                  # Run only unit tests
pytest -m integration           # Run only integration tests
```

### Frontend Tests
```bash
cd frontend
npm test                        # Run tests
npm test -- --coverage         # Run with coverage
npm test -- --watchAll=false   # Run once without watch mode
```

## 📝 API Documentation

The API is fully documented using FastAPI's automatic documentation:

- **Interactive Docs**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **OpenAPI Specification**: http://localhost:8001/openapi.json

### Key Endpoints

- `GET /api/health` - Health check
- `POST /api/sessions` - Create game session
- `POST /api/characters` - Create character
- `POST /api/actions` - Submit player action
- `GET /api/sessions/{session_id}/story` - Get story history

## 🔒 Security

Security measures implemented:

- **Input validation** with Pydantic models
- **CORS protection** for cross-origin requests
- **Environment variable protection** for sensitive data
- **Pre-commit hooks** for secret detection
- **Regular security audits** via GitHub Actions
- **Container security** with non-root users

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`make test lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages
- Ensure all CI checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Ensure MongoDB is running
   - Check `MONGO_URL` in `.env`
   - Verify firewall settings

2. **Google AI API Issues**
   - Verify API key is correct
   - Check API quotas and limits
   - Ensure API is enabled in Google Cloud Console

3. **Frontend Build Issues**
   - Clear node_modules: `rm -rf frontend/node_modules && cd frontend && npm install`
   - Check Node.js version compatibility

4. **Docker Issues**
   - Ensure Docker and Docker Compose are installed
   - Check available disk space
   - Verify port availability (3000, 8001, 27017)

### Getting Help

- Check the [Issues](https://github.com/v1un/emergentRPG/issues) page
- Review the API documentation at `/docs`
- Check application logs for error details

## 🎯 Roadmap

- [ ] WebSocket support for real-time multiplayer
- [ ] Advanced AI model integration (Claude, GPT-4)
- [ ] Voice interaction capabilities
- [ ] Mobile application
- [ ] Advanced analytics and player insights
- [ ] Modding and plugin system
- [ ] Social features and community integration

---

**Made with ❤️ for the RPG and AI community**
