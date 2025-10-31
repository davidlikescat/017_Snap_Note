import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, PenLine, List, Settings, Languages, LogOut, User } from 'lucide-react';
import { useLanguageStore, AppLanguage } from '@/stores/useLanguageStore';
import { useAuth } from '@/contexts/AuthContext';
import { getText } from '@/lib/i18n';
import { toast } from 'sonner';

export default function Home() {
  const { language, setLanguage } = useLanguageStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const languageLabels: Record<AppLanguage, string> = {
    en: 'English',
    ko: '한국어',
    ja: '日本語',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Top Right Buttons */}
      <div className="fixed top-4 right-4 flex gap-2">
        {/* Language Button */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="px-4 py-2 rounded-full bg-background border border-border hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Languages className="h-5 w-5" />
            <span className="text-sm font-medium">Language</span>
          </button>

          {showLanguageMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowLanguageMenu(false)}
              />
              <div className="absolute top-full mt-2 right-0 w-40 bg-background border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                {(['en', 'ko', 'ja', 'es', 'fr', 'de'] as AppLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setShowLanguageMenu(false);
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

        {/* User Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-3 rounded-full bg-background border border-border hover:bg-muted transition-colors flex items-center gap-2"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="h-5 w-5 rounded-full"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute top-full mt-2 right-0 w-56 bg-background border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium truncate">
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleSignOut();
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 border-t border-border text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo and Title */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">{getText('appTitle', language)}</h1>
          <p className="text-lg text-muted-foreground">
            {getText('appSubtitle', language)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-4 pt-8">
          <Link
            to="/record"
            className="group relative overflow-hidden rounded-lg bg-primary p-8 text-primary-foreground transition-all hover:scale-105 hover:shadow-lg"
          >
            <div className="flex flex-col items-center space-y-3">
              <Mic className="h-12 w-12" />
              <span className="text-xl font-semibold">{getText('recordButton', language)}</span>
              <span className="text-sm opacity-90">{getText('recording', language)}</span>
            </div>
          </Link>

          <Link
            to="/write"
            className="group relative overflow-hidden rounded-lg bg-secondary p-8 text-secondary-foreground transition-all hover:scale-105 hover:shadow-lg"
          >
            <div className="flex flex-col items-center space-y-3">
              <PenLine className="h-12 w-12" />
              <span className="text-xl font-semibold">{getText('writeButton', language)}</span>
              <span className="text-sm opacity-90">{getText('writeTitle', language)}</span>
            </div>
          </Link>

          <Link
            to="/memos"
            className="group relative overflow-hidden rounded-lg border-2 border-border p-6 transition-all hover:scale-105 hover:border-primary"
          >
            <div className="flex items-center justify-center space-x-3">
              <List className="h-6 w-6" />
              <span className="text-lg font-semibold">{getText('viewMemosButton', language)}</span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-8 text-sm text-muted-foreground">
          <p>Powered by AI • Privacy-first • Offline-ready</p>
        </div>
      </div>
    </div>
  );
}
