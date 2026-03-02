'use client';

import { useState, useMemo, useCallback } from 'react';
import type { HistoryItem } from '@/components/HistorySidebar';

export function useHistoryState() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(0);

  const hasNewHistory = useMemo(
    () => history.length > 0 && history[0].timestamp > lastViewedTimestamp,
    [history, lastViewedTimestamp]
  );

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
      localStorage.setItem('transcription_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      localStorage.setItem('transcription_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
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
