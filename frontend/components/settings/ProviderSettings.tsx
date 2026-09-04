'use client';

import React from 'react';
import { Sparkles, Zap, Sliders, KeyRound } from 'lucide-react';
import { AI_MODELS } from '@/lib/constants';
import { AIProvider } from '@/types/chat';

interface ProviderSettingsProps {
  selectedProvider: AIProvider;
  onSelectProvider: (provider: AIProvider) => void;
  selectedModelId: string;
  onSelectModelId: (modelId: string) => void;
  temperature: number;
  onChangeTemperature: (temp: number) => void;
}

export function ProviderSettings({
  selectedProvider,
  onSelectProvider,
  selectedModelId,
  onSelectModelId,
  temperature,
  onChangeTemperature,
}: ProviderSettingsProps) {
  const modelsForProvider = AI_MODELS.filter((m) => m.provider === selectedProvider);

  return (
    <div className="space-y-5">
      {/* Provider Selector */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Default AI Provider
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              onSelectProvider('gemini');
              onSelectModelId('gemini-2.5-flash');
            }}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selectedProvider === 'gemini'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500'
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Google Gemini</p>
              <p className="text-[11px] text-neutral-400">Gemini 2.5 & 1.5</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectProvider('openai');
              onSelectModelId('gpt-4o-mini');
            }}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selectedProvider === 'openai'
                ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-100 ring-1 ring-sky-500'
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">OpenAI</p>
              <p className="text-[11px] text-neutral-400">GPT-4o & GPT-4o-mini</p>
            </div>
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
          Default Model
        </label>
        <select
          value={selectedModelId}
          onChange={(e) => onSelectModelId(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {modelsForProvider.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} - {m.description}
            </option>
          ))}
        </select>
      </div>

      {/* Temperature Slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Temperature (Creativity)
          </label>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {temperature.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={temperature}
          onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
          className="w-full accent-emerald-600 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
          <span>Precise & Deterministic (0.0)</span>
          <span>Balanced (0.7)</span>
          <span>Creative (1.0)</span>
        </div>
      </div>

      {/* API Key notice */}
      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex items-start gap-2">
        <KeyRound className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-neutral-700 dark:text-neutral-300">Backend Secrets & Keys</p>
          <p className="mt-0.5 text-[11px] leading-relaxed">
            API keys are securely managed by the FastAPI backend in the <code>.env</code> file. No secrets are exposed to client browsers.
          </p>
        </div>
      </div>
    </div>
  );
}
