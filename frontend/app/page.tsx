'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useConversations } from '@/hooks/useConversations';
import { useChat } from '@/hooks/useChat';
import { useDocuments } from '@/hooks/useDocuments';
import { useMemory } from '@/hooks/useMemory';
import { useToast } from '@/ui/Toast';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { AIProvider, ModelOption } from '@/types/chat';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, STORAGE_KEYS } from '@/lib/constants';

export default function Home() {
  const { user, isAuthenticated, isLoading: isAuthLoading, login, register, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Model & Provider State
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(DEFAULT_PROVIDER);
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_MODEL);
  const [temperature, setTemperature] = useState<number>(0.7);

  // Load saved preferences
  useEffect(() => {
    const savedProvider = localStorage.getItem(STORAGE_KEYS.SELECTED_PROVIDER) as AIProvider;
    const savedModel = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
    const savedTemp = localStorage.getItem(STORAGE_KEYS.TEMPERATURE);

    if (savedProvider) setSelectedProvider(savedProvider);
    if (savedModel) setSelectedModelId(savedModel);
    if (savedTemp) setTemperature(parseFloat(savedTemp));
  }, []);

  const handleSelectProvider = (p: AIProvider) => {
    setSelectedProvider(p);
    localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, p);
  };

  const handleSelectModel = (model: ModelOption) => {
    setSelectedModelId(model.id);
    setSelectedProvider(model.provider);
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model.id);
    localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, model.provider);
  };

  const handleChangeTemperature = (temp: number) => {
    setTemperature(temp);
    localStorage.setItem(STORAGE_KEYS.TEMPERATURE, temp.toString());
  };

  // Conversations Hook
  const {
    conversations,
    activeId,
    setActiveId,
    searchQuery,
    setSearchQuery,
    isLoading: isLoadingConversations,
    fetchConversations,
    updateConversation,
    deleteConversation,
    startNewChat,
  } = useConversations(isAuthenticated);

  // Documents / RAG Hook
  const {
    documents,
    selectedDocIds,
    isLoading: isLoadingDocuments,
    uploadDocument,
    deleteDocument,
    toggleDocumentSelection,
  } = useDocuments(isAuthenticated);

  // Memory Hook
  const {
    memories,
    isLoading: isLoadingMemories,
    addMemory,
    deleteMemory,
    clearAllMemories,
  } = useMemory(isAuthenticated);

  // Chat Hook
  const {
    messages,
    isStreaming,
    error: chatError,
    sendMessage,
    stopGeneration,
    regenerateResponse,
    deleteMessage,
  } = useChat({
    conversationId: activeId,
    onConversationCreated: (newId, title) => {
      setActiveId(newId);
      fetchConversations();
    },
    selectedProvider,
    selectedModel: selectedModelId,
    selectedDocIds,
    temperature,
  });

  // Display chat errors via toast if any
  useEffect(() => {
    if (chatError) {
      toast.error(chatError);
    }
  }, [chatError, toast]);

  // Prompt user to login if not authenticated and trying to chat
  const handleSendMessage = async (text: string) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    await sendMessage(text);
  };

  // Keyboard shortcut Ctrl+K for New Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        startNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startNewChat]);

  // If initial auth check is loading
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-900 text-neutral-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs">Loading ChatBox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-neutral-950 font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => setActiveId(id)}
        onNewChat={startNewChat}
        onRenameConversation={async (id, title) => {
          await updateConversation(id, { title });
          toast.success('Conversation renamed');
        }}
        onDeleteConversation={async (id) => {
          await deleteConversation(id);
          toast.info('Conversation deleted');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoadingConversations}
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={async () => {
          await logout();
          toast.info('Signed out');
        }}
      />

      {/* Main Chat Area */}
      <ChatArea
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        selectedModelId={selectedModelId}
        onSelectModel={handleSelectModel}
        onNewChat={startNewChat}
        messages={messages}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        onStopGeneration={stopGeneration}
        onRegenerate={regenerateResponse}
        onDeleteMessage={async (id) => {
          await deleteMessage(id);
          toast.info('Message deleted');
        }}
        documents={documents}
        selectedDocIds={selectedDocIds}
        onToggleDocument={toggleDocumentSelection}
        onUploadDocument={async (file) => {
          const doc = await uploadDocument(file);
          toast.success(`Uploaded & indexed "${file.name}"`);
          return doc;
        }}
        onDeleteDocument={async (id) => {
          await deleteDocument(id);
          toast.info('Document deleted');
        }}
        isLoadingDocuments={isLoadingDocuments}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        selectedProvider={selectedProvider}
        onSelectProvider={handleSelectProvider}
        selectedModelId={selectedModelId}
        onSelectModelId={setSelectedModelId}
        temperature={temperature}
        onChangeTemperature={handleChangeTemperature}
        memories={memories}
        onAddMemory={async (k, v) => {
          const m = await addMemory(k, v);
          toast.success('Memory saved');
          return m;
        }}
        onDeleteMemory={async (id) => {
          await deleteMemory(id);
          toast.info('Memory deleted');
        }}
        onClearAllMemories={async () => {
          await clearAllMemories();
          toast.info('All memories cleared');
        }}
        isLoadingMemories={isLoadingMemories}
        onLogout={async () => {
          await logout();
          toast.info('Signed out');
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen || (!isAuthenticated && !isAuthLoading)}
        onClose={() => {
          if (isAuthenticated) setIsAuthModalOpen(false);
        }}
        onLogin={async (email, pass) => {
          await login(email, pass);
          toast.success('Welcome back!');
          setIsAuthModalOpen(false);
        }}
        onRegister={async (email, pass) => {
          await register(email, pass);
          toast.success('Account created successfully!');
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
