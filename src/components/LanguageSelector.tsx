
'use client';

import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LanguageSelectorProps {
    selectedLanguage: string;
    onSelectLanguage: (lang: string) => void;
    className?: string;
}

export default function LanguageSelector({ selectedLanguage, onSelectLanguage, className }: LanguageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'auto', label: 'Auto Detect', id: 'A' },
        { code: 'hinglish', label: 'Hinglish', id: 'Hi' },
        { code: 'hi-IN', label: 'Hindi', id: 'अ' },
        { code: 'te-IN', label: 'Telugu', id: 'అ' },
        { code: 'ta-IN', label: 'Tamil', id: 'அ' },
        { code: 'mr-IN', label: 'Marathi', id: 'म' },
        { code: 'bn-IN', label: 'Bengali', id: 'অ' },
        { code: 'kn-IN', label: 'Kannada', id: 'ಕ' },
        { code: 'gu-IN', label: 'Gujarati', id: 'અ' },
        { code: 'ml-IN', label: 'Malayalam', id: 'അ' },
        { code: 'en-IN', label: 'English', id: 'En' },
    ];

    const selected = languages.find(l => l.code === selectedLanguage);

    return (
        <div className={cn("relative w-full font-sans", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-[28px] hover:bg-white/60 transition-all duration-300 active:scale-[0.98] group shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
            >
                <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-base shadow-lg">
                        {selected?.id}
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Target Language</span>
                        <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                            {selected?.label}
                        </span>
                    </div>
                </div>
                <div className="p-2 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors">
                    <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform duration-300", isOpen && "rotate-180")} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[60]"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-0 right-0 mt-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-white dark:border-white/10 rounded-[32px] shadow-[0_24px_48px_rgba(0,0,0,0.1)] overflow-hidden z-[70] max-h-[400px] overflow-y-auto custom-scrollbar p-2"
                        >
                            <div className="grid grid-cols-1 gap-1">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            onSelectLanguage(lang.code);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full px-4 py-3 text-left rounded-2xl transition-all flex items-center justify-between group",
                                            selectedLanguage === lang.code
                                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl scale-[1.02]'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                                        )}
                                    >
                                        <span className="flex items-center space-x-4">
                                            <span className={cn(
                                                "flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black transition-all",
                                                selectedLanguage === lang.code
                                                    ? "bg-white/20 dark:bg-black/10 text-white dark:text-zinc-900"
                                                    : "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-white"
                                            )}>
                                                {lang.id}
                                            </span>
                                            <span className="font-bold tracking-tight">{lang.label}</span>
                                        </span>
                                        {selectedLanguage === lang.code && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-5 h-5 bg-white/20 dark:bg-black/10 rounded-full flex items-center justify-center"
                                            >
                                                <Check className="w-3 h-3 text-white dark:text-zinc-900" />
                                            </motion.div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
