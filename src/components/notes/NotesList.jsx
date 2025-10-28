/**
 * Notes List Component
 * Main component for displaying and managing notes with filtering and search
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  SortAsc, 
  SortDesc,
  Pin,
  Sparkles,
  Trash2,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { noteService } from '../../services/noteService';
import NoteCard from './NoteCard';
import CreateNoteModal from './CreateNoteModal';
import NoteModal from './NoteModal';
import NotesStats from './NotesStats';
import AIActions from './AIActions';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'lastModified', label: 'Last Modified' },
  { value: 'title', label: 'Title' },
  { value: 'wordCount', label: 'Word Count' },
];

const CATEGORIES = ['all', 'personal', 'work', 'ideas', 'other'];

function NotesList() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewingNote, setViewingNote] = useState(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch notes with filters
  const { 
    data: notesData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['notes', { 
      page, 
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      sortBy, 
      sortOrder,
      isPinned: showPinnedOnly || undefined,
    }],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey;
      return noteService.getNotes({
        page: params.page,
        limit: 12,
        category: params.category,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        isPinned: params.isPinned,
      });
    },
  });

  // Search notes
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => noteService.searchNotes(searchQuery, 20),
    enabled: searchQuery.length > 2,
  });

  // Get user stats
  const { data: statsData } = useQuery({
    queryKey: ['notes-stats'],
    queryFn: noteService.getStats,
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: noteService.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries(['notes']);
      queryClient.invalidateQueries(['notes-stats']);
      toast.success('Note deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete note');
    },
  });

  // Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: ({ operation, noteIds }) => noteService.bulkOperations(operation, noteIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['notes']);
      queryClient.invalidateQueries(['notes-stats']);
      setSelectedNotes(new Set());
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Bulk operation failed');
    },
  });

  // Determine which notes to display
  const displayNotes = useMemo(() => {
    if (searchQuery.length > 2 && searchResults) {
      return searchResults.data.notes;
    }
    return notesData?.data?.notes || [];
  }, [searchQuery, searchResults, notesData]);

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsCreateModalOpen(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setIsCreateModalOpen(true);
    setIsNoteModalOpen(false); // Close note modal if open
  };

  const handleViewNote = (note) => {
    console.log('handleViewNote called with:', note);
    setViewingNote(note);
    setIsNoteModalOpen(true);
    console.log('Modal should be open now');
  };

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false);
    setViewingNote(null);
  };

  const handleSaveNote = (savedNote) => {
    queryClient.invalidateQueries(['notes']);
    queryClient.invalidateQueries(['notes-stats']);
    setIsCreateModalOpen(false);
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId) => {
    deleteNoteMutation.mutate(noteId);
  };

  const handleUpdateNote = (updatedNote) => {
    queryClient.setQueryData(['notes'], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          notes: oldData.data.notes.map(note => 
            note._id === updatedNote._id ? updatedNote : note
          ),
        },
      };
    });
  };

  const handleSelectNote = (noteId) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleBulkOperation = (operation) => {
    if (selectedNotes.size === 0) {
      toast.error('Please select notes first');
      return;
    }

    const noteIds = Array.from(selectedNotes);
    bulkOperationMutation.mutate({ operation, noteIds });
  };

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setShowPinnedOnly(false);
    setPage(1);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-500 mb-4">Failed to load notes</div>
        <button onClick={() => refetch()} className="btn-primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            My Notes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Organize your thoughts with AI-powered insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCreateNote}
            className="btn-primary flex items-center gap-2 px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            New Note
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <NotesStats />

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search your notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12 pr-12 w-full h-12 text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${showFilters ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          <button
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            className={`btn-ghost flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${showPinnedOnly ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Pin className="w-4 h-4" />
            Pinned Only
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input text-sm px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleSortToggle}
              className="btn-ghost p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {(searchQuery || selectedCategory !== 'all' || showPinnedOnly || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
            <button
              onClick={resetFilters}
              className="btn-ghost text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input w-full"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* AI Actions */}
        <AIActions 
          selectedNotes={selectedNotes}
          onClearSelection={() => setSelectedNotes(new Set())}
        />

        {/* Bulk Actions */}
        {selectedNotes.size > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-800 dark:text-primary-200">
                {selectedNotes.size} note{selectedNotes.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkOperation('pin')}
                  className="btn-ghost text-sm flex items-center gap-1"
                >
                  <Pin className="w-3 h-3" />
                  Pin
                </button>
                <button
                  onClick={() => handleBulkOperation('unpin')}
                  className="btn-ghost text-sm flex items-center gap-1"
                >
                  <Pin className="w-3 h-3" />
                  Unpin
                </button>
                <button
                  onClick={() => handleBulkOperation('delete')}
                  className="btn-ghost text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedNotes(new Set())}
                  className="btn-ghost text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes Grid/List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : displayNotes.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No notes found' : 'No notes yet'}
          description={searchQuery 
            ? `No notes match "${searchQuery}". Try adjusting your search terms or filters.`
            : 'Get started by creating your first note and organize your thoughts with AI-powered insights.'
          }
          actionLabel="Create your first note"
          onAction={handleCreateNote}
          showAction={!searchQuery}
          isSearchResult={!!searchQuery}
        />
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {displayNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              onEdit={handleEditNote}
              onView={handleViewNote}
              viewMode={viewMode}
              selectedNotes={selectedNotes}
              onSelectNote={handleSelectNote}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {notesData?.data?.pagination && notesData.data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {notesData.data.pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={page >= notesData.data.pagination.totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        editNote={editingNote}
      />

      {/* Note View Modal */}
      <NoteModal
        note={viewingNote}
        isOpen={isNoteModalOpen}
        onClose={handleCloseNoteModal}
        onUpdate={handleUpdateNote}
        onEdit={handleEditNote}
      />
    </div>
  );
}

export default NotesList;
