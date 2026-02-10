
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, MessageSquare, AlertCircle, Clock, X, Zap, Cloud, Code2, Github, PenTool } from 'lucide-react';
import AudioRecorder from '@/components/AudioRecorder';
import LanguageSelector from '@/components/LanguageSelector';
import SettingsModal from '@/components/SettingsModal';
import HistorySidebar, { HistoryItem } from '@/components/HistorySidebar';
import NetworkStatus from '@/components/NetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const mobileRef = useRef<HTMLTextAreaElement>(null);
  const desktopRef = useRef<HTMLTextAreaElement>(null);
  const [language, setLanguage] = useState('auto');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const [autoStartRecording, setAutoStartRecording] = useState(false);

  const taglines = [
    { main: "Bolo Bindass.", sub: "Likho Fatafat." },      // Hinglish (Roman)
    { main: "बिंदास बोलो।", sub: "फटाफट लिखो।" },          // Hindi
    { main: "మస్తు మాట్లాడండి.", sub: "ఫాస్ట్ గా రాయండి." }, // Telugu
    { main: "வேகமா பேசுங்க.", sub: "சீக்கிரமா எழுதுங்க." }, // Tamil
    { main: "बिंधास बोला.", sub: "पटापट लिहा." },           // Marathi
    { main: "মন খুলে বলুন।", sub: "ঝটপট লিখুন।" },         // Bengali
    { main: "ಮನಸಾರೆ ಮಾತನಾಡಿ.", sub: "ಬೇಗ ಬರೆಯಿರಿ." },    // Kannada
    { main: "મન મૂકીને બોલો.", sub: "ઝટપટ લખો." },         // Gujarati
    { main: "മനസ്സുതുറന്നു സംസാരിക്കൂ.", sub: "വേഗത്തിൽ എഴുതൂ." }, // Malayalam
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [taglines.length]);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(0);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showAutoCopyBanner, setShowAutoCopyBanner] = useState(false);

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
  }, []);

  // Handle transcript textarea updates (scrolling for desktop, expanding for mobile)
  useEffect(() => {
    // For mobile
    if (mobileRef.current) {
      mobileRef.current.style.height = 'auto';
      mobileRef.current.style.height = `${mobileRef.current.scrollHeight}px`;

      // Also scroll the parent container to bottom if we're near the bottom
      const container = mobileRef.current.closest('.overflow-y-auto');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
    // For desktop
    if (desktopRef.current) {
      desktopRef.current.scrollTop = desktopRef.current.scrollHeight;
    }
  }, [transcript]);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('transcription_history', JSON.stringify(newHistory));
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('sarvam_api_key', key);
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

    setTranscript(text);

    // Auto-copy to clipboard
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setHasCopied(true);
        setShowAutoCopyBanner(true);
        setTimeout(() => {
          setHasCopied(false);
          setShowAutoCopyBanner(false);
        }, 3000);
      }).catch(err => {
        console.error('Failed to auto-copy: ', err);
      });
    }

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
    setTimeout(() => setErrorBanner(null), 5000);
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
    const duration = 400; // ms - snappy but visible
    const start = performance.now();

    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic easing for a "vacuum" effect
      const remainingProgress = 1 - Math.pow(progress, 3);
      const currentLength = Math.floor(initialText.length * remainingProgress);

      setTranscript(initialText.substring(0, currentLength));

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setTranscript('');
      }
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

  return (
    <main className="min-h-screen bg-mesh dark:bg-mesh text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors duration-300 items-center overflow-x-hidden">

      {/* Elevated Header - Floating Pill */}
      <header className="fixed top-6 z-[100] w-[90%] max-w-md">
        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[32px] px-6 py-4 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-[-4deg]">
              <MessageSquare className="w-6 h-6 text-white dark:text-zinc-900" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tight leading-none bg-gradient-to-r from-[#FF9933] via-zinc-100 dark:via-white to-[#138808] bg-clip-text text-transparent">Indi-क</h1>
              <span className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-500 dark:text-zinc-400 mt-1">AI for India</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={openHistory}
              className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl transition-all active:scale-95 group relative"
            >
              <Clock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              {hasNewHistory && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-md px-6 pt-32 pb-12 flex flex-col">

        {/* Intro Section - Animated Multilingual Tags */}
        {!transcript && (
          <div className="text-center mb-8 h-32 flex flex-col justify-center items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTaglineIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="space-y-3"
              >
                <h2 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white leading-[1.1]">
                  {taglines[currentTaglineIndex].main}<br />
                  <span className="italic font-serif font-black text-zinc-600 dark:text-zinc-400">
                    {taglines[currentTaglineIndex].sub}
                  </span>
                </h2>
              </motion.div>
            </AnimatePresence>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-black uppercase tracking-widest mt-4">
              Instant Transcription to Hindi, Hinglish & 10+ languages
            </p>
          </div>
        )}

        {/* Language Selector Section */}
        <div className="w-full mb-6 relative z-40">
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-1.5 border border-white/40 dark:border-white/10 shadow-sm">
            <LanguageSelector
              selectedLanguage={language}
              onSelectLanguage={setLanguage}
              className="!mb-0"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <AnimatePresence mode="wait">
            {!transcript ? (
              /* Landing Experience */
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center w-full"
              >
                <div className="relative p-12">
                  {/* Glass Background for Recording */}
                  <div className="absolute inset-0 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[60px] border border-white/60 dark:border-white/10" />

                  <div className="relative z-10">
                    {/* Subtle pulsing glow behind the button - set to pointer-events-none */}
                    <div className="absolute inset-0 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[100px] animate-pulse pointer-events-none" />
                    <div className="relative z-10">
                      <AudioRecorder
                        onTranscriptionComplete={handleTranscriptionComplete}
                        onError={handleError}
                        language={language}
                        apiKey={apiKey}
                        variant="circular"
                        autoStart={autoStartRecording}
                        onRecordingStart={() => setAutoStartRecording(false)}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* After Transcription */
              <motion.div
                key="transcribed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full flex flex-col h-full space-y-8"
              >
                {/* Transcription Canvas Card */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-white/5 rounded-[48px] shadow-[0_24px_64px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.2)] overflow-hidden relative group">
                  <textarea
                    ref={mobileRef}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-xl text-zinc-800 dark:text-zinc-200 leading-relaxed p-10 pb-20 resize-none placeholder-zinc-300 font-bold outline-none overflow-y-auto custom-scrollbar min-h-[300px]"
                    placeholder="Transcription will appear here..."
                  />

                  {/* Integrated Canvas Controls */}
                  <div className="absolute bottom-6 left-10 right-10 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 tracking-widest">Ready</span>
                      </div>
                    </div>
                    <button
                      onClick={() => animateClear()}
                      className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl text-zinc-500 transition-all active:scale-95 shadow-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Actions Bar - Elevated Tiles */}
                <div className="grid grid-cols-2 gap-6 h-24 w-full">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "w-full h-full flex items-center justify-center space-x-4 rounded-[32px] font-black uppercase tracking-[0.15em] transition-all shadow-xl active:scale-95 border-b-8 group",
                      hasCopied
                        ? "bg-green-500 border-green-700 text-white"
                        : "bg-white dark:bg-zinc-100 border-zinc-100 dark:border-zinc-200 text-zinc-900 shadow-[0_12px_24px_rgba(0,0,0,0.05)]"
                    )}
                  >
                    {hasCopied ? (
                      <>
                        <Check className="w-6 h-6" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-6 h-6 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <AudioRecorder
                    onTranscriptionComplete={handleTranscriptionComplete}
                    onError={handleError}
                    language={language}
                    apiKey={apiKey}
                    variant="side-by-side"
                    onRecordingStart={() => {
                      setTranscript('');
                      setAutoStartRecording(true);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Premium Bottom Credit Dock */}
        <div className="mt-auto pt-12 pb-12 w-full flex justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative w-full"
          >
            {/* Ambient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />

            <div className="relative bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white dark:border-white/5 p-2 rounded-full shadow-2xl mx-auto w-fit max-w-[90%] overflow-hidden">
              {/* Fade Masks for Mobile Scroll */}
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/60 dark:from-zinc-900/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/60 dark:from-zinc-900/80 to-transparent z-10 pointer-events-none" />

              {/* Scrolling Container */}
              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar px-8 scroll-smooth flex-nowrap">
                {/* Category: Transcription */}
                <a href="https://www.sarvam.ai/" target="_blank" rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-5 py-3 rounded-full hover:bg-white/60 dark:hover:bg-white/5 transition-all shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Transcription</span>
                    <span className="text-[10px] font-black uppercase text-zinc-900 dark:text-white">Sarvam AI</span>
                  </div>
                </a>

                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />

                {/* Category: Deployment */}
                <div className="flex items-center space-x-3 px-5 py-3 text-left shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                    <Cloud className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Deployment</span>
                    <span className="text-[10px] font-black uppercase text-zinc-900 dark:text-white">Vercel</span>
                  </div>
                </div>

                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />

                {/* Category: IDE */}
                <div className="flex items-center space-x-3 px-5 py-3 text-left shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Code2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">IDE</span>
                    <span className="text-[10px] font-black uppercase text-zinc-900 dark:text-white">Antigravity</span>
                  </div>
                </div>

                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />

                {/* Category: Wireframing */}
                <a href="https://excalidraw.com/" target="_blank" rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-5 py-3 rounded-full hover:bg-white/60 dark:hover:bg-white/5 transition-all text-left shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <PenTool className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Wireframing</span>
                    <span className="text-[10px] font-black uppercase text-zinc-900 dark:text-white">Excalidraw</span>
                  </div>
                </a>

                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />

                {/* Category: Developer */}
                <a href="https://github.com/alwaysbiryani/indi-ka" target="_blank" rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-5 py-3 rounded-full hover:bg-white/60 dark:hover:bg-white/5 transition-all text-left shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                    <Github className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Developer</span>
                    <span className="text-[10px] font-black uppercase text-zinc-900 dark:text-white">Repo</span>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Notifications Layer */}
      <AnimatePresence>
        {showAutoCopyBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-950 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(0,0,0,0.3)] z-[200] border border-white/20 whitespace-nowrap"
          >
            Copied to Clipboard
          </motion.div>
        )}

        {errorBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-28 px-6 py-3 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl z-[200] flex items-center space-x-3 border-b-4 border-red-700 active:scale-95 transition-transform"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="ml-2 hover:bg-white/20 p-1 rounded-lg">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <HistorySidebarDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onDelete={handleDeleteHistory}
        onSelect={(text) => {
          setTranscript(text);
          setIsHistoryOpen(false);
        }}
        onClearAll={handleClearHistory}
      />

      <SettingsModal
        isOpen={false}
        onClose={() => { }}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </main>
  );
}

interface HistorySidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: any[];
  onDelete: (id: string) => void;
  onSelect: (text: string) => void;
  onClearAll: () => void;
}

function HistorySidebarDrawer({ isOpen, onClose, history, onDelete, onSelect, onClearAll }: HistorySidebarDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[150]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-6 top-6 bottom-6 w-full max-w-sm bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl z-[151] flex flex-col shadow-[0_40px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.4)] border border-white dark:border-white/5 rounded-[48px] overflow-hidden"
          >
            {/* Header with Close */}
            <div className="flex items-center justify-between p-8 pb-0">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white dark:text-zinc-900" />
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <HistorySidebar
                history={history}
                onDelete={onDelete}
                onSelect={onSelect}
                onClearAll={onClearAll}
                className="h-full"
              />
            </div>

            <div className="p-8 pt-0">
              <button
                onClick={onClose}
                className="w-full py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[32px] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-[0.98] border-b-8 border-black dark:border-zinc-200"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
