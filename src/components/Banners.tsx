
'use client';

import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { AlertCircle, Check, X, RefreshCw } from 'lucide-react';

interface BannersProps {
    errorBanner: string | null;
    showAutoCopyBanner: boolean;
    onDismissError?: () => void;
    onRetry?: () => void;
}

export const Banners = React.memo(function Banners({ errorBanner, showAutoCopyBanner, onDismissError, onRetry }: BannersProps) {
    const dragX = useMotionValue(0);
    const errorOpacity = useTransform(dragX, [-150, 0, 150], [0.3, 1, 0.3]);

    return (
        <>
            <AnimatePresence>
                {errorBanner && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.5}
                        style={{ x: dragX, opacity: errorOpacity }}
                        onDragEnd={(_, info) => {
                            if (Math.abs(info.offset.x) > 100) {
                                onDismissError?.();
                            }
                        }}
                        className="absolute top-0 left-4 right-4 bg-[var(--surface)]/95 border border-[var(--error)]/30 text-[var(--text-primary)] px-4 py-3 rounded-2xl shadow-xl z-[100] flex items-center justify-between backdrop-blur-xl cursor-grab active:cursor-grabbing"
                    >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[var(--error)]" />
                            <span className="text-sm font-medium truncate">{errorBanner}</span>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                                    aria-label="Retry"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {onDismissError && (
                                <button
                                    onClick={onDismissError}
                                    className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                                    aria-label="Dismiss error"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showAutoCopyBanner && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--surface)]/95 border border-[var(--success)]/20 text-[var(--text-primary)] px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08),0_0_0_1px_rgba(34,197,94,0.1)] z-[100] flex items-center space-x-3 backdrop-blur-2xl whitespace-nowrap animate-fade-scale-in">
                    <div className="bg-[var(--success)] p-1 rounded-full shadow-sm">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">Copied to clipboard</span>
                </div>
            )}
        </>
    );
});
