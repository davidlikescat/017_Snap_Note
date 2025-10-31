import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppLanguage = 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de';

interface LanguageStore {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-language',
    }
  )
);
