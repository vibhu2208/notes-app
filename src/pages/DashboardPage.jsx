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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense 
          fallback={
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
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
