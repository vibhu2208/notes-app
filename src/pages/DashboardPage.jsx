/**
 * Dashboard page component
 * Main notes management interface with comprehensive features
 */

import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotesList from '../components/notes/NotesList';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Create a query client for this page if not already provided
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/20 to-purple-200/20 dark:from-primary-800/10 dark:to-purple-800/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-200/20 to-primary-200/20 dark:from-pink-800/10 dark:to-primary-800/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense 
          fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4">
                <LoadingSpinner size="lg" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm animate-pulse">
                Loading your notes...
              </p>
            </div>
          }
        >
          <NotesList />
        </Suspense>
      </div>
    </div>
  );
}

export default DashboardPage;
