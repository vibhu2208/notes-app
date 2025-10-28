/**
 * AI Actions Component
 * Quick actions for AI-powered features
 */

import { useState } from 'react';
import { Sparkles, Zap, Brain, Wand2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { noteService } from '../../services/noteService';

function AIActions({ selectedNotes, onClearSelection }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const batchSummarizeMutation = useMutation({
    mutationFn: ({ noteIds, style }) => noteService.batchSummarize(noteIds, style),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['notes']);
      onClearSelection();
      
      const { successful, failed, total } = data.data.summary;
      if (successful === total) {
        toast.success(`Successfully summarized ${successful} notes!`);
      } else {
        toast.success(`Summarized ${successful}/${total} notes. ${failed} failed.`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Batch summarization failed');
    },
  });

  const handleBatchSummarize = async (style = 'concise') => {
    if (selectedNotes.size === 0) {
      toast.error('Please select notes to summarize');
      return;
    }

    if (selectedNotes.size > 10) {
      toast.error('Can only summarize up to 10 notes at once');
      return;
    }

    const noteIds = Array.from(selectedNotes);
    setIsProcessing(true);
    
    try {
      await batchSummarizeMutation.mutateAsync({ noteIds, style });
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedNotes.size === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              AI Actions
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {selectedNotes.size} note{selectedNotes.size !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Summarize Options */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleBatchSummarize('concise')}
              disabled={isProcessing}
              className="btn-ghost text-sm flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50"
              title="Generate concise summaries"
            >
              <Sparkles className="w-3 h-3" />
              {isProcessing ? 'Processing...' : 'Summarize'}
            </button>

            <div className="relative group">
              <button
                className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded"
                title="More summarization options"
              >
                <Wand2 className="w-3 h-3" />
              </button>
              
              {/* Dropdown for different styles */}
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1 min-w-[140px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={() => handleBatchSummarize('bullet')}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Zap className="w-3 h-3" />
                  Bullet Points
                </button>
                
                <button
                  onClick={() => handleBatchSummarize('detailed')}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Brain className="w-3 h-3" />
                  Detailed
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClearSelection}
            className="btn-ghost text-sm"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Progress indicator */}
      {isProcessing && (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span>Processing {selectedNotes.size} notes with AI...</span>
          </div>
          <div className="mt-2 bg-purple-200 dark:bg-purple-800 rounded-full h-2">
            <div className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        💡 Tip: AI summarization works best with notes that have at least 100 characters
      </div>
    </div>
  );
}

export default AIActions;
