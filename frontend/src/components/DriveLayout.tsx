import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFolder, FiGrid, FiList, FiSearch, FiFilter, FiTrash2 } from 'react-icons/fi';
import { DriveItem, BreadcrumbItem, SortField, SortDirection, FileCategory } from '../types';
import { listItems, createFolder, deleteItem, moveItem, updateItem } from '../api/drive';
import { useFileUpload } from '../hooks/useFileUpload';
import FileGrid from './FileGrid';
import FileList from './FileList';
import Breadcrumb from './Breadcrumb';
import SearchBar from './SearchBar';
import UploadProgress from './UploadProgress';
import FilePreview from './FilePreview';
import Sidebar from './Sidebar';
import StorageAnalytics from './StorageAnalytics';
import ShareDialog from './ShareDialog';
import MoveDialog from './MoveDialog';
import BulkActionBar from './BulkActionBar';
import SecretRoomDialog from './SecretRoomDialog';

interface DriveLayoutProps {}

export default function DriveLayout({}: DriveLayoutProps) {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: 'root', name: 'My Drive' }]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [currentView, setCurrentView] = useState<'drive' | 'recent' | 'starred' | 'analytics' | 'trash' | 'secret'>('drive');
  const [shareItem, setShareItem] = useState<DriveItem | null>(null);
  const [allItems, setAllItems] = useState<DriveItem[]>([]);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<FileCategory>('all');
  const [showSecretRoomDialog, setShowSecretRoomDialog] = useState(false);
  const [isSecretRoomUnlocked, setIsSecretRoomUnlocked] = useState(false);
  const [secretRoomPassword, setSecretRoomPassword] = useState<string | null>(null);

  const { uploads, uploadFiles, clearUploads } = useFileUpload(currentFolderId, loadItems);

  useEffect(() => {
    loadItems();
  }, [currentFolderId]);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchQuery, sortField, sortDirection]);

  async function loadItems() {
    setLoading(true);
    try {
      const data = await listItems(currentFolderId);
      setItems(data);
      // Load all items recursively for starred/recent views
      await loadAllItems();
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllItems() {
    try {
      // Load root items
      const rootItems = await listItems('root');
      const allItemsList: DriveItem[] = [...rootItems];
      
      // Recursively load items from all folders
      const loadFolder = async (folderId: string) => {
        const folderItems = await listItems(folderId);
        allItemsList.push(...folderItems);
        
        // Load subfolders
        const subfolders = folderItems.filter(item => item.type === 'folder');
        for (const folder of subfolders) {
          await loadFolder(folder.itemId);
        }
      };
      
      const rootFolders = rootItems.filter(item => item.type === 'folder');
      for (const folder of rootFolders) {
        await loadFolder(folder.itemId);
      }
      
      setAllItems(allItemsList);
    } catch (error) {
      console.error('Failed to load all items:', error);
    }
  }

  async function toggleStar(item: DriveItem) {
    const newStarredState = !item.starred;
    
    // Optimistically update UI
    const updatedItems = items.map(i => 
      i.itemId === item.itemId ? { ...i, starred: newStarredState } : i
    );
    setItems(updatedItems);
    setAllItems(allItems.map(i => 
      i.itemId === item.itemId ? { ...i, starred: newStarredState } : i
    ));

    // Persist to backend
    try {
      await updateItem(item.itemId, { starred: newStarredState });
    } catch (error) {
      console.error('Failed to update starred status:', error);
      // Revert on error
      setItems(items);
      setAllItems(allItems);
    }
  }

  function getFileCategory(mimeType?: string): FileCategory {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) {
      if (mimeType === 'image/gif') return 'other'; // GIFs in their own category if needed
      return 'images';
    }
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType === 'application/pdf') return 'pdfs';
    if (mimeType.includes('document') || mimeType.includes('text')) return 'documents';
    return 'other';
  }

  function filterByCategory(items: DriveItem[]): DriveItem[] {
    if (currentCategory === 'all') return items;
    return items.filter(item => {
      if (item.type === 'folder') return false; // Hide folders when filtering by category
      return getFileCategory(item.mimeType) === currentCategory;
    });
  }

  function handleViewChange(view: 'drive' | 'recent' | 'starred' | 'analytics' | 'trash' | 'secret') {
    if (view === 'secret' && !isSecretRoomUnlocked) {
      setShowSecretRoomDialog(true);
      return;
    }
    setCurrentView(view);
  }

  function handleSecretRoomUnlock(password: string) {
    // Check if password is being set for first time
    const storedPassword = localStorage.getItem('secretRoomPassword');
    
    if (!storedPassword) {
      // First time setup
      localStorage.setItem('secretRoomPassword', btoa(password)); // Simple encoding
      setSecretRoomPassword(password);
      setIsSecretRoomUnlocked(true);
      setShowSecretRoomDialog(false);
      setCurrentView('secret');
    } else {
      // Verify password
      if (btoa(password) === storedPassword) {
        setSecretRoomPassword(password);
        setIsSecretRoomUnlocked(true);
        setShowSecretRoomDialog(false);
        setCurrentView('secret');
      } else {
        alert('Incorrect password!');
      }
    }
  }

  function getViewItems(): DriveItem[] {
    let viewItems: DriveItem[];
    
    switch (currentView) {
      case 'recent':
        viewItems = [...allItems]
          .filter(item => item.type === 'file' && !item.deleted && item.isSecret !== true)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 20);
        break;
      case 'starred':
        viewItems = allItems.filter(item => item.starred && !item.deleted && item.isSecret !== true);
        break;
      case 'trash':
        viewItems = allItems.filter(item => item.deleted === true && item.isSecret !== true);
        break;
      case 'secret':
        viewItems = filteredItems.filter(item => item.isSecret === true && !item.deleted);
        break;
      default:
        viewItems = filteredItems.filter(item => !item.deleted && item.isSecret !== true);
    }
    
    // Apply category filter only in drive view
    if (currentView === 'drive') {
      viewItems = filterByCategory(viewItems);
    }
    
    return viewItems;
  }

  function filterAndSortItems() {
    let filtered = [...items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const tagsMatch = item.aiMetadata?.labels?.some(label => 
          label.toLowerCase().includes(query)
        );
        const keywordsMatch = item.aiMetadata?.keywords?.some(keyword => 
          keyword.toLowerCase().includes(query)
        );
        return nameMatch || tagsMatch || keywordsMatch;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      // Folders first
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }

      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          comparison = (a.mimeType || '').localeCompare(b.mimeType || '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredItems(filtered);
  }

  async function handleCreateFolder() {
    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      await createFolder(name, currentFolderId);
      await loadItems();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check for duplicates
    const duplicates = acceptedFiles.filter(file => 
      items.some(item => item.name === file.name && !item.deleted)
    );
    
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map(f => f.name).join('\n• ');
      const proceed = confirm(
        `⚠️ The following file(s) already exist:\n\n• ${duplicateNames}\n\nDo you want to upload anyway? This will create duplicates.`
      );
      if (!proceed) return;
    }
    
    uploadFiles(acceptedFiles);
  }, [uploadFiles, items]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    // Check for duplicates
    const duplicates = files.filter(file => 
      items.some(item => item.name === file.name && !item.deleted)
    );
    
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map(f => f.name).join('\n• ');
      const proceed = confirm(
        `⚠️ The following file(s) already exist:\n\n• ${duplicateNames}\n\nDo you want to upload anyway? This will create duplicates.`
      );
      if (!proceed) {
        event.target.value = ''; // Reset input
        return;
      }
    }
    
    uploadFiles(files);
    event.target.value = ''; // Reset input for next upload
  }, [items, uploadFiles]);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  function handleItemClick(item: DriveItem) {
    if (item.type === 'folder') {
      setCurrentFolderId(item.itemId);
      setBreadcrumbs([...breadcrumbs, { id: item.itemId, name: item.name }]);
      setSelectedItems(new Set());
    } else {
      // Open preview for files
      setPreviewItem(item);
    }
  }

  function handlePreviewNavigate(direction: 'prev' | 'next') {
    if (!previewItem) return;
    
    const fileItems = filteredItems.filter(item => item.type === 'file');
    const currentIndex = fileItems.findIndex(item => item.itemId === previewItem.itemId);
    
    if (direction === 'prev' && currentIndex > 0) {
      setPreviewItem(fileItems[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < fileItems.length - 1) {
      setPreviewItem(fileItems[currentIndex + 1]);
    }
  }

  function handleBreadcrumbClick(index: number) {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
    setSelectedItems(new Set());
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  async function handleBulkDelete() {
    const count = selectedItems.size;
    
    if (currentView === 'trash') {
      // Permanent delete from trash
      if (!confirm(`Permanently delete ${count} ${count === 1 ? 'item' : 'items'}? This cannot be undone.`)) {
        return;
      }
      try {
        await Promise.all(Array.from(selectedItems).map(itemId => deleteItem(itemId)));
        setSelectedItems(new Set());
        await loadItems();
      } catch (error) {
        console.error('Failed to delete items:', error);
        alert('Failed to delete some items');
      }
    } else {
      // Move to trash (soft delete)
      if (!confirm(`Move ${count} ${count === 1 ? 'item' : 'items'} to trash?`)) {
        return;
      }
      try {
        await Promise.all(
          Array.from(selectedItems).map(itemId => 
            updateItem(itemId, { deleted: true })
          )
        );
        setSelectedItems(new Set());
        await loadItems();
      } catch (error) {
        console.error('Failed to move items to trash:', error);
        alert('Failed to move some items to trash');
      }
    }
  }

  async function handleRestore() {
    try {
      await Promise.all(
        Array.from(selectedItems).map(itemId => 
          updateItem(itemId, { deleted: false })
        )
      );
      setSelectedItems(new Set());
      await loadItems();
    } catch (error) {
      console.error('Failed to restore items:', error);
      alert('Failed to restore some items');
    }
  }

  async function handleEmptyTrash() {
    const trashItems = allItems.filter(item => item.deleted);
    if (trashItems.length === 0) {
      alert('Trash is already empty');
      return;
    }
    
    if (!confirm(`Permanently delete all ${trashItems.length} items in trash? This cannot be undone.`)) {
      return;
    }
    
    try {
      await Promise.all(trashItems.map(item => deleteItem(item.itemId)));
      await loadItems();
    } catch (error) {
      console.error('Failed to empty trash:', error);
      alert('Failed to empty trash');
    }
  }

  async function handleToggleSecret(item: DriveItem) {
    if (!item.isSecret && !isSecretRoomUnlocked) {
      setShowSecretRoomDialog(true);
      return;
    }

    try {
      await updateItem(item.itemId, { isSecret: !item.isSecret });
      await loadItems();
    } catch (error) {
      console.error('Failed to toggle secret status:', error);
      alert('Failed to update item');
    }
  }

  async function handleBulkMove(targetFolderId: string) {
    try {
      await Promise.all(Array.from(selectedItems).map(itemId => moveItem(itemId, targetFolderId)));
      setSelectedItems(new Set());
      setShowMoveDialog(false);
      await loadItems();
    } catch (error) {
      console.error('Failed to move items:', error);
      alert('Failed to move some items');
    }
  }

  async function handleBulkStar() {
    const selectedItemsList = items.filter(item => selectedItems.has(item.itemId));
    const allStarred = selectedItemsList.every(item => item.starred);
    const newStarredState = !allStarred;
    
    // Optimistically update UI
    const updatedItems = items.map(item => 
      selectedItems.has(item.itemId) ? { ...item, starred: newStarredState } : item
    );
    setItems(updatedItems);
    setAllItems(allItems.map(item => 
      selectedItems.has(item.itemId) ? { ...item, starred: newStarredState } : item
    ));

    // Persist to backend
    try {
      await Promise.all(
        Array.from(selectedItems).map(itemId => 
          updateItem(itemId, { starred: newStarredState })
        )
      );
    } catch (error) {
      console.error('Failed to update starred status:', error);
      // Reload items on error
      await loadItems();
    }
  }

  const displayItems = currentView === 'analytics' ? [] : getViewItems();

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange}
        currentCategory={currentCategory}
        onCategoryChange={setCurrentCategory}
        isSecretRoomUnlocked={isSecretRoomUnlocked}
      />

      {/* Main Content */}
      <div {...getRootProps()} className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Drag overlay */}
        {isDragActive && (
        <div className="fixed inset-0 bg-gradient-to-br from-primary-500/30 via-purple-500/30 to-pink-500/30 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center animate-scale-in border-4 border-dashed border-primary-500">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center animate-bounce">
              <FiUpload size={40} className="text-white" />
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Drop files here</p>
            <p className="text-gray-600 mt-3 text-lg">Release to upload to your drive</p>
          </div>
        </div>
      )}

        {/* Header */}
        {currentView !== 'analytics' && (
          <>
            <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 px-6 py-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    {currentView === 'recent' ? 'Recent Files' : 
                     currentView === 'starred' ? 'Starred' : 
                     currentView === 'trash' ? 'Trash' : 
                     currentView === 'secret' ? '🔒 Secret Room' :
                     'My Drive'}
                  </h1>
                  {(currentView === 'drive' || currentView === 'trash' || currentView === 'secret') && (
                    <div className="flex items-center space-x-2">
                      {currentView === 'trash' ? (
                        <button
                          onClick={handleEmptyTrash}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          <FiTrash2 />
                          <span>Empty Trash</span>
                        </button>
                      ) : currentView === 'secret' ? (
                        <>
                          <button
                            onClick={handleCreateFolder}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <FiFolder />
                            <span>New Folder</span>
                          </button>
                          <label className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 cursor-pointer">
                            <FiUpload />
                            <span>Upload</span>
                            <input 
                              type="file" 
                              multiple 
                              onChange={handleFileInputChange}
                              className="hidden"
                            />
                          </label>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleCreateFolder}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <FiFolder />
                            <span>New Folder</span>
                          </button>
                          <label className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 cursor-pointer">
                            <FiUpload />
                            <span>Upload</span>
                            <input 
                              type="file" 
                              multiple 
                              onChange={handleFileInputChange}
                              className="hidden"
                            />
                          </label>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} />
                  <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-all ${
                        viewMode === 'grid' 
                          ? 'bg-primary-500 text-white shadow-md' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <FiGrid />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-all ${
                        viewMode === 'list' 
                          ? 'bg-primary-500 text-white shadow-md' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <FiList />
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Breadcrumb */}
            {currentView === 'drive' && (
              <div className="bg-white/50 backdrop-blur-md border-b border-white/20 px-6 py-3">
                <Breadcrumb items={breadcrumbs} onItemClick={handleBreadcrumbClick} />
              </div>
            )}
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {currentView === 'analytics' ? (
            <StorageAnalytics items={allItems} />
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-fade-in p-6">
              <FiFolder size={64} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No files found' : currentView === 'starred' ? 'No starred files' : currentView === 'recent' ? 'No recent files' : 'This folder is empty'}
              </p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : currentView === 'starred' ? 'Star files to see them here' : 'Upload files or create a new folder to get started'}
              </p>
            </div>
          ) : (
            <div className="p-6">
              {viewMode === 'grid' ? (
                <FileGrid
                  items={displayItems}
                  onItemClick={handleItemClick}
                  onRefresh={loadItems}
                  selectedItems={selectedItems}
                  onSelectionChange={setSelectedItems}
                  onStar={toggleStar}
                  onShare={setShareItem}
                  onToggleSecret={handleToggleSecret}
                  isTrashView={currentView === 'trash'}
                  isSecretView={currentView === 'secret'}
                />
              ) : (
                <FileList
                  items={displayItems}
                  onItemClick={handleItemClick}
                  onRefresh={loadItems}
                  selectedItems={selectedItems}
                  onSelectionChange={setSelectedItems}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                  onStar={toggleStar}
                  onShare={setShareItem}
                  onToggleSecret={handleToggleSecret}
                  isTrashView={currentView === 'trash'}
                  isSecretView={currentView === 'secret'}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Upload Progress */}
      <UploadProgress uploads={uploads} onClose={clearUploads} />

      {/* File Preview */}
      {previewItem && (
        <FilePreview
          item={previewItem}
          items={displayItems.filter(item => item.type === 'file')}
          onClose={() => setPreviewItem(null)}
          onNavigate={handlePreviewNavigate}
        />
      )}

      {/* Share Dialog */}
      {shareItem && (
        <ShareDialog
          item={shareItem}
          onClose={() => setShareItem(null)}
        />
      )}

      {/* Move Dialog */}
      {showMoveDialog && selectedItems.size > 0 && (
        <MoveDialog
          items={items.filter(item => selectedItems.has(item.itemId))}
          currentFolderId={currentFolderId}
          onClose={() => setShowMoveDialog(false)}
          onMove={handleBulkMove}
        />
      )}

      {/* Secret Room Dialog */}
      {showSecretRoomDialog && (
        <SecretRoomDialog
          onClose={() => setShowSecretRoomDialog(false)}
          onUnlock={handleSecretRoomUnlock}
          isSetup={!localStorage.getItem('secretRoomPassword')}
        />
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedItems.size}
        onDelete={handleBulkDelete}
        onMove={currentView !== 'trash' && currentView !== 'secret' ? () => setShowMoveDialog(true) : undefined}
        onStar={currentView !== 'trash' && currentView !== 'secret' ? handleBulkStar : undefined}
        onRestore={currentView === 'trash' ? handleRestore : undefined}
        onClearSelection={() => setSelectedItems(new Set())}
        isTrashView={currentView === 'trash'}
      />
    </div>
  );
}
