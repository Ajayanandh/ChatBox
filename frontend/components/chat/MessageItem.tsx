'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User as UserIcon, Copy, Check, RotateCw, Trash2, FileText, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { Message, SourceCitation } from '@/types/chat';
import { CodeBlock } from './CodeBlock';
import { copyToClipboard, cn } from '@/lib/utils';

interface MessageItemProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
  onDelete?: (id: string) => void;
  canRegenerate?: boolean;
}

export function MessageItem({
  message,
  isLast,
  onRegenerate,
  onDelete,
  canRegenerate,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex w-full py-4 px-4 sm:px-6 transition-colors',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex gap-4 max-w-3xl w-full',
          isUser ? 'flex-row-reverse max-w-xl' : 'flex-row'
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold shadow-sm',
            isUser
              ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
              : 'bg-emerald-600 text-white dark:bg-emerald-600'
          )}
        >
          {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Content Box */}
        <div className={cn('flex flex-col space-y-2 overflow-hidden', isUser ? 'items-end' : 'items-start w-full')}>
          {/* Tool usage banner */}
          {message.tools && message.tools.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1">
              {message.tools.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>
                    Calculated: <code className="font-mono">{t.input}</code> = <strong>{t.output}</strong>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Message Text Bubble / Container */}
          <div
            className={cn(
              'relative rounded-2xl text-sm leading-relaxed break-words',
              isUser
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-4 py-2.5'
                : 'text-neutral-900 dark:text-neutral-100 w-full'
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-neutral dark:prose-invert max-w-none text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeContent = String(children).replace(/\n$/, '');

                      return !inline && match ? (
                        <CodeBlock language={match[1]} value={codeContent} />
                      ) : !inline && codeContent.includes('\n') ? (
                        <CodeBlock language="text" value={codeContent} />
                      ) : (
                        <code
                          className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-xs text-neutral-800 dark:text-neutral-200"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="leading-relaxed">{children}</li>;
                    },
                    h1({ children }) {
                      return <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>;
                    },
                    h2({ children }) {
                      return <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>;
                    },
                    h3({ children }) {
                      return <h3 className="text-sm font-bold mt-3 mb-1">{children}</h3>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-neutral-600 dark:text-neutral-400 my-2">
                          {children}
                        </blockquote>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>

                {/* Blinking streaming cursor */}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
                )}
              </div>
            )}
          </div>

          {/* RAG Sources accordion */}
          {message.sources && message.sources.length > 0 && (
            <div className="w-full mt-2 text-xs">
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sources used ({message.sources.length})</span>
                {showSources ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showSources && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {message.sources.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60"
                    >
                      <div className="flex items-center justify-between font-semibold text-neutral-800 dark:text-neutral-200">
                        <span className="truncate">{s.metadata.filename}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          {Math.round(s.score * 100)}% match
                        </span>
                      </div>
                      <p className="mt-1 text-neutral-600 dark:text-neutral-400 line-clamp-3 text-[11px] leading-tight">
                        {s.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons (Copy, Regenerate, Delete) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              title="Copy message"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {!isUser && canRegenerate && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                title="Regenerate response"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-rose-500 transition-colors"
                title="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
