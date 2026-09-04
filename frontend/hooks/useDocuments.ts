'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocumentItem } from '@/types/document';
import { api } from '@/lib/api';

export function useDocuments(isAuthenticated: boolean) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) {
      setDocuments([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.documents.list();
      setDocuments(data);
    } catch (err: any) {
      console.error('Failed to load documents', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (file: File): Promise<DocumentItem> => {
    setUploadError(null);
    try {
      const newDoc = await api.documents.upload(file);
      setDocuments((prev) => [newDoc, ...prev]);
      // Auto-select uploaded doc
      setSelectedDocIds((prev) => [...prev, newDoc.id]);
      return newDoc;
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    await api.documents.delete(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedDocIds((prev) => prev.filter((docId) => docId !== id));
  };

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedDocIds([]);
  };

  return {
    documents,
    selectedDocIds,
    isLoading,
    uploadError,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    toggleDocumentSelection,
    clearSelection,
  };
}
