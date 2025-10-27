/**
 * MongoDB initialization script
 * Creates indexes and initial data for the application
 */

// Switch to the application database
db = db.getSiblingDB('ai-notes-app');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

db.notes.createIndex({ userId: 1, createdAt: -1 });
db.notes.createIndex({ userId: 1, isPinned: -1, createdAt: -1 });
db.notes.createIndex({ title: 'text', content: 'text' });
db.notes.createIndex({ tags: 1 });
db.notes.createIndex({ userId: 1, isDeleted: 1 });

print('Database initialized with indexes');
