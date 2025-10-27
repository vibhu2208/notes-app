/**
 * Secure setup script to configure Hugging Face API key
 * Run this script to add your Hugging Face API key to the .env file
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function getApiKeyFromUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('🔑 Hugging Face API Key Setup');
    console.log('=====================================');
    console.log('Please get your API key from: https://huggingface.co/settings/tokens');
    console.log('Make sure it has "Write" permissions!\n');
    
    rl.question('Enter your Hugging Face API key: ', (apiKey) => {
      rl.close();
      resolve(apiKey.trim());
    });
  });
}

async function main() {
  let HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
  
  if (!HUGGINGFACE_API_KEY || HUGGINGFACE_API_KEY === 'YOUR_HUGGING_FACE_API_KEY_HERE') {
    HUGGINGFACE_API_KEY = await getApiKeyFromUser();
    
    if (!HUGGINGFACE_API_KEY || HUGGINGFACE_API_KEY === '') {
      console.log('❌ No API key provided. Exiting...');
      process.exit(1);
    }
  }

  // Path to .env file
  const envPath = path.join(__dirname, '.env');

  // Read existing .env file or create new one
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Check if HUGGINGFACE_API_KEY already exists
  if (envContent.includes('HUGGINGFACE_API_KEY=')) {
    // Update existing key
    envContent = envContent.replace(
      /HUGGINGFACE_API_KEY=.*/,
      `HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}`
    );
    console.log('✅ Updated existing HUGGINGFACE_API_KEY in .env file');
  } else {
    // Add new key
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n';
    }
    envContent += `HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}\n`;
    console.log('✅ Added HUGGINGFACE_API_KEY to .env file');
  }

  // Ensure other required environment variables exist with defaults
  const requiredEnvVars = {
    'NODE_ENV': 'development',
    'PORT': '5000',
    'MONGODB_URI': 'mongodb+srv://cluster0.xgtzlsb.mongodb.net/ai-notes-app',
    'JWT_SECRET': 'your-jwt-secret-change-in-production',
    'JWT_REFRESH_SECRET': 'your-refresh-secret-change-in-production',
    'JWT_EXPIRE': '15m',
    'JWT_REFRESH_EXPIRE': '7d',
    'BCRYPT_SALT_ROUNDS': '12',
    'CORS_ORIGIN': 'http://localhost:3000',
    'AI_MODEL': 'facebook/bart-large-cnn',
    'MAX_TOKENS': '150',
    'LOG_LEVEL': 'info'
  };

  Object.entries(requiredEnvVars).forEach(([key, defaultValue]) => {
    if (!envContent.includes(`${key}=`)) {
      envContent += `${key}=${defaultValue}\n`;
      console.log(`✅ Added ${key} with default value`);
    }
  });

  // Write updated .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n🎉 Hugging Face API configuration completed!');
  console.log('\nYour .env file now includes the API key securely.');
  console.log('\nThe AI service will now use Hugging Face as the primary provider for note summarization.');
  console.log('\nTo test the setup, run:');
  console.log('npm run test:ai');
  console.log('\nTo start the server, run:');
  console.log('npm run dev');
}

main().catch(console.error);
