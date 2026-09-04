'use client';

import React from 'react';
import { Menu, Plus, FileText } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { ModelOption } from '@/types/chat';

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  selectedModelId: string;
  onSelectModel: (model: ModelOption) => void;
  onOpenDocuments: () => void;
  activeDocumentCount: number;
  onNewChat: () => void;
  isStreaming: boolean;
}

export function ChatHeader({
  onToggleSidebar,
  selectedModelId,
  onSelectModel,
  onOpenDocuments,
  activeDocumentCount,
  onNewChat,
  isStreaming,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30 select-none">
      <div className="flex items-center gap-2">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Selector */}
        <ModelSelector
          selectedModelId={selectedModelId}
          onSelectModel={onSelectModel}
          disabled={isStreaming}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* RAG Documents quick button */}
        <button
          onClick={onOpenDocuments}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 transition-colors shadow-sm"
          title="Manage RAG Documents"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-500" />
          <span>Docs</span>
          {activeDocumentCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-[10px] text-white flex items-center justify-center font-bold">
              {activeDocumentCount}
            </span>
          )}
        </button>

        {/* Mobile New Chat button */}
        <button
          onClick={onNewChat}
          className="md:hidden p-2 rounded-xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
