/**
 * AI Controller
 * Handles AI-related operations like note summarization
 */

const Note = require('../models/Note');
const aiService = require('../services/aiService');
const logger = require('../config/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  NotFoundError,
  ValidationError,
  AIServiceError,
  RateLimitError,
} = require('../utils/errors');

// Rate limiting tracking
const userRequestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 20;

/**
 * Summarize a note using AI
 * @route POST /api/notes/:id/summarize
 * @access Private
 */
const summarizeNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userEmail = req.user.email;
  
  // Rate limiting check
  const now = Date.now();
  const userKey = userId.toString();
  
  if (!userRequestCounts.has(userKey)) {
    userRequestCounts.set(userKey, []);
  }
  
  const userRequests = userRequestCounts.get(userKey);
  
  // Clean old requests
  const validRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  userRequestCounts.set(userKey, validRequests);
  
  if (validRequests.length >= MAX_REQUESTS_PER_HOUR) {
    throw new RateLimitError('AI summarization rate limit exceeded. Please try again later.');
  }

  // Find the note
  const note = await Note.findOne({ _id: id, userId, isDeleted: false });
  
  if (!note) {
    throw new NotFoundError('Note not found');
  }

  // Check if note already has a recent summary
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (note.summary && note.summarizedAt && note.summarizedAt > oneHourAgo) {
    logger.info(`Returning existing summary for note ${id} by user ${userEmail}`);
    
    return res.json({
      success: true,
      data: {
        note: {
          _id: note._id,
          title: note.title,
          summary: note.summary,
          summarizedAt: note.summarizedAt,
        },
        cached: true,
      },
      message: 'Summary retrieved from cache',
    });
  }

  // Validate content length
  if (note.content.length < 100) {
    throw new ValidationError('Note content is too short for meaningful summarization (minimum 100 characters)');
  }

  try {
    // Record the request
    validRequests.push(now);
    userRequestCounts.set(userKey, validRequests);

    // Generate summary
    logger.info(`Starting AI summarization for note ${id} by user ${userEmail}`);
    
    const summaryOptions = {
      maxLength: 150,
      style: req.body.style || 'concise',
      userId: userKey,
    };

    const result = await aiService.summarizeText(note.content, summaryOptions);
    
    // Update note with summary
    note.summary = result.summary;
    note.summarizedAt = new Date();
    await note.save();

    logger.info(`AI summarization completed for note ${id} using ${result.provider}`);

    res.json({
      success: true,
      data: {
        note: {
          _id: note._id,
          title: note.title,
          summary: note.summary,
          summarizedAt: note.summarizedAt,
        },
        provider: result.provider,
        wordCount: result.wordCount,
        cached: false,
      },
      message: 'Note summarized successfully',
    });

  } catch (error) {
    logger.error(`AI summarization failed for note ${id}:`, error);
    
    if (error instanceof AIServiceError) {
      // Return a user-friendly error for AI service issues
      res.status(502).json({
        success: false,
        error: {
          message: 'AI summarization service is temporarily unavailable. Please try again later.',
          code: 'AI_SERVICE_UNAVAILABLE',
          statusCode: 502,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      });
    } else {
      throw error;
    }
  }
});

/**
 * Get AI service health status
 * @route GET /api/ai/health
 * @access Private (Admin only)
 */
const getAIHealth = asyncHandler(async (req, res) => {
  const health = await aiService.healthCheck();
  const stats = aiService.getStats();

  res.json({
    success: true,
    data: {
      health,
      stats,
      rateLimits: {
        maxRequestsPerHour: MAX_REQUESTS_PER_HOUR,
        windowMs: RATE_LIMIT_WINDOW,
      },
    },
  });
});

/**
 * Get AI service statistics
 * @route GET /api/ai/stats
 * @access Private (Admin only)
 */
const getAIStats = asyncHandler(async (req, res) => {
  const stats = aiService.getStats();
  
  // Get user request counts
  const activeUsers = userRequestCounts.size;
  const totalActiveRequests = Array.from(userRequestCounts.values())
    .reduce((sum, requests) => sum + requests.length, 0);

  res.json({
    success: true,
    data: {
      service: stats,
      usage: {
        activeUsers,
        totalActiveRequests,
        rateLimitWindow: RATE_LIMIT_WINDOW,
        maxRequestsPerHour: MAX_REQUESTS_PER_HOUR,
      },
    },
  });
});

/**
 * Batch summarize multiple notes
 * @route POST /api/ai/batch-summarize
 * @access Private
 */
const batchSummarize = asyncHandler(async (req, res) => {
  const { noteIds, style = 'concise' } = req.body;
  const userId = req.user._id;
  const userEmail = req.user.email;

  if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
    throw new ValidationError('noteIds array is required');
  }

  if (noteIds.length > 10) {
    throw new ValidationError('Cannot summarize more than 10 notes at once');
  }

  // Rate limiting check (stricter for batch operations)
  const userKey = userId.toString();
  const now = Date.now();
  
  if (!userRequestCounts.has(userKey)) {
    userRequestCounts.set(userKey, []);
  }
  
  const userRequests = userRequestCounts.get(userKey);
  const validRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Each note in batch counts as 2 requests
  const batchCost = noteIds.length * 2;
  if (validRequests.length + batchCost > MAX_REQUESTS_PER_HOUR) {
    throw new RateLimitError('Batch summarization would exceed rate limit');
  }

  // Find notes
  const notes = await Note.find({
    _id: { $in: noteIds },
    userId,
    isDeleted: false,
  });

  if (notes.length === 0) {
    throw new NotFoundError('No valid notes found');
  }

  const results = [];
  const errors = [];

  // Process each note
  for (const note of notes) {
    try {
      // Skip if recently summarized
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (note.summary && note.summarizedAt && note.summarizedAt > oneHourAgo) {
        results.push({
          noteId: note._id,
          title: note.title,
          summary: note.summary,
          cached: true,
        });
        continue;
      }

      // Skip if content too short
      if (note.content.length < 100) {
        errors.push({
          noteId: note._id,
          title: note.title,
          error: 'Content too short for summarization',
        });
        continue;
      }

      // Summarize
      const result = await aiService.summarizeText(note.content, {
        maxLength: 150,
        style,
        userId: userKey,
      });

      // Update note
      note.summary = result.summary;
      note.summarizedAt = new Date();
      await note.save();

      results.push({
        noteId: note._id,
        title: note.title,
        summary: result.summary,
        provider: result.provider,
        cached: false,
      });

      // Record request
      validRequests.push(now, now); // Count as 2 requests
      
    } catch (error) {
      logger.error(`Batch summarization failed for note ${note._id}:`, error);
      errors.push({
        noteId: note._id,
        title: note.title,
        error: error.message,
      });
    }
  }

  // Update rate limiting
  userRequestCounts.set(userKey, validRequests);

  logger.info(`Batch summarization completed for user ${userEmail}: ${results.length} successful, ${errors.length} failed`);

  res.json({
    success: true,
    data: {
      results,
      errors,
      summary: {
        total: noteIds.length,
        successful: results.length,
        failed: errors.length,
      },
    },
    message: `Batch summarization completed: ${results.length}/${noteIds.length} successful`,
  });
});

module.exports = {
  summarizeNote,
  getAIHealth,
  getAIStats,
  batchSummarize,
};
