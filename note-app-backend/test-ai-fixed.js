/**
 * Test script to verify AI summarization fixes
 */

const axios = require('axios');
require('dotenv').config();

// Import the AI service
const aiService = require('./src/services/aiService');

async function testHuggingFaceFree() {
  console.log('🧪 Testing Hugging Face Free Inference...');
  
  const testContent = `
    Artificial intelligence (AI) is revolutionizing multiple industries through machine learning, 
    natural language processing, and computer vision technologies. These systems analyze vast 
    amounts of data to recognize patterns and make intelligent decisions. In healthcare, AI assists 
    in medical diagnosis and drug discovery. In finance, it powers fraud detection and algorithmic 
    trading. Transportation benefits from autonomous vehicles and route optimization. However, AI 
    development raises important ethical considerations including privacy protection, algorithmic 
    bias prevention, and the future impact on employment as automation becomes more widespread.
  `.trim();

  try {
    // Test without authentication
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6',
      {
        inputs: testContent,
        parameters: {
          max_length: 100,
          min_length: 20,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Free inference successful!');
    if (response.data && Array.isArray(response.data) && response.data[0]) {
      const summary = response.data[0].summary_text || response.data[0].generated_text || '';
      console.log('📄 Generated Summary:', summary);
      return true;
    } else {
      console.log('❌ Unexpected response format:', response.data);
      return false;
    }

  } catch (error) {
    console.log('❌ Free inference failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

async function testAIService() {
  console.log('\n🔧 Testing AI Service with fixes...');
  
  const testContent = `
    Machine learning is a subset of artificial intelligence that enables computers to learn and 
    improve from experience without being explicitly programmed. It uses algorithms to analyze 
    data, identify patterns, and make predictions or decisions. There are three main types: 
    supervised learning uses labeled data, unsupervised learning finds hidden patterns in 
    unlabeled data, and reinforcement learning learns through trial and error. Applications 
    include recommendation systems, image recognition, natural language processing, and 
    autonomous vehicles. The field continues to evolve with deep learning and neural networks 
    achieving breakthrough results in complex tasks.
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
    
    return true;

  } catch (error) {
    console.log('❌ AI Service failed:', error.message);
    return false;
  }
}

async function testDifferentStyles() {
  console.log('\n🎨 Testing different summarization styles...');
  
  const testContent = `
    Climate change refers to long-term shifts in global temperatures and weather patterns. 
    While climate variations occur naturally, scientific evidence shows that human activities 
    have been the primary driver since the 1800s. The burning of fossil fuels generates 
    greenhouse gas emissions that trap heat in Earth's atmosphere. Key impacts include rising 
    sea levels, extreme weather events, and ecosystem disruption. Solutions involve transitioning 
    to renewable energy sources, improving energy efficiency, and implementing carbon capture 
    technologies. International cooperation through agreements like the Paris Climate Accord 
    is essential for addressing this global challenge effectively.
  `.trim();

  const styles = ['concise', 'bullet', 'detailed'];
  
  for (const style of styles) {
    try {
      console.log(`\n📝 Testing ${style} style...`);
      const result = await aiService.summarizeText(testContent, {
        maxLength: 120,
        style: style
      });
      
      console.log(`✅ ${style.toUpperCase()} Summary:`, result.summary);
      console.log(`🔧 Provider: ${result.provider}`);
      
    } catch (error) {
      console.log(`❌ ${style} style failed:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Testing AI Summarization Fixes\n');
  
  // Test free Hugging Face inference
  const freeWorking = await testHuggingFaceFree();
  
  // Test the AI service
  const serviceWorking = await testAIService();
  
  // Test different styles
  if (serviceWorking) {
    await testDifferentStyles();
  }
  
  console.log('\n🏁 Testing complete!');
  
  if (freeWorking || serviceWorking) {
    console.log('✅ AI summarization is now working!');
  } else {
    console.log('❌ AI summarization still has issues');
  }
}

main().catch(console.error);
