import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AppLanguage } from '@/stores/useLanguageStore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

const LANGUAGE_REGEXES: Array<{ lang: AppLanguage; regex: RegExp }> = [
  { lang: 'ko', regex: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/ }, // Hangul
  { lang: 'ja', regex: /[\u3040-\u30FF\u31F0-\u31FF]/ }, // Hiragana + Katakana
  { lang: 'es', regex: /[áéíóúñüÁÉÍÓÚÑÜ]/ },
  { lang: 'fr', regex: /[àâçéèêëîïôûùüÿœæÀÂÇÉÈÊËÎÏÔÛÙÜŸŒÆ]/ },
  { lang: 'de', regex: /[äöüßÄÖÜẞ]/ },
];

export function detectLanguage(text: string): AppLanguage {
  if (!text) return 'en';

  for (const { lang, regex } of LANGUAGE_REGEXES) {
    if (regex.test(text)) {
      return lang;
    }
  }

  // Basic heuristic: if we have a significant portion of CJK unified ideographs,
  // prefer Japanese when not already caught.
  const cjkRegex = /[\u4E00-\u9FFF]/;
  if (cjkRegex.test(text)) {
    return 'ja';
  }

  return 'en';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function validateTags(tags: string[]): boolean {
  if (tags.length < 1 || tags.length > 3) return false;
  return tags.every(tag => tag.startsWith('#') && tag.length > 1);
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
