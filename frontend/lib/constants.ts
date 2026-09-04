import { ModelOption } from '@/types/chat';

export const AI_MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    description: 'Fastest & most versatile multimodal model for general intelligence',
    badge: 'Recommended',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    description: 'Advanced reasoning, deep technical analysis & large context',
    badge: 'Pro',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    description: 'High-speed balanced model for rapid answers',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Flagship OpenAI model with high intelligence and nuance',
    badge: 'Smartest',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai',
    description: 'Fast, cost-efficient model for everyday coding & queries',
    badge: 'Fast',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Classic legacy model for quick completions',
  },
];

export const DEFAULT_MODEL = 'gemini-2.5-flash';
export const DEFAULT_PROVIDER = 'gemini';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'chatbox_auth_token',
  THEME: 'chatbox_theme',
  SELECTED_MODEL: 'chatbox_selected_model',
  SELECTED_PROVIDER: 'chatbox_selected_provider',
  TEMPERATURE: 'chatbox_temperature',
};
