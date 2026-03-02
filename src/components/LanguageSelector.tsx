'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface LanguageSelectorProps {
    selectedLanguage: string;
    onSelectLanguage: (lang: string) => void;
    className?: string;
    'data-testid'?: string;
}

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

const LanguageSelector = React.memo(({ selectedLanguage, onSelectLanguage, className, 'data-testid': testId }: LanguageSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const selected = languages.find(l => l.code === selectedLanguage);

    const openDropdown = useCallback(() => {
        setIsOpen(true);
        const selectedIdx = languages.findIndex(l => l.code === selectedLanguage);
        setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
    }, [selectedLanguage]);

    const closeDropdown = useCallback((restoreFocus = true) => {
        setIsOpen(false);
        setFocusedIndex(-1);
        if (restoreFocus) triggerRef.current?.focus();
    }, []);

    const selectItem = useCallback((code: string) => {
        onSelectLanguage(code);
        closeDropdown(true);
    }, [onSelectLanguage, closeDropdown]);

    // Focus the highlighted option when focusedIndex changes
    useEffect(() => {
        if (isOpen && focusedIndex >= 0) {
            optionRefs.current[focusedIndex]?.focus();
        }
    }, [isOpen, focusedIndex]);

    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowUp':
                e.preventDefault();
                openDropdown();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (isOpen) closeDropdown();
                else openDropdown();
                break;
            case 'Escape':
                if (isOpen) {
                    e.preventDefault();
                    closeDropdown();
                }
                break;
        }
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(index < languages.length - 1 ? index + 1 : 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(index > 0 ? index - 1 : languages.length - 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                selectItem(languages[index].code);
                break;
            case 'Escape':
                e.preventDefault();
                closeDropdown();
                break;
            case 'Home':
                e.preventDefault();
                setFocusedIndex(0);
                break;
            case 'End':
                e.preventDefault();
                setFocusedIndex(languages.length - 1);
                break;
            case 'Tab':
                // Close on Tab (natural exit)
                closeDropdown(false);
                break;
        }
    };

    return (
        <div className={cn("relative w-full font-sans", className)} data-testid={testId}>
            <button
                ref={triggerRef}
                onClick={() => isOpen ? closeDropdown() : openDropdown()}
                onKeyDown={handleTriggerKeyDown}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Target Language: ${selected?.label}`}
                className="w-full flex items-center justify-between px-1 bg-transparent border-none rounded-[20px] hover:bg-[var(--surface-hover)] transition-all duration-200 active:scale-[0.99] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            >
                <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--text-primary)] text-[var(--app-bg)] font-bold text-sm border border-black/5 transition-all shadow-sm group-hover:scale-105">
                        {selected?.id}
                    </div>
                    <div className="text-left">
                        <p className="text-[length:var(--font-size-caption)] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">Target Language</p>
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
                            onClick={() => closeDropdown()}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            role="listbox"
                            aria-label="Select target language"
                            aria-activedescendant={focusedIndex >= 0 ? `lang-option-${languages[focusedIndex].code}` : undefined}
                            className="absolute left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-[32px] shadow-xl overflow-hidden z-[400] max-h-[400px] overflow-y-auto custom-scrollbar p-2"
                        >
                            <div className="p-1.5 grid grid-cols-1 gap-0.5">
                                {languages.map((lang, index) => (
                                    <button
                                        key={lang.code}
                                        ref={(el) => { optionRefs.current[index] = el; }}
                                        id={`lang-option-${lang.code}`}
                                        role="option"
                                        aria-selected={selectedLanguage === lang.code}
                                        onClick={() => selectItem(lang.code)}
                                        onKeyDown={(e) => handleOptionKeyDown(e, index)}
                                        className={cn(
                                            "w-full px-4 py-3 text-left text-sm rounded-2xl transition-all flex items-center justify-between group mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]",
                                            selectedLanguage === lang.code
                                                ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] shadow-sm'
                                                : focusedIndex === index
                                                    ? 'bg-[var(--surface-hover)]/60 text-[var(--text-primary)]'
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
});

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;
