# AI Notes App - Complete Setup Guide

This guide provides step-by-step instructions for setting up the AI Notes App locally and in production.

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher (comes with Node.js)
- **Git**: Latest version
- **MongoDB**: 5.0+ (local) or MongoDB Atlas account
- **OpenAI API Key**: For AI features

### Development Tools (Recommended)
- **VS Code**: With React and ES7+ extensions
- **MongoDB Compass**: For database management
- **Postman**: For API testing
- **Docker**: For containerized development (optional)

## 🚀 Quick Start (5 minutes)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd notes-app
```

### 2. Setup Backend
```bash
cd note-app-backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Setup Frontend
```bash
cd ../  # Go back to root
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔧 Detailed Setup

### Backend Setup

1. **Navigate to Backend Directory**
   ```bash
   cd note-app-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ai-notes-app
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
   CORS_ORIGIN=http://localhost:3000
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to Frontend Directory**
   ```bash
   cd ../  # From backend directory to root
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=AI Notes App (Dev)
   VITE_NODE_ENV=development
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

### Option 1: Local MongoDB

1. **Install MongoDB**
   - **Windows**: Download from [MongoDB Official Site](https://www.mongodb.com/try/download/community)
   - **macOS**: `brew install mongodb-community`
   - **Linux**: Follow [official instructions](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB Service**
   ```bash
   # Windows (as service)
   net start MongoDB
   
   # macOS/Linux
   mongod --config /usr/local/etc/mongod.conf
   ```

3. **Verify Connection**
   ```bash
   mongosh
   # Should connect to mongodb://localhost:27017
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create Account**: Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create Cluster**: Follow the setup wizard
3. **Get Connection String**: 
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
4. **Update Environment**: Use the connection string in `MONGODB_URI`

## 🤖 AI Integration Setup

### OpenAI API Key

1. **Get API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create account or sign in
   - Go to API Keys section
   - Create new secret key

2. **Add to Environment**:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Test Integration**:
   ```bash
   # Backend should be running
   curl -X POST http://localhost:5000/api/notes/test-note-id/summarize \
        -H "Authorization: Bearer your-jwt-token"
   ```

## 🐳 Docker Setup (Optional)

### Full Stack with Docker Compose

1. **Prerequisites**: Docker and Docker Compose installed

2. **Environment Setup**:
   ```bash
   # Create .env file in root directory
   echo "OPENAI_API_KEY=your-key-here" > .env
   ```

3. **Start All Services**:
   ```bash
   docker-compose up -d
   ```

4. **Access Services**:
   - **Frontend**: http://localhost:3000
   - **Backend**: http://localhost:5000
   - **MongoDB**: localhost:27017

5. **View Logs**:
   ```bash
   docker-compose logs -f
   ```

6. **Stop Services**:
   ```bash
   docker-compose down
   ```

## 🧪 Testing Setup

### Backend Tests
```bash
cd note-app-backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd ../  # Root directory
npm test
npm run test:ui
```

## 🚀 Production Deployment

### Backend Deployment (Render)

1. **Create Render Account**: Visit [Render](https://render.com)

2. **Connect Repository**: Link your GitHub repository

3. **Create Web Service**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js

4. **Environment Variables**:
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=production-secret-256-bits
   JWT_REFRESH_SECRET=production-refresh-secret-256-bits
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   OPENAI_API_KEY=sk-...
   ```

### Frontend Deployment (Vercel)

1. **Create Vercel Account**: Visit [Vercel](https://vercel.com)

2. **Connect Repository**: Import your GitHub repository

3. **Configure Project**:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables**:
   ```env
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_NODE_ENV=production
   ```

## 🔧 Development Workflow

### Code Quality Setup

1. **Install VS Code Extensions**:
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint
   - Tailwind CSS IntelliSense

2. **Git Hooks (Optional)**:
   ```bash
   npm install --save-dev husky lint-staged
   npx husky install
   npx husky add .husky/pre-commit "npx lint-staged"
   ```

3. **VS Code Settings**:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "emmet.includeLanguages": {
       "javascript": "javascriptreact"
     }
   }
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   
   # Kill process on port 5000
   npx kill-port 5000
   ```

2. **MongoDB Connection Failed**:
   ```bash
   # Check if MongoDB is running
   mongosh --eval "db.adminCommand('ping')"
   
   # Check connection string format
   echo $MONGODB_URI
   ```

3. **OpenAI API Errors**:
   ```bash
   # Test API key
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

4. **Build Failures**:
   ```bash
   # Clear caches and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear Vite cache
   rm -rf .vite
   ```

### Debug Mode

1. **Backend Debug**:
   ```bash
   DEBUG=* npm run dev
   ```

2. **Frontend Debug**:
   ```bash
   VITE_DEBUG=true npm run dev
   ```

## 📊 Performance Optimization

### Development
- Use React DevTools for component analysis
- Monitor bundle size with `npm run build`
- Use Lighthouse for performance auditing

### Production
- Enable gzip compression
- Configure CDN for static assets
- Monitor with performance tools

## 🔒 Security Checklist

### Development
- [ ] Use HTTPS in production
- [ ] Validate all environment variables
- [ ] Never commit secrets to git
- [ ] Use strong JWT secrets (256+ bits)

### Production
- [ ] Configure CORS properly
- [ ] Enable security headers
- [ ] Use environment-specific secrets
- [ ] Monitor for security vulnerabilities

## 📞 Getting Help

### Resources
- **Documentation**: README files in each directory
- **API Documentation**: Available at `/api-docs` (if enabled)
- **GitHub Issues**: For bug reports and feature requests

### Debug Information
When reporting issues, include:
- Node.js version: `node --version`
- npm version: `npm --version`
- Operating system
- Error messages and stack traces
- Steps to reproduce

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend health check: http://localhost:5000/health
- [ ] Frontend loads: http://localhost:3000
- [ ] User registration works
- [ ] User login works
- [ ] Notes CRUD operations work
- [ ] AI summarization works (with API key)
- [ ] Tests pass: `npm test` in both directories
- [ ] Build succeeds: `npm run build` in both directories

## 🎯 Next Steps

After successful setup:
1. Explore the codebase structure
2. Run the test suites
3. Try creating and summarizing notes
4. Customize the UI/UX to your needs
5. Deploy to production when ready

---

**Need help?** Check the troubleshooting section or create an issue on GitHub.
