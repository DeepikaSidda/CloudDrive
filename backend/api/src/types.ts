export interface FileItem {
  PK: string; // USER#{userId}
  SK: string; // ITEM#{itemId}
  GSI1PK: string; // USER#{userId}#PARENT#{parentId}
  GSI1SK: string; // TYPE#{type}#NAME#{name}
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
  aiMetadata?: {
    labels?: string[];
    keywords?: string[];
    extractedText?: string;
    confidence?: number;
    entities?: Array<{ text: string; type: string; score: number }>;
  };
}

export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId: string;
}

export interface UpdateItemRequest {
  name?: string;
  parentId?: string;
  starred?: boolean;
  deleted?: boolean;
  isSecret?: boolean;
}

export interface UploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  parentId: string;
}
