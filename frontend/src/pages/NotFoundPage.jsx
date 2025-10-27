/**
 * 404 Not Found page component
 * Displays when user navigates to non-existent route
 */

import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Page not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary inline-flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Go home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary inline-flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
