
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Save, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    onSaveApiKey: (key: string) => void;
}

export default function SettingsModal({ isOpen, onClose, apiKey, onSaveApiKey }: SettingsModalProps) {
    const [localApiKey, setLocalApiKey] = useState(apiKey);
    const [showKey, setShowKey] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);

    const isDirty = localApiKey !== apiKey;

    const handleClose = useCallback(() => {
        // Auto-save if dirty
        if (localApiKey !== apiKey && localApiKey.trim()) {
            onSaveApiKey(localApiKey);
        }
        onClose();
    }, [localApiKey, apiKey, onSaveApiKey, onClose]);

    const handleSave = useCallback(() => {
        onSaveApiKey(localApiKey);
        onClose();
    }, [localApiKey, onSaveApiKey, onClose]);

    useEffect(() => {
        setLocalApiKey(apiKey);
    }, [apiKey]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
        setShowKey(false); // Reset visibility when closing
    }, [isOpen]);

    // Escape key handler
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    // Focus trap: cycle through close button → input → toggle → cancel → save
    useEffect(() => {
        if (!isOpen) return;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusable = [
                closeButtonRef.current,
                inputRef.current,
                saveButtonRef.current,
            ].filter(Boolean) as HTMLElement[];

            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleTab);
        return () => document.removeEventListener('keydown', handleTab);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="settings-title"
                        className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6"
                    >
                        <button
                            ref={closeButtonRef}
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] rounded-full active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                            aria-label="Close settings"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-3 bg-[var(--accent)]/10 rounded-xl border border-[var(--accent)]/20">
                                <Key className="w-6 h-6 text-[var(--accent)]" />
                            </div>
                            <div>
                                <h2 id="settings-title" className="text-xl font-bold text-[var(--text-primary)]">API Configuration</h2>
                                <p className="text-sm text-[var(--text-secondary)]">Configure your Sarvam AI connection</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="api-key-input" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                    Sarvam AI API Key
                                </label>
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        id="api-key-input"
                                        type={showKey ? 'text' : 'password'}
                                        value={localApiKey}
                                        onChange={(e) => setLocalApiKey(e.target.value)}
                                        placeholder="Enter your API key..."
                                        className="w-full px-4 py-3 pr-12 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] focus:border-[var(--accent)] transition-all font-mono text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSave();
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                                        aria-label={showKey ? 'Hide API key' : 'Show API key'}
                                        tabIndex={-1}
                                    >
                                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                                    Your API key is stored locally in your browser. For a permanent deployment on Vercel, add <strong>SARVAM_API_KEY</strong> to your Vercel Environment Variables.
                                </p>
                                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                                    Get your key from <a href="https://www.sarvam.ai/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded">sarvam.ai</a>.
                                </p>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                {isDirty && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-xs font-medium text-[var(--warning)]"
                                    >
                                        Unsaved changes
                                    </motion.span>
                                )}
                                <div className={`flex space-x-3 ${isDirty ? '' : 'ml-auto'}`}>
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        ref={saveButtonRef}
                                        onClick={handleSave}
                                        className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#FF9933] to-[#138808] hover:from-[#FFB366] hover:to-[#34D058] text-white rounded-lg shadow-lg hover:shadow-[var(--accent)]/25 transition-all active:scale-95 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>Save Changes</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
