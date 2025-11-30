import { useState, useEffect } from 'react';
import { FiX, FiFolder, FiChevronRight, FiHome } from 'react-icons/fi';
import { DriveItem } from '../types';
import { listItems } from '../api/drive';

interface MoveDialogProps {
  items: DriveItem[];
  currentFolderId: string;
  onClose: () => void;
  onMove: (targetFolderId: string) => void;
}

export default function MoveDialog({ items, currentFolderId, onClose, onMove }: MoveDialogProps) {
  const [folders, setFolders] = useState<DriveItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('root');
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'My Drive' }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFolders(selectedFolder);
  }, [selectedFolder]);

  async function loadFolders(folderId: string) {
    setLoading(true);
    try {
      const data = await listItems(folderId);
      // Only show folders, exclude items being moved
      const itemIds = new Set(items.map(i => i.itemId));
      setFolders(data.filter(item => item.type === 'folder' && !itemIds.has(item.itemId)));
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFolderClick(folder: DriveItem) {
    setSelectedFolder(folder.itemId);
    setBreadcrumbs([...breadcrumbs, { id: folder.itemId, name: folder.name }]);
  }

  function handleBreadcrumbClick(index: number) {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setSelectedFolder(newBreadcrumbs[newBreadcrumbs.length - 1].id);
  }

  function handleMove() {
    if (selectedFolder === currentFolderId) {
      alert('Cannot move to the same folder');
      return;
    }
    onMove(selectedFolder);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-scale-in max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Move Items</h3>
            <p className="text-sm text-gray-600 mt-1">
              Moving {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center space-x-2">
                {index > 0 && <FiChevronRight className="text-gray-400" size={14} />}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-200 transition ${
                    index === breadcrumbs.length - 1 ? 'text-primary-600 font-medium' : 'text-gray-600'
                  }`}
                >
                  {index === 0 && <FiHome size={14} />}
                  <span>{crumb.name}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <FiFolder size={48} className="mb-2 text-gray-300" />
              <p>No folders here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => (
                <button
                  key={folder.itemId}
                  onClick={() => handleFolderClick(folder)}
                  className="w-full flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                    <FiFolder className="text-blue-600" size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{folder.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(folder.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <FiChevronRight className="text-gray-400 group-hover:text-primary-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <p className="text-sm text-gray-600">
            Current location: <span className="font-medium text-gray-900">{breadcrumbs[breadcrumbs.length - 1].name}</span>
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={selectedFolder === currentFolderId}
              className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Move Here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
