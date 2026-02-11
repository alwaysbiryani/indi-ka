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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-1 bg-transparent border-none rounded-[20px] hover:bg-[var(--surface-hover)] transition-all duration-200 active:scale-[0.99] group"
            >
                <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--text-primary)] text-[var(--app-bg)] font-bold text-sm border border-black/5 transition-all shadow-sm group-hover:scale-105">
                        {selected?.id}
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">Target Language</p>
                        <span className="text-sm font-bold text-[var(--text-primary)] transition-colors">
                            {selected?.label}
                        </span>
                    </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-[var(--text-secondary)] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[var(--text-primary)]' : ''}`} />
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
                            className="absolute left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-[32px] shadow-xl overflow-hidden z-[400] max-h-[400px] overflow-y-auto custom-scrollbar p-2"
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
                                            "w-full px-4 py-3 text-left text-sm rounded-2xl transition-all flex items-center justify-between group mb-1",
                                            selectedLanguage === lang.code
                                                ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                                        )}
                                    >
                                        <span className="flex items-center space-x-3">
                                            <span className={cn(
                                                "flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold transition-all",
                                                selectedLanguage === lang.code
                                                    ? "bg-[var(--text-primary)] text-[var(--app-bg)] shadow-md font-bold"
                                                    : "bg-[var(--surface-hover)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                                            )}>
                                                {lang.id}
                                            </span>
                                            <span className="font-bold tracking-tight">{lang.label}</span>
                                        </span>
                                        {selectedLanguage === lang.code && (
                                            <Check className="w-4 h-4 text-[var(--text-primary)]" />
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
