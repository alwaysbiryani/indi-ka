'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Copy, Check, MessageSquare, AlertCircle, X, Trash2, Cloud, Github, Code, Layout, Cpu, Globe, ArrowLeft, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioRecorder from '@/components/AudioRecorder';
import LanguageSelector from '@/components/LanguageSelector';
import HistorySidebar, { HistoryItem } from '@/components/HistorySidebar';
import { cn } from '@/utils/cn';

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
    console.log('UI Version: mobile-first-v2');
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
      setTimeout(() => {
        setHasCopied(false);
        setShowAutoCopyBanner(false);
      }, 3000);
    }
  };

  const handleTranscriptionComplete = (text: string, detectedLanguage?: string, isPartial?: boolean) => {
    if (isPartial) {
      setTranscript(text);
      return;
    }

    if (!text || text.trim() === '') {
      console.log("Empty transcription received, skipping history save.");
      setTranscript(''); // Ensure it's empty but don't save
      return;
    }

    setTranscript(text);

    // Auto-copy
    navigator.clipboard.writeText(text).then(() => {
      setHasCopied(true);
      setShowAutoCopyBanner(true);
      setTimeout(() => {
        setHasCopied(false);
        setShowAutoCopyBanner(false);
      }, 3000);
    });

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

  const hasNewHistory = history.length > 0 && history[0].timestamp > lastViewedTimestamp;

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
    { l1: "ನನ್ನಾಗಿ സംസാರಿಸೂ,", l2: "ಇನಿ Indi-ಕ എഴുದುಮ್!" },
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
    <main className="min-h-screen w-full bg-[var(--app-bg)] flex items-center justify-center p-0 md:p-8 font-sans overflow-hidden relative transition-colors duration-300">
      {/* Subtle Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF9933]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#138808]/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Error Banner */}
        <AnimatePresence>
          {errorBanner && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-0 left-4 right-4 bg-[var(--surface)] border border-red-500/50 text-[var(--text-primary)] px-5 py-4 rounded-3xl shadow-2xl z-[100] flex items-center justify-between backdrop-blur-xl"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span className="text-sm font-bold truncate max-w-[200px]">{errorBanner}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phone Mockup Container (iPhone 12 Pro: 390x844) */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-[390px] h-[844px] bg-[var(--screen-bg)] rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden border-[10px] border-[var(--phone-frame)] relative flex flex-col scale-[0.9] sm:scale-100 transition-colors duration-500"
        >
          {/* Top Notch Area */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[var(--phone-frame)] rounded-b-[20px] z-[50]" />

          {/* Header (LOGO + THEME + HISTORY) */}
          <header className="px-8 pt-12 pb-3 flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3 bg-[var(--surface)] backdrop-blur-md px-4 py-2.5 rounded-[20px] border border-[var(--border)] shadow-sm">
              <MessageSquare className="w-4 h-4 text-[var(--text-secondary)]" />
              <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-[#FF9933] via-[var(--accent-tiranga-mid)] to-[#138808] bg-clip-text text-transparent">
                Indi-क
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 bg-[var(--surface)] rounded-[18px] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm active:scale-95"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={openHistory}
                className="relative bg-[var(--surface)] px-4 py-2.5 rounded-[18px] border border-[var(--border)] flex items-center space-x-2 transition-all hover:bg-[var(--surface-hover)] active:scale-95 group shadow-sm"
              >
                <Clock className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                <span className="text-[10px] font-black text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] uppercase tracking-widest transition-colors">Recent</span>
                {hasNewHistory && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-[var(--screen-bg)]"></span>
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 px-8 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {!transcript ? (
                /* LANDING EXPERIENCE: Big Circular Button */
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex flex-col items-center justify-start pt-2"
                >
                  {/* Animated Taglines */}
                  <div className="h-16 flex flex-col items-center justify-center text-center overflow-hidden mb-4 w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={taglineIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col space-y-1"
                      >
                        <p className="text-lg font-black text-[var(--text-primary)] leading-tight tracking-tight px-4">
                          {taglines[taglineIndex].l1}
                        </p>
                        <p className="text-lg font-black bg-gradient-to-r from-[#FF9933] via-[var(--accent-tiranga-mid)] to-[#138808] bg-clip-text text-transparent leading-tight tracking-tight px-4">
                          {taglines[taglineIndex].l2}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Language Selector */}
                  <div className="w-full mb-6 relative z-50">
                    <div className="bg-[var(--surface)] backdrop-blur-md rounded-[28px] p-5 border border-[var(--border)] shadow-sm">
                      <LanguageSelector
                        selectedLanguage={language}
                        onSelectLanguage={setLanguage}
                        className="!bg-transparent !border-none !p-0 !m-0"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center mb-10">
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setTranscript('')}
                      className="p-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-2xl transition-all active:scale-95 border border-[var(--border)] shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Post-Transcription</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCopy}
                        className="p-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-2xl transition-all active:scale-95 border border-[var(--border)] shadow-sm group"
                      >
                        <Copy className={cn("w-4 h-4 transition-colors", hasCopied ? "text-green-500" : "text-[var(--text-secondary)]")} />
                      </button>
                    </div>
                  </div>

                  {/* Transcription Canvas */}
                  <div className="flex-1 bg-[var(--surface)] rounded-[45px] p-8 border border-[var(--border)] relative overflow-hidden mb-6 flex flex-col shadow-inner group">
                    <textarea
                      ref={transcriptRef}
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="w-full h-full bg-transparent border-none focus:ring-0 text-[var(--text-primary)] text-lg font-bold leading-relaxed resize-none outline-none custom-scrollbar placeholder:text-[var(--text-secondary)]/30"
                      placeholder="Your transcription will appear here..."
                    />
                    <button
                      onClick={() => {
                        setTranscript('');
                      }}
                      className="absolute top-6 right-6 p-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-2xl transition-all active:scale-90 border border-[var(--border)] opacity-0 group-hover:opacity-100 duration-300 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>

                  <div className="flex justify-center mb-8">
                    <AudioRecorder
                      onTranscriptionComplete={handleTranscriptionComplete}
                      onError={handleError}
                      language={language}
                      apiKey={apiKey}
                      variant="default"
                      onRecordingStart={() => { }}
                      theme={theme}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Credits (FOOTER MARQUEE) */}
          <div className="mt-auto pb-8 relative z-10">
            <div className="w-full overflow-hidden flex items-center h-14 bg-[var(--surface)] border-y border-[var(--border)]">
              <motion.div
                className="flex items-center shrink-0"
                animate={{
                  x: isPaused ? 0 : [0, -1000],
                  transition: {
                    x: {
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 30,
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
                    className="flex items-center space-x-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-4 py-2 rounded-2xl border border-[var(--border)] mx-2 transition-all group/item shrink-0 shadow-sm"
                  >
                    <div className="text-[var(--text-secondary)] group-hover/item:text-[var(--text-primary)] transition-colors">
                      {credit.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[6px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none mb-0.5">
                        {credit.role}
                      </span>
                      <span className="text-[10px] font-black text-[var(--text-primary)] uppercase leading-none transition-colors">
                        {credit.name}
                      </span>
                    </div>
                  </a>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Swipe Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-[var(--border)] rounded-full" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[200]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[340px] bg-zinc-950/90 backdrop-blur-2xl z-[201] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/5"
            >
              <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-white tracking-tight">Recent</h2>
                  <button onClick={() => setIsHistoryOpen(false)} className="p-2.5 bg-zinc-900/50 rounded-xl hover:bg-zinc-800 transition-colors border border-white/[0.05]">
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
                <HistorySidebar
                  history={history}
                  onDelete={handleDeleteHistory}
                  onSelect={(text) => {
                    setTranscript(prev => prev ? `${prev}\n\n${text}` : text);
                    setIsHistoryOpen(false);
                  }}
                  onClearAll={handleClearHistory}
                  className="!bg-transparent !border-none !p-0"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
