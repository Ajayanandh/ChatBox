'use client';

import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '@/types/chat';
import { api } from '@/lib/api';

export function useConversations(isAuthenticated: boolean) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = useCallback(async (search?: string) => {
    if (!isAuthenticated) {
      setConversations([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.conversations.list(search);
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchConversations(searchQuery);
  }, [fetchConversations, searchQuery]);

  const createConversation = async (title?: string, provider?: string, model?: string): Promise<Conversation> => {
    const newConv = await api.conversations.create(title, provider, model);
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    return newConv;
  };

  const updateConversation = async (id: string, data: { title?: string; provider?: string; model?: string }) => {
    const updated = await api.conversations.update(id, data);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    return updated;
  };

  const deleteConversation = async (id: string) => {
    await api.conversations.delete(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  const startNewChat = () => {
    setActiveId(null);
  };

  return {
    conversations,
    activeId,
    setActiveId,
    searchQuery,
    setSearchQuery,
    isLoading,
    fetchConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    startNewChat,
  };
}
