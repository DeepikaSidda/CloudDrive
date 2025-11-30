import { useEffect, useRef } from 'react';
import { FiDownload, FiEdit2, FiTrash2, FiStar, FiShare2, FiRotateCcw, FiLock } from 'react-icons/fi';
import { DriveItem } from '../types';
import { deleteItem, renameItem, getDownloadUrl, updateItem } from '../api/drive';

interface ContextMenuProps {
  x: number;
  y: number;
  item: DriveItem;
  onClose: () => void;
  onRefresh: () => void;
  onStar?: (item: DriveItem) => void;
  onShare?: (item: DriveItem) => void;
  onToggleSecret?: (item: DriveItem) => void;
  isTrashView?: boolean;
  isSecretView?: boolean;
}

export default function ContextMenu({ x, y, item, onClose, onRefresh, onStar, onShare, onToggleSecret, isTrashView = false, isSecretView = false }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  async function handleDownload() {
    try {
      const url = await getDownloadUrl(item.itemId);
      window.open(url, '_blank');
      onClose();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  }

  async function handleRename() {
    const newName = prompt('Enter new name:', item.name);
    if (!newName || newName === item.name) {
      onClose();
      return;
    }

    try {
      await renameItem(item.itemId, newName);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Rename failed:', error);
      alert('Failed to rename item');
    }
  }

  async function handleDelete() {
    if (isTrashView) {
      // Permanent delete from trash
      if (!confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) {
        onClose();
        return;
      }
      try {
        await deleteItem(item.itemId);
        onRefresh();
        onClose();
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete item');
      }
    } else {
      // Move to trash (soft delete)
      if (!confirm(`Move "${item.name}" to trash?`)) {
        onClose();
        return;
      }
      try {
        await updateItem(item.itemId, { deleted: true });
        onRefresh();
        onClose();
      } catch (error) {
        console.error('Failed to move to trash:', error);
        alert('Failed to move item to trash');
      }
    }
  }

  async function handleRestore() {
    try {
      await updateItem(item.itemId, { deleted: false });
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Failed to restore item');
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]"
      style={{ left: x, top: y }}
    >
      {item.type === 'file' && (
        <button
          onClick={handleDownload}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <FiDownload />
          <span>Download</span>
        </button>
      )}
      {onStar && (
        <button
          onClick={() => {
            onStar(item);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <FiStar className={item.starred ? 'fill-yellow-400 text-yellow-400' : ''} />
          <span>{item.starred ? 'Unstar' : 'Star'}</span>
        </button>
      )}
      {onShare && item.type === 'file' && (
        <button
          onClick={() => {
            onShare(item);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <FiShare2 />
          <span>Share</span>
        </button>
      )}
      {!isTrashView && (
        <>
          <button
            onClick={handleRename}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <FiEdit2 />
            <span>Rename</span>
          </button>
          {onToggleSecret && (
            <button
              onClick={() => {
                onToggleSecret(item);
                onClose();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-purple-600"
            >
              <FiLock />
              <span>{item.isSecret ? 'Remove from Secret Room' : 'Move to Secret Room'}</span>
            </button>
          )}
        </>
      )}
      {isTrashView ? (
        <>
          <button
            onClick={handleRestore}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-green-600"
          >
            <FiRotateCcw />
            <span>Restore</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-red-600"
          >
            <FiTrash2 />
            <span>Delete Forever</span>
          </button>
        </>
      ) : (
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-red-600"
        >
          <FiTrash2 />
          <span>Move to Trash</span>
        </button>
      )}
    </div>
  );
}
