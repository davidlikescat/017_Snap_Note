import { useState, useMemo as useReactMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Loader2, CheckSquare, Square, Trash2, FolderInput, Share2, FileText, Plus, Mic, Edit3, X, Pencil } from 'lucide-react';
import { useMemos, useBulkDeleteMemos, useBulkUpdateContext, useUpdateMemo } from '@/hooks/useMemo';
import { formatDate } from '@/lib/utils';
import { getTagsForLanguage, addCustomTag, removeCustomTag, CONTEXT_TYPES } from '@/lib/constants';
import { MemoContext } from '@/types/memo';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { toast } from 'sonner';
import { sendMemosToNotion, getNotionSettings } from '@/lib/notion';
import { getTagStyleClasses, formatTagLabel } from '@/lib/tagStyles';

const LANGUAGE_OPTIONS: Array<{ value: '' | 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de'; label: string }> = [
  { value: '', label: 'All' },
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '日本語' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

const LANGUAGE_FLAGS: Record<'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de', string> = {
  en: '🇺🇸',
  ko: '🇰🇷',
  ja: '🇯🇵',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
};

const MEMO_TEXT_LABELS: Record<'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de', { refined: string; original: string }> = {
  en: { refined: 'AI Refined', original: 'Original' },
  ko: { refined: 'AI 정제본', original: '원본' },
  ja: { refined: 'AI整理', original: '元のメモ' },
  es: { refined: 'IA Refinado', original: 'Original' },
  fr: { refined: 'Texte IA', original: 'Texte original' },
  de: { refined: 'KI-Version', original: 'Original' },
};

export default function MemoList() {
  const navigate = useNavigate();
  const { language: globalLanguage } = useLanguageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContext, setSelectedContext] = useState<MemoContext | ''>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de' | ''>('');

  // Bulk selection states
  const [selectedMemos, setSelectedMemos] = useState<string[]>([]);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetContext, setTargetContext] = useState<MemoContext | ''>('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ completed: number; total: number } | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Editing state
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Tag management state
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  // Fetch filter params
  const filters = useReactMemo(() => {
    const f: any = {};
    if (selectedTags.length > 0) f.tags = selectedTags;
    if (selectedContext) f.context = selectedContext;
    if (selectedLanguage) f.language = selectedLanguage;
    if (searchQuery.trim()) f.search = searchQuery.trim();
    return f;
  }, [selectedTags, selectedContext, selectedLanguage, searchQuery]);

  const { data: memos = [], isLoading, isError, error } = useMemos(filters);

  // Bulk operation hooks
  const bulkDeleteMemos = useBulkDeleteMemos();
  const bulkUpdateContext = useBulkUpdateContext();
  const updateMemo = useUpdateMemo();
  const isBulkDeleting = bulkDeleteMemos.isPending;

  // Editing handlers
  const handleMemoClick = (memoId: string, currentRefined: string) => {
    setEditingMemoId(memoId);
    setEditingText(currentRefined);
  };

  const handleSaveEdit = async (memoId: string) => {
    if (!editingText.trim()) {
      toast.error('Please enter memo content');
      return;
    }

    try {
      await updateMemo.mutateAsync({
        id: memoId,
        refined: editingText.trim(),
      });
      setEditingMemoId(null);
      setEditingText('');
      toast.success('Memo updated successfully');
    } catch (error) {
      toast.error('Failed to update memo');
      console.error('Update error:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMemoId(null);
    setEditingText('');
  };

  // Handle card click (toggle checkbox)
  const handleCardClick = (e: React.MouseEvent, memoId: string) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('button') ||
      target.closest('[data-editable]')
    ) {
      return;
    }

    toggleMemoSelection(memoId);
  };

  // Selection handlers
  const toggleMemoSelection = (memoId: string) => {
    setSelectedMemos((prev) =>
      prev.includes(memoId) ? prev.filter((id) => id !== memoId) : [...prev, memoId]
    );
  };

  const selectAll = () => {
    setSelectedMemos(memos.map((m) => m.id));
  };

  const deselectAll = () => {
    setSelectedMemos([]);
  };

  // Bulk operation handlers
  const handleBulkDelete = async () => {
    if (selectedMemos.length === 0) return;

    const confirmMessage = `Delete ${selectedMemos.length} memo(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      setBulkDeleteProgress({ completed: 0, total: selectedMemos.length });
      await bulkDeleteMemos.mutateAsync({
        ids: selectedMemos,
        onProgress: ({ completed, total }) => setBulkDeleteProgress({ completed, total }),
      });
      toast.success(`Deleted ${selectedMemos.length} memo(s)`);
      setSelectedMemos([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(`Failed to delete memos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBulkDeleteProgress(null);
    }
  };

  const handleBulkMove = async () => {
    if (!targetContext || selectedMemos.length === 0) return;

    try {
      await bulkUpdateContext.mutateAsync({
        ids: selectedMemos,
        context: targetContext as MemoContext,
      });
      toast.success(`Moved ${selectedMemos.length} memo(s) to ${targetContext}`);
      setSelectedMemos([]);
      setShowMoveDialog(false);
      setTargetContext('');
    } catch (error) {
      toast.error('Failed to move memos');
      console.error('Move error:', error);
    }
  };

  const handleSystemShare = async () => {
    if (selectedMemos.length === 0) return;

    const selectedMemoData = memos.filter((m) => selectedMemos.includes(m.id));
    const shareText = selectedMemoData
      .map((m) => {
        const memoLabels =
          MEMO_TEXT_LABELS[m.language as keyof typeof MEMO_TEXT_LABELS] ?? MEMO_TEXT_LABELS.en;
        return `${memoLabels.refined}:\n${m.refined}\n\n${memoLabels.original}:\n${m.original_text}\n\nTags: ${m.tags
          .map((tag) => formatTagLabel(tag))
          .join(', ')}\nContext: ${m.context}`;
      })
      .join('\n\n---\n\n');

    setShowShareMenu(false);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Memos',
          text: shareText,
        });
        toast.success('Shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('Copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy');
        console.error('Copy error:', error);
      }
    }
  };

  const handleNotionShare = async () => {
    if (selectedMemos.length === 0) return;

    const notionSettings = getNotionSettings();
    if (!notionSettings) {
      toast.error('Notion settings required');
      setTimeout(() => {
        window.location.href = '/settings';
      }, 1500);
      return;
    }

    setShowShareMenu(false);

    const selectedMemoData = memos.filter((m) => selectedMemos.includes(m.id));

    try {
      await sendMemosToNotion(selectedMemoData);
      toast.success(`${selectedMemos.length} memo(s) sent to Notion successfully`);
      setSelectedMemos([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send to Notion');
      console.error('Notion share error:', error);
    }
  };

  const handleExportToDocument = () => {
    if (selectedMemos.length === 0) return;

    const selectedMemoData = memos.filter((m) => selectedMemos.includes(m.id));
    const markdown = `# My Memos Export\n\n${selectedMemoData
      .map((m) => {
        const memoLabels =
          MEMO_TEXT_LABELS[m.language as keyof typeof MEMO_TEXT_LABELS] ?? MEMO_TEXT_LABELS.en;
        return `## ${m.refined}\n\n**Tags:** ${m.tags
          .map((tag) => formatTagLabel(tag))
          .join(', ')}\n**Context:** ${m.context}\n**Date:** ${formatDate(
          m.created_at
        )}\n\n${m.insight ? `**Insight:** ${m.insight}\n\n` : ''}**${memoLabels.original}:**\n${
          m.original_text
        }\n\n**${memoLabels.refined}:**\n${m.refined}\n\n---\n`;
      })
      .join('\n')}`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memos-export-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Exported successfully');
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Tag management handlers
  const handleAddNewTag = () => {
    const trimmed = newTagValue.trim();
    if (!trimmed) {
      toast.error('Please enter a tag name');
      return;
    }

    const formatted = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

    // Check if tag already exists
    const existingTags = getTagsForLanguage(globalLanguage);
    if (existingTags.includes(formatted)) {
      toast.error('Tag already exists');
      return;
    }

    addCustomTag(globalLanguage, formatted);
    setNewTagValue('');
    setShowAddTag(false);
    toast.success(`Tag "${formatted}" added`);

    // Reload page to show new tag
    window.location.reload();
  };

  const handleStartEditTag = (tag: string) => {
    setEditingTag(tag);
    setEditingTagValue(tag.startsWith('#') ? tag.slice(1) : tag);
  };

  const handleSaveEditTag = () => {
    const trimmed = editingTagValue.trim();
    if (!trimmed || !editingTag) return;

    const formatted = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

    if (formatted === editingTag) {
      setEditingTag(null);
      return;
    }

    // Remove old tag and add new tag
    removeCustomTag(globalLanguage, editingTag);
    addCustomTag(globalLanguage, formatted);

    setEditingTag(null);
    setEditingTagValue('');
    toast.success(`Tag updated to "${formatted}"`);

    // Reload page
    window.location.reload();
  };

  const handleDeleteTag = (tag: string) => {
    if (confirm(`Delete tag "${tag}"?`)) {
      removeCustomTag(globalLanguage, tag);
      toast.success(`Tag "${tag}" deleted`);

      // Reload page
      window.location.reload();
    }
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedContext('');
    setSelectedLanguage('');
    setSearchQuery('');
  };

  const hasFilters =
    selectedTags.length > 0 ||
    selectedContext !== '' ||
    selectedLanguage !== '' ||
    searchQuery.trim() !== '';

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold">My Memos</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 transition-colors ${
              showFilters || hasFilters
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Filter className="h-5 w-5" />
            {hasFilters && (
              <span className="h-2 w-2 rounded-full bg-primary absolute top-0 right-0" />
            )}
          </button>
        </div>

        {/* Search Bar with Create Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memos..."
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Create Memo Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Memo</span>
            </button>

            {showCreateMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowCreateMenu(false)}
                />
                <div className="absolute top-full mt-2 right-0 w-56 bg-background border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      navigate('/record');
                      setShowCreateMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                  >
                    <Mic className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Voice Recording</div>
                      <div className="text-xs text-muted-foreground">Record audio memo</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/write');
                      setShowCreateMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-t border-border"
                  >
                    <Edit3 className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Text Input</div>
                      <div className="text-xs text-muted-foreground">Type or upload file</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters (collapsible) */}
        {showFilters && (
          <div className="p-4 rounded-lg border border-border bg-muted/50 space-y-4 animate-in slide-in-from-top">
            {/* Language Filter */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Language</label>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value || 'all'}
                    onClick={() => setSelectedLanguage(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedLanguage === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border border-border hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">
                  Filter by Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </label>
                <button
                  onClick={() => setShowAddTag(!showAddTag)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Tag</span>
                </button>
              </div>

              {/* Add New Tag Input */}
              {showAddTag && (
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNewTag()}
                    placeholder="New tag name..."
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  <button
                    onClick={handleAddNewTag}
                    className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTag(false);
                      setNewTagValue('');
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {getTagsForLanguage(globalLanguage).map((tag) => (
                  <div
                    key={tag}
                    className="group relative"
                  >
                    {editingTag === tag ? (
                      // Edit mode
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingTagValue}
                          onChange={(e) => setEditingTagValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveEditTag();
                            if (e.key === 'Escape') setEditingTag(null);
                          }}
                          onBlur={handleSaveEditTag}
                          className="px-3 py-1 text-sm rounded-full border border-primary bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          style={{ width: `${Math.max(editingTagValue.length * 8 + 20, 60)}px` }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors bg-background border border-border hover:bg-muted">
                        <button
                          onClick={() => handleTagToggle(tag)}
                          className={`${
                            selectedTags.includes(tag) ? 'font-semibold text-primary' : ''
                          }`}
                        >
                          {tag}
                        </button>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditTag(tag);
                            }}
                            className="p-0.5 hover:bg-muted-foreground/10 rounded"
                            title="Edit tag"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTag(tag);
                            }}
                            className="p-0.5 hover:bg-destructive/10 hover:text-destructive rounded"
                            title="Delete tag"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Context Filter */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Filter by Context</label>
              <select
                value={selectedContext}
                onChange={(e) => setSelectedContext(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Contexts</option>
                {Object.entries(CONTEXT_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.en} / {value.ko}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading memos...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive">
            <p className="font-semibold">Error loading memos</p>
            <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        )}

        {/* Memos List */}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {memos.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <p className="text-muted-foreground">
                  {hasFilters ? 'No memos match your filters' : 'No memos yet'}
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Create Your First Memo
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {memos.length} {memos.length === 1 ? 'memo' : 'memos'} found
                    {selectedMemos.length > 0 && ` (${selectedMemos.length} selected)`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      Select All
                    </button>
                    {selectedMemos.length > 0 && (
                      <button
                        onClick={deselectAll}
                        className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        Deselect All
                      </button>
                    )}
                  </div>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedMemos.length > 0 && (
                  <div className="flex gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-in slide-in-from-top">
                    <button
                      onClick={() => setShowMoveDialog(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors"
                    >
                      <FolderInput className="h-4 w-4" />
                      <span className="text-sm font-medium">Move</span>
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Share</span>
                      </button>

                      {showShareMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowShareMenu(false)}
                          />
                          <div className="absolute top-full mt-2 right-0 w-48 bg-background border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                            <button
                              onClick={handleSystemShare}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                            >
                              <Share2 className="h-4 w-4" />
                              <span>System Share</span>
                            </button>
                            <button
                              onClick={handleNotionShare}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 border-t border-border"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
                              </svg>
                              <span>Send to Notion</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={handleExportToDocument}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Export</span>
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Delete</span>
                    </button>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {memos.map((memo) => {
                    const memoLabels =
                      MEMO_TEXT_LABELS[memo.language as keyof typeof MEMO_TEXT_LABELS] ??
                      MEMO_TEXT_LABELS.en;

                    return (
                      <div
                        key={memo.id}
                        onClick={(e) => handleCardClick(e, memo.id)}
                        className="p-5 rounded-xl border border-border/80 hover:border-primary transition-colors bg-card shadow-sm cursor-pointer"
                      >
                        <div className="flex gap-4">
                          {/* Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMemoSelection(memo.id);
                            }}
                            className="flex-shrink-0 mt-2"
                          >
                            {selectedMemos.includes(memo.id) ? (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>

                          {/* Memo Content */}
                          <div className="flex-1 space-y-4">
                            {/* Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap gap-2">
                                {memo.tags.map((tag) => {
                                  const palette = getTagStyleClasses(tag);
                                  return (
                                    <span
                                      key={tag}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${palette.badge}`}
                                    >
                                      <span className={`h-2 w-2 rounded-full ${palette.dot}`} />
                                      <span>{formatTagLabel(tag)}</span>
                                    </span>
                                  );
                                })}
                              </div>
                              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                                  {(memo.language === 'ko'
                                    ? CONTEXT_TYPES[memo.context as MemoContext]?.ko
                                    : CONTEXT_TYPES[memo.context as MemoContext]?.en) || memo.context}
                                  <span className="text-base leading-none">
                                    {LANGUAGE_FLAGS[memo.language as keyof typeof LANGUAGE_FLAGS] ?? '🌐'}
                                  </span>
                                </span>
                                <span>{formatDate(memo.created_at)}</span>
                              </div>
                            </div>

                            {/* Summary - Editable */}
                            {editingMemoId === memo.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onBlur={() => handleSaveEdit(memo.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      handleCancelEdit();
                                    }
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveEdit(memo.id);
                                    }
                                  }}
                                  autoFocus
                                  className="w-full p-3 rounded-lg border border-primary bg-background focus:outline-none focus:ring-2 focus:ring-ring font-medium resize-none"
                                  rows={5}
                                />
                                <div className="space-y-2">
                                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40 px-3 py-1 rounded-full">
                                    {memoLabels.original}
                                  </div>
                                  <p className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {memo.original_text}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div
                                  data-editable
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMemoClick(memo.id, memo.refined);
                                  }}
                                  className="cursor-pointer space-y-2"
                                >
                                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 px-3 py-1 rounded-full">
                                    {memoLabels.refined}
                                  </div>
                                  <p className="rounded-lg border border-border/60 bg-background/60 p-3 font-medium hover:text-primary transition-colors leading-relaxed whitespace-pre-wrap">
                                    {memo.refined}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40 px-3 py-1 rounded-full">
                                    {memoLabels.original}
                                  </div>
                                  <p className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {memo.original_text}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Insight (if exists) */}
                            {memo.insight && (
                              <div className="pt-3 border-t border-border/40">
                                <p className="text-xs text-muted-foreground italic flex items-start gap-2">
                                  <span className="text-base">💡</span>
                                  <span>{memo.insight}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Move Dialog */}
        {showMoveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg p-6 max-w-md w-full space-y-4 border border-border">
              <h2 className="text-xl font-bold">Move Memos</h2>
              <p className="text-sm text-muted-foreground">
                Select a new context for {selectedMemos.length} selected memo(s)
              </p>
              <select
                value={targetContext}
                onChange={(e) => setTargetContext(e.target.value as MemoContext | '')}
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select Context</option>
                {Object.entries(CONTEXT_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.en} / {value.ko}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowMoveDialog(false);
                    setTargetContext('');
                  }}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkMove}
                  disabled={!targetContext}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Move
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
