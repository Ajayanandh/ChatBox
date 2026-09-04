'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '@/types/user';
import { Theme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface UserProfileMenuProps {
  user: User | null;
  onOpenSettings: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export function UserProfileMenu({
  user,
  onOpenSettings,
  theme,
  onToggleTheme,
  onLogout,
}: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative p-2 border-t border-neutral-200 dark:border-neutral-800" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
          {userInitial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
            {user?.email || 'Guest User'}
          </p>
          <p className="text-[10px] text-neutral-400 truncate">Free Personal Plan</p>
        </div>
      </button>

      {/* Popup Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-2 right-2 mb-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenSettings();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors"
          >
            <Settings className="w-4 h-4 text-neutral-400" />
            <span>Settings & Memory</span>
          </button>

          <button
            onClick={() => {
              onToggleTheme();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-sky-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>Theme</span>
            </div>
            <span className="text-[11px] text-neutral-400 capitalize">{theme}</span>
          </button>

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
