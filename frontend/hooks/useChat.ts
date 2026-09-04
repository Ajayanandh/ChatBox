'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, SourceCitation, ToolUsage, StreamEvent } from '@/types/chat';
import { api } from '@/lib/api';

interface UseChatProps {
  conversationId: string | null;
  onConversationCreated?: (id: string, title?: string) => void;
  selectedProvider: string;
  selectedModel: string;
  selectedDocIds?: string[];
  temperature?: number;
}

export function useChat({
  conversationId,
  onConversationCreated,
  selectedProvider,
  selectedModel,
  selectedDocIds = [],
  temperature = 0.7,
}: UseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load message history when conversation changes
  useEffect(() => {
    let isMounted = true;
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    setError(null);

    api.conversations
      .getMessages(conversationId)
      .then((data) => {
        if (isMounted) {
          setMessages(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load messages');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  // Stop current generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    // Remove streaming flag from last message
    setMessages((prev) =>
      prev.map((m, idx) =>
        idx === prev.length - 1 && m.role === 'assistant' ? { ...m, isStreaming: false } : m
      )
    );
  }, []);

  // Send a new message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsgText = text.trim();
      setError(null);

      // Create optimistic user message
      const tempUserMsg: Message = {
        id: `user_temp_${Date.now()}`,
        conversation_id: conversationId || '',
        role: 'user',
        content: userMsgText,
        created_at: new Date().toISOString(),
      };

      // Create optimistic assistant message placeholder
      const tempAsstMsg: Message = {
        id: `asst_temp_${Date.now()}`,
        conversation_id: conversationId || '',
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        isStreaming: true,
        sources: [],
        tools: [],
      };

      setMessages((prev) => [...prev, tempUserMsg, tempAsstMsg]);
      setIsStreaming(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let currentConvId = conversationId;
      let accumulatedContent = '';
      let collectedSources: SourceCitation[] = [];
      let collectedTools: ToolUsage[] = [];

      try {
        await api.chat.stream(
          {
            conversation_id: currentConvId,
            message: userMsgText,
            provider: selectedProvider,
            model: selectedModel,
            document_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined,
            temperature,
            use_memory: true,
            use_tools: true,
          },
          (event: StreamEvent) => {
            if (event.type === 'start') {
              if (event.conversation_id && event.conversation_id !== currentConvId) {
                currentConvId = event.conversation_id;
                onConversationCreated?.(event.conversation_id, event.title);
              }
            } else if (event.type === 'sources' && event.sources) {
              collectedSources = event.sources;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, sources: collectedSources };
                }
                return copy;
              });
            } else if (event.type === 'tool' && event.tool) {
              collectedTools = [...collectedTools, event.tool];
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, tools: collectedTools };
                }
                return copy;
              });
            } else if (event.type === 'content' && event.content) {
              accumulatedContent += event.content;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                  copy[copy.length - 1] = {
                    ...last,
                    content: accumulatedContent,
                    isStreaming: true,
                  };
                }
                return copy;
              });
            } else if (event.type === 'error') {
              setError(event.error || 'Generation error');
              accumulatedContent = event.error ? `⚠️ ${event.error}` : accumulatedContent;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                  copy[copy.length - 1] = {
                    ...last,
                    content: accumulatedContent,
                    isStreaming: false,
                  };
                }
                return copy;
              });
            } else if (event.type === 'done') {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                  copy[copy.length - 1] = {
                    ...last,
                    id: event.message_id || last.id,
                    conversation_id: event.conversation_id || last.conversation_id,
                    content: accumulatedContent,
                    isStreaming: false,
                  };
                }
                return copy;
              });
            }
          },
          abortController.signal
        );
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          const errMsg = err.message || 'Error communicating with AI service';
          setError(errMsg);
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.role === 'assistant') {
              copy[copy.length - 1] = {
                ...last,
                content: `⚠️ ${errMsg}`,
                isStreaming: false,
              };
            }
            return copy;
          });
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      conversationId,
      isStreaming,
      selectedProvider,
      selectedModel,
      selectedDocIds,
      temperature,
      onConversationCreated,
    ]
  );

  // Regenerate last response
  const regenerateResponse = useCallback(async () => {
    if (!conversationId || isStreaming || messages.length === 0) return;

    setError(null);
    setIsStreaming(true);

    // Filter out last assistant message from UI
    let msgsWithoutLast = [...messages];
    if (msgsWithoutLast[msgsWithoutLast.length - 1]?.role === 'assistant') {
      msgsWithoutLast.pop();
    }

    const tempAsstMsg: Message = {
      id: `asst_regen_${Date.now()}`,
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
      sources: [],
      tools: [],
    };

    setMessages([...msgsWithoutLast, tempAsstMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = '';

    try {
      await api.chat.regenerateStream(
        {
          conversation_id: conversationId,
          provider: selectedProvider,
          model: selectedModel,
          temperature,
          use_memory: true,
          use_tools: true,
        },
        (event: StreamEvent) => {
          if (event.type === 'content' && event.content) {
            accumulatedContent += event.content;
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last && last.role === 'assistant') {
                copy[copy.length - 1] = {
                  ...last,
                  content: accumulatedContent,
                  isStreaming: true,
                };
              }
              return copy;
            });
          } else if (event.type === 'error') {
            setError(event.error || 'Regeneration error');
            accumulatedContent = event.error ? `⚠️ ${event.error}` : accumulatedContent;
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last && last.role === 'assistant') {
                copy[copy.length - 1] = {
                  ...last,
                  content: accumulatedContent,
                  isStreaming: false,
                };
              }
              return copy;
            });
          } else if (event.type === 'done') {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last && last.role === 'assistant') {
                copy[copy.length - 1] = {
                  ...last,
                  id: event.message_id || last.id,
                  content: accumulatedContent,
                  isStreaming: false,
                };
              }
              return copy;
            });
          }
        },
        abortController.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errMsg = err.message || 'Failed to regenerate response';
        setError(errMsg);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, isStreaming, messages, selectedProvider, selectedModel, temperature]);

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await api.chat.deleteMessage(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err: any) {
        setError(err.message || 'Failed to delete message');
      }
    },
    []
  );

  return {
    messages,
    isStreaming,
    isLoadingMessages,
    error,
    sendMessage,
    stopGeneration,
    regenerateResponse,
    deleteMessage,
  };
}
