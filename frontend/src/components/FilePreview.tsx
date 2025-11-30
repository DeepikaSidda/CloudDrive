import { useEffect, useState } from 'react';
import { FiX, FiDownload, FiChevronLeft, FiChevronRight, FiMaximize2 } from 'react-icons/fi';
import { DriveItem } from '../types';
import { getDownloadUrl } from '../api/drive';

interface FilePreviewProps {
  item: DriveItem;
  items: DriveItem[];
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export default function FilePreview({ item, items, onClose, onNavigate }: FilePreviewProps) {
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const currentIndex = items.findIndex(i => i.itemId === item.itemId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  useEffect(() => {
    loadFile();
  }, [item.itemId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate('prev');
      if (e.key === 'ArrowRight' && hasNext) onNavigate('next');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, onClose, onNavigate]);

  async function loadFile() {
    setLoading(true);
    setError('');
    try {
      const url = await getDownloadUrl(item.itemId);
      setDownloadUrl(url);
    } catch (err) {
      setError('Failed to load file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    window.open(downloadUrl, '_blank');
  }

  function renderPreview() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-2">{error}</p>
            <button
              onClick={loadFile}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    const mimeType = item.mimeType || '';

    // Image preview
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <img
            src={downloadUrl}
            alt={item.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      );
    }

    // PDF preview
    if (mimeType === 'application/pdf') {
      return (
        <div className="h-full w-full">
          <iframe
            src={downloadUrl}
            className="w-full h-full border-0"
            title={item.name}
          />
        </div>
      );
    }

    // Text preview
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      return (
        <div className="h-full overflow-auto p-8">
          <iframe
            src={downloadUrl}
            className="w-full h-full border-0 bg-white rounded-lg"
            title={item.name}
          />
        </div>
      );
    }

    // Unsupported file type
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FiMaximize2 size={64} className="text-gray-300 mb-4" />
        <p className="text-xl text-gray-600 mb-2">Preview not available</p>
        <p className="text-sm text-gray-500 mb-6">
          This file type cannot be previewed
        </p>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FiDownload />
          <span>Download File</span>
        </button>
      </div>
    );
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-white text-xl font-semibold truncate">{item.name}</h2>
            <p className="text-gray-300 text-sm mt-1">
              {formatFileSize(item.size)} • {new Date(item.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm"
              title="Download"
            >
              <FiDownload size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm"
              title="Close (Esc)"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* AI Tags */}
        {item.aiMetadata?.labels && item.aiMetadata.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {item.aiMetadata.labels.map((label, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-primary-500/80 backdrop-blur-sm text-white text-sm rounded-full"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {hasPrev && (
        <button
          onClick={() => onNavigate('prev')}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm z-10"
          title="Previous (←)"
        >
          <FiChevronLeft size={24} />
        </button>
      )}
      {hasNext && (
        <button
          onClick={() => onNavigate('next')}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm z-10"
          title="Next (→)"
        >
          <FiChevronRight size={24} />
        </button>
      )}

      {/* Preview Content */}
      <div className="h-full pt-32 pb-8">
        {renderPreview()}
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
}
