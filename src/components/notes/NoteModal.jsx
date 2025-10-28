/**
 * Note Modal Component
 * Displays note details with AI summary regeneration functionality
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Sparkles, 
  RefreshCw,
  Copy,
  Pin,
  PinOff,
  Calendar,
  BookOpen,
  Clock,
  Tag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { noteService } from '../../services/noteService';

function NoteModal({ note, isOpen, onClose, onUpdate, onEdit }) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [localNote, setLocalNote] = useState(note);

  // Update localNote when note prop changes
  useEffect(() => {
    if (note) {
      setLocalNote(note);
    }
  }, [note]);

  if (!isOpen || !note || !localNote) return null;

  const handleRegenerateSummary = async () => {
    try {
      setIsRegenerating(true);
      // Add refresh parameter to force new summary generation
      const response = await noteService.summarizeNote(localNote._id, { refresh: true });
      const updatedNote = response.data.note;
      setLocalNote(updatedNote);
      onUpdate(updatedNote);
      
      toast.success(`New summary generated using ${response.data.provider}`);
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to regenerate summary';
      toast.error(message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localNote.content);
      toast.success('Note content copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  const handlePin = async () => {
    try {
      const response = await noteService.togglePin(localNote._id);
      const updatedNote = response.data.note;
      setLocalNote(updatedNote);
      onUpdate(updatedNote);
      toast.success(response.message);
    } catch (error) {
      toast.error('Failed to update pin status');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      personal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      work: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      ideas: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl transform transition-all max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {localNote.isPinned && (
                  <Pin className="w-5 h-5 text-amber-500 fill-current" />
                )}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {localNote.title}
                </h2>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryColor(localNote.category)}`}>
                  {localNote.category}
                </span>
              </div>
              
              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDistanceToNow(new Date(localNote.lastModified || localNote.createdAt), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{localNote.wordCount || 0} words</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{localNote.readingTime || 0} min read</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handlePin}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                  localNote.isPinned 
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                    : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50/50'
                }`}
                title={localNote.isPinned ? 'Unpin note' : 'Pin note'}
              >
                {localNote.isPinned ? <PinOff className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
              </button>
              
              <button
                onClick={handleCopy}
                className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                title="Copy content"
              >
                <Copy className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => onEdit(localNote)}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                title="Edit note"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {/* Note Content */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Content
              </h3>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {localNote.content}
                </p>
              </div>
            </div>
            
            {/* AI Summary Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Summary
                </h3>
                
                {localNote.summary && (
                  <button
                    onClick={handleRegenerateSummary}
                    disabled={isRegenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    {isRegenerating ? 'Regenerating...' : 'Regenerate Summary'}
                  </button>
                )}
              </div>
              
              {localNote.summary ? (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
                  <p className="text-purple-700 dark:text-purple-300 leading-relaxed">
                    {localNote.summary}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No AI summary generated yet
                  </p>
                  <button
                    onClick={handleRegenerateSummary}
                    disabled={isRegenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 mx-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isRegenerating ? 'Generating...' : 'Generate AI Summary'}
                  </button>
                </div>
              )}
            </div>
            
            {/* Tags */}
            {localNote.tags && localNote.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-500" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {localNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteModal;
