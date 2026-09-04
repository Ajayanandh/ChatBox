'use client';

import { useState, useEffect, useCallback } from 'react';
import { MemoryItem } from '@/types/memory';
import { api } from '@/lib/api';

export function useMemory(isAuthenticated: boolean) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    if (!isAuthenticated) {
      setMemories([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.memory.list();
      setMemories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const addMemory = async (key: string, value: string): Promise<MemoryItem> => {
    setError(null);
    try {
      const newMem = await api.memory.create(key, value);
      setMemories((prev) => [newMem, ...prev.filter((m) => m.id !== newMem.id)]);
      return newMem;
    } catch (err: any) {
      setError(err.message || 'Failed to add memory');
      throw err;
    }
  };

  const deleteMemory = async (id: string) => {
    await api.memory.delete(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const clearAllMemories = async () => {
    await api.memory.clearAll();
    setMemories([]);
  };

  return {
    memories,
    isLoading,
    error,
    fetchMemories,
    addMemory,
    deleteMemory,
    clearAllMemories,
  };
}
