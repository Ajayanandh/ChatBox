'use client';

import React, { useState } from 'react';
import { Bot, Mail, Lock, ArrowRight, Sparkles, UserPlus, LogIn } from 'lucide-react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string) => Promise<void>;
}

export function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please fill in both email and password');
      return;
    }

    if (isRegister && cleanPassword !== confirmPassword.trim()) {
      setError('Passwords do not match');
      return;
    }

    if (isRegister && cleanPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await onRegister(cleanEmail, cleanPassword);
      } else {
        await onLogin(cleanEmail, cleanPassword);
      }
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Authentication failed';
      if (!isRegister && (msg.includes('401') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('not found'))) {
        setError('No account found with these credentials. Please check password or click "Create Account".');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError(null);
    setIsDemoLoading(true);
    try {
      try {
        await onLogin('demo@chatbox.ai', 'password123');
      } catch {
        // If not yet registered, register demo account
        await onRegister('demo@chatbox.ai', 'password123');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick sign-in failed');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      {/* Header */}
      <div className="flex flex-col items-center text-center p-1 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mb-2.5 shadow-md">
          <Bot className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          {isRegister ? 'Create Your Account' : 'Welcome to ChatBox AI'}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {isRegister
            ? 'Sign up to access conversations, personal memory, and RAG'
            : 'Sign in to access your chat history and models'}
        </p>
      </div>

      {/* Segmented Mode Tabs (Sign In vs Create Account) */}
      <div className="grid grid-cols-2 p-1 mb-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => {
            setIsRegister(false);
            setError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            !isRegister
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          Sign In
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRegister(true);
            setError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            isRegister
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Create Account
        </button>
      </div>

      {/* 1-Click Quick Demo Button */}
      <button
        type="button"
        onClick={handleQuickDemoLogin}
        disabled={isDemoLoading || isLoading}
        className="w-full mb-4 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition-all shadow-2xs group"
      >
        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span>{isDemoLoading ? 'Signing in demo account...' : '⚡ 1-Click Demo Login (demo@chatbox.ai)'}</span>
      </button>

      <div className="relative flex py-1 items-center mb-3">
        <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
        <span className="flex-shrink mx-2 text-[10px] uppercase font-semibold text-neutral-400">or with email</span>
        <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {isRegister && (
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        )}

        {error && (
          <div className="p-2.5 rounded-xl text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-center leading-relaxed">
            {error}
            {!isRegister && (
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                  }}
                  className="underline font-bold text-rose-800 dark:text-rose-200"
                >
                  Click here to Create Account with this email
                </button>
              </div>
            )}
          </div>
        )}

        <Button type="submit" className="w-full h-10 mt-2" isLoading={isLoading} disabled={isDemoLoading}>
          <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </form>
    </Modal>
  );
}
