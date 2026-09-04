'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { DocumentItem } from '@/types/document';
import { formatFileSize } from '@/lib/utils';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  selectedDocIds: string[];
  onToggleDocument: (id: string) => void;
  onUpload: (file: File) => Promise<DocumentItem>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  documents,
  selectedDocIds,
  onToggleDocument,
  onUpload,
  onDelete,
  isLoading,
}: DocumentUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Knowledge & Document Context"
      description="Upload PDF, DOCX, TXT, or MD documents for Retrieval-Augmented Generation (RAG)."
      className="max-w-xl"
    >
      <div className="space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.md,.markdown"
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-col items-center">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
            ) : (
              <UploadCloud className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mb-2" />
            )}
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {isUploading ? 'Chunking and embedding document...' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Supports PDF, DOCX, TXT, MD (up to 20MB)
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Uploaded Documents List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Uploaded Documents ({documents.length})
            </h4>
            <span className="text-[11px] text-neutral-400">
              Check to activate in chat
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400 rounded-xl border border-neutral-100 dark:border-neutral-800">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {documents.map((doc) => {
                const isChecked = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isChecked
                        ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleDocument(doc.id)}
                        className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500"
                      />
                      <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {doc.filename}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {formatFileSize(doc.file_size)} • {doc.chunk_count} chunks • {doc.file_type.toUpperCase()}
                        </p>
                      </div>
                    </label>

                    <button
                      onClick={() => onDelete(doc.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-2"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
