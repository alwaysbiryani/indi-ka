
'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, MessageSquare, AlertCircle, Clock, X } from 'lucide-react';
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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
          <div className="w-9 h-9 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <MessageSquare className="w-5 h-5 text-zinc-50 dark:text-zinc-950" />
          </div>
          <div className="whitespace-nowrap">
            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#FF9933] via-zinc-400 dark:via-white to-[#138808] bg-clip-text text-transparent select-none">
              Indi-क
            </h1>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center space-x-2 whitespace-nowrap">
          <span className="text-[10px] md:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center space-x-2">
            <span>🇮🇳</span>
            <span className="opacity-30">|</span>
            <span>your home for Voice-To-Text</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition-colors flex items-center space-x-2 border border-zinc-200 dark:border-zinc-700"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>HISTORY</span>
          </button>
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {errorBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-3 flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 text-sm font-medium z-50"
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
                <button onClick={() => setErrorBanner(null)} className="underline opacity-75 hover:opacity-100 text-xs text-white">Dismiss</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex-1 flex flex-col overflow-hidden">

        {/* Mobile Layout (Visible on Small Screens) */}
        <div className="md:hidden flex flex-col flex-1 p-5 space-y-6 overflow-y-auto">

          {/* Tap to Speak and Language Selector */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-12 xs:col-span-7">
              <LanguageSelector
                selectedLanguage={language}
                onSelectLanguage={setLanguage}
                className="!mb-0"
              />
            </div>
            <div className="col-span-12 xs:col-span-5">
              <AudioRecorder
                onTranscriptionComplete={handleTranscriptionComplete}
                onError={handleError}
                language={language}
                apiKey={apiKey}
                isCompact={true}
                className="h-full"
              />
            </div>
          </div>

          {/* Transcription Canvas */}
          <div className="flex-1 min-h-[45vh] bg-white dark:bg-zinc-900/50 backdrop-blur-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl relative group overflow-hidden">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-lg md:text-xl text-zinc-800 dark:text-zinc-200 leading-relaxed p-7 resize-none placeholder-zinc-300 font-normal outline-none scrollbar-hide"
              placeholder="Start speaking to transcribe..."
            />
            {transcript && (
              <button
                onClick={handleCopy}
                className="absolute top-5 right-5 p-2.5 bg-zinc-100 dark:bg-zinc-800/80 backdrop-blur-md rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all hover:scale-110 active:scale-95"
              >
                {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              </button>
            )}
          </div>

          {/* Footers */}
          <div className="space-y-4 pt-2">
            <div className="bg-orange-50/50 dark:bg-orange-950/10 rounded-3xl border border-orange-100/50 dark:border-orange-900/20 p-6 flex flex-col items-center justify-center">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-orange-600/70 dark:text-orange-400/70 uppercase tracking-[0.2em] font-bold">POWERED USING</span>
                <img
                  src="/logos/sarvam-wordmark-black.svg"
                  alt="Sarvam AI"
                  className="h-4 dark:invert opacity-80"
                />
              </div>
            </div>

            <div className="bg-zinc-100/50 dark:bg-zinc-900/30 rounded-3xl border border-zinc-200 dark:border-zinc-800/50 p-4 px-5 flex items-center justify-between overflow-hidden">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-50 dark:text-zinc-950 shrink-0">N</div>
                <p className="text-[10px] text-zinc-500 font-medium truncate">
                  Created by <a href="https://github.com/alwaysbiryani/indi-ka" target="_blank" rel="noopener noreferrer" className="text-zinc-800 dark:text-zinc-200 font-bold hover:underline">Manideep</a> / AI for India
                </p>
              </div>
              <div className="shrink-0 scale-90 origin-right">
                <NetworkStatus fixed={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout (Visible on Medium+ Screens) */}
        <div className="hidden md:grid md:grid-cols-12 gap-0 flex-1 md:h-[calc(100vh-65px)] border-t border-zinc-100 dark:border-zinc-800/50">

          <aside className="md:col-span-3 lg:col-span-2 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 p-6 flex flex-col">
            <div className="mb-6">
              <LanguageSelector
                selectedLanguage={language}
                onSelectLanguage={setLanguage}
                className="mb-4"
              />
            </div>

            <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
              <h3 className="text-blue-600 dark:text-blue-400 font-semibold text-xs mb-1 uppercase tracking-wider">Pro Tip</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Speaking naturally in Hinglish, English or your local language? Set language to 'Auto' for best results.
              </p>
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-center space-y-4">
              <NetworkStatus fixed={false} />
              <p className="text-[10px] text-zinc-400 text-center">
                Created by <a href="https://github.com/alwaysbiryani/indi-ka" target="_blank" rel="noopener noreferrer" className="font-bold text-zinc-600 dark:text-zinc-300 hover:underline">Manideep</a> / AI for India
              </p>
            </div>
          </aside>

          <section className="md:col-span-9 lg:col-span-10 flex flex-col bg-white dark:bg-zinc-950 p-8 overflow-hidden">
            <div className="max-w-4xl w-full mx-auto flex flex-col h-full space-y-6">
              <AudioRecorder
                onTranscriptionComplete={handleTranscriptionComplete}
                onError={handleError}
                language={language}
                apiKey={apiKey}
                className="max-w-xl mx-auto"
              />

              <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/30 rounded-[32px] border border-zinc-200 dark:border-zinc-800 relative group overflow-hidden">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full h-full bg-transparent border-none focus:ring-0 text-xl text-zinc-800 dark:text-zinc-200 leading-relaxed p-10 resize-none placeholder-zinc-300 font-normal outline-none"
                  placeholder="Transcribed text will appear here..."
                />
                <button
                  onClick={handleCopy}
                  className="absolute top-8 right-8 p-3 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-md border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 transition-all opacity-0 group-hover:opacity-100"
                >
                  {hasCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-center px-6 py-4 bg-orange-50/30 dark:bg-orange-950/10 rounded-2xl border border-orange-100/30 dark:border-orange-900/10">
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] text-orange-600/70 dark:text-orange-400/70 uppercase tracking-[0.2em] font-bold">POWERED USING</span>
                  <img
                    src="/logos/sarvam-wordmark-black.svg"
                    alt="Sarvam AI"
                    className="h-4 dark:invert opacity-80"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 top-[10%] bg-zinc-50 dark:bg-zinc-950 rounded-t-[40px] z-[101] md:hidden flex flex-col shadow-2xl overflow-hidden border-t border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-zinc-50 dark:text-zinc-950" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Recent History</h2>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <HistorySidebar
                  history={history}
                  onDelete={handleDeleteHistory}
                  onSelect={(text) => {
                    setTranscript(prev => prev ? `${prev}\n\n${text}` : text);
                    setIsHistoryOpen(false);
                  }}
                  onClearAll={handleClearHistory}
                  className="bg-transparent border-none shadow-none"
                />
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-950 rounded-2xl font-bold transition-all active:scale-[0.98]"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </main>
  );
}
