/**
 * Note validation middleware
 * Handles input validation for note operations
 */

const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');
const mongoose = require('mongoose');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));
    
    throw new ValidationError('Validation failed', errorDetails);
  }
  
  next();
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('Invalid ID format');
  }
  return true;
};

/**
 * Note creation validation rules
 */
const validateCreateNote = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
    
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be between 1 and 50,000 characters'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new Error('All tags must be non-empty strings');
        }
        if (tag.length > 30) {
          throw new Error('Each tag must be less than 30 characters');
        }
      }
      return true;
    }),
    
  body('category')
    .optional()
    .isIn(['personal', 'work', 'ideas', 'other'])
    .withMessage('Category must be one of: personal, work, ideas, other'),
    
  handleValidationErrors,
];

/**
 * Note update validation rules
 */
const validateUpdateNote = [
  param('id')
    .custom(validateObjectId)
    .withMessage('Invalid note ID'),
    
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
    
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be between 1 and 50,000 characters'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new Error('All tags must be non-empty strings');
        }
        if (tag.length > 30) {
          throw new Error('Each tag must be less than 30 characters');
        }
      }
      return true;
    }),
    
  body('category')
    .optional()
    .isIn(['personal', 'work', 'ideas', 'other'])
    .withMessage('Category must be one of: personal, work, ideas, other'),
    
  handleValidationErrors,
];

/**
 * Note ID parameter validation
 */
const validateNoteId = [
  param('id')
    .custom(validateObjectId)
    .withMessage('Invalid note ID'),
    
  handleValidationErrors,
];

/**
 * Search query validation
 */
const validateSearch = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  handleValidationErrors,
];

/**
 * Get notes query validation
 */
const validateGetNotes = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  query('category')
    .optional()
    .isIn(['personal', 'work', 'ideas', 'other'])
    .withMessage('Category must be one of: personal, work, ideas, other'),
    
  query('sortBy')
    .optional()
    .isIn(['title', 'createdAt', 'lastModified', 'wordCount'])
    .withMessage('SortBy must be one of: title, createdAt, lastModified, wordCount'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be either asc or desc'),
    
  query('isPinned')
    .optional()
    .isBoolean()
    .withMessage('isPinned must be a boolean'),
    
  handleValidationErrors,
];

/**
 * Bulk operations validation
 */
const validateBulkOperations = [
  body('operation')
    .notEmpty()
    .withMessage('Operation is required')
    .isIn(['delete', 'pin', 'unpin'])
    .withMessage('Operation must be one of: delete, pin, unpin'),
    
  body('noteIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('noteIds must be an array with 1-50 items')
    .custom((noteIds) => {
      for (const id of noteIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('All note IDs must be valid MongoDB ObjectIds');
        }
      }
      return true;
    }),
    
  handleValidationErrors,
];

/**
 * Recent notes query validation
 */
const validateRecentNotes = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
    
  handleValidationErrors,
];

module.exports = {
  validateCreateNote,
  validateUpdateNote,
  validateNoteId,
  validateSearch,
  validateGetNotes,
  validateBulkOperations,
  validateRecentNotes,
  handleValidationErrors,
};
