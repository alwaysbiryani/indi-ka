
'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Copy, Check, MessageSquare, Menu, LogIn, AlertCircle } from 'lucide-react';
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
    // Only fetch from local storage if needed, but we prefer .env or hardcoded source
    // But since this is client-side, we might still want to allow user override via settings
    const storedKey = localStorage.getItem('sarvam_api_key');
    if (storedKey) setApiKey(storedKey);
    // Removed the "setIsSettingsOpen(true)" call to start fresh without nagging

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
      detectedLanguage: detectedLanguage // Save detected language (e.g., 'hi-IN')
    };
    const newHistory = [newItem, ...history];
    saveHistory(newHistory);
    setErrorBanner(null); // Clear errors on success
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
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans overflow-hidden transition-colors duration-300">



      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center space-x-3 w-1/4">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center shadow-sm">
            <MessageSquare className="w-4 h-4 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              <span className="text-orange-600 dark:text-orange-500">I</span>ndi-क
            </h1>
          </div>
        </div>

        <div className="flex-1 text-center hidden md:block">
          <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wide">
            The Home for Hinglish
          </span>
        </div>

        <div className="flex items-center justify-end space-x-4 w-1/4">

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="md:hidden p-2 text-zinc-400"
          >
            <Settings className="w-5 h-5" />
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
            className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-3 flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 text-sm font-medium"
          >
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid Layout */}
      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-0 h-[calc(100vh-65px)]">

        {/* Left Column: Language Selector */}
        <aside className="hidden md:flex md:col-span-3 lg:col-span-2 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="p-4 h-full flex flex-col">
            <LanguageSelector
              selectedLanguage={language}
              onSelectLanguage={setLanguage}
              className="mb-2 relative z-50"
            />
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20 relative z-0">
              <h3 className="text-blue-600 dark:text-blue-400 font-semibold text-xs mb-1 uppercase tracking-wider">Pro Tip</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Speaking naturally in Hinglish, English or your local language? Set language to 'Auto' for best results.
              </p>
            </div>
            <div className="mt-auto">
              <div className="mb-4 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-xs mb-1 uppercase tracking-wider text-zinc-500">Powered By</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Sarvam AI</span>
                  <span className="text-xs text-zinc-400">for Indian Languages</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 text-center border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-400">Created by <a href="https://github.com/alwaysbiryani" target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-600 dark:text-zinc-300 hover:underline">Manideep</a></p>
            </div>
          </div>
        </aside>

        {/* Center Column: Canvas & Recorder */}
        <section className="col-span-1 md:col-span-6 lg:col-span-7 flex flex-col h-full relative bg-white dark:bg-zinc-950">

          {/* Recorder Area - Top */}
          <div className="p-6 w-full max-w-xl mx-auto z-10">
            <AudioRecorder
              onTranscriptionComplete={handleTranscriptionComplete}
              onError={handleError}
              language={language}
              apiKey={apiKey}
              className=""
            />
          </div>

          {/* Canvas */}
          <div className="flex-1 relative group w-full max-w-4xl mx-auto">
            <textarea
              id="transcript-area"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-lg md:text-xl text-zinc-800 dark:text-zinc-200 leading-relaxed p-8 resize-none placeholder-zinc-300 font-normal custom-scrollbar outline-none"
              placeholder="Transcribed text will appear here..."
            />

            {/* Floating Copy Action */}
            <div className="absolute top-0 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                disabled={!transcript}
                className="p-2 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all disabled:opacity-0"
              >
                {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </section>

        {/* Right Column: History */}
        <aside className="hidden md:flex md:col-span-3 lg:col-span-3 flex-col h-full border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="flex-1 overflow-hidden">
            <HistorySidebar
              history={history}
              onDelete={handleDeleteHistory}
              onSelect={(text) => setTranscript(prev => prev ? `${prev}\n\n${text}` : text)}
              onClearAll={handleClearHistory}
              className="h-full bg-transparent border-none"
            />
          </div>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            {/* Ads Space Placeholder */}
            <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700 mb-4">
              <span className="text-xs text-zinc-400 uppercase tracking-widest font-medium">Ads Space</span>
            </div>

            {/* Online Indicator */}
            <div className="flex justify-center">
              <NetworkStatus fixed={false} />
            </div>
          </div>
        </aside>

      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

    </main>
  );
}
