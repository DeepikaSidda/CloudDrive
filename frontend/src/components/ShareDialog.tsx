import { useState } from 'react';
import { FiX, FiCopy, FiCheck, FiLink, FiClock, FiEye, FiEdit, FiDownload, FiShield } from 'react-icons/fi';
import { DriveItem } from '../types';

type PermissionLevel = 'view' | 'download' | 'edit';

interface ShareDialogProps {
  item: DriveItem;
  onClose: () => void;
}

export default function ShareDialog({ item, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [permission, setPermission] = useState<PermissionLevel>('view');
  
  // Generate a mock share link (in production, this would call an API)
  const shareLink = `${window.location.origin}/share/${item.itemId}?expires=${expiryDays}d&permission=${permission}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Share File</h3>
            <p className="text-sm text-gray-600 mt-1">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Link
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 flex items-center space-x-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <FiLink className="text-gray-400 flex-shrink-0" size={18} />
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-transparent outline-none text-sm text-gray-700 truncate"
                />
              </div>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-3 rounded-lg transition-all flex items-center space-x-2 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
              >
                {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                <span className="font-medium">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Permission Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FiShield className="inline mr-2" size={16} />
              Access Permission
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setPermission('view')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                  permission === 'view'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${permission === 'view' ? 'bg-primary-500' : 'bg-gray-100'}`}>
                  <FiEye className={permission === 'view' ? 'text-white' : 'text-gray-600'} size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium ${permission === 'view' ? 'text-primary-900' : 'text-gray-900'}`}>
                    View Only
                  </p>
                  <p className="text-xs text-gray-600">Can only view the file</p>
                </div>
                {permission === 'view' && (
                  <FiCheck className="text-primary-500" size={20} />
                )}
              </button>

              <button
                onClick={() => setPermission('download')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                  permission === 'download'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${permission === 'download' ? 'bg-green-500' : 'bg-gray-100'}`}>
                  <FiDownload className={permission === 'download' ? 'text-white' : 'text-gray-600'} size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium ${permission === 'download' ? 'text-green-900' : 'text-gray-900'}`}>
                    Can Download
                  </p>
                  <p className="text-xs text-gray-600">Can view and download the file</p>
                </div>
                {permission === 'download' && (
                  <FiCheck className="text-green-500" size={20} />
                )}
              </button>

              <button
                onClick={() => setPermission('edit')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                  permission === 'edit'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${permission === 'edit' ? 'bg-orange-500' : 'bg-gray-100'}`}>
                  <FiEdit className={permission === 'edit' ? 'text-white' : 'text-gray-600'} size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium ${permission === 'edit' ? 'text-orange-900' : 'text-gray-900'}`}>
                    Can Edit
                  </p>
                  <p className="text-xs text-gray-600">Can view, download, and modify</p>
                </div>
                {permission === 'edit' && (
                  <FiCheck className="text-orange-500" size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Expiry Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiClock className="inline mr-2" size={16} />
              Link Expiry
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 7, 30, 365].map((days) => (
                <button
                  key={days}
                  onClick={() => setExpiryDays(days)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    expiryDays === days
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {days === 1 ? '1 day' : days === 365 ? '1 year' : `${days} days`}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Anyone with this link can{' '}
              {permission === 'view' && 'view this file'}
              {permission === 'download' && 'view and download this file'}
              {permission === 'edit' && 'view, download, and edit this file'}
              . The link will expire in {expiryDays} {expiryDays === 1 ? 'day' : 'days'}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            Close
          </button>
          <button
            onClick={copyToClipboard}
            className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition font-medium shadow-lg"
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}
