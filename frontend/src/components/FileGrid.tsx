import { useState } from 'react';
import { FiFolder, FiFile, FiImage, FiFileText, FiMoreVertical, FiCheck, FiVideo } from 'react-icons/fi';
import { DriveItem } from '../types';
import ContextMenu from './ContextMenu';

interface FileGridProps {
  items: DriveItem[];
  onItemClick: (item: DriveItem) => void;
  onRefresh: () => void;
  selectedItems: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onStar: (item: DriveItem) => void;
  onShare: (item: DriveItem) => void;
  onToggleSecret?: (item: DriveItem) => void;
  isTrashView?: boolean;
  isSecretView?: boolean;
}

export default function FileGrid({ items, onItemClick, onRefresh, selectedItems, onSelectionChange, onStar, onShare, onToggleSecret, isTrashView = false, isSecretView = false }: FileGridProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: DriveItem } | null>(null);

  function getFileIcon(item: DriveItem) {
    if (item.type === 'folder') {
      return <FiFolder size={48} className="text-blue-500" />;
    }
    if (item.mimeType?.startsWith('image/')) {
      return <FiImage size={48} className="text-green-500" />;
    }
    if (item.mimeType?.includes('text') || item.mimeType?.includes('document')) {
      return <FiFileText size={48} className="text-orange-500" />;
    }
    return <FiFile size={48} className="text-gray-500" />;
  }

  function handleContextMenu(e: React.MouseEvent, item: DriveItem) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  function toggleSelection(itemId: string, event: React.MouseEvent) {
    event.stopPropagation();
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    onSelectionChange(newSelected);
  }

  const isSelected = (itemId: string) => selectedItems.has(itemId);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
        {items.map((item) => (
          <div
            key={item.itemId}
            className={`group relative bg-white/90 backdrop-blur-sm rounded-xl border-2 p-4 hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 ${
              isSelected(item.itemId) 
                ? 'border-primary-500 shadow-xl shadow-primary-500/30 ring-2 ring-primary-200' 
                : 'border-white/40 hover:border-primary-300 shadow-md'
            }`}
            onClick={() => onItemClick(item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
          >
            {/* Selection checkbox */}
            <div
              className="absolute top-2 left-2 z-10"
              onClick={(e) => toggleSelection(item.itemId, e)}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                isSelected(item.itemId)
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-gray-300 bg-white opacity-0 group-hover:opacity-100'
              }`}>
                {isSelected(item.itemId) && <FiCheck className="text-white" size={14} />}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-3 relative">
                {item.type === 'file' && (item.mimeType?.startsWith('image/') || item.mimeType === 'image/gif') ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shadow-md bg-gray-100 relative group">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/items/${item.itemId}/thumbnail`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = `https://via.placeholder.com/80/10b981/ffffff?text=${encodeURIComponent(item.name.split('.').pop()?.toUpperCase() || 'IMG')}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                    {item.mimeType === 'image/gif' && (
                      <div className="absolute top-1 right-1 bg-purple-500 rounded px-1 py-0.5">
                        <span className="text-xs text-white font-bold">GIF</span>
                      </div>
                    )}
                  </div>
                ) : item.type === 'file' && item.mimeType?.startsWith('video/') ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center relative">
                    <FiVideo className="text-white" size={32} />
                    <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5">
                      <span className="text-xs text-white font-medium">VIDEO</span>
                    </div>
                  </div>
                ) : item.type === 'file' && item.mimeType === 'application/pdf' ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center relative">
                    <FiFileText className="text-white" size={32} />
                    <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5">
                      <span className="text-xs text-white font-medium">PDF</span>
                    </div>
                  </div>
                ) : item.type === 'file' && (item.mimeType?.includes('document') || item.mimeType?.includes('word')) ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center relative">
                    <FiFileText className="text-white" size={32} />
                    <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5">
                      <span className="text-xs text-white font-medium">DOC</span>
                    </div>
                  </div>
                ) : (
                  getFileIcon(item)
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 text-center truncate w-full">
                {item.name}
              </p>
              {item.size && (
                <p className="text-xs text-gray-500 mt-1">{formatFileSize(item.size)}</p>
              )}
              {item.aiMetadata?.labels && item.aiMetadata.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 justify-center">
                  {item.aiMetadata.labels.slice(0, 2).map((label, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 px-2 py-0.5 rounded-full font-medium"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, item);
              }}
            >
              <FiMoreVertical />
            </button>
          </div>
        ))}
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
