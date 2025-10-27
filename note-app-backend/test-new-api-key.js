/**
 * Test script for Hugging Face API integration
 */

const axios = require('axios');
require('dotenv').config();

async function testHuggingFaceAPI() {
  console.log('🧪 Testing Hugging Face API Integration...\n');
  
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.log('❌ No API key found in .env file');
    console.log('💡 Run: node setup-huggingface.js first');
    return false;
  }
  
  console.log('API Key:', `${apiKey.substring(0, 8)}...`);
  
  const testContent = `
    Artificial intelligence has revolutionized many industries through machine learning and deep learning technologies. 
    These systems can process vast amounts of data to identify patterns and make predictions. Applications include 
    natural language processing, computer vision, and autonomous systems. However, AI development also raises 
    important ethical considerations around privacy, bias, and transparency that must be carefully addressed.
  `.trim();

  const models = [
    'facebook/bart-large-cnn',
    'sshleifer/distilbart-cnn-12-6'
  ];

  let successCount = 0;

  for (const model of models) {
    console.log(`\n📝 Testing model: ${model}`);
    
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: testContent,
          parameters: {
            max_length: 100,
            min_length: 30,
            do_sample: false,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data && Array.isArray(response.data) && response.data[0]) {
        const summary = response.data[0].summary_text || response.data[0].generated_text || '';
        if (summary) {
          console.log('✅ SUCCESS!');
          console.log('📄 Generated Summary:', summary);
          successCount++;
        } else {
          console.log('⚠️ Empty response');
        }
      } else {
        console.log('⚠️ Unexpected response format:', response.data);
      }

    } catch (error) {
      console.log('❌ Failed:');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
        
        if (error.response.status === 401 || error.response.status === 403) {
          console.log('🔑 API key permission issue - make sure it has Write permissions');
        }
      } else {
        console.log('Network Error:', error.message);
      }
    }
  }

  console.log(`\n🏁 Results: ${successCount}/${models.length} models working`);
  return successCount > 0;
}

async function testAIService() {
  console.log('\n🔧 Testing AI Service Integration...');
  
  const aiService = require('./src/services/aiService');
  
  const testContent = `
    Machine learning is a subset of artificial intelligence that enables computers to learn and 
    improve from experience without being explicitly programmed. It uses algorithms to analyze 
    data, identify patterns, and make predictions or decisions. There are three main types: 
    supervised learning uses labeled data, unsupervised learning finds hidden patterns in 
    unlabeled data, and reinforcement learning learns through trial and error. Applications 
    include recommendation systems, image recognition, natural language processing, and 
    autonomous vehicles.
  `.trim();

  try {
    const result = await aiService.summarizeText(testContent, {
      maxLength: 150,
      style: 'concise'
    });

    console.log('✅ AI Service working!');
    console.log('📄 Summary:', result.summary);
    console.log('🔧 Provider:', result.provider);
    console.log('📊 Word count:', result.wordCount);
    
    return result.provider === 'huggingface';

  } catch (error) {
    console.log('❌ AI Service failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Hugging Face API Integration\n');
  
  const apiWorking = await testHuggingFaceAPI();
  
  if (apiWorking) {
    console.log('\n🎉 GREAT! Your API key is working!');
    console.log('✅ Now testing the AI service integration...');
    
    const serviceWorking = await testAIService();
    
    if (serviceWorking) {
      console.log('\n🎆 PERFECT! Everything is working!');
      console.log('✅ Hugging Face API: Working');
      console.log('✅ AI Service: Using Hugging Face');
      console.log('\n🚀 Your notes app now has REAL AI summarization!');
    } else {
      console.log('\n⚠️  API key works but service is using fallback');
      console.log('💡 This is still good - you have working summarization!');
    }
  } else {
    console.log('\n❌ API key is not working properly');
    console.log('💡 Please check:');
    console.log('1. API key has "Write" permissions');
    console.log('2. API key is correctly set in .env file');
    console.log('3. Try generating a new key from Hugging Face');
  }
}

main().catch(console.error);
