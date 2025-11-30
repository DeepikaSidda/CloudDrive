import { useEffect, useState } from 'react';
import { FiFile, FiImage, FiFileText, FiFolder, FiTrendingUp, FiDollarSign, FiDatabase, FiActivity } from 'react-icons/fi';
import { DriveItem } from '../types';
import { getAnalytics, AnalyticsData } from '../api/drive';

interface StorageAnalyticsProps {
  items: DriveItem[];
}

export default function StorageAnalytics({ items }: StorageAnalyticsProps) {
  const [stats, setStats] = useState({
    totalSize: 0,
    fileCount: 0,
    folderCount: 0,
    byType: {} as Record<string, { count: number; size: number }>,
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStats();
    loadAnalytics();
  }, [items]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats() {
    let totalSize = 0;
    let fileCount = 0;
    let folderCount = 0;
    const byType: Record<string, { count: number; size: number }> = {};

    items.forEach(item => {
      if (item.type === 'folder') {
        folderCount++;
      } else {
        fileCount++;
        totalSize += item.size || 0;

        const type = getFileType(item.mimeType);
        if (!byType[type]) {
          byType[type] = { count: 0, size: 0 };
        }
        byType[type].count++;
        byType[type].size += item.size || 0;
      }
    });

    setStats({ totalSize, fileCount, folderCount, byType });
  }

  function getFileType(mimeType?: string): string {
    if (!mimeType) return 'Other';
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (mimeType.includes('pdf')) return 'PDFs';
    if (mimeType.startsWith('text/')) return 'Text';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'Documents';
    return 'Other';
  }

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  const typeColors: Record<string, string> = {
    Images: 'from-green-500 to-green-600',
    Videos: 'from-purple-500 to-purple-600',
    PDFs: 'from-red-500 to-red-600',
    Documents: 'from-blue-500 to-blue-600',
    Text: 'from-yellow-500 to-yellow-600',
    Other: 'from-gray-500 to-gray-600',
  };

  const typeIcons: Record<string, any> = {
    Images: FiImage,
    Videos: FiFile,
    PDFs: FiFileText,
    Documents: FiFileText,
    Text: FiFileText,
    Other: FiFile,
  };

  const sortedTypes = Object.entries(stats.byType).sort((a, b) => b[1].size - a[1].size);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Storage Analytics</h2>
        <p className="text-gray-600">Real-time S3 storage metrics and cost analysis</p>
      </div>

      {/* Cost & Storage Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-white" size={24} />
            </div>
            <span className="text-sm font-medium text-green-600">Monthly Cost</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${analyticsData?.estimatedMonthlyCost.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-gray-600 mt-1">Estimated</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-primary-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <FiDatabase className="text-white" size={24} />
            </div>
            <span className="text-sm font-medium text-primary-600">Total Storage</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {analyticsData?.totalSizeGB.toFixed(2) || '0'} GB
          </p>
          <p className="text-sm text-gray-600 mt-1">{formatSize(analyticsData?.totalSize || 0)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FiFile className="text-white" size={24} />
            </div>
            <span className="text-sm font-medium text-blue-600">Objects</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData?.objectCount || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Total objects in S3</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FiActivity className="text-white" size={24} />
            </div>
            <span className="text-sm font-medium text-purple-600">Avg Size</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {analyticsData && analyticsData.objectCount > 0
              ? formatSize(analyticsData.totalSize / analyticsData.objectCount)
              : '0 B'}
          </p>
          <p className="text-sm text-gray-600 mt-1">Per object</p>
        </div>
      </div>

      {/* Cost Breakdown */}
      {analyticsData && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <p className="text-sm text-green-700 font-medium mb-1">Storage Cost</p>
              <p className="text-2xl font-bold text-green-900">
                ${analyticsData.costBreakdown.storage.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                ${(0.023).toFixed(3)}/GB/month
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-1">Request Cost</p>
              <p className="text-2xl font-bold text-blue-900">
                ${analyticsData.costBreakdown.requests.toFixed(4)}
              </p>
              <p className="text-xs text-blue-600 mt-1">PUT/GET requests</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <p className="text-sm text-orange-700 font-medium mb-1">Data Transfer</p>
              <p className="text-2xl font-bold text-orange-900">
                ${analyticsData.costBreakdown.dataTransfer.toFixed(2)}
              </p>
              <p className="text-xs text-orange-600 mt-1">After 100GB free tier</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-primary-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-white" size={24} />
            </div>
            <span className="text-sm font-medium text-primary-600">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatSize(stats.totalSize)}</p>
          <p className="text-sm text-gray-600 mt-1">Storage used</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FiFile className="text-white" size={24} />
            </div>
            <span className="text-sm font-medium text-blue-600">Files</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.fileCount}</p>
          <p className="text-sm text-gray-600 mt-1">Total files</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <FiFolder className="text-white" size={24} />
            </div>
            <span className="text-sm font-medium text-green-600">Folders</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.folderCount}</p>
          <p className="text-sm text-gray-600 mt-1">Total folders</p>
        </div>
      </div>

      {/* File Type Breakdown - Use real S3 data if available */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Storage by File Type (S3 Real Data)</h3>
        <div className="space-y-4">
          {analyticsData && Object.entries(analyticsData.byType).length > 0 ? (
            Object.entries(analyticsData.byType)
              .sort((a, b) => b[1].size - a[1].size)
              .map(([type, data]) => {
                const Icon = typeIcons[type] || FiFile;
                const percentage = analyticsData.totalSize > 0 ? (data.size / analyticsData.totalSize) * 100 : 0;
                
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${typeColors[type]} rounded-lg flex items-center justify-center`}>
                          <Icon className="text-white" size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{type}</p>
                          <p className="text-sm text-gray-600">{data.count} files</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatSize(data.size)}</p>
                        <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${typeColors[type]} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
          ) : (
            sortedTypes.map(([type, data]) => {
            const Icon = typeIcons[type] || FiFile;
            const percentage = stats.totalSize > 0 ? (data.size / stats.totalSize) * 100 : 0;
            
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${typeColors[type]} rounded-lg flex items-center justify-center`}>
                      <Icon className="text-white" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{type}</p>
                      <p className="text-sm text-gray-600">{data.count} files</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatSize(data.size)}</p>
                    <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${typeColors[type]} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* Largest Files */}
      {analyticsData && analyticsData.largestFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Largest Files</h3>
          <div className="space-y-2">
            {analyticsData.largestFiles.map((file, index) => (
              <div key={file.key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-md">{file.key.split('/').pop()}</p>
                    <p className="text-xs text-gray-500">{new Date(file.lastModified).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="font-bold text-gray-900">{formatSize(file.size)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {items
            .filter(item => item.type === 'file')
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5)
            .map(item => (
              <div key={item.itemId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                <div className="flex items-center space-x-3">
                  <FiFile className="text-gray-400" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-xs">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(item.updatedAt).toLocaleDateString()} • {formatSize(item.size || 0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
