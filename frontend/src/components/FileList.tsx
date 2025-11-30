import { useState } from 'react';
import { FiFolder, FiFile, FiImage, FiFileText, FiChevronUp, FiChevronDown, FiCheck, FiVideo } from 'react-icons/fi';
import { DriveItem, SortField, SortDirection } from '../types';
import ContextMenu from './ContextMenu';

interface FileListProps {
  items: DriveItem[];
  onItemClick: (item: DriveItem) => void;
  onRefresh: () => void;
  selectedItems: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onStar: (item: DriveItem) => void;
  onShare: (item: DriveItem) => void;
  onToggleSecret?: (item: DriveItem) => void;
  isTrashView?: boolean;
  isSecretView?: boolean;
}

export default function FileList({ items, onItemClick, onRefresh, selectedItems, onSelectionChange, sortField, sortDirection, onSort, onStar, onShare, onToggleSecret, isTrashView = false, isSecretView = false }: FileListProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: DriveItem } | null>(null);

  function getFileIcon(item: DriveItem) {
    if (item.type === 'folder') {
      return <FiFolder size={20} className="text-blue-500" />;
    }
    if (item.mimeType?.startsWith('image/') || item.mimeType === 'image/gif') {
      return (
        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 relative">
          <img
            src={`${import.meta.env.VITE_API_URL}/items/${item.itemId}/thumbnail`}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = `https://via.placeholder.com/40/10b981/ffffff?text=${encodeURIComponent(item.name.split('.').pop()?.toUpperCase() || 'IMG')}`;
            }}
          />
          {item.mimeType === 'image/gif' && (
            <div className="absolute top-0 right-0 bg-purple-500 rounded-bl px-1">
              <span className="text-xs text-white font-bold">GIF</span>
            </div>
          )}
        </div>
      );
    }
    if (item.mimeType?.startsWith('video/')) {
      return (
        <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
          <FiVideo className="text-white" size={16} />
        </div>
      );
    }
    if (item.mimeType === 'application/pdf') {
      return (
        <div className="w-10 h-10 rounded bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
          <FiFileText className="text-white" size={16} />
        </div>
      );
    }
    if (item.mimeType?.includes('text') || item.mimeType?.includes('document')) {
      return (
        <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <FiFileText className="text-white" size={16} />
        </div>
      );
    }
    return <FiFile size={20} className="text-gray-500" />;
  }

  function handleContextMenu(e: React.MouseEvent, item: DriveItem) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modified
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                AI Tags
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr
                key={item.itemId}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onItemClick(item)}
                onContextMenu={(e) => handleContextMenu(e, item)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(item)}
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(item.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.updatedAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {item.aiMetadata?.labels?.slice(0, 3).map((label, i) => (
                      <span
                        key={i}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                      >
                        {label}
                      </span>
                    ))}
                    {item.aiMetadata?.keywords?.slice(0, 2).map((keyword, i) => (
                      <span
                        key={i}
                        className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onRefresh={onRefresh}
          onStar={!isTrashView ? onStar : undefined}
          onShare={!isTrashView ? onShare : undefined}
          onToggleSecret={!isTrashView ? onToggleSecret : undefined}
          isTrashView={isTrashView}
          isSecretView={isSecretView}
        />
      )}
    </>
  );
}
