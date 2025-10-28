/**
 * Debug Panel Component
 * Shows debug information in development mode
 */

import { useState } from 'react';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';

function DebugPanel({ data, title = "Debug Info" }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-lg max-w-sm z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full p-3 text-left hover:bg-gray-800 rounded-lg"
      >
        <Bug className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-auto" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-3 border-t border-gray-700 max-h-64 overflow-auto">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default DebugPanel;
