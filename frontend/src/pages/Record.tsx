import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mic, Square, Pause, Play, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { useRecorder } from '@/hooks/useRecorder';
import { useTranscribe } from '@/hooks/useTranscribe';
import { useRefine } from '@/hooks/useRefine';
import { useCreateMemo } from '@/hooks/useMemo';
import { formatDuration } from '@/lib/utils';
import { MemoContext } from '@/types/memo';
import type { AppLanguage } from '@/stores/useLanguageStore';

const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

export default function Record() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Recording hook
  const [recorderState, recorderControls] = useRecorder();
  const { isRecording, isPaused, duration, error: recorderError } = recorderState;
  const { startRecording, stopRecording, pauseRecording, resumeRecording } = recorderControls;

  // Transcription hook
  const [transcribeState, transcribeControls] = useTranscribe();
  const { transcript, interimTranscript, error: transcribeError, language } = transcribeState;
  const { startListening, stopListening, setLanguage } = transcribeControls;

  // Refinement hook
  const [refineState, refineControls] = useRefine();

  const createMemo = useCreateMemo();

  // Handle recording errors
  useEffect(() => {
    if (recorderError) {
      toast.error(recorderError);
    }
  }, [recorderError]);

  // Handle transcription errors
  useEffect(() => {
    if (transcribeError) {
      toast.error(transcribeError);
    }
  }, [transcribeError]);

  // Start both recording and transcription
  const handleStartRecording = async () => {
    await startRecording();
    startListening();
  };

  // Stop both recording and transcription, auto-refine and save
  const handleStopRecording = async () => {
    stopRecording();
    stopListening();

    // Wait a bit for audioBlob to be set
    setTimeout(async () => {
      if (transcript.trim().length === 0) {
        toast.error('No speech detected. Please try again.');
        return;
      }

      setIsSaving(true);
      console.log('🎙️ [DEBUG] Recording stopped, starting auto-save...');

      try {
        // Step 1: Refine with AI
        console.log('🤖 [DEBUG] Refining text with AI...');
        const refinedData = await refineControls.refineText(transcript.trim());

        if (!refinedData) {
          toast.error('Failed to refine text. Please try again.');
          setIsSaving(false);
          return;
        }

        console.log('✅ [DEBUG] Refinement complete:', refinedData);

        // Step 2: Save to database
        console.log('💾 [DEBUG] Saving to database...');
        await createMemo.mutateAsync({
          refined: refinedData.refined,
          tags: refinedData.tags,
          context: refinedData.context as MemoContext,
          insight: refinedData.insight || undefined,
          original_text: transcript.trim(),
          language: language,
        });

        console.log('✅ [DEBUG] Memo saved successfully!');
        toast.success('Memo saved successfully!');

        // Step 3: Navigate to memos list
        navigate('/memos');
      } catch (error) {
        console.error('❌ [DEBUG] Save failed:', error);
        toast.error('Failed to save memo. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
      startListening();
    } else {
      pauseRecording();
      stopListening();
    }
  };

  const handleLanguageChange = (newLang: AppLanguage) => {
    setLanguage(newLang);
    setShowLanguageMenu(false);
    toast.success(`Language changed to ${LANGUAGE_LABELS[newLang]}`);

    // Restart recognition if currently recording
    if (isRecording && !isPaused) {
      stopListening();
      setTimeout(() => {
        startListening();
      }, 100);
    }
  };

  const displayText = interimTranscript || transcript || '';

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
          <h1 className="text-2xl font-bold">Voice Recording</h1>
          <div className="w-20" />
        </div>

        {/* Recording Interface */}
        <div className="flex flex-col items-center justify-center space-y-8 py-12">
          {/* Status */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {isSaving
                ? 'Saving memo...'
                : isRecording
                ? isPaused
                  ? 'Paused'
                  : 'Recording...'
                : 'Ready to record'}
            </p>
            <p className="text-4xl font-mono tabular-nums">{formatDuration(duration * 1000)}</p>

            {/* Language Selector */}
            <div className="flex items-center justify-center gap-2">
              <p className="text-xs text-muted-foreground">
                Language: {LANGUAGE_LABELS[language] ?? 'English'}
              </p>
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  disabled={isSaving}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Change Language"
                >
                  <Languages className="h-4 w-4" />
                </button>

                {showLanguageMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowLanguageMenu(false)}
                    />
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-32 bg-background border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                      {(['en', 'ko', 'ja', 'es', 'fr', 'de'] as AppLanguage[]).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageChange(lang)}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-muted transition-colors ${
                            language === lang ? 'bg-primary/10 font-semibold' : ''
                          }`}
                        >
                          {LANGUAGE_LABELS[lang]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Recording Button */}
          <div className="relative">
            {isSaving ? (
              <div className="h-32 w-32 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={(isRecording && isPaused) || isSaving}
                className={`relative h-32 w-32 rounded-full transition-all shadow-lg ${
                  isRecording
                    ? isPaused
                      ? 'bg-muted cursor-not-allowed'
                      : 'bg-destructive hover:bg-destructive/90 recording-pulse'
                    : 'bg-primary hover:bg-primary/90 hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <Square className="h-12 w-12 text-primary-foreground mx-auto" />
                ) : (
                  <Mic className="h-12 w-12 text-primary-foreground mx-auto" />
                )}
              </button>
            )}

            {/* Pause/Resume Button (when recording) */}
            {isRecording && (
              <button
                onClick={handlePauseResume}
                className="absolute -bottom-16 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-secondary hover:bg-secondary/90 flex items-center justify-center shadow-md transition-all"
              >
                {isPaused ? (
                  <Play className="h-6 w-6 text-secondary-foreground ml-0.5" />
                ) : (
                  <Pause className="h-6 w-6 text-secondary-foreground" />
                )}
              </button>
            )}
          </div>

          {/* Transcription Display */}
          {displayText && (
            <div className="w-full mt-8 p-6 rounded-lg border border-border bg-muted/50 max-h-60 overflow-y-auto">
              <p className="text-sm leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-muted-foreground italic">
                    {interimTranscript}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground max-w-md">
            <p>
              {isRecording
                ? isPaused
                  ? 'Tap play to resume, or square to finish'
                  : 'Speak naturally. Tap square to stop.'
                : 'Tap the microphone to start recording your thoughts'}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-semibold">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Speak clearly and naturally</li>
            <li>Pause briefly between sentences</li>
            <li>Language auto-detected (English/Korean)</li>
            <li>AI will refine and organize your thoughts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
