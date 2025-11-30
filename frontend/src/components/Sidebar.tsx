import { FiHome, FiClock, FiStar, FiPieChart, FiFolder, FiTrash2, FiImage, FiVideo, FiFileText, FiFile, FiLock } from 'react-icons/fi';
import { FileCategory } from '../types';

interface SidebarProps {
  currentView: 'drive' | 'recent' | 'starred' | 'analytics' | 'trash' | 'secret';
  onViewChange: (view: 'drive' | 'recent' | 'starred' | 'analytics' | 'trash' | 'secret') => void;
  currentCategory: FileCategory;
  onCategoryChange: (category: FileCategory) => void;
  isSecretRoomUnlocked: boolean;
}

export default function Sidebar({ currentView, onViewChange, currentCategory, onCategoryChange, isSecretRoomUnlocked }: SidebarProps) {
  const menuItems = [
    { id: 'drive' as const, icon: FiHome, label: 'My Drive' },
    { id: 'recent' as const, icon: FiClock, label: 'Recent' },
    { id: 'starred' as const, icon: FiStar, label: 'Starred' },
    { id: 'analytics' as const, icon: FiPieChart, label: 'Analytics' },
    { id: 'trash' as const, icon: FiTrash2, label: 'Trash' },
  ];

  const categories = [
    { id: 'all' as const, icon: FiFolder, label: 'All Files' },
    { id: 'images' as const, icon: FiImage, label: 'Images' },
    { id: 'videos' as const, icon: FiVideo, label: 'Videos' },
    { id: 'documents' as const, icon: FiFileText, label: 'Documents' },
    { id: 'pdfs' as const, icon: FiFile, label: 'PDFs' },
  ];

  return (
    <div className="w-64 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-xl flex flex-col relative z-20">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <FiFolder className="text-white" size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Cloud Drive</h2>
            <p className="text-xs text-gray-500">Smart Storage</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Secret Room */}
        <div className="mt-4">
          <button
            onClick={() => onViewChange('secret')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              currentView === 'secret'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 hover:from-purple-200 hover:to-purple-300'
            }`}
          >
            <FiLock size={20} />
            <div className="flex-1 text-left">
              <span className="font-medium">Secret Room</span>
              {isSecretRoomUnlocked && (
                <span className="block text-xs opacity-75">Unlocked</span>
              )}
            </div>
            {!isSecretRoomUnlocked && (
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            )}
          </button>
        </div>

        {/* Categories Section */}
        {currentView === 'drive' && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
              Categories
            </p>
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = currentCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
