import { useState, useEffect, useRef, useCallback } from 'react';
import { detectLanguage } from '@/lib/utils';
import { AppLanguage } from '@/stores/useLanguageStore';

export interface TranscribeState {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  error: string | null;
  language: AppLanguage;
}

export interface TranscribeControls {
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  setLanguage: (lang: AppLanguage) => void;
}

// Map AppLanguage to Speech Recognition language codes
const LANG_CODE_MAP: Record<AppLanguage, string> = {
  en: 'en-US',
  ko: 'ko-KR',
  ja: 'ja-JP',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
};

const getLangCode = (lang: AppLanguage): string => LANG_CODE_MAP[lang] ?? LANG_CODE_MAP.en;

// Check if Web Speech API is available
const isSpeechRecognitionAvailable = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

export function useTranscribe(initialLanguage: AppLanguage = 'en'): [TranscribeState, TranscribeControls] {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguageState] = useState<AppLanguage>(initialLanguage);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isSpeechRecognitionAvailable()) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = getLangCode(language);

    // Handle results
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;

        if (result.isFinal) {
          final += transcriptPart + ' ';
        } else {
          interim += transcriptPart;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);

        // Auto-detect language from final transcript
        const detectedLang = detectLanguage(final);
        if (detectedLang !== language) {
          console.log(`🌐 Language detected: ${language} → ${detectedLang}`);
          setLanguageState(detectedLang);

          // Restart recognition with new language
          try {
            recognition.stop();
            setTimeout(() => {
              recognition.lang = getLangCode(detectedLang);
              recognition.start();
              console.log(`🔄 Recognition restarted with ${getLangCode(detectedLang)}`);
            }, 100);
          } catch (err) {
            console.error('Error restarting recognition:', err);
          }
        }
      }

      setInterimTranscript(interim);
    };

    // Handle errors
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please connect a microphone.');
          break;
        case 'not-allowed':
          setError('Microphone permission denied.');
          break;
        case 'network':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError('Speech recognition failed. Please try again.');
      }

      setIsListening(false);
    };

    // Handle end
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    // Handle start
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized.');
      return;
    }

    try {
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      // Recognition might already be started
      if (err instanceof Error && err.message.includes('already started')) {
        setIsListening(true);
      } else {
        setError('Failed to start speech recognition.');
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = getLangCode(lang);
    }
  }, []);

  const state: TranscribeState = {
    transcript,
    interimTranscript,
    isListening,
    error,
    language,
  };

  const controls: TranscribeControls = {
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
  };

  return [state, controls];
}

// Export helper to check availability
export { isSpeechRecognitionAvailable };
