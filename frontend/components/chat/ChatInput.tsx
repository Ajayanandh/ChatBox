'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip, X, FileText } from 'lucide-react';
import { DocumentItem } from '@/types/document';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  onOpenDocuments: () => void;
  selectedDocuments: DocumentItem[];
  onRemoveDocument: (id: string) => void;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  onOpenDocuments,
  selectedDocuments,
  onRemoveDocument,
  disabled,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming || disabled) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 sm:pb-6">
      {/* Selected RAG document badges */}
      {selectedDocuments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2 px-2">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Active Context:
          </span>
          {selectedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            >
              <FileText className="w-3 h-3" />
              <span className="max-w-[140px] truncate">{doc.filename}</span>
              <button
                onClick={() => onRemoveDocument(doc.id)}
                className="hover:text-emerald-900 dark:hover:text-emerald-100 p-0.5 rounded-full"
                title="Remove from chat context"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="relative flex items-end gap-2 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
        {/* Document Attachment Button */}
        <button
          type="button"
          onClick={onOpenDocuments}
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Upload or select documents for RAG context"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatBox... (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={disabled}
          className="flex-1 max-h-48 resize-none bg-transparent py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed leading-relaxed"
        />

        {/* Send / Stop Button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStopGeneration}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 transition-colors shadow-sm"
            title="Stop generating"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className={cn(
              'p-2 rounded-xl transition-all',
              input.trim() && !disabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            )}
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
        ChatBox may produce inaccurate information about people, places, or facts.
      </p>
    </div>
  );
}
