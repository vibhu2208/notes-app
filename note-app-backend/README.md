# AI-Powered Notes App Backend

A robust Node.js backend API for an AI-powered notes application with intelligent summarization capabilities.

## 🚀 Features

- **AI Summarization**: Multiple providers (Hugging Face, OpenAI, Local fallback)
- **User Authentication**: JWT-based auth with refresh tokens
- **Note Management**: Full CRUD operations with search and filtering
- **Batch Operations**: Bulk summarization and management
- **Rate Limiting**: Protection against abuse
- **Comprehensive Logging**: Structured logging with Winston
- **Error Handling**: Custom error classes and global error handling

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Configure Hugging Face API key
npm run setup:hf

# Or manually create .env file with:
# HUGGINGFACE_API_KEY=your_api_key_here
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
```

### 3. Test AI Integration
```bash
npm run test:ai
```

### 4. Start Server
```bash
# Production mode with AI verification
npm start

# Development mode
npm run dev

# Basic mode (no verification)
npm run start:basic
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start server with AI verification |
| `npm run dev` | Development mode with nodemon |
| `npm run test:ai` | Test Hugging Face API integration |
| `npm run setup:hf` | Configure Hugging Face API key |
| `npm test` | Run Jest tests |
| `npm run lint` | Check code style |
| `npm run format` | Format code with Prettier |

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Notes
- `GET /api/notes` - Get user notes (with pagination, search, filters)
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/notes/:id/summarize` - Summarize individual note

### AI Operations
- `POST /api/ai/batch-summarize` - Batch summarize multiple notes
- `GET /api/ai/health` - AI service health check (admin only)
- `GET /api/ai/stats` - AI usage statistics (admin only)

## 🤖 AI Summarization

The system uses a multi-tier approach for reliable summarization:

1. **Primary**: Hugging Face API (facebook/bart-large-cnn, sshleifer/distilbart-cnn-12-6)
2. **Secondary**: OpenAI GPT (if configured)
3. **Fallback**: Advanced extractive summarization with TF-IDF scoring
4. **Last Resort**: Intelligent text truncation

### Summarization Styles
- **Concise**: Brief overview focusing on main points
- **Bullet**: Key information in bullet point format
- **Detailed**: Comprehensive summary with full context

## 🔒 Security Features

- JWT authentication with refresh tokens
- Rate limiting (20 requests/hour for individual, 5/hour for batch)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- MongoDB injection protection

## 📊 Monitoring & Logging

- Structured logging with Winston
- Request/response logging
- Error tracking and reporting
- AI service performance metrics
- Health check endpoints

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # MongoDB models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
└── server.js        # Main server file
```

## 🔧 Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://your-connection-string

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
BCRYPT_SALT_ROUNDS=12

# AI Services
HUGGINGFACE_API_KEY=hf_your_api_key
OPENAI_API_KEY=sk-your_openai_key (optional)
AI_MODEL=facebook/bart-large-cnn
MAX_TOKENS=150

# Logging
LOG_LEVEL=info
```

## 🧪 Testing

The project includes comprehensive testing for AI functionality:

```bash
# Test Hugging Face API integration
npm run test:ai

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

The application is ready for deployment on platforms like:
- Render
- Heroku
- Railway
- DigitalOcean App Platform

Includes Docker configuration for containerized deployment.

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the logs in the `logs/` directory
2. Run `npm run test:ai` to verify AI functionality
3. Check environment variable configuration
4. Review the API documentation above
