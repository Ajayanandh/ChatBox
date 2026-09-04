'use client';

import React, { useState } from 'react';
import { Brain, Plus, Trash2, AlertCircle } from 'lucide-react';
import { MemoryItem } from '@/types/memory';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';

interface MemoryManagerProps {
  memories: MemoryItem[];
  onAddMemory: (key: string, value: string) => Promise<MemoryItem>;
  onDeleteMemory: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  isLoading: boolean;
}

export function MemoryManager({
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearAll,
  isLoading,
}: MemoryManagerProps) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;
    setError(null);
    setIsAdding(true);
    try {
      await onAddMemory(key.trim(), value.trim());
      setKey('');
      setValue('');
    } catch (err: any) {
      setError(err.message || 'Failed to save memory');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-500" />
            Long-Term Personal Memory
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            ChatBox remembers your preferences and facts to personalize future answers.
          </p>
        </div>

        {memories.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={onClearAll}
            className="text-xs h-7 px-2.5"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Add Memory Form */}
      <form onSubmit={handleAdd} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-2.5">
        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          Add Custom Memory
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input
            placeholder="Topic (e.g., Coding Preference)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Fact (e.g., Prefers Python and FastAPI)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 text-xs sm:col-span-2"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            isLoading={isAdding}
            disabled={!key.trim() || !value.trim()}
            className="h-7 text-xs px-3"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Save Memory
          </Button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-2.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Memories List */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Active Memories ({memories.length})
        </div>

        {memories.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-400 rounded-xl border border-neutral-100 dark:border-neutral-800">
            No memories saved yet. State preferences in chat or add them manually above.
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {memories.map((mem) => (
              <div
                key={mem.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {mem.key}:
                  </span>{' '}
                  <span className="text-xs text-neutral-700 dark:text-neutral-300">
                    {mem.value}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteMemory(mem.id)}
                  className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
