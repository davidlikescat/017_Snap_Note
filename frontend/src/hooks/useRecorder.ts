import { useState, useRef, useCallback } from 'react';

export interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
}

export interface RecorderControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
}

const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

function getSupportedMimeType(): string {
  for (const mimeType of MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return 'audio/webm'; // fallback
}

export function useRecorder(): [RecorderState, RecorderControls] {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      setAudioBlob(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Get supported MIME type
      const mimeType = getSupportedMimeType();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps for good quality
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        setIsRecording(false);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 100); // Update every 100ms for smooth counter

    } catch (err) {
      console.error('Error starting recording:', err);

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission denied. Please allow access.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else {
          setError('Failed to start recording. Please try again.');
        }
      }

      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      // Store paused time
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Calculate paused duration
      const pauseStart = Date.now();

      // Resume timer
      timerRef.current = setInterval(() => {
        const pauseDuration = Date.now() - pauseStart;
        pausedTimeRef.current += pauseDuration;
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 100);
    }
  }, []);

  const resetRecording = useCallback(() => {
    stopRecording();
    setDuration(0);
    setAudioBlob(null);
    setError(null);
    audioChunksRef.current = [];
  }, [stopRecording]);

  const state: RecorderState = {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    error,
  };

  const controls: RecorderControls = {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  };

  return [state, controls];
}
