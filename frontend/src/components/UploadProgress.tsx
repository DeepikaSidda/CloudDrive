import { FiCheck, FiX, FiUpload } from 'react-icons/fi';
import { UploadProgress as UploadProgressType } from '../types';

interface UploadProgressProps {
  uploads: UploadProgressType[];
  onClose: () => void;
}

export default function UploadProgress({ uploads, onClose }: UploadProgressProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-slide-up z-50">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center space-x-2">
          <FiUpload size={18} />
          <span className="font-medium">Uploading {uploads.length} file(s)</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition">
          <FiX size={18} />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {uploads.map((upload, index) => (
          <div key={index} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 truncate flex-1">
                {upload.file.name}
              </span>
              {upload.status === 'success' && (
                <FiCheck className="text-green-500 flex-shrink-0" size={18} />
              )}
              {upload.status === 'error' && (
                <FiX className="text-red-500 flex-shrink-0" size={18} />
              )}
            </div>
            {upload.status === 'uploading' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            )}
            {upload.status === 'error' && (
              <p className="text-xs text-red-500 mt-1">{upload.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
