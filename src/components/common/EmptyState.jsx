/**
 * Empty State Component
 * Reusable component for empty states with call-to-action
 */

import { Plus, Search, FileText } from 'lucide-react';

function EmptyState({ 
  icon: Icon = FileText,
  title = "No items found",
  description = "Get started by creating your first item",
  actionLabel = "Create Item",
  onAction,
  showAction = true,
  isSearchResult = false
}) {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
        {description}
      </p>
      
      {showAction && onAction && !isSearchResult && (
        <button onClick={onAction} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </button>
      )}
      
      {isSearchResult && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          <Search className="w-4 h-4 inline mr-1" />
          Try adjusting your search terms or filters
        </div>
      )}
    </div>
  );
}

export default EmptyState;
