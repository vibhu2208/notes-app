/**
 * Notes Statistics Component
 * Displays user's notes statistics and insights
 */

import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Pin, 
  BookOpen, 
  Clock, 
  TrendingUp,
  Folder,
  Tag,
  Calendar
} from 'lucide-react';
import { noteService } from '../../services/noteService';

function NotesStats() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['notes-stats'],
    queryFn: noteService.getStats,
  });

  const { data: recentNotes } = useQuery({
    queryKey: ['recent-notes'],
    queryFn: () => noteService.getRecentNotes(3),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!statsData) return null;

  const stats = statsData.data.stats;

  const statCards = [
    {
      title: 'Total Notes',
      value: stats.totalNotes,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Pinned Notes',
      value: stats.pinnedNotes,
      icon: Pin,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      title: 'Total Words',
      value: stats.totalWords.toLocaleString(),
      icon: BookOpen,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Reading Time',
      value: `${stats.totalReadingTime} min`,
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="card p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Folder className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Categories
            </h3>
          </div>
          
          {stats.categoryStats && Object.keys(stats.categoryStats).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.categoryStats).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      category === 'personal' ? 'bg-blue-500' :
                      category === 'work' ? 'bg-green-500' :
                      category === 'ideas' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {category}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No categories yet
            </p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Notes
            </h3>
          </div>
          
          {recentNotes?.data?.notes && recentNotes.data.notes.length > 0 ? (
            <div className="space-y-3">
              {recentNotes.data.notes.map((note) => (
                <div key={note._id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    note.isPinned ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {note.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(note.lastModified || note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent notes
            </p>
          )}
        </div>
      </div>

      {/* Quick Insights */}
      {stats.totalNotes > 0 && (
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Insights
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">
                {stats.averageWordsPerNote}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Avg words per note
              </p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">
                {Math.round((stats.pinnedNotes / stats.totalNotes) * 100)}%
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Notes pinned
              </p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">
                {Math.round(stats.totalReadingTime / stats.totalNotes) || 0}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Avg reading time (min)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotesStats;
