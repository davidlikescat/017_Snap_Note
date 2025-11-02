import { useState, useCallback } from 'react';
import { AIRefinementResult, MemoContext } from '@/types/memo';
import { detectLanguage } from '@/lib/utils';
import { API_ENDPOINTS } from '@/lib/constants';

export interface RefineState {
  isRefining: boolean;
  result: AIRefinementResult | null;
  error: string | null;
  progressMessage: string;
  progressStep: number;
  totalSteps: number;
  logs: string[];
}

export interface RefineControls {
  refineText: (text: string) => Promise<AIRefinementResult | null>;
  reset: () => void;
}

import type { AppLanguage } from '@/stores/useLanguageStore';

const FALLBACK_CONTEXT: MemoContext = 'Memory Archive';
const FALLBACK_TAG: Record<AppLanguage, string> = {
  en: '#memo',
  ko: '#메모',
  ja: '#メモ',
  es: '#nota',
  fr: '#note',
  de: '#notiz',
};

export function useRefine(): [RefineState, RefineControls] {
  const [isRefining, setIsRefining] = useState(false);
  const [result, setResult] = useState<AIRefinementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressStep, setProgressStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const totalSteps = 3;

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const refineText = useCallback(async (text: string): Promise<AIRefinementResult | null> => {
    if (!text || text.trim().length === 0) {
      setError('Text is required');
      return null;
    }

    setIsRefining(true);
    setError(null);
    setResult(null);
    setProgressStep(0);
    setLogs([]);

    try {
      addLog('🎯 [WRITE] Starting refinement...');
      addLog(`📝 [DEBUG] Original text length: ${text.length} chars`);

      const detectedLang = detectLanguage(text);
      addLog(`🌐 [DEBUG] Detected language: ${detectedLang}`);

      setProgressStep(1);
      setProgressMessage('AI 정제 요청 중...');
      addLog('🚀 [DEBUG] Calling /api/refine...');

      const response = await fetch(API_ENDPOINTS.REFINE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        addLog(`❌ [DEBUG] API call failed: ${response.status} ${response.statusText}`);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      addLog('✅ [DEBUG] API call successful!');
      setProgressStep(2);
      setProgressMessage('AI 응답 분석 중...');

      const data = await response.json();
      addLog('📦 [DEBUG] Response received');

      setProgressStep(3);
      setProgressMessage('정제 완료!');

      const refinementResult: AIRefinementResult = {
        refined: data.refined,
        tag: data.tag,
        context: data.context as MemoContext,
        insight: data.insight ?? '',
        language: data.language,
        isAIRefined: data.isFallback ? false : true,
      };

      addLog('🎉 [DEBUG] AI refinement successful!');
      addLog(`📊 [DEBUG] Tag: ${refinementResult.tag}`);
      addLog(`📊 [DEBUG] Context: ${refinementResult.context}`);

      setResult(refinementResult);
      return refinementResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refine text';
      addLog(`❌ [DEBUG] Refinement error: ${errorMessage}`);
      setError(errorMessage);

      addLog('⚠️ [DEBUG] Using FALLBACK result');
      const language = detectLanguage(text);
      const fallbackTag = FALLBACK_TAG[language] ?? FALLBACK_TAG.en;
      const fallbackResult: AIRefinementResult = {
        refined: text.slice(0, 1000),
        tag: fallbackTag,
        context: FALLBACK_CONTEXT,
        insight: '',
        language,
        isAIRefined: false,
      };

      addLog('📋 [DEBUG] Fallback result created');
      setResult(fallbackResult);
      return fallbackResult;
    } finally {
      setIsRefining(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsRefining(false);
    setResult(null);
    setError(null);
    setProgressMessage('');
    setProgressStep(0);
    setLogs([]);
  }, []);

  const state: RefineState = {
    isRefining,
    result,
    error,
    progressMessage,
    progressStep,
    totalSteps,
    logs,
  };

  const controls: RefineControls = {
    refineText,
    reset,
  };

  return [state, controls];
}
