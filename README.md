# AI-Powered Notes App

A production-grade, enterprise-level notes application with intelligent AI summarization capabilities.

## 🚀 Features

- **Secure Authentication** - JWT-based auth with refresh tokens
- **Smart Notes Management** - CRUD operations with advanced search and filtering
- **AI Summarization** - Intelligent note summarization using AI
- **Modern UI/UX** - Responsive design with dark mode support
- **Production Ready** - Docker containerization and deployment ready

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API communication
- React Query for state management

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- OpenAI/Claude for AI summarization

### DevOps
- Docker & Docker Compose
- ESLint & Prettier
- Jest for testing
- GitHub Actions CI/CD

## 🏗️ Architecture

```
AI-Notes-App/
├── frontend/          # React application
├── backend/           # Express API server
├── docker-compose.yml # Container orchestration
└── docs/             # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB (or use Docker)

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd AI-Notes-App

# Start with Docker Compose
docker-compose up -d

# Or run manually
cd backend && npm install && npm run dev
cd frontend && npm install && npm start
```

### Environment Variables
Copy `.env.example` to `.env` in both frontend and backend directories and configure:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key for summarization
- `REACT_APP_API_URL` - Backend API URL

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 🚀 Deployment

The application is containerized and ready for deployment on:
- Vercel/Netlify (Frontend)
- Railway/Render (Backend)
- MongoDB Atlas (Database)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
