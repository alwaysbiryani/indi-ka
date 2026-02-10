
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

    const langMap: Record<string, { label: string, symbol: string }> = {
        'hi-IN': { label: 'HINDI', symbol: 'अ' },
        'te-IN': { label: 'TELUGU', symbol: 'అ' },
        'ta-IN': { label: 'TAMIL', symbol: 'அ' },
        'mr-IN': { label: 'MARATHI', symbol: 'म' },
        'bn-IN': { label: 'BENGALI', symbol: 'অ' },
        'kn-IN': { label: 'KANNADA', symbol: 'ಕ' },
        'gu-IN': { label: 'GUJARATI', symbol: 'અ' },
        'ml-IN': { label: 'MALAYALAM', symbol: 'അ' },
        'en-IN': { label: 'ENGLISH', symbol: 'En' },
        'hinglish': { label: 'HINGLISH', symbol: 'Hi' },
        'auto': { label: 'AUTO', symbol: 'A' }
    };

    return langMap[code] || { label: code.split('-')[0].toUpperCase(), symbol: '?' };
};

export default function HistorySidebar({ history, onDelete, onSelect, onClearAll, className }: HistorySidebarProps) {
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    const handleCopy = (e: React.MouseEvent, id: string, text: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className={`flex flex-col h-full bg-transparent ${className}`}>
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between">
                <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">History</h2>
                {history.length > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-[10px] font-black text-red-500/70 hover:text-red-500 uppercase tracking-widest transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
                        <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Clock className="w-8 h-8 text-zinc-400" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">No recordings yet</p>
                    </div>
                ) : (
                    history.map((item) => {
                        const langInfo = formatLanguage(item.language, item.detectedLanguage);
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={item.id}
                                onClick={() => onSelect(item.text)}
                                className="group relative bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-5 transition-all cursor-pointer hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-black/5 active:scale-[0.98]"
                            >
                                <p className="text-zinc-800 dark:text-zinc-200 text-sm line-clamp-4 mb-8 font-medium leading-relaxed pr-2">
                                    {item.text}
                                </p>

                                <div className="flex justify-between items-end mt-auto pt-4 border-t border-zinc-100 dark:border-white/5">
                                    <div className="flex flex-col space-y-1.5">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                                                {langInfo.symbol}
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                {langInfo.label}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-bold text-zinc-400 pl-1">
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={(e) => handleCopy(e, item.id, item.text)}
                                            className="p-3 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"
                                        >
                                            {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(item.id);
                                            }}
                                            className="p-3 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/10 text-zinc-400 hover:text-red-500 transition-all active:scale-90"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
