import { getStoredToken, removeStoredToken } from './auth';
import { Conversation, ConversationDetail, Message, StreamEvent } from '@/types/chat';
import { User, AuthResponse } from '@/types/user';
import { DocumentItem } from '@/types/document';
import { MemoryItem } from '@/types/memory';

const API_BASE = '/api';

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not calling login/register, clear token on 401
    if (!url.startsWith('/auth/login') && !url.startsWith('/auth/register')) {
      removeStoredToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
  }

  return response;
}

export const api = {
  // Authentication
  auth: {
    async register(email: string, password: string): Promise<AuthResponse> {
      const res = await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(error.detail || 'Registration failed');
      }
      return res.json();
    },

    async login(email: string, password: string): Promise<AuthResponse> {
      const res = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
        throw new Error(error.detail || 'Login failed');
      }
      return res.json();
    },

    async getMe(): Promise<User> {
      const res = await fetchWithAuth('/auth/me');
      if (!res.ok) {
        throw new Error('Failed to fetch user profile');
      }
      return res.json();
    },

    async logout(): Promise<void> {
      try {
        await fetchWithAuth('/auth/logout', { method: 'POST' });
      } finally {
        removeStoredToken();
      }
    },
  },

  // Conversations
  conversations: {
    async list(q?: string): Promise<Conversation[]> {
      const query = q ? `?q=${encodeURIComponent(q)}` : '';
      const res = await fetchWithAuth(`/conversations${query}`);
      if (!res.ok) throw new Error('Failed to load conversations');
      return res.json();
    },

    async create(title?: string, provider?: string, model?: string): Promise<Conversation> {
      const res = await fetchWithAuth('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title, provider, model }),
      });
      if (!res.ok) throw new Error('Failed to create conversation');
      return res.json();
    },

    async get(id: string): Promise<ConversationDetail> {
      const res = await fetchWithAuth(`/conversations/${id}`);
      if (!res.ok) throw new Error('Failed to load conversation details');
      return res.json();
    },

    async update(id: string, data: { title?: string; provider?: string; model?: string }): Promise<Conversation> {
      const res = await fetchWithAuth(`/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update conversation');
      return res.json();
    },

    async delete(id: string): Promise<void> {
      const res = await fetchWithAuth(`/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete conversation');
    },

    async getMessages(id: string): Promise<Message[]> {
      const res = await fetchWithAuth(`/conversations/${id}/messages`);
      if (!res.ok) throw new Error('Failed to load messages');
      return res.json();
    },
  },

  // Chat Streaming & Actions
  chat: {
    async stream(
      params: {
        conversation_id?: string | null;
        message: string;
        provider?: string;
        model?: string;
        document_ids?: string[];
        temperature?: number;
        use_memory?: boolean;
        use_tools?: boolean;
      },
      onEvent: (event: StreamEvent) => void,
      signal?: AbortSignal
    ): Promise<void> {
      const response = await fetchWithAuth('/chat/stream', {
        method: 'POST',
        body: JSON.stringify(params),
        signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to start chat stream' }));
        throw new Error(error.detail || `Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body readable stream');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.substring(6).trim();
              if (jsonStr) {
                try {
                  const event = JSON.parse(jsonStr) as StreamEvent;
                  onEvent(event);
                } catch (e) {
                  console.warn('Failed to parse SSE event chunk:', jsonStr, e);
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Stream generation stopped by user');
        } else {
          throw err;
        }
      } finally {
        reader.releaseLock();
      }
    },

    async regenerateStream(
      params: {
        conversation_id: string;
        provider?: string;
        model?: string;
        temperature?: number;
        use_memory?: boolean;
        use_tools?: boolean;
      },
      onEvent: (event: StreamEvent) => void,
      signal?: AbortSignal
    ): Promise<void> {
      const response = await fetchWithAuth('/chat/regenerate', {
        method: 'POST',
        body: JSON.stringify(params),
        signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to regenerate stream' }));
        throw new Error(error.detail || `Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body readable stream');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.substring(6).trim();
              if (jsonStr) {
                try {
                  const event = JSON.parse(jsonStr) as StreamEvent;
                  onEvent(event);
                } catch (e) {
                  console.warn('Failed to parse SSE event chunk:', jsonStr, e);
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Regeneration stopped by user');
        } else {
          throw err;
        }
      } finally {
        reader.releaseLock();
      }
    },

    async deleteMessage(messageId: string): Promise<void> {
      const res = await fetchWithAuth(`/messages/${messageId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete message');
    },
  },

  // Documents & RAG
  documents: {
    async upload(file: File): Promise<DocumentItem> {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetchWithAuth('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Failed to upload document');
      }
      return res.json();
    },

    async list(): Promise<DocumentItem[]> {
      const res = await fetchWithAuth('/documents');
      if (!res.ok) throw new Error('Failed to load documents');
      return res.json();
    },

    async delete(id: string): Promise<void> {
      const res = await fetchWithAuth(`/documents/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete document');
    },
  },

  // Long-Term Memory
  memory: {
    async list(): Promise<MemoryItem[]> {
      const res = await fetchWithAuth('/memory');
      if (!res.ok) throw new Error('Failed to load memory');
      return res.json();
    },

    async create(key: string, value: string): Promise<MemoryItem> {
      const res = await fetchWithAuth('/memory', {
        method: 'POST',
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to create memory' }));
        throw new Error(error.detail || 'Failed to create memory');
      }
      return res.json();
    },

    async delete(id: string): Promise<void> {
      const res = await fetchWithAuth(`/memory/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete memory item');
    },

    async clearAll(): Promise<void> {
      const res = await fetchWithAuth('/memory', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear memory');
    },
  },

  // Health
  health: {
    async check(): Promise<any> {
      const res = await fetchWithAuth('/health');
      if (!res.ok) throw new Error('Health check failed');
      return res.json();
    },
  },
};
