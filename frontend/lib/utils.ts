import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
      }
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  } catch {
    return '';
  }
}

export function groupConversationsByDate<T extends { updated_at: string }>(items: T[]): { [key: string]: T[] } {
  const groups: { [key: string]: T[] } = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    Older: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const sevenDaysAgo = today - 7 * 86400000;
  const thirtyDaysAgo = today - 30 * 86400000;

  for (const item of items) {
    const time = new Date(item.updated_at).getTime();
    if (time >= today) {
      groups.Today.push(item);
    } else if (time >= yesterday) {
      groups.Yesterday.push(item);
    } else if (time >= sevenDaysAgo) {
      groups['Previous 7 Days'].push(item);
    } else if (time >= thirtyDaysAgo) {
      groups['Previous 30 Days'].push(item);
    } else {
      groups.Older.push(item);
    }
  }

  // Remove empty groups
  const filtered: { [key: string]: T[] } = {};
  for (const [key, list] of Object.entries(groups)) {
    if (list.length > 0) {
      filtered[key] = list;
    }
  }
  return filtered;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}
