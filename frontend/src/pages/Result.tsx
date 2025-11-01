import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, Plus, X, CheckCircle2, List } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateMemo } from '@/hooks/useMemo';
import { useRefine } from '@/hooks/useRefine';
import { getTagsForLanguage, addCustomTag, CONTEXT_TYPES } from '@/lib/constants';
import { MemoContext } from '@/types/memo';
import type { AppLanguage } from '@/stores/useLanguageStore';
import { getTagStyleClasses, formatTagLabel } from '@/lib/tagStyles';

const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

const TEXT_PAIR_LABELS: Record<AppLanguage, { refined: string; original: string }> = {
  en: { refined: 'AI Refined Text', original: 'Original Memo' },
  ko: { refined: 'AI 정제된 메모', original: '원본 메모' },
  ja: { refined: 'AI整形メモ', original: '元のメモ' },
  es: { refined: 'Nota refinada por IA', original: 'Nota original' },
  fr: { refined: 'Note affinée par IA', original: 'Note originale' },
  de: { refined: 'KI-verfeinerte Notiz', original: 'Ursprüngliche Notiz' },
};

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const createMemo = useCreateMemo();
  const { mutateAsync: createMemoAsync, isPending: isSaving } = createMemo;
  const [refineState, refineControls] = useRefine();

  const [isEditing, setIsEditing] = useState(false);
  const [refined, setRefined] = useState('');  // summary -> refined
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');  // 신규 태그 입력
  const [context, setContext] = useState<MemoContext>('Memory Archive');
  const [insight, setInsight] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [isAIRefined, setIsAIRefined] = useState<boolean | undefined>(undefined);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const autoSaveAttemptedRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string>('');
  const labelPair = TEXT_PAIR_LABELS[language] ?? TEXT_PAIR_LABELS.en;

  // Load data from location state or refine state
  useEffect(() => {
    const state = location.state as any;

    autoSaveAttemptedRef.current = false;
    setAutoSaveState('idle');
    lastSavedSnapshotRef.current = '';

    if (state?.refinedData) {
      // Data already refined (from Write page)
      setRefined(state.refinedData.refined);
      setTags(state.refinedData.tags);
      setContext(state.refinedData.context);
      setInsight(state.refinedData.insight || '');
      setOriginalText(state.originalText || '');
      setLanguage((state.refinedData.language as AppLanguage) || state.language || 'en');
      setIsAIRefined(state.refinedData.isAIRefined);
    } else if (state?.originalText) {
      // Need to refine (from Record page)
      setOriginalText(state.originalText);
      setLanguage(state.language || 'en');

      // Auto-refine
      refineControls.refineText(state.originalText).then((result) => {
        if (result) {
          setRefined(result.refined);
          setTags(result.tags);
          setContext(result.context as MemoContext);
          setInsight(result.insight || '');
          if (result.language) {
            setLanguage(result.language);
          }
          setIsAIRefined(result.isAIRefined);
        }
      });
    } else {
      // No data - redirect to home
      toast.error('No data to display');
      navigate('/');
    }
  }, [location.state]);

  useEffect(() => {
    if (isRefining) {
      return;
    }

    if (autoSaveState === 'saving' || autoSaveState === 'error') {
      return;
    }

    if (autoSaveAttemptedRef.current) {
      return;
    }

    if (refined.trim().length === 0 || tags.length === 0 || originalText.trim().length === 0) {
      return;
    }

    const performAutoSave = async () => {
      autoSaveAttemptedRef.current = true;
      setAutoSaveState('saving');
      try {
        const savedMemo = await createMemoAsync({
          refined: refined.trim(),
          tags,
          context,
          insight: insight.trim() || undefined,
          original_text: originalText,
          language,
        });

        lastSavedSnapshotRef.current = JSON.stringify({
          refined: savedMemo.refined,
          tags: savedMemo.tags,
          context: savedMemo.context,
          insight: savedMemo.insight ?? '',
        });

        setAutoSaveState('saved');
        toast.success('메모가 자동으로 저장되었어요.');
      } catch (err) {
        autoSaveAttemptedRef.current = false;
        setAutoSaveState('error');
        toast.error('자동 저장에 실패했습니다. Save 버튼으로 다시 시도해주세요.');
      }
    };

    performAutoSave();
  }, [
    refined,
    tags,
    context,
    insight,
    originalText,
    language,
    refineState,
    createMemoAsync,
  ]);

  useEffect(() => {
    if (!lastSavedSnapshotRef.current) {
      return;
    }

    if (autoSaveState === 'saving') {
      return;
    }

    const currentSnapshot = JSON.stringify({
      refined: refined.trim(),
      tags,
      context,
      insight: insight.trim(),
    });

    if (currentSnapshot !== lastSavedSnapshotRef.current && autoSaveState === 'saved') {
      autoSaveAttemptedRef.current = false;
      setAutoSaveState('idle');
    }
  }, [refined, tags, context, insight, autoSaveState]);

  const handleSave = async () => {
    if (refined.trim().length === 0) {
      toast.error('Refined text cannot be empty');
      return;
    }

    if (tags.length === 0) {
      toast.error('Please select at least one tag');
      return;
    }

    try {
      autoSaveAttemptedRef.current = true;
      setAutoSaveState('saving');
      await createMemoAsync({
        refined: refined.trim(),
        tags,
        context,
        insight: insight.trim() || undefined,
        original_text: originalText,
        language,
      });

      lastSavedSnapshotRef.current = JSON.stringify({
        refined: refined.trim(),
        tags,
        context,
        insight: insight.trim(),
      });
      setAutoSaveState('saved');
      toast.success('Memo saved successfully!');
      navigate('/memos');
    } catch (error) {
      console.error('Save error:', error);
      setAutoSaveState('error');
      toast.error('Failed to save memo. Please try again.');
    }
  };

  const handleTagToggle = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      if (tags.length < 3) {
        setTags([...tags, tag]);
      } else {
        toast.error('Maximum 3 tags allowed');
      }
    }
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTag.trim();

    if (!trimmedTag) {
      toast.error('Please enter a tag');
      return;
    }

    // # 자동 추가
    const formattedTag = trimmedTag.startsWith('#') ? trimmedTag : `#${trimmedTag}`;

    if (tags.includes(formattedTag)) {
      toast.error('Tag already exists');
      return;
    }

    if (tags.length >= 3) {
      toast.error('Maximum 3 tags allowed');
      return;
    }

    // Add to current memo tags
    setTags([...tags, formattedTag]);

    // Save to custom tags for this language (if not already in default tags)
    if (!availableTags.includes(formattedTag)) {
      addCustomTag(language, formattedTag);
    }

    setNewTag('');
    toast.success(`Tag "${formatTagLabel(formattedTag)}" added`);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const availableTags = getTagsForLanguage(language);
  const isRefining = refineState?.isRefining || false;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold">
            {isRefining ? 'Refining...' : 'AI Refinement'}
          </h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="h-5 w-5" />
            <span>{isEditing ? 'Done' : 'Edit'}</span>
          </button>
        </div>

        {/* Progress Indicator */}
        {isRefining && refineState.progressMessage && (
          <div className="space-y-3">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary">
                  {refineState.progressMessage}
                </span>
                <span className="text-xs text-muted-foreground">
                  {refineState.progressStep} / {refineState.totalSteps}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${(refineState.progressStep / refineState.totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Real-time Logs */}
            {refineState.logs.length > 0 && (
              <div className="bg-muted/50 border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="text-xs font-mono space-y-1">
                  {refineState.logs.map((log, index) => (
                    <div key={index} className="text-muted-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug Status Badge */}
        {!isRefining && isAIRefined !== undefined && (
          <div className={`flex items-center justify-center space-x-2 p-3 rounded-lg border ${
            isAIRefined
              ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400'
          }`}>
            <span className="font-bold text-sm">
              {isAIRefined ? '✅ AI Refined' : '⚠️ Fallback Mode'}
            </span>
            <span className="text-xs opacity-80">
              {isAIRefined
                ? 'AI가 정상적으로 메모를 정제했어요.'
                : 'AI 정제에 실패해 임시 결과를 사용 중입니다.'}
            </span>
          </div>
        )}

        {!isRefining && (
          <p className="text-xs text-muted-foreground text-center">
            Detected language: {LANGUAGE_LABELS[language] ?? LANGUAGE_LABELS.en}
          </p>
        )}

        {!isRefining && autoSaveState === 'saved' && (
          <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>자동 저장이 완료되었어요.</span>
          </div>
        )}

        {!isRefining && autoSaveState === 'error' && (
          <div className="text-sm text-destructive border border-destructive/40 bg-destructive/10 rounded-lg px-3 py-2">
            자동 저장에 실패했습니다. Save 버튼을 눌러 다시 시도해주세요.
          </div>
        )}

        {/* Loading State */}
        {isRefining && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">AI is refining your memo...</p>
          </div>
        )}

        {/* Refined Content */}
        {!isRefining && (
          <div className="space-y-6">
            {/* Refined Text */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                {labelPair.refined}
              </label>
              {isEditing ? (
                <textarea
                  value={refined}
                  onChange={(e) => setRefined(e.target.value)}
                  className="w-full p-4 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={6}
                  maxLength={1000}
                />
              ) : (
                <div className="p-4 rounded-lg bg-muted whitespace-pre-wrap leading-relaxed">
                  {refined}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground">
                Tags {isEditing && <span className="text-xs">({tags.length}/3)</span>}
              </label>

              {/* Selected Tags */}
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const palette = getTagStyleClasses(tag);
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium transition-colors ${palette.badge}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${palette.dot}`} />
                      <span>{formatTagLabel(tag)}</span>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 flex items-center justify-center rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Add Custom Tag */}
              {isEditing && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNewTag()}
                      placeholder="Add custom tag (e.g., 회고, review)"
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                    />
                    <button
                      onClick={handleAddNewTag}
                      disabled={tags.length >= 3}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  {/* Recommended Tags */}
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Or select from recommended tags
                    </summary>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableTags.map((tag) => {
                        const palette = getTagStyleClasses(tag);
                        const isSelected = tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => handleTagToggle(tag)}
                            disabled={isSelected}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              isSelected
                                ? 'opacity-60 cursor-not-allowed border-border bg-muted/60'
                                : 'hover:bg-muted/60 border-border bg-background'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${palette.dot}`} />
                              <span>{formatTagLabel(tag)}</span>
                            </span>
                            {!isSelected && <Plus className="h-3 w-3 text-muted-foreground" />}
                          </button>
                        );
                      })}
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* Context */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                Context
              </label>
              {isEditing ? (
                <select
                  value={context}
                  onChange={(e) => setContext(e.target.value as MemoContext)}
                  className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(CONTEXT_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value[language]}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="p-4 rounded-lg bg-muted">
                  {CONTEXT_TYPES[context][language]}
                </p>
              )}
            </div>

            {/* Insight */}
            {(insight || isEditing) && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">
                  AI Insight
                </label>
                {isEditing ? (
                  <textarea
                    value={insight}
                    onChange={(e) => setInsight(e.target.value)}
                    placeholder="Optional insight or suggestion"
                    className="w-full p-4 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                  />
                ) : (
                  insight && (
                    <div className="p-4 rounded-lg bg-accent/50 border border-accent">
                      <p className="text-sm">💡 {insight}</p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Original Text */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                {labelPair.original}
              </label>
              <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border/60 text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {originalText}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {!isRefining && (
          <div className="flex space-x-4">
            <button
              onClick={autoSaveState === 'saved' ? () => navigate('/memos') : handleSave}
              disabled={
                autoSaveState === 'saved' ? false : (
                  isSaving ||
                  autoSaveState === 'saving' ||
                  refined.trim().length === 0 ||
                  tags.length === 0
                )
              }
              className="flex-1 flex items-center justify-center space-x-2 bg-primary text-primary-foreground py-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {isSaving || autoSaveState === 'saving' ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                  <span>Saving...</span>
                </>
              ) : autoSaveState === 'saved' ? (
                <>
                  <List className="h-5 w-5" />
                  <span>View Memo List</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Memo</span>
                </>
              )}
            </button>
            <Link
              to="/"
              className="flex items-center justify-center px-6 py-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
