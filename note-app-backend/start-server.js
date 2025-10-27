/**
 * Production server startup script with AI service verification
 */

const { spawn } = require('child_process');
const aiService = require('./src/services/aiService');

async function verifyAIService() {
  console.log('🧪 Verifying AI Summarization Service...');
  
  const testContent = `
    This is a test note to verify that the AI summarization service is working correctly. 
    The system should be able to process this content and generate a meaningful summary 
    using the fallback method, which provides reliable extractive summarization even 
    when external APIs are unavailable.
  `.trim();
  
  try {
    const result = await aiService.summarizeText(testContent, {
      maxLength: 100,
      style: 'concise',
      userId: 'startup-test'
    });
    
    console.log('✅ AI Service is working!');
    console.log(`📄 Test summary: ${result.summary}`);
    console.log(`🔧 Provider: ${result.provider}`);
    return true;
    
  } catch (error) {
    console.log('❌ AI Service failed:', error.message);
    return false;
  }
}

async function startServer() {
  console.log('🚀 Starting Notes App Backend Server\n');
  
  // Verify AI service first
  const aiWorking = await verifyAIService();
  
  if (!aiWorking) {
    console.log('⚠️  AI service has issues, but server will start anyway');
    console.log('   The fallback system should still provide basic functionality\n');
  } else {
    console.log('✅ All systems ready!\n');
  }
  
  console.log('🌟 Starting Express server...\n');
  
  // Start the main server
  const serverProcess = spawn('node', ['src/server.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`\n🛑 Server exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGTERM');
  });
}

// Add helpful startup information
console.log('📝 AI-Powered Notes App Backend');
console.log('================================');
console.log('Features:');
console.log('✅ Note CRUD operations');
console.log('✅ User authentication');
console.log('✅ AI summarization (with fallback)');
console.log('✅ Search and filtering');
console.log('✅ Batch operations');
console.log('');

startServer().catch(console.error);
