
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
        <div className={`flex flex-col h-full ${className} transition-colors duration-300`}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="font-bold text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em]">Recent Transcriptions</h2>
                {history.length > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-4 opacity-40">
                        <Clock className="w-10 h-10 stroke-[1]" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No history yet</p>
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
                            className="group relative bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl p-5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                            <p className="text-[var(--text-primary)] text-sm line-clamp-4 mb-4 font-medium leading-relaxed">
                                {item.text}
                            </p>

                            <div className="flex flex-col gap-3">
                                {/* Metadata Row */}
                                <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-bold tracking-wider uppercase">
                                    <span className={`px-2 py-1 rounded-md border ${(item.language === 'auto' && (!item.detectedLanguage || item.detectedLanguage === 'auto'))
                                        ? 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)]'
                                        : 'bg-purple-500/5 border-purple-500/20 text-purple-500'
                                        }`}>
                                        {formatLanguage(item.language, item.detectedLanguage)}
                                    </span>
                                    <span className="opacity-60">
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Action Row - Always visible, distinct touch targets */}
                                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]/50">
                                    <button
                                        onClick={(e) => handleCopy(e, item.id, item.text)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${copiedId === item.id
                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                            : 'bg-[var(--app-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
                                            }`}
                                    >
                                        {copiedId === item.id ? (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={(e) => handleDelete(e, item.id)}
                                        className="flex-none flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-red-500/80 hover:text-red-600 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all"
                                        aria-label="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
