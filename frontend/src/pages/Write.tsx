import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { APP_CONFIG } from '@/lib/constants';
import { useRefine } from '@/hooks/useRefine';
import { detectLanguage } from '@/lib/utils';
import { readTextFile, validateFile } from '@/lib/fileReader';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { getText } from '@/lib/i18n';

export default function Write() {
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const [text, setText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [refineState, refineControls] = useRefine();
  const { isRefining } = refineState;
  const { refineText } = refineControls;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    try {
      const fileText = await readTextFile(file);

      // MAX_TEXT_LENGTH로 제한
      const truncatedText = fileText.slice(0, APP_CONFIG.MAX_TEXT_LENGTH);
      setText(truncatedText);
      setUploadedFileName(file.name);

      if (fileText.length > APP_CONFIG.MAX_TEXT_LENGTH) {
        toast.warning(`File content was truncated to ${APP_CONFIG.MAX_TEXT_LENGTH} characters`);
      } else {
        toast.success(`File "${file.name}" loaded successfully`);
      }
    } catch (error) {
      toast.error('Failed to read file');
      console.error(error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearFile = () => {
    setText('');
    setUploadedFileName(null);
  };

  const handleRefine = async () => {
    if (text.trim().length === 0) {
      toast.error('Please enter some text');
      return;
    }

    console.log('🎯 [WRITE] Starting refinement...');
    const detectedLanguage = detectLanguage(text);
    const result = await refineText(text.trim());

    console.log('🎯 [WRITE] Refinement result:', result);

    if (result) {
      console.log('🎯 [WRITE] Navigating to result page...');
      navigate('/result', {
        state: {
          originalText: text.trim(),
          refinedData: result,
          language: detectedLanguage,
        },
      });
    } else {
      console.error('🎯 [WRITE] No result returned!');
      console.error('🎯 [WRITE] Error:', refineState.error);
      toast.error(refineState.error || 'Failed to refine text. Please try again.');
    }
  };

  const remainingChars = APP_CONFIG.MAX_TEXT_LENGTH - text.length;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/app" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span>{getText('back', language)}</span>
          </Link>
          <h1 className="text-2xl font-bold">{getText('writeTitle', language)}</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* File Upload Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,.csv,.json,.log"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>{getText('uploadFile', language)}</span>
            </button>
            <span className="text-sm text-muted-foreground">
              (.txt, .md, .csv, .json, .log)
            </span>
            {uploadedFileName && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <span className="text-sm">{uploadedFileName}</span>
                <button
                  onClick={handleClearFile}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Text Input */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={APP_CONFIG.MAX_TEXT_LENGTH}
              placeholder={getText('textPlaceholder', language)}
              className="w-full min-h-[300px] p-4 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="absolute bottom-4 right-4 text-sm text-muted-foreground">
              {remainingChars} characters remaining
            </div>
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

          {/* Action Button */}
          <button
            onClick={handleRefine}
            disabled={text.trim().length === 0 || isRefining}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground py-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {isRefining ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                <span>{getText('refining', language)}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>{getText('refineWithAI', language)}</span>
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground space-y-2">
          <p>💡 <strong>Tip:</strong> Write freely or upload a file. AI will:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Summarize your thoughts</li>
            <li>Add relevant tags</li>
            <li>Categorize by context</li>
            <li>Suggest insights</li>
          </ul>
          <p className="text-xs pt-2">
            📎 {getText('supportedFormats', language)}
          </p>
        </div>
      </div>
    </div>
  );
}
