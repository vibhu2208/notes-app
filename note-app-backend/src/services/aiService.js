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
    
    // Determine primary provider based on available API keys
    this.currentProvider = this.selectPrimaryProvider();
    
    // Statistics tracking
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Select the best available provider based on configuration
   */
  selectPrimaryProvider() {
    if (config.huggingFaceApiKey) return 'huggingface';
    if (config.openaiApiKey) return 'openai';
    return 'fallback';
  }

  /**
   * Main summarization function with robust fallback
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
    if (trimmedContent.length < 100) {
      throw new ValidationError('Content must be at least 100 characters long for meaningful summarization');
    }

    if (trimmedContent.length > 50000) {
      throw new ValidationError('Content is too long for summarization (max 50,000 characters)');
    }

    this.requestCount++;
    logger.info(`AI summarization request #${this.requestCount} for user: ${userId || 'unknown'}`);
    try {
      // Try primary provider
      const result = await this.executeWithRetry(
        this.providers[this.currentProvider],
        [trimmedContent, { maxLength, style }],
        2
      );

      const validatedSummary = this.validateAIResponse(result, trimmedContent);
      logger.info(`AI summarization successful using ${this.currentProvider}`);
      
      return this.formatResult(validatedSummary, this.currentProvider, trimmedContent);

    } catch (error) {
      this.errorCount++;
      logger.error(`AI summarization failed with ${this.currentProvider}:`, error.message);

      // Try fallback if primary provider failed
      if (this.currentProvider !== 'fallback') {
        return await this.tryFallbackSummarization(trimmedContent, { maxLength, style });
      }

      // Last resort: simple truncation
      logger.warn('All methods failed, using simple truncation');
      const simpleSummary = this.simpleTruncate(trimmedContent, maxLength);
      return this.formatResult(simpleSummary, 'simple', trimmedContent);
    }
  }

  /**
   * Try fallback summarization when primary provider fails
   */
  async tryFallbackSummarization(content, options) {
    try {
      logger.info('Attempting fallback summarization method');
      const fallbackResult = await this.providers.fallback(content, options);
      return this.formatResult(fallbackResult, 'fallback', content);
    } catch (fallbackError) {
      logger.error('Fallback summarization failed:', fallbackError.message);
      const simpleSummary = this.simpleTruncate(content, options.maxLength);
      return this.formatResult(simpleSummary, 'simple', content);
    }
  }

  /**
   * Format the result object consistently
   */
  formatResult(summary, provider, originalContent) {
    return {
      summary,
      provider,
      wordCount: summary.split(' ').length,
      originalLength: originalContent.length,
    };
  }

  /**
   * Hugging Face summarization (FREE)
   */
  async huggingFaceSummarize(content, options = {}) {
    const { maxLength } = options;
    
    if (!config.huggingFaceApiKey) {
      throw new AIServiceError('Hugging Face API key not configured');
    }

    const models = ['facebook/bart-large-cnn', 'sshleifer/distilbart-cnn-12-6'];
    
    for (const model of models) {
      try {
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            inputs: content,
            parameters: {
              max_length: Math.min(maxLength, 142),
              min_length: 30,
              do_sample: false,
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${config.huggingFaceApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        const summary = response.data?.[0]?.summary_text?.trim();
        if (summary) {
          return summary;
        }
        
      } catch (modelError) {
        logger.warn(`Model ${model} failed:`, modelError.message);
        continue;
      }
    }
    
    throw new AIServiceError('All Hugging Face models failed');
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
      logger.info('Using fallback summarization method');
      
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
        if (index === 0) score *= 1.8; // Increased bonus for first sentence
        if (index === sentences.length - 1) score *= 1.3;
        
        // Length penalty for very short or very long sentences
        const wordCount = words.length;
        if (wordCount < 5) score *= 0.3;
        if (wordCount > 35) score *= 0.7;
        if (wordCount >= 8 && wordCount <= 25) score *= 1.2; // Bonus for ideal length
        
        // Keyword bonus - expanded list
        const keywords = [
          'important', 'key', 'main', 'significant', 'conclusion', 'summary', 'result',
          'therefore', 'however', 'moreover', 'furthermore', 'consequently', 'finally',
          'first', 'second', 'third', 'primary', 'secondary', 'essential', 'critical',
          'shows', 'demonstrates', 'indicates', 'reveals', 'suggests', 'proves'
        ];
        keywords.forEach(keyword => {
          if (sentence.toLowerCase().includes(keyword)) {
            score *= 1.4;
          }
        });
        
        // Numerical data bonus
        if (/\d+/.test(sentence)) {
          score *= 1.2;
        }
        
        return { sentence, score, index };
      });

      // Sort by score and select top sentences
      const numSentences = Math.min(Math.max(2, Math.ceil(sentences.length * 0.3)), 4);
      const topSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, numSentences);
      
      // Re-order by original position for coherence
      const orderedSentences = topSentences
        .sort((a, b) => a.index - b.index)
        .map(item => item.sentence);

      // Build summary within word limit
      let summary = '';
      let wordCount = 0;
      const targetWords = Math.ceil(maxLength / 3.5); // More generous word limit
      
      for (const sentence of orderedSentences) {
        const sentenceWords = sentence.split(/\s+/).length;
        if (wordCount + sentenceWords <= targetWords) {
          summary += (summary ? ' ' : '') + sentence.trim();
          if (!sentence.endsWith('.') && !sentence.endsWith('!') && !sentence.endsWith('?')) {
            summary += '.';
          }
          summary += ' ';
          wordCount += sentenceWords;
        } else if (!summary) {
          // If first sentence is too long, truncate it intelligently
          const words = sentence.split(/\s+/);
          const truncated = words.slice(0, Math.max(10, targetWords)).join(' ');
          summary = truncated + (truncated.endsWith('.') ? '' : '...');
          break;
        }
      }
      
      summary = summary.trim();
      
      // Style-based formatting
      if (style === 'bullet' && summary) {
        const points = summary.split(/[.!?]+/).filter(s => s.trim().length > 15);
        summary = points.map(point => `• ${point.trim()}`).join('\n');
      } else if (style === 'detailed' && summary) {
        // For detailed style, try to include more context
        summary = `Summary: ${summary}`;
      }
      
      const finalSummary = summary || this.generateKeywordSummary(content, targetWords);
      logger.info(`Fallback summarization completed: ${finalSummary.length} characters`);
      
      return finalSummary;
      
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
   * Simple but intelligent truncation fallback
   */
  simpleTruncate(content, maxLength) {
    const targetWords = Math.ceil(maxLength / 4);
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    if (sentences.length === 0) {
      // Fallback to character-based truncation
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
    
    // Take first few sentences that fit within word limit
    let summary = '';
    let wordCount = 0;
    
    for (const sentence of sentences) {
      const sentenceWords = sentence.split(/\s+/).length;
      if (wordCount + sentenceWords <= targetWords) {
        summary += (summary ? '. ' : '') + sentence;
        wordCount += sentenceWords;
      } else if (!summary) {
        // If first sentence is too long, truncate it
        const words = sentence.split(/\s+/);
        summary = words.slice(0, targetWords).join(' ') + '...';
        break;
      } else {
        break;
      }
    }
    
    // Ensure proper ending
    if (summary && !summary.endsWith('.') && !summary.endsWith('...')) {
      summary += '.';
    }
    
    return summary || content.substring(0, Math.ceil(maxLength * 4)) + '...';
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
