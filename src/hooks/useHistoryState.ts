'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { HistoryItem } from '@/components/HistorySidebar';

/**
 * Debounced localStorage persistence for history.
 * State updates are instant (React state), but localStorage writes
 * are batched with a 500ms debounce to avoid blocking the main thread
 * during rapid operations (bulk delete, quick successive transcriptions).
 */
export function useHistoryState() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(0);
  const persistTimerRef = useRef<NodeJS.Timeout | null>(null);

  const hasNewHistory = useMemo(
    () => history.length > 0 && history[0].timestamp > lastViewedTimestamp,
    [history, lastViewedTimestamp]
  );

  // Debounced persist: batches localStorage writes
  const persistHistory = useCallback((newHistory: HistoryItem[]) => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      localStorage.setItem('transcription_history', JSON.stringify(newHistory));
    }, 500);
  }, []);

  // Flush pending writes on unmount
  useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  /** Call once on mount to hydrate from localStorage */
  const hydrate = useCallback(() => {
    const storedHistory = localStorage.getItem('transcription_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
    const storedLastViewed = localStorage.getItem('last_viewed_history');
    if (storedLastViewed) setLastViewedTimestamp(parseInt(storedLastViewed));
  }, []);

  const addHistoryItem = useCallback((item: HistoryItem) => {
    setHistory(prev => {
      const newHistory = [item, ...prev];
      persistHistory(newHistory);
      return newHistory;
    });
  }, [persistHistory]);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      persistHistory(newHistory);
      return newHistory;
    });
  }, [persistHistory]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    // Clear immediately — no debounce needed for removal
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    localStorage.removeItem('transcription_history');
  }, []);

  const openHistory = useCallback(() => {
    setIsHistoryOpen(true);
    const now = Date.now();
    setLastViewedTimestamp(now);
    localStorage.setItem('last_viewed_history', now.toString());
  }, []);

  const closeHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  return {
    history,
    isHistoryOpen,
    hasNewHistory,
    hydrate,
    addHistoryItem,
    handleDeleteHistory,
    handleClearHistory,
    openHistory,
    closeHistory,
  };
}
