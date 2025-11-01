import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle, XCircle, Plus, X, Tag, Settings as SettingsIcon, Plug } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguageStore, type AppLanguage } from '@/stores/useLanguageStore';
import { getCustomTags, removeCustomTag, addCustomTag } from '@/lib/constants';

interface NotionSettings {
  apiKey: string;
  databaseId: string;
  autoSync: boolean;
}

type MenuSection = 'general' | 'integrations';

export default function Settings() {
  const { language } = useLanguageStore();
  const [activeSection, setActiveSection] = useState<MenuSection>('general');

  const [notionSettings, setNotionSettings] = useState<NotionSettings>({
    apiKey: '',
    databaseId: '',
    autoSync: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Tag management
  const [customTags, setCustomTagsState] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState('');

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notionSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotionSettings(parsed);
      } catch (error) {
        console.error('Failed to parse notion settings:', error);
      }
    }
  }, []);

  // Load custom tags when language changes
  useEffect(() => {
    setCustomTagsState(getCustomTags(language));
  }, [language]);

  const handleSave = () => {
    if (!notionSettings.apiKey || !notionSettings.databaseId) {
      toast.error('Please enter both API Key and Database ID');
      return;
    }

    localStorage.setItem('notionSettings', JSON.stringify(notionSettings));
    toast.success('Notion settings saved successfully');
  };

  const handleTest = async () => {
    if (!notionSettings.apiKey || !notionSettings.databaseId) {
      toast.error('Please enter API Key and Database ID first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Use backend API to avoid CORS issues
      const response = await fetch('/api/notion-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: notionSettings.apiKey,
          databaseId: notionSettings.databaseId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult('success');
        toast.success(`Connection successful! Connected to: ${data.database.title}`);
      } else {
        setTestResult('error');
        toast.error(`Connection failed: ${data.error || 'Please check permissions'}`);
        console.error('Notion test error:', data);
      }
    } catch (error) {
      setTestResult('error');
      toast.error('Connection failed: Network error occurred');
      console.error('Notion test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    setNotionSettings({ apiKey: '', databaseId: '', autoSync: false });
    localStorage.removeItem('notionSettings');
    setTestResult(null);
    toast.success('Notion settings have been reset');
  };

  // Tag management handlers
  const handleAddCustomTag = () => {
    const trimmed = newCustomTag.trim();
    if (!trimmed) {
      toast.error('Please enter a tag name');
      return;
    }

    const formatted = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

    if (customTags.includes(formatted)) {
      toast.error('Tag already exists');
      return;
    }

    addCustomTag(language, formatted);
    setCustomTagsState([...customTags, formatted]);
    setNewCustomTag('');
    toast.success(`Tag "${formatted}" added`);
  };

  const handleRemoveCustomTag = (tag: string) => {
    removeCustomTag(language, tag);
    setCustomTagsState(customTags.filter(t => t !== tag));
    toast.success(`Tag "${tag}" removed`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-muted/30 border-r border-border p-4 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link
            to="/"
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Menu */}
        <nav className="space-y-1">
          <button
            onClick={() => setActiveSection('general')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeSection === 'general'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
            <span className="font-medium">General</span>
          </button>
          <button
            onClick={() => setActiveSection('integrations')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeSection === 'integrations'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Plug className="h-5 w-5" />
            <span className="font-medium">Integrations</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* General Settings Section */}
          {activeSection === 'general' && (
            <>
              <div>
                <h2 className="text-2xl font-bold mb-6">General Settings</h2>
              </div>

              {/* Tag Management Section */}
              <div className="space-y-4">
                <div className="p-6 rounded-lg border border-border bg-card space-y-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">Custom Tags</h3>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Add custom tags for the current language. These tags will be available when creating memos.
                  </p>

                  {/* Add New Tag */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Add Custom Tag</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomTag}
                        onChange={(e) => setNewCustomTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                        placeholder="e.g., review, 회고, レビュー"
                        className="flex-1 p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        onClick={handleAddCustomTag}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Tags List */}
                  {customTags.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Your Custom Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {customTags.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                          >
                            <span className="text-sm">{tag}</span>
                            <button
                              onClick={() => handleRemoveCustomTag(tag)}
                              className="hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {customTags.length === 0 && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
                      No custom tags yet. Add your first custom tag above.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Integrations Section */}
          {activeSection === 'integrations' && (
            <>
              <div>
                <h2 className="text-2xl font-bold mb-6">Integrations</h2>
                <p className="text-muted-foreground mb-6">
                  Connect your favorite apps to sync and share your memos.
                </p>
              </div>

              {/* Notion Integration */}
              <div className="space-y-4">
                <div className="p-6 rounded-lg border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                        N
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Notion</h3>
                        <p className="text-sm text-muted-foreground">Sync memos to Notion database</p>
                      </div>
                    </div>
                    {testResult && (
                      <div className="flex items-center gap-2">
                        {testResult === 'success' ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="text-sm text-red-600 dark:text-red-400">Failed</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Notion API Key <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={notionSettings.apiKey}
                        onChange={(e) =>
                          setNotionSettings({ ...notionSettings, apiKey: e.target.value })
                        }
                        placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full p-3 pr-12 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-block"
                    >
                      → Create Notion Integration
                    </a>
                  </div>

                  {/* Database ID Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Database ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={notionSettings.databaseId}
                      onChange={(e) =>
                        setNotionSettings({ ...notionSettings, databaseId: e.target.value })
                      }
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">
                      Extract from Notion database URL: <br />
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        https://notion.so/[workspace]/[database-id]?v=...
                      </code>
                    </p>
                  </div>

                  {/* Auto Sync Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold">Auto Sync to Notion</label>
                      <p className="text-xs text-muted-foreground">
                        Automatically send memos to Notion when saved
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setNotionSettings({ ...notionSettings, autoSync: !notionSettings.autoSync })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notionSettings.autoSync ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notionSettings.autoSync ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleTest}
                      disabled={isTesting}
                      className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {isTesting ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-semibold text-sm">📝 Setup Instructions:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>
                        Create a new Integration at{' '}
                        <a
                          href="https://www.notion.so/my-integrations"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Notion Integrations
                        </a>
                      </li>
                      <li>Copy the API Key from the created Integration</li>
                      <li>Create a Notion Database to store your memos</li>
                      <li>Connect the Integration in Database settings (Connections)</li>
                      <li>Copy the Database ID from the Database URL</li>
                      <li>Enter API Key and Database ID above, then save</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Evernote Integration (Coming Soon) */}
              <div className="space-y-4">
                <div className="p-6 rounded-lg border border-border bg-card space-y-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-600 text-white flex items-center justify-center font-bold">
                        E
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Evernote</h3>
                        <p className="text-sm text-muted-foreground">Sync memos to Evernote</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Evernote integration will be available in a future update.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
