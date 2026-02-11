
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
                <h2 className="font-black text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em]">Recent Transcriptions</h2>
                {history.length > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors"
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
                        <p className="text-[10px] font-black uppercase tracking-widest">No history yet</p>
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
                            className="group relative bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-3xl p-6 transition-all cursor-pointer shadow-sm hover:shadow-xl"
                        >
                            <p className="text-[var(--text-primary)] text-sm line-clamp-6 mb-8 pr-2 font-medium leading-relaxed">
                                {item.text}
                            </p>

                            <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-bold">
                                <span className={`px-2 py-1 rounded-lg border shadow-sm ${(item.language === 'auto' && (!item.detectedLanguage || item.detectedLanguage === 'auto'))
                                        ? 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-secondary)]'
                                        : 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                                    } uppercase tracking-widest`}>
                                    {formatLanguage(item.language, item.detectedLanguage)}
                                </span>
                                <span className="opacity-60">
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--surface)] shadow-2xl rounded-xl p-1 border border-[var(--border)] z-10">
                                <button
                                    onClick={(e) => handleCopy(e, item.id, item.text)}
                                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-all"
                                >
                                    {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, item.id)}
                                    className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
