import { useLanguageStore, AppLanguage } from '@/stores/useLanguageStore';
import { useState } from 'react';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();
  const [showMenu, setShowMenu] = useState(false);

  const languageLabels: Record<AppLanguage, string> = {
    en: 'English',
    ko: '한국어',
    ja: '日本語',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-3 rounded-full bg-background border border-border hover:bg-muted transition-colors"
      >
        <Languages className="h-5 w-5" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full mt-2 right-0 w-40 bg-background border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            {(['en', 'ko', 'ja', 'es', 'fr', 'de'] as AppLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors ${
                  language === lang ? 'bg-primary/10 font-semibold' : ''
                }`}
              >
                {languageLabels[lang]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
