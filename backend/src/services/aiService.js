/**
 * AI Service
 * Handles AI summarization with multiple providers and fallback strategies
 */

const axios = require('axios');
const config = require('../config/config');
const logger = require('../config/logger');
const { AIServiceError, ValidationError } = require('../utils/errors');

class AIService {
  constructor() {
    this.providers = {
      huggingface: this.huggingFaceSummarize.bind(this),
      openai: this.openaiSummarize.bind(this),
      fallback: this.fallbackSummarize.bind(this),
    };
    
    // Priority: HuggingFace (free) -> OpenAI (paid) -> Fallback (local)
    this.currentProvider = 'huggingface';
    if (config.openaiApiKey && !config.huggingFaceApiKey) {
      this.currentProvider = 'openai';
    } else if (!config.huggingFaceApiKey && !config.openaiApiKey) {
      this.currentProvider = 'fallback';
    }
    
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Main summarization function with provider fallback
   */
  async summarizeText(content, options = {}) {
    const {
      maxLength = config.maxTokens || 150,
      style = 'concise',
      userId = null,
    } = options;

    // Validate input
    if (!content || typeof content !== 'string') {
      throw new ValidationError('Content must be a non-empty string');
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 50) {
      throw new ValidationError('Content must be at least 50 characters long for summarization');
    }

    if (trimmedContent.length > 10000) {
      throw new ValidationError('Content is too long for summarization (max 10,000 characters)');
    }

    this.requestCount++;
    logger.info(`AI summarization request #${this.requestCount} for user: ${userId || 'unknown'}`);

    try {
      // Try primary provider
      const result = await this.executeWithRetry(
        this.providers[this.currentProvider],
        [trimmedContent, { maxLength, style }],
        3
      );

      // Validate AI response
      const validatedSummary = this.validateAIResponse(result, trimmedContent);
      
      logger.info(`AI summarization successful using ${this.currentProvider}`);
      return {
        summary: validatedSummary,
        provider: this.currentProvider,
        wordCount: validatedSummary.split(' ').length,
        originalLength: trimmedContent.length,
      };

    } catch (error) {
      this.errorCount++;
      logger.error(`AI summarization failed with ${this.currentProvider}:`, error.message);

      // Try fallback if primary provider failed
      if (this.currentProvider !== 'fallback') {
        try {
          logger.info('Attempting fallback summarization method');
          const fallbackResult = await this.providers.fallback(trimmedContent, { maxLength, style });
          
          return {
            summary: fallbackResult,
            provider: 'fallback',
            wordCount: fallbackResult.split(' ').length,
            originalLength: trimmedContent.length,
          };
        } catch (fallbackError) {
          logger.error('Fallback summarization also failed:', fallbackError.message);
        }
      }

      throw new AIServiceError(`Summarization failed: ${error.message}`);
    }
  }

  /**
   * Hugging Face summarization (FREE)
   */
  async huggingFaceSummarize(content, options = {}) {
    const { maxLength, style } = options;
    
    try {
      // Use Facebook's BART model for summarization (free)
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        {
          inputs: content,
          parameters: {
            max_length: Math.min(maxLength, 142), // BART max is 142 tokens
            min_length: 30,
            do_sample: false,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${config.huggingFaceApiKey || 'hf_demo'}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      let summary = '';
      if (response.data && Array.isArray(response.data) && response.data[0]) {
        summary = response.data[0].summary_text || response.data[0].generated_text || '';
      }
      
      if (!summary) {
        throw new AIServiceError('Empty response from Hugging Face');
      }

      return summary.trim();

    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error || 'Unknown Hugging Face error';
        
        if (status === 401) {
          throw new AIServiceError('Invalid Hugging Face API key');
        } else if (status === 429) {
          throw new AIServiceError('Hugging Face rate limit exceeded');
        } else if (status === 503) {
          throw new AIServiceError('Hugging Face model is loading, try again in a moment');
        } else {
          throw new AIServiceError(`Hugging Face API error: ${message}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new AIServiceError('Hugging Face request timeout');
      } else {
        throw new AIServiceError(`Hugging Face connection error: ${error.message}`);
      }
    }
  }

  /**
   * OpenAI GPT summarization
   */
  async openaiSummarize(content, options = {}) {
    if (!config.openaiApiKey) {
      throw new AIServiceError('OpenAI API key not configured');
    }

    const { maxLength, style } = options;
    
    const systemPrompt = this.buildSystemPrompt(style);
    const userPrompt = `Please summarize the following text in approximately ${Math.ceil(maxLength / 4)} words:\n\n${content}`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: config.aiModel || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxLength,
          temperature: 0.3,
          top_p: 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      const summary = response.data.choices[0]?.message?.content?.trim();
      
      if (!summary) {
        throw new AIServiceError('Empty response from OpenAI');
      }

      return summary;

    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || 'Unknown OpenAI error';
        
        if (status === 401) {
          throw new AIServiceError('Invalid OpenAI API key');
        } else if (status === 429) {
          throw new AIServiceError('OpenAI rate limit exceeded');
        } else if (status === 500) {
          throw new AIServiceError('OpenAI service temporarily unavailable');
        } else {
          throw new AIServiceError(`OpenAI API error: ${message}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new AIServiceError('OpenAI request timeout');
      } else {
        throw new AIServiceError(`OpenAI connection error: ${error.message}`);
      }
    }
  }

  /**
   * Fallback summarization using advanced extractive method (100% FREE)
   */
  async fallbackSummarize(content, options = {}) {
    const { maxLength, style } = options;
    
    try {
      // Advanced extractive summarization with TF-IDF-like scoring
      const sentences = this.extractSentences(content);
      if (sentences.length === 0) {
        return this.simpleTruncate(content, maxLength);
      }

      // Calculate word frequencies
      const wordFreq = this.calculateWordFrequencies(content);
      
      // Score sentences based on multiple factors
      const scoredSentences = sentences.map((sentence, index) => {
        let score = 0;
        const words = sentence.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        
        // TF-IDF-like scoring
        words.forEach(word => {
          score += (wordFreq[word] || 0);
        });
        
        // Position bonus (first and last sentences are often important)
        if (index === 0) score *= 1.5;
        if (index === sentences.length - 1) score *= 1.2;
        
        // Length penalty for very short or very long sentences
        const wordCount = words.length;
        if (wordCount < 5) score *= 0.5;
        if (wordCount > 30) score *= 0.8;
        
        // Keyword bonus
        const keywords = ['important', 'key', 'main', 'significant', 'conclusion', 'summary', 'result'];
        keywords.forEach(keyword => {
          if (sentence.toLowerCase().includes(keyword)) {
            score *= 1.3;
          }
        });
        
        return { sentence, score, index };
      });

      // Sort by score and select top sentences
      const topSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(3, sentences.length));
      
      // Re-order by original position for coherence
      const orderedSentences = topSentences
        .sort((a, b) => a.index - b.index)
        .map(item => item.sentence);

      // Build summary within word limit
      let summary = '';
      let wordCount = 0;
      const targetWords = Math.ceil(maxLength / 4);
      
      for (const sentence of orderedSentences) {
        const sentenceWords = sentence.split(/\s+/).length;
        if (wordCount + sentenceWords <= targetWords) {
          summary += (summary ? ' ' : '') + sentence;
          wordCount += sentenceWords;
        } else if (!summary) {
          // If first sentence is too long, truncate it
          const words = sentence.split(/\s+/);
          summary = words.slice(0, targetWords).join(' ') + '...';
          break;
        }
      }
      
      // Style-based formatting
      if (style === 'bullet' && summary) {
        const points = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
        summary = points.map(point => `• ${point.trim()}`).join('\n');
      }
      
      return summary.trim() || this.generateKeywordSummary(content, targetWords);
      
    } catch (error) {
      logger.error('Fallback summarization error:', error);
      return this.simpleTruncate(content, maxLength);
    }
  }

  /**
   * Calculate word frequencies for TF-IDF-like scoring
   */
  calculateWordFrequencies(text) {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const freq = {};
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    words.forEach(word => {
      if (!stopWords.has(word)) {
        freq[word] = (freq[word] || 0) + 1;
      }
    });
    
    return freq;
  }

  /**
   * Generate keyword-based summary as last resort
   */
  generateKeywordSummary(content, maxWords) {
    const wordFreq = this.calculateWordFrequencies(content);
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, Math.min(10, maxWords / 2))
      .map(([word]) => word);
    
    if (topWords.length === 0) {
      return this.simpleTruncate(content, maxWords * 5);
    }
    
    return `Key topics: ${topWords.join(', ')}. ${this.simpleTruncate(content, maxWords * 3)}`;
  }

  /**
   * Execute function with retry logic
   */
  async executeWithRetry(fn, args, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        logger.warn(`AI service attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Validate AI response quality
   */
  validateAIResponse(summary, originalContent) {
    if (!summary || typeof summary !== 'string') {
      throw new AIServiceError('Invalid AI response format');
    }

    const trimmedSummary = summary.trim();
    
    if (trimmedSummary.length < 10) {
      throw new AIServiceError('AI response too short');
    }

    if (trimmedSummary.length > originalContent.length) {
      throw new AIServiceError('AI response longer than original content');
    }

    // Check for common AI failure patterns
    const failurePatterns = [
      /^(I cannot|I can't|Unable to|Sorry, I cannot)/i,
      /^(As an AI|I'm an AI|I am an AI)/i,
      /^(Error|Failed|Exception)/i,
    ];

    for (const pattern of failurePatterns) {
      if (pattern.test(trimmedSummary)) {
        throw new AIServiceError('AI response indicates failure');
      }
    }

    return trimmedSummary;
  }

  /**
   * Build system prompt based on style
   */
  buildSystemPrompt(style) {
    const basePrompt = 'You are a helpful assistant that creates concise, accurate summaries.';
    
    switch (style) {
      case 'bullet':
        return `${basePrompt} Format your summary as bullet points highlighting key information.`;
      case 'detailed':
        return `${basePrompt} Provide a comprehensive summary that covers all important aspects.`;
      case 'concise':
      default:
        return `${basePrompt} Create a brief, clear summary focusing on the main points and key takeaways.`;
    }
  }

  /**
   * Extract sentences from text
   */
  extractSentences(text) {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .slice(0, 20); // Limit to first 20 sentences
  }

  /**
   * Rank sentences by importance (simple frequency-based)
   */
  rankSentences(sentences, fullText) {
    const words = fullText.toLowerCase().split(/\W+/);
    const wordFreq = {};
    
    // Calculate word frequencies
    words.forEach(word => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Score sentences
    const scoredSentences = sentences.map(sentence => {
      const sentenceWords = sentence.toLowerCase().split(/\W+/);
      const score = sentenceWords.reduce((sum, word) => {
        return sum + (wordFreq[word] || 0);
      }, 0);
      
      return { sentence, score };
    });

    // Sort by score and return sentences
    return scoredSentences
      .sort((a, b) => b.score - a.score)
      .map(item => item.sentence);
  }

  /**
   * Simple truncation fallback
   */
  simpleTruncate(content, maxLength) {
    const targetChars = Math.ceil(maxLength * 4);
    if (content.length <= targetChars) {
      return content;
    }
    
    const truncated = content.substring(0, targetChars);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > targetChars * 0.8 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      successRate: this.requestCount > 0 ? ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(2) : 0,
      currentProvider: this.currentProvider,
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (this.currentProvider === 'openai' && config.openaiApiKey) {
        // Test with a simple request
        await this.openaiSummarize('This is a test sentence for health check purposes.', { maxLength: 50 });
      }
      return { status: 'healthy', provider: this.currentProvider };
    } catch (error) {
      return { status: 'unhealthy', provider: this.currentProvider, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new AIService();
