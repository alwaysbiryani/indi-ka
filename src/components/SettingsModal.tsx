
'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Save } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    onSaveApiKey: (key: string) => void;
}

export default function SettingsModal({ isOpen, onClose, apiKey, onSaveApiKey }: SettingsModalProps) {
    const [localApiKey, setLocalApiKey] = useState(apiKey);

    useEffect(() => {
        setLocalApiKey(apiKey);
    }, [apiKey]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSaveApiKey(localApiKey);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 transform transition-all scale-100 opacity-100">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] rounded-full active:scale-95"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-[var(--accent)]/10 rounded-xl border border-[var(--accent)]/20">
                        <Key className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">API Configuration</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Configure your Sarvam AI connection</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Sarvam AI API Key
                        </label>
                        <input
                            type="password"
                            value={localApiKey}
                            onChange={(e) => setLocalApiKey(e.target.value)}
                            placeholder="Enter your API key..."
                            className="w-full px-4 py-3 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] focus:border-[var(--accent)] transition-all font-mono text-sm"
                        />
                        <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                            Your API key is stored locally in your browser. For a permanent deployment on Vercel, add <strong>SARVAM_API_KEY</strong> to your Vercel Environment Variables.
                        </p>
                        <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                            Get your key from <a href="https://www.sarvam.ai/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">sarvam.ai</a>.
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#FF9933] to-[#138808] hover:from-[#FFB366] hover:to-[#34D058] text-white rounded-lg shadow-lg hover:shadow-[var(--accent)]/25 transition-all active:scale-95 text-sm font-medium"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
