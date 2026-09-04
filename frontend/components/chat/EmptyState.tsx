import React from 'react';
import { Sparkles, Code2, BookOpen, Calculator, FileText } from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  selectedModelName: string;
}

export function EmptyState({ onSelectPrompt, selectedModelName }: EmptyStateProps) {
  const suggestions = [
    {
      icon: <Code2 className="w-5 h-5 text-emerald-500" />,
      title: 'Python & FastAPI',
      prompt: 'Write a complete asynchronous FastAPI route with Pydantic v2 validation and dependency injection.',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      title: 'Explain Concepts',
      prompt: 'Explain how Retrieval-Augmented Generation (RAG) and vector embeddings work in production.',
    },
    {
      icon: <Calculator className="w-5 h-5 text-amber-500" />,
      title: 'Math & Computation',
      prompt: 'Calculate sqrt(256) * 15.5 + log10(1000) using the calculator tool.',
    },
    {
      icon: <FileText className="w-5 h-5 text-purple-500" />,
      title: 'Document Analysis',
      prompt: 'How do I upload PDF or DOCX files and ask questions about specific passages?',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-4 text-center">
      {/* Bot Icon and Heading */}
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4 shadow-sm">
        <Sparkles className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        How can I help you today?
      </h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
        Powered by <strong className="text-neutral-700 dark:text-neutral-300">{selectedModelName}</strong> with long-term memory, document analysis, and tools.
      </p>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex flex-col items-start p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all text-left group shadow-sm hover:shadow"
          >
            <div className="mb-2 p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:scale-105 transition-transform">
              {item.icon}
            </div>
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {item.title}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
              {item.prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
