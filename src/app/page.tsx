
'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import AudioRecorder from '@/components/AudioRecorder';
import LanguageSelector from '@/components/LanguageSelector';
import SettingsModal from '@/components/SettingsModal';
import HistorySidebar, { HistoryItem } from '@/components/HistorySidebar';
import NetworkStatus from '@/components/NetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('auto');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

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
  }, []);

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
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const handleTranscriptionComplete = (text: string, detectedLanguage?: string) => {
    setTranscript(prev => prev ? `${prev}\n\n${text}` : text);
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

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors duration-300">

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <MessageSquare className="w-4 h-4 text-white dark:text-black" />
          </div>
          <div className="whitespace-nowrap">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              <span className="text-orange-600 dark:text-orange-500">I</span>ndi-क
            </h1>
          </div>
        </div>

        <div className="flex-1 text-center hidden lg:block px-4">
          <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Your home for voice-to-text for Indian languages
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile History Button from wireframe */}
          <button
            onClick={() => document.getElementById('recent-history')?.scrollIntoView({ behavior: 'smooth' })}
            className="md:hidden px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center space-x-1.5 border border-zinc-200 dark:border-zinc-700"
          >
            <Clock className="w-3 h-3" />
            <span>history</span>
          </button>

          <div className="hidden md:block w-10" /> {/* Placeholder for desktop symmetry */}
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {errorBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-3 flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 text-sm font-medium"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 text-center md:text-left">
              <span>{errorBanner}</span>
              <div className="flex items-center space-x-3">
                {errorBanner.includes('API Key') && (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setErrorBanner(null);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 transition-colors"
                  >
                    Open Settings
                  </button>
                )}
                <button onClick={() => setErrorBanner(null)} className="underline opacity-75 hover:opacity-100 text-xs">Dismiss</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex-1 flex flex-col md:overflow-hidden overflow-y-auto">

        {/* Mobile Wireframe Layout */}
        <div className="md:hidden flex flex-col p-4 space-y-4">

          {/* Row 2: Drop-down selector & Tap to Speak */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <LanguageSelector
                selectedLanguage={language}
                onSelectLanguage={setLanguage}
                className="!mb-0"
              />
            </div>
            <div className="col-span-2">
              <AudioRecorder
                onTranscriptionComplete={handleTranscriptionComplete}
                onError={handleError}
                language={language}
                apiKey={apiKey}
                className="h-[46px]" // Approximating selector height
              />
            </div>
          </div>

          {/* Row 3: Transcription Canvas */}
          <div className="flex-1 min-h-[40vh] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative group">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed p-6 resize-none placeholder-zinc-300 font-normal outline-none"
              placeholder="transcription canvas,"
            />
            {transcript && (
              <button
                onClick={handleCopy}
                className="absolute top-4 right-4 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm"
              >
                {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              </button>
            )}
          </div>

          {/* History Anchor */}
          <div id="recent-history" className="pt-2">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2 mb-2">Recent History</h2>
            <HistorySidebar
              history={history}
              onDelete={handleDeleteHistory}
              onSelect={(text) => {
                setTranscript(prev => prev ? `${prev}\n\n${text}` : text);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onClearAll={handleClearHistory}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden"
            />
          </div>

          {/* Row 4: Credits */}
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30 p-6 flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-orange-600/70 dark:text-orange-400/70 uppercase tracking-[0.2em] font-bold">Powered Using</span>
              <img
                src="/logos/sarvam-wordmark-black.svg"
                alt="Sarvam AI"
                className="h-4 dark:invert opacity-80"
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">State-of-the-art Indic Voice Models</p>
          </div>

          {/* Row 5: Author / Contact */}
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <p className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">
              Created by <a href="https://github.com/alwaysbiryani/indi-ka" target="_blank" rel="noopener noreferrer" className="text-zinc-800 dark:text-zinc-200 font-bold hover:underline">Manideep</a> / AI for India
            </p>
          </div>

          {/* Row 6: Online Indicator */}
          <div className="flex justify-center py-2 pb-10">
            <NetworkStatus fixed={false} />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-12 gap-0 flex-1 md:h-[calc(100vh-65px)] border-t border-zinc-100 dark:border-zinc-800/50">

          {/* Desktop Left: Selector */}
          <aside className="md:col-span-3 lg:col-span-2 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 p-4 flex flex-col">
            <LanguageSelector
              selectedLanguage={language}
              onSelectLanguage={setLanguage}
              className="mb-4"
            />
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
              <h3 className="text-blue-600 dark:text-blue-400 font-semibold text-xs mb-1 uppercase tracking-wider">Pro Tip</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Speaking naturally in Hinglish, English or your local language? Set language to 'Auto' for best results.
              </p>
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-[10px] text-zinc-400 text-center">
                Created by <a href="https://github.com/alwaysbiryani/indi-ka" target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-600 dark:text-zinc-300 hover:underline">Manideep</a> / AI for India
              </p>
            </div>
          </aside>

          {/* Desktop Center: Canvas & Tap to Speak */}
          <section className="md:col-span-6 lg:col-span-7 flex flex-col bg-white dark:bg-zinc-950">
            <div className="p-6 w-full max-w-xl mx-auto">
              <AudioRecorder
                onTranscriptionComplete={handleTranscriptionComplete}
                onError={handleError}
                language={language}
                apiKey={apiKey}
              />
            </div>

            <div className="flex-1 relative group w-full max-w-4xl mx-auto flex flex-col">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full h-full bg-transparent border-none focus:ring-0 text-lg md:text-xl text-zinc-800 dark:text-zinc-200 leading-relaxed p-8 resize-none placeholder-zinc-300 font-normal custom-scrollbar outline-none"
                placeholder="Transcribed text will appear here..."
              />
              <div className="absolute top-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-400"
                >
                  {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </section>

          {/* Desktop Right: History & Credits */}
          <aside className="md:col-span-3 lg:col-span-3 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <HistorySidebar
                history={history}
                onDelete={handleDeleteHistory}
                onSelect={(text) => setTranscript(prev => prev ? `${prev}\n\n${text}` : text)}
                onClearAll={handleClearHistory}
                className="h-full bg-transparent border-none"
              />
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30 flex flex-col items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] text-orange-600/70 dark:text-orange-400/70 uppercase tracking-[0.2em] font-bold">Powered Using</span>
                  <img
                    src="/logos/sarvam-wordmark-black.svg"
                    alt="Sarvam AI"
                    className="h-3.5 dark:invert opacity-80"
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <NetworkStatus fixed={false} />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </main>
  );
}
