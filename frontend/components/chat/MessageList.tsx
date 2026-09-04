'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { Message } from '@/types/chat';
import { MessageItem } from './MessageItem';
import { EmptyState } from './EmptyState';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  selectedModelName: string;
  onSelectPrompt: (prompt: string) => void;
  onRegenerate: () => void;
  onDeleteMessage: (id: string) => void;
}

export function MessageList({
  messages,
  isStreaming,
  selectedModelName,
  onSelectPrompt,
  onRegenerate,
  onDeleteMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Auto-scroll when new messages arrive or when streaming tokens arrive
  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom(false);
    }
  }, [messages, isStreaming, showScrollBottom]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <EmptyState onSelectPrompt={onSelectPrompt} selectedModelName={selectedModelName} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto py-6 space-y-2 relative scroll-smooth"
    >
      <div className="max-w-4xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <MessageItem
            key={msg.id || idx}
            message={msg}
            isLast={idx === messages.length - 1}
            canRegenerate={idx === messages.length - 1 && !isStreaming}
            onRegenerate={onRegenerate}
            onDelete={onDeleteMessage}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Floating scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-28 right-8 z-20 p-2 rounded-full bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all animate-in fade-in"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
