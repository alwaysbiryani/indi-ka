
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
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 transform transition-all scale-100 opacity-100">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/20">
                        <Key className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">API Configuration</h2>
                        <p className="text-sm text-gray-400">Configure your Sarvam AI connection</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Sarvam AI API Key
                        </label>
                        <input
                            type="password"
                            value={localApiKey}
                            onChange={(e) => setLocalApiKey(e.target.value)}
                            placeholder="Enter your API key..."
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono text-sm"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Your API key is stored locally in your browser and never sent anywhere else except Sarvam AI.
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95 text-sm font-medium"
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
