/**
 * Note model
 * Defines note schema with all required fields and methods
 */

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title must be less than 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [50000, 'Content must be less than 50,000 characters'],
  },
  summary: {
    type: String,
    maxlength: [1000, 'Summary must be less than 1,000 characters'],
    default: null,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag must be less than 30 characters'],
  }],
  isPinned: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    enum: ['personal', 'work', 'ideas', 'other'],
    default: 'other',
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false, // Don't include in queries by default
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },
  summarizedAt: {
    type: Date,
    default: null,
  },
  wordCount: {
    type: Number,
    default: 0,
  },
  readingTime: {
    type: Number, // in minutes
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.isDeleted;
      return ret;
    },
  },
});

// Compound indexes for performance
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });
noteSchema.index({ userId: 1, category: 1, createdAt: -1 });
noteSchema.index({ userId: 1, isDeleted: 1 });
noteSchema.index({ tags: 1 });

// Text index for search functionality
noteSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    tags: 5,
    content: 1,
  },
});

// Pre-save middleware to update lastModified and calculate stats
noteSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('title')) {
    this.lastModified = new Date();
    
    // Calculate word count
    const words = this.content.trim().split(/\s+/).filter(word => word.length > 0);
    this.wordCount = words.length;
    
    // Calculate reading time (average 200 words per minute)
    this.readingTime = Math.ceil(this.wordCount / 200) || 1;
  }
  
  next();
});

// Instance method to soft delete
noteSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

// Instance method to restore
noteSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

// Instance method to toggle pin status
noteSchema.methods.togglePin = function() {
  this.isPinned = !this.isPinned;
  return this.save();
};

// Static method to find notes by user (excluding deleted)
noteSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, isDeleted: false };
  
  // Add filters
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  if (options.isPinned !== undefined) {
    query.isPinned = options.isPinned;
  }
  
  let queryBuilder = this.find(query);
  
  // Add sorting
  const sortOptions = {};
  if (options.sortBy) {
    switch (options.sortBy) {
      case 'title':
        sortOptions.title = options.sortOrder === 'desc' ? -1 : 1;
        break;
      case 'lastModified':
        sortOptions.lastModified = options.sortOrder === 'desc' ? -1 : 1;
        break;
      case 'wordCount':
        sortOptions.wordCount = options.sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }
  } else {
    // Default sort: pinned first, then by creation date
    sortOptions.isPinned = -1;
    sortOptions.createdAt = -1;
  }
  
  queryBuilder = queryBuilder.sort(sortOptions);
  
  // Add pagination
  if (options.limit) {
    queryBuilder = queryBuilder.limit(parseInt(options.limit));
  }
  
  if (options.skip) {
    queryBuilder = queryBuilder.skip(parseInt(options.skip));
  }
  
  return queryBuilder;
};

// Static method for text search
noteSchema.statics.searchByUser = function(userId, searchQuery, options = {}) {
  const query = {
    userId,
    isDeleted: false,
    $text: { $search: searchQuery },
  };
  
  let queryBuilder = this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, isPinned: -1 });
  
  if (options.limit) {
    queryBuilder = queryBuilder.limit(parseInt(options.limit));
  }
  
  return queryBuilder;
};

// Static method to get user stats
noteSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
    {
      $group: {
        _id: null,
        totalNotes: { $sum: 1 },
        pinnedNotes: { $sum: { $cond: ['$isPinned', 1, 0] } },
        totalWords: { $sum: '$wordCount' },
        averageWordsPerNote: { $avg: '$wordCount' },
        totalReadingTime: { $sum: '$readingTime' },
        categoryCounts: {
          $push: '$category'
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalNotes: 1,
        pinnedNotes: 1,
        totalWords: 1,
        averageWordsPerNote: { $round: ['$averageWordsPerNote', 0] },
        totalReadingTime: 1,
        categoryCounts: 1,
      },
    },
  ]);
  
  return stats[0] || {
    totalNotes: 0,
    pinnedNotes: 0,
    totalWords: 0,
    averageWordsPerNote: 0,
    totalReadingTime: 0,
    categoryCounts: [],
  };
};

module.exports = mongoose.model('Note', noteSchema);
