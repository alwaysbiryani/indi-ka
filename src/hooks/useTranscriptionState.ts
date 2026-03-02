'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { HistoryItem } from '@/components/HistorySidebar';

interface UseTranscriptionStateOptions {
  language: string;
  onAddHistoryItem: (item: HistoryItem) => void;
  onClearError: () => void;
}

export function useTranscriptionState({ language, onAddHistoryItem, onClearError }: UseTranscriptionStateOptions) {
  const [transcript, setTranscript] = useState('');
  const [transcriptionTime, setTranscriptionTime] = useState<number | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [showAutoCopyBanner, setShowAutoCopyBanner] = useState(false);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll transcript to bottom on change
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleCopy = useCallback(() => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setHasCopied(true);
      setShowAutoCopyBanner(true);
      setTimeout(() => setHasCopied(false), 1200);
      setTimeout(() => setShowAutoCopyBanner(false), 2000);
    }
  }, [transcript]);

  const handleTranscriptionComplete = useCallback((text: string, detectedLanguage?: string, isPartial?: boolean, processingTime?: number) => {
    if (isPartial) {
      setTranscript(text);
      return;
    }

    if (processingTime) setTranscriptionTime(processingTime);

    if (!text || text.trim() === '') {
      setTranscript('');
      return;
    }

    setTranscript(text);

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      text: text,
      timestamp: Date.now(),
      language: language,
      detectedLanguage: detectedLanguage
    };

    onAddHistoryItem(newItem);
    onClearError();
  }, [language, onAddHistoryItem, onClearError]);

  const animateClear = useCallback(() => {
    if (!transcript) return;
    const initialText = transcript;
    const duration = 400;
    const start = performance.now();
    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const currentLength = Math.floor(initialText.length * (1 - Math.pow(progress, 3)));
      setTranscript(initialText.substring(0, currentLength));
      if (progress < 1) requestAnimationFrame(frame);
      else setTranscript('');
    };
    requestAnimationFrame(frame);
  }, [transcript]);

  return {
    transcript,
    setTranscript,
    transcriptRef,
    transcriptionTime,
    hasCopied,
    showAutoCopyBanner,
    handleCopy,
    handleTranscriptionComplete,
    animateClear,
  };
}
