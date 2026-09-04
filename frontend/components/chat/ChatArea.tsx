'use client';

import React, { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { DocumentUploadModal } from './DocumentUploadModal';
import { Message, ModelOption } from '@/types/chat';
import { DocumentItem } from '@/types/document';
import { AI_MODELS } from '@/lib/constants';

interface ChatAreaProps {
  onToggleSidebar: () => void;
  selectedModelId: string;
  onSelectModel: (model: ModelOption) => void;
  onNewChat: () => void;
  messages: Message[];
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  onRegenerate: () => void;
  onDeleteMessage: (id: string) => void;
  documents: DocumentItem[];
  selectedDocIds: string[];
  onToggleDocument: (id: string) => void;
  onUploadDocument: (file: File) => Promise<DocumentItem>;
  onDeleteDocument: (id: string) => Promise<void>;
  isLoadingDocuments: boolean;
}

export function ChatArea({
  onToggleSidebar,
  selectedModelId,
  onSelectModel,
  onNewChat,
  messages,
  isStreaming,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onDeleteMessage,
  documents,
  selectedDocIds,
  onToggleDocument,
  onUploadDocument,
  onDeleteDocument,
  isLoadingDocuments,
}: ChatAreaProps) {
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const currentModel = AI_MODELS.find((m) => m.id === selectedModelId) || AI_MODELS[0];
  const selectedDocs = documents.filter((d) => selectedDocIds.includes(d.id));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900">
      {/* Header */}
      <ChatHeader
        onToggleSidebar={onToggleSidebar}
        selectedModelId={selectedModelId}
        onSelectModel={onSelectModel}
        onOpenDocuments={() => setIsDocModalOpen(true)}
        activeDocumentCount={selectedDocs.length}
        onNewChat={onNewChat}
        isStreaming={isStreaming}
      />

      {/* Message Stream List */}
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        selectedModelName={currentModel.name}
        onSelectPrompt={(prompt) => onSendMessage(prompt)}
        onRegenerate={onRegenerate}
        onDeleteMessage={onDeleteMessage}
      />

      {/* Input Box */}
      <ChatInput
        onSendMessage={onSendMessage}
        onStopGeneration={onStopGeneration}
        isStreaming={isStreaming}
        onOpenDocuments={() => setIsDocModalOpen(true)}
        selectedDocuments={selectedDocs}
        onRemoveDocument={(id) => onToggleDocument(id)}
      />

      {/* RAG Knowledge Document Modal */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        documents={documents}
        selectedDocIds={selectedDocIds}
        onToggleDocument={onToggleDocument}
        onUpload={onUploadDocument}
        onDelete={onDeleteDocument}
        isLoading={isLoadingDocuments}
      />
    </div>
  );
}
