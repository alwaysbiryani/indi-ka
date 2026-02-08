
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
        { code: 'en-IN', label: 'English', id: 'En' },
        { code: 'bn-IN', label: 'Bengali', id: 'অ' },
        { code: 'gu-IN', label: 'Gujarati', id: 'અ' },
        { code: 'kn-IN', label: 'Kannada', id: 'ಅ' },
        { code: 'ml-IN', label: 'Malayalam', id: 'അ' },
        { code: 'mr-IN', label: 'Marathi', id: 'म' },
        { code: 'or-IN', label: 'Odia', id: 'ଅ' },
        { code: 'pa-IN', label: 'Punjabi', id: 'ੳ' },
        { code: 'ta-IN', label: 'Tamil', id: 'அ' },
        { code: 'te-IN', label: 'Telugu', id: 'అ' },
    ];

    const selected = languages.find(l => l.code === selectedLanguage);

    return (
        <div className={cn("relative w-full font-sans", className)}>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                Select Language
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 active:scale-[0.99] group shadow-sm"
            >
                <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm border border-zinc-200 dark:border-zinc-700">
                        {selected?.id}
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {selected?.label}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-40 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent ring-1 ring-black/5"
                        >
                            <div className="p-1.5 grid grid-cols-1 gap-0.5">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            onSelectLanguage(lang.code);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2 text-left text-sm rounded-lg transition-colors flex items-center justify-between group",
                                            selectedLanguage === lang.code
                                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                                        )}
                                    >
                                        <span className="flex items-center space-x-3">
                                            <span className={cn(
                                                "flex items-center justify-center w-6 h-6 rounded text-xs font-bold transition-all",
                                                selectedLanguage === lang.code
                                                    ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
                                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"
                                            )}>
                                                {lang.id}
                                            </span>
                                            <span className="font-medium">{lang.label}</span>
                                        </span>
                                        {selectedLanguage === lang.code && (
                                            <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
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
