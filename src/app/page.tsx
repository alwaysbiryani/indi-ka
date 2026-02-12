'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Clock, Copy, Check, MessageSquare, AlertCircle, X, Trash2,
  Cloud, Github, Code, Layout, Cpu, Globe, ArrowLeft, Sun, Moon, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioRecorder from '@/components/AudioRecorder';
import LanguageSelector from '@/components/LanguageSelector';
import { cn } from '@/utils/cn';
import type { HistoryItem } from '@/components/HistorySidebar';

// Dynamically import HistorySidebar since it's only shown on click
const HistorySidebar = dynamic(() => import('@/components/HistorySidebar'), {
  loading: () => <div className="p-8 text-center text-zinc-500">Loading history...</div>,
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
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

    // Build verification info
    console.log('%c🇮🇳 Indi-क Mobile-First UI', 'font-size: 16px; font-weight: bold; color: #FF9933;');
    console.log('Build Commit:', process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local-dev');
    console.log('Build Time:', process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown');
    console.log('UI Version: refined-v3');
  }, []);

  // Update textarea height/scroll
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('transcription_history', JSON.stringify(newHistory));
  };

  const handleCopy = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setHasCopied(true);
      setShowAutoCopyBanner(true);

      // Button state reverts faster for that "snappy" feel
      setTimeout(() => {
        setHasCopied(false);
      }, 1200);

      // Toast lingers a bit longer to be readable
      setTimeout(() => {
        setShowAutoCopyBanner(false);
      }, 2000);
    }
  };

  const handleTranscriptionComplete = (text: string, detectedLanguage?: string, isPartial?: boolean, processingTime?: number) => {
    if (isPartial) {
      setTranscript(text);
      return;
    }

    if (processingTime) {
      setTranscriptionTime(processingTime);
    }

    if (!text || text.trim() === '') {
      console.log("Empty transcription received, skipping history save.");
      setTranscript(''); // Ensure it's empty but don't save
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
    const newHistory = [newItem, ...history];
    saveHistory(newHistory);
    setErrorBanner(null);
  };

  const handleError = (msg: string) => {
    handleErrorAction(msg);
  };

  const handleErrorAction = (msg: string) => {
    setErrorBanner(msg);
  };

  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    saveHistory(newHistory);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('transcription_history');
  };

  const animateClear = () => {
    if (!transcript) return;
    const initialText = transcript;
    const duration = 400;
    const start = performance.now();
    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const remainingProgress = 1 - Math.pow(progress, 3);
      const currentLength = Math.floor(initialText.length * remainingProgress);
      setTranscript(initialText.substring(0, currentLength));
      if (progress < 1) requestAnimationFrame(frame);
      else setTranscript('');
    };
    requestAnimationFrame(frame);
  };

  const hasNewHistory = useMemo(() => history.length > 0 && history[0].timestamp > lastViewedTimestamp, [history, lastViewedTimestamp]);

  const openHistory = () => {
    setIsHistoryOpen(true);
    const now = Date.now();
    setLastViewedTimestamp(now);
    localStorage.setItem('last_viewed_history', now.toString());
  };

  const credits = [
    { name: 'Sarvam AI', role: 'Transcription', icon: <Cloud className="w-3.5 h-3.5" />, link: 'https://www.sarvam.ai/' },
    { name: 'Google Antigravity', role: 'IDE', icon: <Cpu className="w-3.5 h-3.5" />, link: 'https://antigravity.google/' },
    { name: 'Vercel', role: 'Deployment', icon: <Globe className="w-3.5 h-3.5" />, link: 'https://vercel.com/' },
    { name: 'Excalidraw', role: 'Wireframing', icon: <Layout className="w-3.5 h-3.5" />, link: 'https://excalidraw.com/' },
    { name: 'Developer', role: 'Repo', icon: <Github className="w-3.5 h-3.5" />, link: 'https://github.com/alwaysbiryani/indi-ka' },
  ];

  const [taglineIndex, setTaglineIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const taglines = [
    { l1: "Baat karo dil se,", l2: "Typing kyu? Chill se." },
    { l1: "बकवास नहीं, काम की बात।", l2: "बोल के देखो, मज़ा आएगा।" },
    { l1: "Speak your mind,", l2: "Let Indi-क write." },
    { l1: "গল্প করো মন খুলে,", l2: "Indi-কাল আছে আপনার সাথে!" },
    { l1: "મોજથી બોલો,", l2: "લખવાની માથાકૂટ છોડો!" },
    { l1: "પટ પટ ಅಂತ ಹೇಳಿ,", l2: "Indi-ಕ ಇದೆ ನೋಡಿ!" },
    { l1: "ನನ್ನಾಗಿ സംസാರಿಸೂ,", l2: "ಇನಿ Indi-ಕ എഴുదుಮ್!" },
    { l1: "मस्त गप्पा मारा,", l2: "Indi-क करेल सगळं काम!" },
    { l1: "ମନ ଭରି କୁହ,", l2: "Indi-କ ଅଛି ସାଥିରେ!" },
    { l1: "ਖੁੱਲ ਕੇ ਬੋਲੋ ਜੀ,", l2: "Indi-ਕ ਕਰੇਗਾ ਬਾਕੀ ਕੰਮ!" },
    { l1: "மனசு விட்டு பேசுங்க,", l2: "Indi-க பாத்துக்கும்!" },
    { l1: "మనసు విప్పి మాట్లాడు,", l2: "Indi-క రాసి పెడుతుంది!" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [taglines.length]);

  return (
    <main className="min-h-screen w-full bg-[var(--app-bg)] flex items-center justify-center p-0 lg:p-8 font-sans overflow-hidden relative transition-colors duration-500">
      {/* Subtle Background decoration - Refined for "Aurora" feel */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-[#FF9933]/[0.02] rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] bg-[#138808]/[0.02] rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Error Banner */}
        <AnimatePresence>
          {errorBanner && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-0 left-4 right-4 bg-[var(--surface)]/95 border border-red-500/30 text-[var(--text-primary)] px-5 py-4 rounded-2xl shadow-xl z-[100] flex items-center justify-between backdrop-blur-xl"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span className="text-sm font-medium truncate max-w-[200px]">{errorBanner}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Copy Banner */}
        <AnimatePresence>
          {showAutoCopyBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 16, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--surface)]/95 border border-green-500/20 text-[var(--text-primary)] px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08),0_0_0_1px_rgba(34,197,94,0.1)] z-[100] flex items-center space-x-3 backdrop-blur-2xl whitespace-nowrap"
            >
              <div className="bg-green-500 p-1 rounded-full shadow-sm">
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </div>
              <span className="text-sm font-bold tracking-tight">Copied to clipboard</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phone Mockup Container (iPhone 12 Pro: 390x844) */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full h-[100dvh] lg:w-[390px] lg:h-[844px] bg-[var(--screen-bg)] lg:rounded-[50px] lg:shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden lg:border-[8px] border-0 lg:border-[var(--phone-frame)] relative flex flex-col scale-100 lg:scale-100 transition-colors duration-500"
        >
          {/* Top Notch Area - Only visible in desktop mockup */}
          <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[var(--phone-frame)] rounded-b-[20px] z-[50]" />

          {/* Header (LOGO + THEME + HISTORY) */}
          <header className="px-6 pb-4 flex items-center justify-between relative z-10 pt-[calc(env(safe-area-inset-top)+2rem)] lg:px-8 lg:pt-14 lg:pb-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9933] to-[#138808] opacity-90 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                <MessageSquare className="w-4 h-4 text-white fill-current" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Indi-क
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" data-testid="sun-icon" /> : <Moon className="w-5 h-5" data-testid="moon-icon" />}
              </button>

              <button
                onClick={openHistory}
                data-testid="history-button"
                className="relative bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-4 py-2 rounded-full border border-[var(--border)] flex items-center space-x-2 transition-all active:scale-95 group shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                <Clock className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors">Recent</span>
                {hasNewHistory && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 z-20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-[var(--screen-bg)]"></span>
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 px-6 lg:px-8 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {!transcript ? (
                /* LANDING EXPERIENCE */
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex-1 flex flex-col items-center justify-start pt-6"
                >
                  {/* Animated Taglines */}
                  <div className="h-20 flex flex-col items-center justify-center text-center overflow-hidden mb-8 w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={taglineIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="flex flex-col space-y-2"
                      >
                        <p className="text-xl font-bold text-[var(--text-primary)] leading-snug tracking-tight">
                          {taglines[taglineIndex].l1}
                        </p>
                        <p className="text-xl font-bold bg-gradient-to-r from-[#FF9933] via-[var(--text-primary)] to-[#138808] bg-clip-text text-transparent leading-snug tracking-tight opacity-90">
                          {taglines[taglineIndex].l2}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Language Selector - Cleaner, Floating */}
                  <div className="w-full mb-10 relative z-50">
                    <div className="bg-[var(--surface)]/80 backdrop-blur-xl rounded-[24px] p-1 border border-[var(--border)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300">
                      <LanguageSelector
                        selectedLanguage={language}
                        onSelectLanguage={setLanguage}
                        className="!bg-transparent !border-none !p-4 !m-0"
                        data-testid="language-selector"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center mb-16">
                    <AudioRecorder
                      onTranscriptionComplete={handleTranscriptionComplete}
                      onError={handleError}
                      language={language}
                      apiKey={apiKey}
                      variant="circular"
                      onRecordingStart={animateClear}
                      theme={theme}
                    />
                  </div>
                </motion.div>
              ) : (
                /* AFTER TRANSCRIPTION: Canvas + Action Row */
                <motion.div
                  key="transcribing"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setTranscript('')}
                      className="group flex items-center space-x-1 pl-2 pr-3 py-2 hover:bg-[var(--surface-hover)] rounded-full transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      <span className="text-sm font-medium">Back</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      {transcriptionTime && (
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--surface-hover)] px-3 py-1.5 rounded-full border border-[var(--border)]">
                          Ready in {transcriptionTime.toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Transcription Canvas */}
                  <div className="flex-1 bg-[var(--surface)] rounded-[32px] p-6 lg:p-8 border border-[var(--border)] relative overflow-hidden mb-6 flex flex-col shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] group hover:shadow-[inset_0_2px_15px_rgba(0,0,0,0.03)] transition-all duration-300">
                    <textarea
                      ref={transcriptRef}
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="w-full h-full bg-transparent border-none focus:ring-0 text-[var(--text-primary)] text-lg lg:text-xl font-medium leading-relaxed resize-none outline-none custom-scrollbar placeholder:text-[var(--text-secondary)]/30"
                      placeholder="Your transcription will appear here..."
                      data-testid="transcription-canvas"
                    />
                    <button
                      onClick={() => {
                        setTranscript('');
                      }}
                      className="absolute top-4 right-4 p-2.5 bg-[var(--app-bg)] hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-95 text-[var(--text-secondary)] hover:text-red-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-4 mb-8 w-full max-w-full lg:max-w-[400px] mx-auto px-1 pb-[env(safe-area-inset-bottom)]">
                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      data-testid="copy-button"
                      className={cn(
                        "flex-1 py-3.5 rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center space-x-2 group outline-none focus:ring-2 focus:ring-[var(--accent-tiranga-mid)]/20",
                        hasCopied
                          ? "bg-green-500/10 border border-green-500/40 text-green-600 dark:text-green-500"
                          : "bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
                      )}
                    >
                      <Copy className={cn("w-4.5 h-4.5 transition-colors duration-300", hasCopied ? "text-green-500" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]")} />
                      <span className="font-bold text-sm tracking-wide">
                        {hasCopied ? "Copied" : "Copy Text"}
                      </span>
                    </button>

                    {/* Tap to Speak Button */}
                    <button
                      onClick={() => setTranscript('')}
                      data-testid="speak-again-button"
                      className="flex-1 py-3.5 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-full transition-all active:scale-95 border border-[var(--border)] shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center justify-center space-x-2 outline-none focus:ring-2 focus:ring-[var(--accent-tiranga-mid)]/20"
                    >
                      <Mic className="w-4.5 h-4.5 text-[var(--text-secondary)]" />
                      <span className="font-bold text-sm text-[var(--text-primary)] tracking-wide">Speak Again</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Credits (FOOTER MARQUEE) */}
          <div className="mt-auto pb-8 relative z-10">
            <div className="w-full overflow-hidden flex items-center h-12 bg-[var(--surface)]/50 backdrop-blur-sm border-y border-[var(--border)]">
              <motion.div
                className="flex items-center shrink-0"
                animate={{
                  x: isPaused ? 0 : [0, -1000],
                  transition: {
                    x: {
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 40, // Slower for elegance
                      ease: "linear",
                    }
                  }
                }}
                onHoverStart={() => setIsPaused(true)}
                onHoverEnd={() => setIsPaused(false)}
              >
                {/* Double the credits array for seamless loop */}
                {[...credits, ...credits].map((credit, idx) => (
                  <a
                    key={idx}
                    href={credit.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 px-4 mx-2 group/item shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <div className="text-[var(--text-primary)]">
                      {credit.icon}
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-[11px] font-bold text-[var(--text-primary)] tracking-wide">
                        {credit.name}
                      </span>
                      <span className="text-[9px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {credit.role}
                      </span>
                    </div>
                  </a>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Swipe Indicator - Only visible in desktop mockup */}
          <div className="hidden lg:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-[var(--border)] rounded-full opacity-60" />
        </motion.div>
      </div >

      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[340px] bg-[var(--surface)] z-[201] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.1)] border-l border-[var(--border)]"
            >
              <div className="p-6 md:p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Recent History</h2>
                    {history.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="text-[10px] font-bold text-red-500/70 hover:text-red-600 uppercase tracking-[0.15em] transition-colors mt-1 text-left active:scale-95 w-fit"
                        data-testid="clear-all-history"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <button onClick={() => setIsHistoryOpen(false)} className="p-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-all border border-[var(--border)] active:scale-90 shadow-sm">
                    <X className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>

                <div className="flex-1 overflow-hidden">
                  <HistorySidebar
                    history={history}
                    onDelete={handleDeleteHistory}
                    onSelect={(text) => {
                      setTranscript(text);
                      setErrorBanner(null);
                      setIsHistoryOpen(false);
                    }}
                    onClearAll={handleClearHistory}
                    className="!bg-transparent !border-none !p-0"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main >
  );
}
