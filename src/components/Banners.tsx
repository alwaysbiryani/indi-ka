
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check } from 'lucide-react';

interface BannersProps {
    errorBanner: string | null;
    showAutoCopyBanner: boolean;
}

export function Banners({ errorBanner, showAutoCopyBanner }: BannersProps) {
    return (
        <>
            <AnimatePresence>
                {errorBanner && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="absolute top-0 left-4 right-4 bg-[var(--surface)]/95 border border-red-500/30 text-[var(--text-primary)] px-5 py-4 rounded-2xl shadow-xl z-[100] flex items-center justify-between backdrop-blur-xl"
                    >
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                            <span className="text-sm font-medium truncate max-w-[200px]">{errorBanner}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAutoCopyBanner && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 16, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--surface)]/95 border border-green-500/20 text-[var(--text-primary)] px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08),0_0_0_1px_rgba(34,197,94,0.1)] z-[100] flex items-center space-x-3 backdrop-blur-2xl whitespace-nowrap"
                    >
                        <div className="bg-green-500 p-1 rounded-full shadow-sm">
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">Copied to clipboard</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
