'use client';

import React from 'react';
import { Conversation } from '@/types/chat';
import { ConversationItem } from './ConversationItem';
import { groupConversationsByDate } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onRename,
  onDelete,
  isLoading,
}: ConversationListProps) {
  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex-1 px-3 py-4 space-y-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-8 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-neutral-400">
        No conversations yet. Start a new chat!
      </div>
    );
  }

  const grouped = groupConversationsByDate(conversations);

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
      {Object.entries(grouped).map(([groupName, items]) => (
        <div key={groupName} className="space-y-0.5">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {groupName}
          </div>
          {items.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeId === conv.id}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
