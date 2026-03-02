
'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  Clock, Copy, MessageSquare, X, Trash2,
  ArrowLeft, Sun, Moon, Mic, WifiOff, Wifi
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import AudioRecorder from '@/components/AudioRecorder';
import LanguageSelector from '@/components/LanguageSelector';
import { cn } from '@/utils/cn';

import { TaglineCycler } from '@/components/TaglineCycler';
import { BackgroundBlobs } from '@/components/BackgroundBlobs';
import { useTranscriptionState } from '@/hooks/useTranscriptionState';
import { useHistoryState } from '@/hooks/useHistoryState';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// Aggressively dynamic imports for non-critical/below-fold elements
const CreditsMarquee = dynamic(() => import('@/components/CreditsMarquee').then(mod => mod.CreditsMarquee), { ssr: false });
const Banners = dynamic(() => import('@/components/Banners').then(mod => mod.Banners), { ssr: false });
const HistorySidebar = dynamic(() => import('@/components/HistorySidebar'), {
  loading: () => <div className="p-8 text-center text-[var(--text-secondary)] opacity-50 text-xs font-bold uppercase tracking-widest">Loading history...</div>,
  ssr: false
});

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const { isOnline, justReconnected } = useOnlineStatus();

  // Standalone state
  const [language, setLanguage] = useState('auto');
  const [apiKey, setApiKey] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isMounted, setIsMounted] = useState(false);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);
  const confirmTimerRef = useRef<NodeJS.Timeout | null>(null);

  // History state (consolidated hook)
  const {
    history,
    isHistoryOpen,
    hasNewHistory,
    hydrate: hydrateHistory,
    addHistoryItem,
    handleDeleteHistory,
    handleClearHistory,
    openHistory,
    closeHistory,
  } = useHistoryState();

  const clearError = useCallback(() => setErrorBanner(null), []);

  // Transcription state (consolidated hook)
  const {
    transcript,
    setTranscript,
    transcriptRef,
    transcriptionTime,
    hasCopied,
    showAutoCopyBanner,
    handleCopy,
    handleTranscriptionComplete,
    animateClear,
  } = useTranscriptionState({
    language,
    onAddHistoryItem: addHistoryItem,
    onClearError: clearError,
  });

  const handleErrorAction = useCallback((msg: string) => setErrorBanner(msg), []);

  // Focus trap for history sidebar
  const historySidebarRef = useFocusTrap<HTMLDivElement>({
    active: isHistoryOpen,
    onEscape: closeHistory,
  });

  // Auto-dismiss error banner after 8 seconds
  useEffect(() => {
    if (!errorBanner) return;
    const timer = setTimeout(() => setErrorBanner(null), 8000);
    return () => clearTimeout(timer);
  }, [errorBanner]);

  // Global Escape key: go back from transcription view (when not in a modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && transcript && !isHistoryOpen) {
        e.preventDefault();
        setTranscript('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [transcript, isHistoryOpen, setTranscript]);

  // Confirm Clear All (inline pattern for the page.tsx header version)
  useEffect(() => {
    if (confirmingClearAll) {
      confirmTimerRef.current = setTimeout(() => setConfirmingClearAll(false), 3000);
      return () => { if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current); };
    }
  }, [confirmingClearAll]);

  const handleHeaderClearAll = useCallback(() => {
    if (confirmingClearAll) {
      setConfirmingClearAll(false);
      handleClearHistory();
    } else {
      setConfirmingClearAll(true);
    }
  }, [confirmingClearAll, handleClearHistory]);

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

    // Config
    const storedKey = localStorage.getItem('sarvam_api_key');
    if (storedKey) setApiKey(storedKey);

    // History
    hydrateHistory();

    console.log('%c🇮🇳 Indi-क Performance-Optimized v6', 'font-size: 16px; font-weight: bold; color: #FF9933;');
  }, [hydrateHistory]);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('app_theme', theme);
    }
  }, [theme, isMounted]);

  return (
    <main className="min-h-dvh w-full bg-[var(--app-bg)] flex items-center justify-center p-0 lg:p-8 font-sans overflow-hidden relative transition-colors duration-200">
      <BackgroundBlobs />

      <div className="relative z-10 w-full flex flex-col items-center">
        <Banners
          errorBanner={errorBanner}
          showAutoCopyBanner={showAutoCopyBanner}
          onDismissError={clearError}
          onRetry={clearError}
        />

        {/* Offline banner */}
        <AnimatePresence>
          {!isOnline && (
            <m.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-0 left-4 right-4 bg-[var(--surface)]/95 border border-[var(--warning)]/30 text-[var(--text-primary)] px-5 py-3 rounded-2xl shadow-xl z-[99] flex items-center space-x-3 backdrop-blur-xl"
            >
              <WifiOff className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
              <span className="text-sm font-medium">You&apos;re offline. Recording is disabled.</span>
            </m.div>
          )}
        </AnimatePresence>

        {/* Back online toast */}
        <AnimatePresence>
          {justReconnected && isOnline && (
            <m.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-0 left-4 right-4 bg-[var(--surface)]/95 border border-[var(--success)]/30 text-[var(--text-primary)] px-5 py-3 rounded-2xl shadow-xl z-[99] flex items-center space-x-3 backdrop-blur-xl"
            >
              <Wifi className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
              <span className="text-sm font-medium">Back online</span>
            </m.div>
          )}
        </AnimatePresence>

        {/* Phone Mockup */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-dvh lg:w-[390px] lg:h-[844px] bg-[var(--screen-bg)] lg:rounded-[50px] lg:shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden lg:border-[8px] border-0 lg:border-[var(--phone-frame)] relative flex flex-col transition-colors duration-200"
        >
          <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[var(--phone-frame)] rounded-b-[20px] z-[50]" />

          <header className="px-6 pb-2 sm:pb-4 flex items-center justify-between relative z-10 pt-[max(env(safe-area-inset-top),1.5rem)] lg:px-8 lg:pt-14 lg:pb-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9933] to-[#138808]">
                <MessageSquare className="w-4 h-4 text-white fill-current" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Indi-क</h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                data-testid={theme === 'dark' ? 'sun-icon' : 'moon-icon'}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={openHistory}
                className="relative bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-4 py-2 rounded-full border border-[var(--border)] flex items-center space-x-2 transition-all active:scale-95 group shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                data-testid="history-button"
                aria-label="Open recent history"
              >
                <Clock className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] uppercase tracking-wider">Recent</span>
                {hasNewHistory && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 z-20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--error)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--error)] border-2 border-[var(--screen-bg)]"></span>
                  </span>
                )}
              </button>
            </div>
          </header>

          <div className="flex-1 px-6 lg:px-8 flex flex-col overflow-hidden min-h-0">
            <AnimatePresence mode="wait">
              {!transcript ? (
                <m.div
                  key="landing"
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  className="flex-1 flex flex-col items-center justify-between pb-6 h-full min-h-0"
                >
                  <TaglineCycler />

                  <div className="w-full relative z-50 mb-4">
                    <div className="bg-[var(--surface)]/80 backdrop-blur-xl rounded-[24px] p-1 border border-[var(--border)] shadow-sm transition-all duration-300">
                      <LanguageSelector
                        selectedLanguage={language}
                        onSelectLanguage={setLanguage}
                        className="!bg-transparent !border-none !p-4 !m-0"
                        data-testid="language-selector"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center min-h-0 w-full overflow-visible">
                    <AudioRecorder
                      onTranscriptionComplete={handleTranscriptionComplete}
                      onError={handleErrorAction}
                      language={language}
                      apiKey={apiKey}
                      variant="circular"
                      onRecordingStart={animateClear}
                      theme={theme}
                      isOnline={isOnline}
                    />
                  </div>
                </m.div>
              ) : (
                <m.div
                  key="transcribing"
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.35 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setTranscript('')}
                      className="group flex items-center space-x-1 pl-2 pr-3 py-2 hover:bg-[var(--surface-hover)] rounded-full transition-all text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                      aria-label="Go back to recording view"
                    >
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      <span className="text-sm font-medium">Back</span>
                    </button>
                    {transcriptionTime !== null && (
                      <span className="text-[length:var(--font-size-caption)] font-bold text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--surface-hover)] px-3 py-1.5 rounded-full border border-[var(--border)]">
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
                      data-testid="transcription-canvas"
                    />
                    <button
                      onClick={() => setTranscript('')}
                      className="absolute top-4 right-4 p-2.5 bg-[var(--app-bg)] rounded-xl transition-all active:scale-95 text-[var(--text-secondary)] hover:text-[var(--error)] lg:opacity-0 lg:group-hover:opacity-100 duration-200"
                      aria-label="Clear transcript"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-4 mb-4 lg:mb-8 w-full max-w-full lg:max-w-[400px] mx-auto px-1 pb-[max(env(safe-area-inset-bottom),1rem)]">
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "flex-1 py-3.5 rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center space-x-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]",
                        hasCopied
                          ? "bg-[var(--success-bg)] border border-[var(--success)]/40 text-[var(--success)]"
                          : "bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)]"
                      )}
                      data-testid="copy-button"
                    >
                      <Copy className={cn("w-4.5 h-4.5 transition-colors", hasCopied ? "text-[var(--success)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]")} />
                      <span className="font-bold text-sm tracking-wide">{hasCopied ? "Copied" : "Copy Text"}</span>
                    </button>

                    <button
                      onClick={() => setTranscript('')}
                      className="flex-1 py-3.5 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-full transition-all active:scale-95 border border-[var(--border)] flex items-center justify-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                      data-testid="speak-again-button"
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
              onClick={closeHistory}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200]"
            />
            <m.div
              ref={historySidebarRef}
              initial={prefersReducedMotion ? { opacity: 0 } : { x: '100%' }}
              animate={prefersReducedMotion ? { opacity: 1 } : { x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { x: '100%' }}
              transition={prefersReducedMotion ? { duration: 0.15 } : { type: 'spring', damping: 25, stiffness: 200 }}
              role="dialog"
              aria-modal="true"
              aria-label="Recent history"
              className="fixed right-0 top-0 bottom-0 w-full max-w-[340px] bg-[var(--surface)] z-[201] flex flex-col shadow-xl border-l border-[var(--border)]"
            >
              <div className="p-6 md:p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Recent History</h2>
                    {history.length > 0 && (
                      <button
                        onClick={handleHeaderClearAll}
                        className={`text-[length:var(--font-size-caption)] font-bold uppercase tracking-widest mt-1 text-left active:scale-95 w-fit transition-all ${
                          confirmingClearAll
                            ? 'text-white bg-[var(--error)] px-2 py-0.5 rounded-md'
                            : 'text-[var(--error)]/70 hover:text-[var(--error)]'
                        }`}
                      >
                        {confirmingClearAll ? 'Tap to confirm' : 'Clear All'}
                      </button>
                    )}
                  </div>
                  <button onClick={closeHistory} className="p-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-all border border-[var(--border)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]">
                    <X className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <HistorySidebar
                    history={history}
                    onDelete={handleDeleteHistory}
                    onSelect={(text) => {
                      setTranscript(text);
                      closeHistory();
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
