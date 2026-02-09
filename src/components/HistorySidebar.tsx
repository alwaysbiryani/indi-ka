
'use client';

import React from 'react';
import { Clock, Trash2, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface HistoryItem {
    id: string;
    text: string;
    timestamp: number;
    language: string;
    detectedLanguage?: string;
}

interface HistorySidebarProps {
    history: HistoryItem[];
    onDelete: (id: string) => void;
    onSelect: (text: string) => void;
    onClearAll: () => void;
    className?: string; // Allow custom classes for positioning/width
}

// Map Sarvam language codes to readable labels if needed
// Or just format them nicely. Sarvam often returns like 'hi-IN' or 'en-IN'
const formatLanguage = (lang: string, detected?: string) => {
    const code = (lang === 'auto' && detected && detected !== 'auto') ? detected : lang;

    // Manual mapping for cleaner display
    const langMap: Record<string, string> = {
        'hi-IN': 'HINDI',
        'en-IN': 'ENGLISH',
        'bn-IN': 'BENGALI',
        'gu-IN': 'GUJARATI',
        'kn-IN': 'KANNADA',
        'ml-IN': 'MALAYALAM',
        'mr-IN': 'MARATHI',
        'or-IN': 'ODIA',
        'pa-IN': 'PUNJABI',
        'ta-IN': 'TAMIL',
        'te-IN': 'TELUGU',
        'hinglish': 'HINGLISH',
        'auto': 'AUTO'
    };

    return langMap[code] || code.split('-')[0].toUpperCase();

};

export default function HistorySidebar({ history, onDelete, onSelect, onClearAll, className }: HistorySidebarProps) {
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    const handleCopy = (e: React.MouseEvent, id: string, text: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onDelete(id);
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold text-xs text-zinc-500 uppercase tracking-widest">Recent Transcriptions</h2>
                {history.length > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 space-y-3 opacity-60">
                        <Clock className="w-8 h-8 stroke-[1.5]" />
                        <p className="text-xs font-medium">No history yet</p>
                    </div>
                ) : (
                    history.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            key={item.id}
                            onClick={() => onSelect(item.text)}
                            className="group relative bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl p-4 transition-all cursor-pointer shadow-sm hover:shadow-md"
                        >
                            <p className="text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm line-clamp-6 mb-6 font-normal leading-relaxed text-ellipsis">
                                {item.text}
                            </p>

                            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                <span className={`px-2 py-0.5 rounded-full border ${(item.language === 'auto' && (!item.detectedLanguage || item.detectedLanguage === 'auto'))
                                    ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                                    : 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/20 text-purple-600 dark:text-purple-400'
                                    } uppercase tracking-wider`}>
                                    {formatLanguage(item.language, item.detectedLanguage)}
                                </span>
                                <span>
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-lg p-1 border border-zinc-200 dark:border-zinc-700">
                                <button
                                    onClick={(e) => handleCopy(e, item.id, item.text)}
                                    className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                                >
                                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, item.id)}
                                    className="p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
