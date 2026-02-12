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
const formatLanguage = (lang: string, detected?: string) => {
    const code = (lang === 'auto' && detected && detected !== 'auto') ? detected : lang;

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
            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-4 opacity-40 py-20">
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
                            className="group relative bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-[20px] p-4 transition-all cursor-pointer active:scale-[0.99] shadow-sm"
                        >
                            <p className="text-[var(--text-primary)] text-sm line-clamp-3 mb-4 font-medium leading-relaxed opacity-90">
                                {item.text}
                            </p>

                            <div className="flex flex-col gap-3">
                                {/* Metadata Row */}
                                <div className="flex justify-between items-center text-[9px] text-[var(--text-secondary)] font-bold tracking-widest uppercase opacity-60">
                                    <span className="px-1.5 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface-hover)]">
                                        {formatLanguage(item.language, item.detectedLanguage)}
                                    </span>
                                    <span>
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Action Row */}
                                <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                                    <button
                                        onClick={(e) => handleCopy(e, item.id, item.text)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all ${copiedId === item.id
                                            ? 'text-emerald-500 bg-emerald-500/5'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                                            }`}
                                    >
                                        {copiedId === item.id ? (
                                            <>
                                                <Check className="w-3 h-3" />
                                                <span>Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={(e) => handleDelete(e, item.id)}
                                        className="flex-none flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold text-[var(--text-secondary)] hover:text-red-500/80 hover:bg-red-500/5 transition-all"
                                        aria-label="Delete"
                                    >
                                        <Trash2 className="w-3 h-3" />
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
