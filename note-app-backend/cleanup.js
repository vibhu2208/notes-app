/**
 * Cleanup script to remove old test files
 */

const fs = require('fs');
const path = require('path');

const filesToRemove = [
  'test-ai.js',
  'test-ai-fixed.js', 
  'test-robust-ai.js'
];

console.log('🧹 Cleaning up old test files...\n');

filesToRemove.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
    } catch (error) {
      console.log(`❌ Failed to remove ${file}:`, error.message);
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n🎉 Cleanup complete!');
console.log('\n📋 Remaining files:');
console.log('✅ test-new-api-key.js - Main AI testing script');
console.log('✅ setup-huggingface.js - API key setup script');
console.log('✅ start-server.js - Enhanced server startup');

// Clean up this script itself
setTimeout(() => {
  try {
    fs.unlinkSync(__filename);
    console.log('\n🗑️  Cleanup script removed itself');
  } catch (error) {
    console.log('\n⚠️  Could not remove cleanup script:', error.message);
  }
}, 1000);
