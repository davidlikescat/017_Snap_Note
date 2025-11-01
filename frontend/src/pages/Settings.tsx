import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle, XCircle, Settings as SettingsIcon, Plug, Search, Download, Upload, Trash2, FileText, Database } from 'lucide-react';
import { toast } from 'sonner';
import { useMemos, useBulkDeleteMemos } from '@/hooks/useMemo';

interface NotionSettings {
  apiKey: string;
  databaseId: string;
  autoSync: boolean;
}

type MenuSection = 'general' | 'integrations';
type IntegrationView = 'browse' | 'notion' | 'evernote' | 'discord';

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync memos to Notion database',
    icon: 'N',
    iconBg: 'bg-black',
    available: true,
  },
  {
    id: 'evernote',
    name: 'Evernote',
    description: 'Sync memos to Evernote',
    icon: 'E',
    iconBg: 'bg-green-600',
    available: false,
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Send memos to Discord channel',
    icon: 'D',
    iconBg: 'bg-indigo-600',
    available: false,
  },
] as const;

export default function Settings() {
  const [activeSection, setActiveSection] = useState<MenuSection>('general');
  const [integrationView, setIntegrationView] = useState<IntegrationView>('browse');

  const [notionSettings, setNotionSettings] = useState<NotionSettings>({
    apiKey: '',
    databaseId: '',
    autoSync: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // General settings state
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch all memos for export/delete
  const { data: allMemos = [] } = useMemos({});
  const bulkDeleteMemos = useBulkDeleteMemos();

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

  // Export handlers
  const handleExportJSON = () => {
    if (allMemos.length === 0) {
      toast.error('No memos to export');
      return;
    }

    setIsExporting(true);
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        memosCount: allMemos.length,
        memos: allMemos,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snap-note-memos-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allMemos.length} memos as JSON`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export memos');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (allMemos.length === 0) {
      toast.error('No memos to export');
      return;
    }

    setIsExporting(true);
    try {
      // CSV headers
      const headers = ['ID', 'Created At', 'Language', 'Context', 'Tags', 'Original Text', 'Refined Text', 'Insight'];

      // CSV rows
      const rows = allMemos.map(memo => [
        memo.id,
        new Date(memo.created_at).toISOString(),
        memo.language,
        memo.context,
        memo.tags.join('; '),
        `"${memo.original_text.replace(/"/g, '""')}"`,
        `"${memo.refined.replace(/"/g, '""')}"`,
        memo.insight ? `"${memo.insight.replace(/"/g, '""')}"` : '',
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snap-note-memos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allMemos.length} memos as CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export memos');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    if (allMemos.length === 0) {
      toast.error('No memos to export');
      return;
    }

    setIsExporting(true);
    try {
      let markdown = `# SNAP NOTE - Exported Memos\n\n`;
      markdown += `**Export Date:** ${new Date().toLocaleString()}\n`;
      markdown += `**Total Memos:** ${allMemos.length}\n\n`;
      markdown += `---\n\n`;

      allMemos.forEach((memo, index) => {
        markdown += `## Memo ${index + 1}\n\n`;
        markdown += `- **Date:** ${new Date(memo.created_at).toLocaleString()}\n`;
        markdown += `- **Language:** ${memo.language.toUpperCase()}\n`;
        markdown += `- **Context:** ${memo.context}\n`;
        markdown += `- **Tags:** ${memo.tags.join(', ')}\n\n`;
        markdown += `### AI Refined\n\n${memo.refined}\n\n`;
        markdown += `### Original Text\n\n${memo.original_text}\n\n`;
        if (memo.insight) {
          markdown += `### Insight\n\n${memo.insight}\n\n`;
        }
        markdown += `---\n\n`;
      });

      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snap-note-memos-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allMemos.length} memos as Markdown`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export memos');
    } finally {
      setIsExporting(false);
    }
  };

  // Import handler
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.memos || !Array.isArray(data.memos)) {
          toast.error('Invalid JSON format');
          return;
        }

        toast.info(`Found ${data.memos.length} memos. Import feature will be available soon.`);
        // TODO: Implement actual import to Supabase
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Delete all data handler
  const handleDeleteAllData = async () => {
    if (allMemos.length === 0) {
      toast.error('No data to delete');
      return;
    }

    try {
      const memoIds = allMemos.map(m => m.id);
      await bulkDeleteMemos.mutateAsync({
        ids: memoIds,
        onProgress: () => {},
      });

      toast.success(`Deleted all ${allMemos.length} memos`);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete all data');
    }
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
            onClick={() => {
              setActiveSection('general');
            }}
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
            onClick={() => {
              setActiveSection('integrations');
              setIntegrationView('browse');
            }}
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
                <h2 className="text-2xl font-bold mb-2">General Settings</h2>
                <p className="text-muted-foreground">
                  Manage your workspace data and preferences
                </p>
              </div>

              {/* Workspace Content Export */}
              <div className="space-y-4">
                <div className="p-6 rounded-lg border border-border bg-card space-y-4">
                  <div className="flex items-start gap-3">
                    <Database className="h-6 w-6 text-primary mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">Workspace Content</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export all your memos to various formats. You can use exported data as backup or for data portability.
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div>
                            <p className="text-sm font-medium">Total Memos</p>
                            <p className="text-2xl font-bold text-primary">{allMemos.length}</p>
                          </div>
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={handleExportJSON}
                            disabled={isExporting || allMemos.length === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Download className="h-4 w-4" />
                            <span>Export as JSON</span>
                          </button>
                          <button
                            onClick={handleExportCSV}
                            disabled={isExporting || allMemos.length === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Download className="h-4 w-4" />
                            <span>Export as CSV</span>
                          </button>
                          <button
                            onClick={handleExportMarkdown}
                            disabled={isExporting || allMemos.length === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Download className="h-4 w-4" />
                            <span>Export as Markdown</span>
                          </button>
                        </div>

                        <div className="pt-2 text-xs text-muted-foreground">
                          💡 Exported files include all memo data: original text, AI refined text, tags, context, language, and timestamps.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Import Data */}
                <div className="p-6 rounded-lg border border-border bg-card space-y-4">
                  <div className="flex items-start gap-3">
                    <Upload className="h-6 w-6 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">Import Data</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Import previously exported memos from JSON file.
                      </p>

                      <div className="space-y-3">
                        <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer w-fit">
                          <Upload className="h-4 w-4" />
                          <span>Choose JSON File</span>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportJSON}
                            className="hidden"
                          />
                        </label>

                        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                          ⚠️ Import feature is coming soon. Currently you can only validate your exported JSON files.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete All Data */}
                <div className="p-6 rounded-lg border border-destructive/50 bg-destructive/5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Trash2 className="h-6 w-6 text-destructive mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 text-destructive">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete all memos from your workspace. This action cannot be undone.
                      </p>

                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={allMemos.length === 0}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete All Data</span>
                        </button>
                      ) : (
                        <div className="space-y-3 p-4 rounded-lg bg-background border border-destructive">
                          <p className="text-sm font-semibold text-destructive">
                            ⚠️ Are you sure? This will permanently delete all {allMemos.length} memos!
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleDeleteAllData}
                              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                            >
                              Yes, Delete Everything
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Integrations Section */}
          {activeSection === 'integrations' && (
            <>
              {/* Browse Integrations */}
              {integrationView === 'browse' && (
                <>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Integrations</h2>
                    <p className="text-muted-foreground">
                      Connect your favorite apps to sync and share your memos.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search integrations..."
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Integration Cards */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Available Integrations</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {AVAILABLE_INTEGRATIONS.map((integration) => (
                        <div
                          key={integration.id}
                          className={`p-6 rounded-lg border border-border bg-card space-y-4 ${
                            !integration.available && 'opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg ${integration.iconBg} text-white flex items-center justify-center font-bold text-xl`}>
                                {integration.icon}
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold">{integration.name}</h4>
                                <p className="text-sm text-muted-foreground">{integration.description}</p>
                              </div>
                            </div>
                          </div>

                          {integration.available ? (
                            <button
                              onClick={() => setIntegrationView(integration.id as IntegrationView)}
                              className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              Configure
                            </button>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">
                                Coming Soon
                              </span>
                              <button
                                disabled
                                className="py-2 px-4 rounded-lg border border-border text-muted-foreground cursor-not-allowed"
                              >
                                Configure
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Notion Configuration */}
              {integrationView === 'notion' && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      onClick={() => setIntegrationView('browse')}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      <span>Back to Integrations</span>
                    </button>
                  </div>

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
                </>
              )}

              {/* Evernote Configuration (Placeholder) */}
              {integrationView === 'evernote' && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      onClick={() => setIntegrationView('browse')}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      <span>Back to Integrations</span>
                    </button>
                  </div>

                  <div className="p-12 rounded-lg border border-border bg-card text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-lg bg-green-600 text-white flex items-center justify-center font-bold text-3xl">
                      E
                    </div>
                    <h3 className="text-2xl font-bold">Evernote Integration</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Evernote integration will be available in a future update. Stay tuned!
                    </p>
                    <span className="inline-block px-4 py-2 rounded-full bg-muted text-sm font-medium">
                      Coming Soon
                    </span>
                  </div>
                </>
              )}

              {/* Discord Configuration (Placeholder) */}
              {integrationView === 'discord' && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      onClick={() => setIntegrationView('browse')}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      <span>Back to Integrations</span>
                    </button>
                  </div>

                  <div className="p-12 rounded-lg border border-border bg-card text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-3xl">
                      D
                    </div>
                    <h3 className="text-2xl font-bold">Discord Integration</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Discord integration will be available in a future update. Stay tuned!
                    </p>
                    <span className="inline-block px-4 py-2 rounded-full bg-muted text-sm font-medium">
                      Coming Soon
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
