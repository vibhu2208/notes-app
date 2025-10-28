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
    <div className="space-y-8 mb-8">
      {/* Main Stats - Enhanced with hover effects and better spacing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={stat.title} 
            className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 lg:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient background overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative flex flex-col items-center text-center lg:flex-row lg:text-left lg:items-center">
              <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300 mb-3 lg:mb-0`}>
                <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color}`} />
              </div>
              <div className="lg:ml-4 flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                  {stat.value}
                </p>
              </div>
            </div>
            
            {/* Subtle shimmer effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent group-hover:via-indigo-400/60 transition-all duration-300"></div>
          </div>
        ))}
      </div>

      {/* Additional Insights - Enhanced with modern design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl mr-3">
              <Folder className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Categories
            </h3>
          </div>
          
          {stats.categoryStats && Object.keys(stats.categoryStats).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.categoryStats).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-3 shadow-sm ${
                      category === 'personal' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                      category === 'work' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      category === 'ideas' ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                      'bg-gradient-to-r from-gray-400 to-gray-600'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {category}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded-lg">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No categories yet
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl mr-3">
              <Calendar className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Notes
            </h3>
          </div>
          
          {recentNotes?.data?.notes && recentNotes.data.notes.length > 0 ? (
            <div className="space-y-3">
              {recentNotes.data.notes.map((note, index) => (
                <div key={note._id} className="group/item flex items-start space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer">
                  <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 shadow-sm ${
                    note.isPinned ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors duration-200">
                      {note.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(note.lastModified || note.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  {note.isPinned && (
                    <Pin className="w-3 h-3 text-amber-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No recent notes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Insights - Enhanced with modern design */}
      {stats.totalNotes > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-pink-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-800/80 backdrop-blur-sm border border-indigo-200/50 dark:border-gray-700/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl mr-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Quick Insights
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="group text-center p-4 bg-white/60 dark:bg-gray-700/30 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.averageWordsPerNote}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Avg words per note
              </p>
            </div>
            
            <div className="group text-center p-4 bg-white/60 dark:bg-gray-700/30 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Pin className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {Math.round((stats.pinnedNotes / stats.totalNotes) * 100)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Notes pinned
              </p>
            </div>
            
            <div className="group text-center p-4 bg-white/60 dark:bg-gray-700/30 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {Math.round(stats.totalReadingTime / stats.totalNotes) || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
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
