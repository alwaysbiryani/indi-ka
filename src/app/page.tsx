
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  Clock, Copy, MessageSquare, X, Trash2,
  ArrowLeft, Sun, Moon, Mic
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import AudioRecorder from '@/components/AudioRecorder';
import LanguageSelector from '@/components/LanguageSelector';
import { cn } from '@/utils/cn';
import type { HistoryItem } from '@/components/HistorySidebar';

import { TaglineSkeleton } from '@/components/ui/Skeleton';

// Aggressively dynamic imports to keep the initial JS bundle tiny
const TaglineCycler = dynamic(() => import('@/components/TaglineCycler').then(mod => mod.TaglineCycler), {
  ssr: false,
  loading: () => <TaglineSkeleton />
});
const CreditsMarquee = dynamic(() => import('@/components/CreditsMarquee').then(mod => mod.CreditsMarquee), { ssr: false });
const Banners = dynamic(() => import('@/components/Banners').then(mod => mod.Banners), { ssr: false });
const BackgroundBlobs = dynamic(() => import('@/components/BackgroundBlobs').then(mod => mod.BackgroundBlobs), { ssr: false });
const HistorySidebar = dynamic(() => import('@/components/HistorySidebar'), {
  loading: () => <div className="p-8 text-center text-[var(--text-secondary)] opacity-50 text-xs font-bold uppercase tracking-widest">Loading history...</div>,
  ssr: false
});

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef<HTMLTextAreaElement>(null);
  const [language, setLanguage] = useState('auto');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(0);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showAutoCopyBanner, setShowAutoCopyBanner] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [transcriptionTime, setTranscriptionTime] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize all settings in a single effect to avoid re-render loops
  useEffect(() => {
    setIsMounted(true);

    // Theme
    const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }

    // Config & History
    const storedKey = localStorage.getItem('sarvam_api_key');
    if (storedKey) setApiKey(storedKey);

    const storedHistory = localStorage.getItem('transcription_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const storedLastViewed = localStorage.getItem('last_viewed_history');
    if (storedLastViewed) setLastViewedTimestamp(parseInt(storedLastViewed));

    console.log('%c🇮🇳 Indi-क Performance-Optimized v5', 'font-size: 16px; font-weight: bold; color: #FF9933;');
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('app_theme', theme);
    }
  }, [theme, isMounted]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const saveHistory = useCallback((newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('transcription_history', JSON.stringify(newHistory));
  }, []);

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

    setHistory(prev => {
      const newHistory = [newItem, ...prev];
      localStorage.setItem('transcription_history', JSON.stringify(newHistory));
      return newHistory;
    });
    setErrorBanner(null);
  }, [language]);

  const handleErrorAction = useCallback((msg: string) => setErrorBanner(msg), []);

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

  const hasNewHistory = useMemo(() => history.length > 0 && history[0].timestamp > lastViewedTimestamp, [history, lastViewedTimestamp]);

  const openHistory = useCallback(() => {
    setIsHistoryOpen(true);
    const now = Date.now();
    setLastViewedTimestamp(now);
    localStorage.setItem('last_viewed_history', now.toString());
  }, []);

  return (
    <main className="min-h-screen w-full bg-[var(--app-bg)] flex items-center justify-center p-0 lg:p-8 font-sans overflow-hidden relative transition-colors duration-500">
      <BackgroundBlobs />

      <div className="relative z-10 w-full flex flex-col items-center">
        <Banners errorBanner={errorBanner} showAutoCopyBanner={showAutoCopyBanner} />

        {/* Phone Mockup */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-[100dvh] lg:w-[390px] lg:h-[844px] bg-[var(--screen-bg)] lg:rounded-[50px] lg:shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden lg:border-[8px] border-0 lg:border-[var(--phone-frame)] relative flex flex-col transition-colors duration-500"
        >
          <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[var(--phone-frame)] rounded-b-[20px] z-[50]" />

          <header className="px-6 pb-4 flex items-center justify-between relative z-10 pt-[calc(env(safe-area-inset-top)+2rem)] lg:px-8 lg:pt-14 lg:pb-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9933] to-[#138808]">
                <MessageSquare className="w-4 h-4 text-white fill-current" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Indi-क</h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-all active:scale-95"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={openHistory}
                className="relative bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-4 py-2 rounded-full border border-[var(--border)] flex items-center space-x-2 transition-all active:scale-95 group shadow-sm"
              >
                <Clock className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] uppercase tracking-wider">Recent</span>
                {hasNewHistory && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 z-20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-[var(--screen-bg)]"></span>
                  </span>
                )}
              </button>
            </div>
          </header>

          <div className="flex-1 px-6 lg:px-8 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {!transcript ? (
                <m.div
                  key="landing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex-1 flex flex-col items-center justify-start pt-6"
                >
                  <Suspense fallback={<TaglineSkeleton />}>
                    <TaglineCycler />
                  </Suspense>

                  <div className="w-full mb-10 relative z-50">
                    <div className="bg-[var(--surface)]/80 backdrop-blur-xl rounded-[24px] p-1 border border-[var(--border)] shadow-sm transition-all duration-300">
                      <LanguageSelector
                        selectedLanguage={language}
                        onSelectLanguage={setLanguage}
                        className="!bg-transparent !border-none !p-4 !m-0"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center mb-16">
                    <AudioRecorder
                      onTranscriptionComplete={handleTranscriptionComplete}
                      onError={handleErrorAction}
                      language={language}
                      apiKey={apiKey}
                      variant="circular"
                      onRecordingStart={animateClear}
                      theme={theme}
                    />
                  </div>
                </m.div>
              ) : (
                <m.div
                  key="transcribing"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setTranscript('')}
                      className="group flex items-center space-x-1 pl-2 pr-3 py-2 hover:bg-[var(--surface-hover)] rounded-full transition-all text-[var(--text-secondary)]"
                    >
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      <span className="text-sm font-medium">Back</span>
                    </button>
                    {transcriptionTime !== null && (
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--surface-hover)] px-3 py-1.5 rounded-full border border-[var(--border)]">
                        Ready in {transcriptionTime.toFixed(1)}s
                      </span>
                    )}
                  </div>

                  <div className="flex-1 bg-[var(--surface)] rounded-[32px] p-6 lg:p-8 border border-[var(--border)] relative overflow-hidden mb-6 flex flex-col shadow-sm group transition-all duration-300">
                    <textarea
                      ref={transcriptRef}
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="w-full h-full bg-transparent border-none focus:ring-0 text-[var(--text-primary)] text-lg lg:text-xl font-medium leading-relaxed resize-none outline-none custom-scrollbar"
                      placeholder="Your transcription will appear here..."
                    />
                    <button
                      onClick={() => setTranscript('')}
                      className="absolute top-4 right-4 p-2.5 bg-[var(--app-bg)] rounded-xl transition-all active:scale-95 text-[var(--text-secondary)] hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100 duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-4 mb-8 w-full max-w-full lg:max-w-[400px] mx-auto px-1 pb-[env(safe-area-inset-bottom)]">
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "flex-1 py-3.5 rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center space-x-2 group outline-none",
                        hasCopied
                          ? "bg-green-500/10 border border-green-500/40 text-green-600 dark:text-green-500"
                          : "bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)]"
                      )}
                    >
                      <Copy className={cn("w-4.5 h-4.5 transition-colors", hasCopied ? "text-green-500" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]")} />
                      <span className="font-bold text-sm tracking-wide">{hasCopied ? "Copied" : "Copy Text"}</span>
                    </button>

                    <button
                      onClick={() => setTranscript('')}
                      className="flex-1 py-3.5 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-full transition-all active:scale-95 border border-[var(--border)] flex items-center justify-center space-x-2 outline-none"
                    >
                      <Mic className="w-4.5 h-4.5 text-[var(--text-secondary)]" />
                      <span className="font-bold text-sm text-[var(--text-primary)] tracking-wide">Speak Again</span>
                    </button>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          <Suspense fallback={<div className="h-10" />}>
            <CreditsMarquee />
          </Suspense>

          <div className="hidden lg:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-[var(--border)] rounded-full opacity-60" />
        </m.div>
      </div>

      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200]"
            />
            <m.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[340px] bg-[var(--surface)] z-[201] flex flex-col shadow-xl border-l border-[var(--border)]"
            >
              <div className="p-6 md:p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Recent History</h2>
                    {history.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="text-[10px] font-bold text-red-500/70 hover:text-red-600 uppercase tracking-widest mt-1 text-left active:scale-95 w-fit"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <button onClick={() => setIsHistoryOpen(false)} className="p-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-all border border-[var(--border)] active:scale-90">
                    <X className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <HistorySidebar
                    history={history}
                    onDelete={handleDeleteHistory}
                    onSelect={(text) => {
                      setTranscript(text);
                      setIsHistoryOpen(false);
                    }}
                    onClearAll={handleClearHistory}
                    className="!bg-transparent !border-none !p-0"
                  />
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
