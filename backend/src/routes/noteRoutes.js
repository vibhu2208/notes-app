/**
 * Notes routes
 * Handles CRUD operations for notes and AI summarization
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const noteController = require('../controllers/noteController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  validateCreateNote,
  validateUpdateNote,
  validateNoteId,
  validateSearch,
  validateGetNotes,
  validateBulkOperations,
  validateRecentNotes,
} = require('../middleware/noteValidation');

// Rate limiting for note operations
const noteCreateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each user to 10 note creations per minute
  message: {
    success: false,
    error: {
      message: 'Too many notes created, please slow down',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    },
  },
});

const noteSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each user to 30 searches per minute
  message: {
    success: false,
    error: {
      message: 'Too many search requests, please slow down',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    },
  },
});

// All routes require authentication
router.use(authenticate);

// Special routes (must come before parameterized routes)
router.get('/search', noteSearchLimiter, validateSearch, noteController.searchNotes);
router.get('/stats', noteController.getStats);
router.get('/recent', validateRecentNotes, noteController.getRecentNotes);
router.post('/bulk', validateBulkOperations, noteController.bulkOperations);

// CRUD routes
router.get('/', validateGetNotes, noteController.getNotes);
router.get('/:id', validateNoteId, noteController.getNote);
router.post('/', noteCreateLimiter, validateCreateNote, noteController.createNote);
router.put('/:id', validateUpdateNote, noteController.updateNote);
router.delete('/:id', validateNoteId, noteController.deleteNote);

// Additional operations
router.patch('/:id/pin', validateNoteId, noteController.togglePin);

// AI summarization route
const aiController = require('../controllers/aiController');

const aiSummarizeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each user to 20 AI requests per hour
  message: {
    success: false,
    error: {
      message: 'AI summarization rate limit exceeded. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    },
  },
});

router.post('/:id/summarize', aiSummarizeLimiter, validateNoteId, aiController.summarizeNote);

module.exports = router;
