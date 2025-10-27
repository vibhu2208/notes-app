/**
 * AI routes
 * Handles AI service management and batch operations
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const aiController = require('../controllers/aiController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBulkOperations } = require('../middleware/noteValidation');

// Rate limiting for batch operations
const batchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each user to 5 batch operations per hour
  message: {
    success: false,
    error: {
      message: 'Batch operation rate limit exceeded. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    },
  },
});

// All routes require authentication
router.use(authenticate);

// Batch summarization for regular users
router.post('/batch-summarize', batchLimiter, aiController.batchSummarize);

// Admin-only routes
router.get('/health', authorize('admin'), aiController.getAIHealth);
router.get('/stats', authorize('admin'), aiController.getAIStats);

module.exports = router;
