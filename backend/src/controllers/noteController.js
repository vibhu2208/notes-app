/**
 * Note controller
 * Handles all note-related operations including CRUD and search
 */

const Note = require('../models/Note');
const logger = require('../config/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} = require('../utils/errors');

/**
 * Get all notes for authenticated user
 * @route GET /api/notes
 * @access Private
 */
const getNotes = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 10,
    category,
    tags,
    sortBy,
    sortOrder = 'desc',
    isPinned,
  } = req.query;

  // Parse tags if provided
  const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

  // Build options object
  const options = {
    limit: Math.min(parseInt(limit), 50), // Max 50 notes per page
    skip: (parseInt(page) - 1) * parseInt(limit),
    category,
    tags: parsedTags,
    sortBy,
    sortOrder,
  };

  if (isPinned !== undefined) {
    options.isPinned = isPinned === 'true';
  }

  // Get notes and total count
  const [notes, totalNotes] = await Promise.all([
    Note.findByUser(userId, options),
    Note.countDocuments({ userId, isDeleted: false }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalNotes / options.limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.json({
    success: true,
    data: {
      notes,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalNotes,
        hasNextPage,
        hasPrevPage,
        limit: options.limit,
      },
    },
  });
});

/**
 * Get single note by ID
 * @route GET /api/notes/:id
 * @access Private
 */
const getNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const note = await Note.findOne({ _id: id, userId, isDeleted: false });

  if (!note) {
    throw new NotFoundError('Note not found');
  }

  res.json({
    success: true,
    data: {
      note,
    },
  });
});

/**
 * Create new note
 * @route POST /api/notes
 * @access Private
 */
const createNote = asyncHandler(async (req, res) => {
  const { title, content, tags = [], category = 'other' } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!title || !content) {
    throw new ValidationError('Title and content are required');
  }

  // Create note
  const note = await Note.create({
    userId,
    title: title.trim(),
    content: content.trim(),
    tags: tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0),
    category,
  });

  logger.info(`Note created by user ${req.user.email}: ${note._id}`);

  res.status(201).json({
    success: true,
    data: {
      note,
    },
    message: 'Note created successfully',
  });
});

/**
 * Update note
 * @route PUT /api/notes/:id
 * @access Private
 */
const updateNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, tags, category } = req.body;
  const userId = req.user._id;

  const note = await Note.findOne({ _id: id, userId, isDeleted: false });

  if (!note) {
    throw new NotFoundError('Note not found');
  }

  // Update fields if provided
  if (title !== undefined) {
    note.title = title.trim();
  }
  
  if (content !== undefined) {
    note.content = content.trim();
  }
  
  if (tags !== undefined) {
    note.tags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
  }
  
  if (category !== undefined) {
    note.category = category;
  }

  await note.save();

  logger.info(`Note updated by user ${req.user.email}: ${note._id}`);

  res.json({
    success: true,
    data: {
      note,
    },
    message: 'Note updated successfully',
  });
});

/**
 * Delete note (soft delete)
 * @route DELETE /api/notes/:id
 * @access Private
 */
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const note = await Note.findOne({ _id: id, userId, isDeleted: false });

  if (!note) {
    throw new NotFoundError('Note not found');
  }

  await note.softDelete();

  logger.info(`Note deleted by user ${req.user.email}: ${note._id}`);

  res.json({
    success: true,
    message: 'Note deleted successfully',
  });
});

/**
 * Toggle pin status of note
 * @route PATCH /api/notes/:id/pin
 * @access Private
 */
const togglePin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const note = await Note.findOne({ _id: id, userId, isDeleted: false });

  if (!note) {
    throw new NotFoundError('Note not found');
  }

  await note.togglePin();

  logger.info(`Note pin toggled by user ${req.user.email}: ${note._id} - ${note.isPinned ? 'pinned' : 'unpinned'}`);

  res.json({
    success: true,
    data: {
      note,
    },
    message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
  });
});

/**
 * Search notes
 * @route GET /api/notes/search
 * @access Private
 */
const searchNotes = asyncHandler(async (req, res) => {
  const { q: query, limit = 10 } = req.query;
  const userId = req.user._id;

  if (!query || query.trim().length === 0) {
    throw new ValidationError('Search query is required');
  }

  const options = {
    limit: Math.min(parseInt(limit), 50),
  };

  const notes = await Note.searchByUser(userId, query.trim(), options);

  res.json({
    success: true,
    data: {
      notes,
      query: query.trim(),
      count: notes.length,
    },
  });
});

/**
 * Get user notes statistics
 * @route GET /api/notes/stats
 * @access Private
 */
const getStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Note.getUserStats(userId);

  // Process category counts
  const categoryStats = {};
  stats.categoryCounts.forEach(category => {
    categoryStats[category] = (categoryStats[category] || 0) + 1;
  });

  const response = {
    ...stats,
    categoryStats,
  };
  
  delete response.categoryCounts;

  res.json({
    success: true,
    data: {
      stats: response,
    },
  });
});

/**
 * Get recently modified notes
 * @route GET /api/notes/recent
 * @access Private
 */
const getRecentNotes = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  const userId = req.user._id;

  const notes = await Note.findByUser(userId, {
    limit: Math.min(parseInt(limit), 20),
    sortBy: 'lastModified',
    sortOrder: 'desc',
  });

  res.json({
    success: true,
    data: {
      notes,
    },
  });
});

/**
 * Bulk operations on notes
 * @route POST /api/notes/bulk
 * @access Private
 */
const bulkOperations = asyncHandler(async (req, res) => {
  const { operation, noteIds } = req.body;
  const userId = req.user._id;

  if (!operation || !noteIds || !Array.isArray(noteIds)) {
    throw new ValidationError('Operation and noteIds array are required');
  }

  if (noteIds.length === 0) {
    throw new ValidationError('At least one note ID is required');
  }

  if (noteIds.length > 50) {
    throw new ValidationError('Cannot perform bulk operations on more than 50 notes at once');
  }

  let result;

  switch (operation) {
    case 'delete':
      result = await Note.updateMany(
        { _id: { $in: noteIds }, userId, isDeleted: false },
        { isDeleted: true, lastModified: new Date() }
      );
      break;

    case 'pin':
      result = await Note.updateMany(
        { _id: { $in: noteIds }, userId, isDeleted: false },
        { isPinned: true, lastModified: new Date() }
      );
      break;

    case 'unpin':
      result = await Note.updateMany(
        { _id: { $in: noteIds }, userId, isDeleted: false },
        { isPinned: false, lastModified: new Date() }
      );
      break;

    default:
      throw new ValidationError('Invalid operation. Supported operations: delete, pin, unpin');
  }

  logger.info(`Bulk ${operation} operation by user ${req.user.email}: ${result.modifiedCount} notes affected`);

  res.json({
    success: true,
    data: {
      operation,
      affectedCount: result.modifiedCount,
    },
    message: `Bulk ${operation} completed successfully`,
  });
});

module.exports = {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
  searchNotes,
  getStats,
  getRecentNotes,
  bulkOperations,
};
