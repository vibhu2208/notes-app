/**
 * Clean setup script - no hardcoded API keys
 * This file is safe to commit to git
 */

console.log('🔄 This setup script has been cleaned for security.');
console.log('No API keys are hardcoded in this file.');
console.log('');
console.log('To setup your Hugging Face API key:');
console.log('npm run setup:hf');
console.log('');
console.log('This will prompt you for your API key securely.');

// Run the secure setup script
const { spawn } = require('child_process');
const secureSetup = spawn('node', ['setup-huggingface-secure.js'], {
  stdio: 'inherit'
});

secureSetup.on('close', (code) => {
  process.exit(code);
});
