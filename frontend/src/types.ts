export interface DriveItem {
  itemId: string;
  userId: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  s3Key?: string;
  parentId: string;
  createdAt: string;
  updatedAt: string;
  starred?: boolean;
  shareLink?: string;
  deleted?: boolean;
  deletedAt?: string;
  isSecret?: boolean;
  aiMetadata?: {
    labels?: string[];
    keywords?: string[];
    extractedText?: string;
    confidence?: number;
    thumbnailKey?: string;
    entities?: Array<{ text: string; type: string; score: number }>;
  };
}

export type FileCategory = 'all' | 'images' | 'videos' | 'documents' | 'pdfs' | 'other';

export interface StorageStats {
  totalSize: number;
  fileCount: number;
  folderCount: number;
  byType: Record<string, { count: number; size: number }>;
  recentFiles: DriveItem[];
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export type SortField = 'name' | 'date' | 'size' | 'type';
export type SortDirection = 'asc' | 'desc';

export interface ViewState {
  mode: 'grid' | 'list';
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
  selectedItems: Set<string>;
}
