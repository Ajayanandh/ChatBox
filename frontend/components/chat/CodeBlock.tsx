'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export function CodeBlock({ language = 'plaintext', value }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(value);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-neutral-800 bg-[#1e1e1e] text-neutral-100 font-mono text-xs shadow-md">
      {/* Code block header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-neutral-400 text-xs select-none">
        <span className="font-semibold uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#3d3d3d] text-neutral-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="p-4 overflow-x-auto">
        <pre className="leading-relaxed">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}
