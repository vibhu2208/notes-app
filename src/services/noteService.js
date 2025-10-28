/**
 * Notes service
 * Handles all note-related API calls
 */

import api from './api';

export const noteService = {
  /**
   * Get all notes with pagination and filters
   */
  getNotes: async (params = {}) => {
    const response = await api.get('/notes', { params });
    return response.data;
  },

  /**
   * Get single note by ID
   */
  getNote: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  /**
   * Create new note
   */
  createNote: async (noteData) => {
    const response = await api.post('/notes', noteData);
    return response.data;
  },

  /**
   * Update existing note
   */
  updateNote: async (id, noteData) => {
    const response = await api.put(`/notes/${id}`, noteData);
    return response.data;
  },

  /**
   * Delete note
   */
  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },

  /**
   * Toggle pin status of note
   */
  togglePin: async (id) => {
    const response = await api.patch(`/notes/${id}/pin`);
    return response.data;
  },

  /**
   * Search notes
   */
  searchNotes: async (query, limit = 10) => {
    const response = await api.get('/notes/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  /**
   * Get user notes statistics
   */
  getStats: async () => {
    const response = await api.get('/notes/stats');
    return response.data;
  },

  /**
   * Get recently modified notes
   */
  getRecentNotes: async (limit = 5) => {
    const response = await api.get('/notes/recent', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Bulk operations on notes
   */
  bulkOperations: async (operation, noteIds) => {
    const response = await api.post('/notes/bulk', {
      operation,
      noteIds,
    });
    return response.data;
  },

  /**
   * Summarize note with AI
   */
  summarizeNote: async (id, options = {}) => {
    const response = await api.post(`/notes/${id}/summarize`, options);
    return response.data;
  },

  /**
   * Batch summarize multiple notes
   */
  batchSummarize: async (noteIds, style = 'concise') => {
    const response = await api.post('/ai/batch-summarize', {
      noteIds,
      style,
    });
    return response.data;
  },

  /**
   * Get AI service health (admin only)
   */
  getAIHealth: async () => {
    const response = await api.get('/ai/health');
    return response.data;
  },

  /**
   * Get AI service stats (admin only)
   */
  getAIStats: async () => {
    const response = await api.get('/ai/stats');
    return response.data;
  },
};
