/**
 * Test script to diagnose AI summarization issues
 */

const axios = require('axios');
require('dotenv').config();

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

async function testHuggingFace() {
  console.log('🧪 Testing Hugging Face API...');
  console.log('API Key:', HUGGINGFACE_API_KEY ? `${HUGGINGFACE_API_KEY.substring(0, 8)}...` : 'Not found');
  
  const testContent = `
    Artificial intelligence (AI) is a rapidly growing field that encompasses machine learning, 
    natural language processing, and computer vision. AI systems are being deployed across 
    various industries including healthcare, finance, and transportation. These systems can 
    analyze large amounts of data, recognize patterns, and make predictions or decisions 
    based on their training. However, AI also raises important ethical questions about 
    privacy, bias, and the future of work as automation becomes more prevalent.
  `.trim();

  try {
    // Test with Facebook BART model
    console.log('\n📝 Testing with BART model...');
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
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
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Success! Response:', response.data);
    
    if (response.data && Array.isArray(response.data) && response.data[0]) {
      const summary = response.data[0].summary_text || response.data[0].generated_text || '';
      console.log('📄 Generated Summary:', summary);
      return true;
    } else {
      console.log('❌ Unexpected response format:', response.data);
      return false;
    }

  } catch (error) {
    console.log('❌ Error occurred:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      
      if (error.response.status === 503) {
        console.log('🔄 Model is loading, trying alternative approach...');
        return await testAlternativeModel();
      }
    } else {
      console.log('Network Error:', error.message);
    }
    
    return false;
  }
}

async function testAlternativeModel() {
  console.log('\n🔄 Testing with alternative model (T5)...');
  
  const testContent = `
    Artificial intelligence (AI) is a rapidly growing field that encompasses machine learning, 
    natural language processing, and computer vision. AI systems are being deployed across 
    various industries including healthcare, finance, and transportation.
  `.trim();

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/t5-small',
      {
        inputs: `summarize: ${testContent}`,
        parameters: {
          max_length: 100,
          min_length: 20,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ T5 Success! Response:', response.data);
    
    if (response.data && Array.isArray(response.data) && response.data[0]) {
      const summary = response.data[0].generated_text || '';
      console.log('📄 T5 Generated Summary:', summary);
      return true;
    }
    
    return false;

  } catch (error) {
    console.log('❌ T5 also failed:', error.response?.data || error.message);
    return false;
  }
}

async function testFallbackSummarization() {
  console.log('\n🔧 Testing fallback summarization...');
  
  const testContent = `
    Artificial intelligence (AI) is a rapidly growing field that encompasses machine learning, 
    natural language processing, and computer vision. AI systems are being deployed across 
    various industries including healthcare, finance, and transportation. These systems can 
    analyze large amounts of data, recognize patterns, and make predictions or decisions 
    based on their training. However, AI also raises important ethical questions about 
    privacy, bias, and the future of work as automation becomes more prevalent.
  `.trim();

  // Simple extractive summarization
  const sentences = testContent.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  const summary = sentences.slice(0, 2).join('. ') + '.';
  
  console.log('✅ Fallback summary:', summary);
  return summary;
}

async function main() {
  console.log('🚀 Starting AI Summarization Diagnostics\n');
  
  const huggingFaceWorking = await testHuggingFace();
  
  if (!huggingFaceWorking) {
    console.log('\n⚠️  Hugging Face API not working, testing fallback...');
    await testFallbackSummarization();
  }
  
  console.log('\n🏁 Diagnostics complete!');
  
  if (huggingFaceWorking) {
    console.log('✅ Hugging Face API is working correctly');
  } else {
    console.log('❌ Hugging Face API has issues - fallback will be used');
  }
}

main().catch(console.error);
