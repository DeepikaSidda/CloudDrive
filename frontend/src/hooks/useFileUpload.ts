import { useState, useCallback } from 'react';
import { uploadFile } from '../api/drive';
import { UploadProgress } from '../types';

export function useFileUpload(parentId: string, onComplete: () => void) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const uploadFiles = useCallback(async (files: File[]) => {
    const newUploads: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadIndex = uploads.length + i;

      try {
        setUploads(prev => {
          const updated = [...prev];
          updated[uploadIndex] = { ...updated[uploadIndex], status: 'uploading', progress: 0 };
          return updated;
        });

        await uploadFile(file, parentId);

        setUploads(prev => {
          const updated = [...prev];
          updated[uploadIndex] = { ...updated[uploadIndex], status: 'success', progress: 100 };
          return updated;
        });
      } catch (error) {
        setUploads(prev => {
          const updated = [...prev];
          updated[uploadIndex] = {
            ...updated[uploadIndex],
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          };
          return updated;
        });
      }
    }

    setTimeout(() => {
      setUploads([]);
      onComplete();
    }, 2000);
  }, [parentId, onComplete, uploads.length]);

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  return { uploads, uploadFiles, clearUploads };
}
