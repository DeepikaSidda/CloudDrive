import { DriveItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

async function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}

export async function listItems(parentId: string = 'root'): Promise<DriveItem[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/items?parentId=${parentId}`, { headers });
  if (!response.ok) throw new Error('Failed to list items');
  const data = await response.json();
  return data.items;
}

export async function createFolder(name: string, parentId: string = 'root'): Promise<DriveItem> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/folders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, parentId }),
  });
  if (!response.ok) throw new Error('Failed to create folder');
  const data = await response.json();
  return data.item;
}

export async function uploadFile(
  file: File,
  parentId: string = 'root'
): Promise<{ itemId: string; uploadUrl: string }> {
  const headers = await getAuthHeaders();
  
  // Get presigned URL
  const response = await fetch(`${API_URL}/files/upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      parentId,
    }),
  });
  
  if (!response.ok) throw new Error('Failed to get upload URL');
  const data = await response.json();
  
  // Upload to S3
  await fetch(data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  
  return { itemId: data.itemId, uploadUrl: data.uploadUrl };
}

export async function deleteItem(itemId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('Failed to delete item');
}

export async function renameItem(itemId: string, newName: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name: newName }),
  });
  if (!response.ok) throw new Error('Failed to rename item');
}

export async function moveItem(itemId: string, newParentId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ parentId: newParentId }),
  });
  if (!response.ok) throw new Error('Failed to move item');
}

export async function updateItem(itemId: string, updates: { name?: string; parentId?: string; starred?: boolean; deleted?: boolean; isSecret?: boolean }): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update item');
}

export async function getDownloadUrl(itemId: string): Promise<string> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/items/${itemId}/download`, { headers });
  if (!response.ok) throw new Error('Failed to get download URL');
  const data = await response.json();
  return data.downloadUrl;
}

export interface AnalyticsData {
  totalSize: number;
  totalSizeGB: number;
  objectCount: number;
  estimatedMonthlyCost: number;
  costBreakdown: {
    storage: number;
    requests: number;
    dataTransfer: number;
  };
  byType: Record<string, { count: number; size: number }>;
  largestFiles: Array<{ key: string; size: number; lastModified: Date }>;
  storageClass: Record<string, number>;
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/analytics`, { headers });
  if (!response.ok) throw new Error('Failed to get analytics');
  return await response.json();
}
