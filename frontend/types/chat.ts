export type AIProvider = 'gemini' | 'openai';

export interface ModelOption {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  badge?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  isStreaming?: boolean;
  sources?: SourceCitation[];
  tools?: ToolUsage[];
}

export interface SourceCitation {
  id: string;
  content: string;
  metadata: {
    filename: string;
    document_id: string;
    chunk_index: number;
  };
  score: number;
}

export interface ToolUsage {
  tool: string;
  input: string;
  output: any;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface StreamEvent {
  type: 'start' | 'content' | 'sources' | 'tool' | 'error' | 'done';
  conversation_id?: string;
  title?: string;
  content?: string;
  sources?: SourceCitation[];
  tool?: ToolUsage;
  error?: string;
  message_id?: string;
  created_at?: string;
  is_new?: boolean;
}
