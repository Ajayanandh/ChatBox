'use client';

import React, { useState } from 'react';
import { Sliders, Brain, User as UserIcon, Trash2, LogOut } from 'lucide-react';
import { Modal } from '@/ui/Modal';
import { ProviderSettings } from './ProviderSettings';
import { MemoryManager } from './MemoryManager';
import { User } from '@/types/user';
import { AIProvider } from '@/types/chat';
import { MemoryItem } from '@/types/memory';
import { Button } from '@/ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  selectedProvider: AIProvider;
  onSelectProvider: (provider: AIProvider) => void;
  selectedModelId: string;
  onSelectModelId: (modelId: string) => void;
  temperature: number;
  onChangeTemperature: (temp: number) => void;
  memories: MemoryItem[];
  onAddMemory: (key: string, value: string) => Promise<MemoryItem>;
  onDeleteMemory: (id: string) => Promise<void>;
  onClearAllMemories: () => Promise<void>;
  isLoadingMemories: boolean;
  onLogout: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  user,
  selectedProvider,
  onSelectProvider,
  selectedModelId,
  onSelectModelId,
  temperature,
  onChangeTemperature,
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearAllMemories,
  isLoadingMemories,
  onLogout,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'models' | 'memory' | 'account'>('models');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" className="max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Navigation Tabs */}
        <div className="flex sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-neutral-200 dark:border-neutral-800 sm:w-44 pb-3 sm:pb-0 sm:pr-4 shrink-0">
          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
              activeTab === 'models'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>AI Models</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
              activeTab === 'memory'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Memory ({memories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
              activeTab === 'account'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Account</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'models' && (
            <ProviderSettings
              selectedProvider={selectedProvider}
              onSelectProvider={onSelectProvider}
              selectedModelId={selectedModelId}
              onSelectModelId={onSelectModelId}
              temperature={temperature}
              onChangeTemperature={onChangeTemperature}
            />
          )}

          {activeTab === 'memory' && (
            <MemoryManager
              memories={memories}
              onAddMemory={onAddMemory}
              onDeleteMemory={onDeleteMemory}
              onClearAll={onClearAllMemories}
              isLoading={isLoadingMemories}
            />
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <p className="text-xs text-neutral-400">Signed in as</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {user?.email || 'Guest'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  User ID: <code className="font-mono">{user?.id || 'anonymous'}</code>
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
