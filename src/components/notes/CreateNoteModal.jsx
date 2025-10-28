/**
 * Create Note Modal Component
 * Modal for creating and editing notes with rich features
 */

import { useState, useEffect } from 'react';
import { X, Save, Tag, Folder, Sparkles, Type, AlignLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { noteService } from '../../services/noteService';
import DebugPanel from '../common/DebugPanel';

const CATEGORIES = [
  { value: 'personal', label: 'Personal', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'work', label: 'Work', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'ideas', label: 'Ideas', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
];

function CreateNoteModal({ isOpen, onClose, onSave, editNote = null }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Initialize form data when editing
  useEffect(() => {
    if (editNote) {
      setFormData({
        title: editNote.title || '',
        content: editNote.content || '',
        category: editNote.category || 'other',
        tags: editNote.tags || [],
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'other',
        tags: [],
      });
    }
    setErrors({});
  }, [editNote, isOpen]);

  // Update word and character count
  useEffect(() => {
    const words = formData.content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(formData.content.length);
  }, [formData.content]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter' && !isLoading) {
        e.preventDefault();
        if (formData.title.trim() && formData.content.trim()) {
          handleSubmit(e);
        }
      }
      if (e.key === 'Escape' && !isLoading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isLoading, formData.title, formData.content]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field-specific errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      
      if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag],
        }));
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length > 50000) {
      newErrors.content = 'Content must be less than 50,000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData); // Debug log
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors); // Debug log
      return;
    }

    setIsLoading(true);

    try {
      const noteData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
      };

      console.log('Sending note data:', noteData); // Debug log

      let response;
      if (editNote) {
        response = await noteService.updateNote(editNote._id, noteData);
        toast.success('Note updated successfully!');
      } else {
        response = await noteService.createNote(noteData);
        toast.success('Note created successfully!');
      }

      console.log('Note saved successfully:', response); // Debug log
      onSave(response.data.note);
      onClose();
    } catch (error) {
      console.error('Error saving note:', error); // Debug log
      const errorMessage = error.response?.data?.error?.message || 
        `Failed to ${editNote ? 'update' : 'create'} note`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Type className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editNote ? 'Edit Note' : 'Create New Note'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editNote ? 'Update your note' : 'Capture your thoughts and ideas'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                className={`input w-full ${errors.title ? 'input-error' : ''}`}
                placeholder="Enter note title..."
                maxLength={200}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Category and Tags Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Folder className="w-4 h-4 inline mr-1" />
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags ({formData.tags.length}/10)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="input w-full"
                  placeholder="Type and press Enter to add tags..."
                  disabled={formData.tags.length >= 10}
                />
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <AlignLeft className="w-4 h-4 inline mr-1" />
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={12}
                className={`input w-full resize-none ${errors.content ? 'input-error' : ''}`}
                placeholder="Write your note content here..."
                maxLength={50000}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
              )}
              <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{wordCount} words • {charCount}/50,000 characters</span>
                <span>{Math.ceil(wordCount / 200) || 1} min read</span>
              </div>
            </div>

            {/* Preview Category */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Preview:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  CATEGORIES.find(cat => cat.value === formData.category)?.color
                }`}>
                  {CATEGORIES.find(cat => cat.value === formData.category)?.label}
                </span>
              </div>
              
              {/* Quick tips */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                💡 Tip: Use tags to organize and find your notes easily
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Sparkles className="w-4 h-4" />
                <span>AI summarization available after saving</span>
              </div>
              
              {/* Form status indicator */}
              {formData.title.trim() && formData.content.trim() && (
                <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Ready to save</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Ctrl+Enter to save • Esc to cancel
              </div>
              
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
                className={`btn-primary flex items-center gap-2 min-w-[160px] justify-center px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all ${
                  formData.title.trim() && formData.content.trim() && !isLoading 
                    ? 'ring-2 ring-primary-300 ring-offset-2 dark:ring-primary-700 dark:ring-offset-gray-900' 
                    : ''
                }`}
                title={`Press Ctrl+Enter to ${editNote ? 'update' : 'create'} note`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editNote ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editNote ? 'Update Note' : 'Create Note'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Debug Panel for development */}
      <DebugPanel 
        data={{
          formData,
          errors,
          isLoading,
          wordCount,
          charCount,
          editNote: editNote ? { id: editNote._id, title: editNote.title } : null
        }}
        title="Note Form Debug"
      />
    </div>
  );
}

export default CreateNoteModal;
