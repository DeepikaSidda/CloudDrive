import { FiTrash2, FiMove, FiX, FiStar, FiRotateCcw } from 'react-icons/fi';

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onMove?: () => void;
  onStar?: () => void;
  onRestore?: () => void;
  onClearSelection: () => void;
  isTrashView?: boolean;
}

export default function BulkActionBar({ selectedCount, onDelete, onMove, onStar, onRestore, onClearSelection, isTrashView = false }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 px-6 py-4 flex items-center space-x-6">
        {/* Selection Count */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
            {selectedCount}
          </div>
          <span className="font-medium text-gray-900">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {isTrashView ? (
            <>
              <button
                onClick={onRestore}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all font-medium"
                title="Restore selected items"
              >
                <FiRotateCcw size={18} />
                <span>Restore</span>
              </button>
              <button
                onClick={onDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium"
                title="Permanently delete selected items"
              >
                <FiTrash2 size={18} />
                <span>Delete Forever</span>
              </button>
            </>
          ) : (
            <>
              {onStar && (
                <button
                  onClick={onStar}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all font-medium"
                  title="Star selected items"
                >
                  <FiStar size={18} />
                  <span>Star</span>
                </button>
              )}

              {onMove && (
                <button
                  onClick={onMove}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-medium"
                  title="Move selected items"
                >
                  <FiMove size={18} />
                  <span>Move</span>
                </button>
              )}

              <button
                onClick={onDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium"
                title="Move to trash"
              >
                <FiTrash2 size={18} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Clear selection"
        >
          <FiX size={20} />
        </button>
      </div>
    </div>
  );
}
