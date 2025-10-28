/**
 * Note Card Component
 * Displays individual note with actions and AI summary
 */

import { useState } from 'react';
import { 
  Pin, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Copy, 
  Eye,
  Clock,
  Tag,
  MoreVertical,
  PinOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { noteService } from '../../services/noteService';

function NoteCard({ note, onUpdate, onDelete, onEdit, onView, viewMode = 'grid', selectedNotes, onSelectNote }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = (e) => {
    // Don't trigger if clicking on buttons or interactive elements
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) {
      return;
    }
    
    console.log('Card clicked:', note.title); // Debug log
    if (onView) {
      console.log('Calling onView with note:', note); // Debug log
      onView(note);
    } else {
      console.log('onView is not provided'); // Debug log
    }
  };

  const handlePin = async () => {
    try {
      setIsLoading(true);
      const response = await noteService.togglePin(note._id);
      onUpdate(response.data.note);
      toast.success(response.message);
    } catch (error) {
      toast.error('Failed to update pin status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const options = forceRefresh ? { refresh: true } : {};
      const response = await noteService.summarizeNote(note._id, options);
      onUpdate(response.data.note);
      
      if (forceRefresh) {
        toast.success(`New summary generated using ${response.data.provider}`);
      } else if (response.data.cached) {
        toast.success('Summary retrieved from cache');
      } else {
        toast.success(`Summary generated using ${response.data.provider}`);
      }
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to generate summary';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(note.content);
      toast.success('Note content copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note._id);
    }
  };

  const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
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

  if (viewMode === 'list') {
    return (
      <div 
        className={`card p-4 sm:p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out border-l-4 cursor-pointer ${
          note.isPinned 
            ? 'ring-2 ring-primary-200 dark:ring-primary-800 border-l-primary-500 bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/20' 
            : 'border-l-transparent hover:border-l-primary-300 dark:hover:border-l-primary-600'
        } group relative overflow-hidden`}
        onClick={handleCardClick}
      >
        {/* Selection checkbox for list view */}
        {selectedNotes && onSelectNote && (
          <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={selectedNotes.has(note._id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelectNote(note._id);
                }}
                className="peer relative appearance-none w-4 h-4 border-2 border-white/80 dark:border-gray-300 rounded-md cursor-pointer bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm
                  checked:bg-gradient-to-r checked:from-indigo-500 checked:to-pink-500 checked:border-indigo-500
                  hover:border-indigo-400 dark:hover:border-indigo-400 transition-all duration-200 hover:scale-110
                  focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:outline-none shadow-lg"
              />
              <svg
                className="absolute w-2.5 h-2.5 text-white left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {note.isPinned && (
                <Pin className="w-4 h-4 text-primary-500 fill-current" />
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {note.title}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(note.category)}`}>
                {note.category}
              </span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {note.content}
            </p>

            {note.summary && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg mb-3 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-purple-800 dark:text-purple-200">
                    AI Summary
                  </span>
                </div>
                <p className="text-purple-700 dark:text-purple-300 text-sm leading-relaxed">
                  {note.summary}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(note.lastModified || note.createdAt)}
                </div>
                <span>{note.wordCount} words</span>
                <span>{note.readingTime} min read</span>
              </div>

              {note.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-gray-400" />
                  <div className="flex gap-1">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2 sm:ml-4">
            {/* AI Summarize Button - Prominent in list view too */}
            {!note.summary && (
              <button
                onClick={handleSummarize}
                disabled={isLoading}
                className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-medium rounded-full transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md disabled:opacity-50"
                title="Generate AI summary"
              >
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">AI</span>
              </button>
            )}

            <button
              onClick={handlePin}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 ${
                note.isPinned 
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                  : 'text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
              }`}
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
            >
              {note.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onEdit(note)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-110 transform"
              title="Edit note"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:scale-110 transform"
              title="Copy content"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110 transform"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div 
      className={`card p-5 sm:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-out group relative overflow-hidden border-l-4 cursor-pointer ${
        note.isPinned 
          ? 'ring-2 ring-amber-300/50 dark:ring-amber-700/50 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-gray-800 border-l-amber-500' 
          : 'hover:ring-2 hover:ring-primary-200/50 dark:hover:ring-primary-800/50 border-l-transparent hover:border-l-primary-300 dark:hover:border-l-primary-600'
      }`}
      onClick={handleCardClick}
    >
      {/* Selection checkbox - only show if selection handlers are provided */}
      {selectedNotes && onSelectNote && (
        <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={selectedNotes.has(note._id)}
              onChange={(e) => {
                e.stopPropagation();
                onSelectNote(note._id);
              }}
              className="peer relative appearance-none w-5 h-5 border-2 border-white/80 dark:border-gray-300 rounded-lg cursor-pointer bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm
                checked:bg-gradient-to-r checked:from-indigo-500 checked:to-pink-500 checked:border-indigo-500
                hover:border-indigo-400 dark:hover:border-indigo-400 transition-all duration-200 hover:scale-110
                focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:outline-none shadow-lg"
            />
            <svg
              className="absolute w-3 h-3 text-white left-1 top-1 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}
      {/* Header with title and actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {note.isPinned && (
            <Pin className="w-4 h-4 text-primary-500 fill-current flex-shrink-0" />
          )}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {note.title}
          </h3>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Pin/Unpin Button */}
          <button
            onClick={handlePin}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 ${
              note.isPinned 
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                : 'text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note'}
          >
            {note.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl backdrop-blur-sm z-20 py-2 min-w-[140px] animate-in slide-in-from-top-2 duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(note);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category and Content */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getCategoryColor(note.category)}`}>
            {note.category}
          </span>
          
          {/* AI Summarize Button - Prominent placement */}
          {!note.summary && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSummarize();
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-medium rounded-full transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Generate AI summary"
            >
              <Sparkles className="w-3 h-3" />
              AI Summary
            </button>
          )}
        </div>
        
        <p className={`text-gray-700 dark:text-gray-300 text-sm leading-relaxed ${
          isExpanded ? '' : 'line-clamp-3'
        }`}>
          {note.content}
        </p>
        
        {note.content.length > 200 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-primary-600 dark:text-primary-400 text-sm mt-2 hover:underline font-medium"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* AI Summary Display */}
      {note.summary && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl mb-4 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
              AI Summary
            </span>
          </div>
          <p className="text-purple-700 dark:text-purple-300 text-sm leading-relaxed">
            {note.summary}
          </p>
        </div>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md font-medium"
            >
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md">
              +{note.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer with metadata */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(note.lastModified || note.createdAt)}</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <span>{note.wordCount} words</span>
          <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <span>{note.readingTime} min read</span>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="animate-pulse">Processing...</span>
          </div>
        </div>
      )}

      {/* Subtle shimmer effect for pinned notes */}
      {note.isPinned && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-400/30 to-transparent animate-pulse" />
      )}
    </div>
  );
}

export default NoteCard;
