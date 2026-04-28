'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';

interface OnlineStatusToastsProps {
  isOnline: boolean;
  justReconnected: boolean;
}

export default function OnlineStatusToasts({ isOnline, justReconnected }: OnlineStatusToastsProps) {
  return (
    <>
      <AnimatePresence>
        {!isOnline && (
          <m.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-0 left-4 right-4 bg-[var(--surface)]/95 border border-[var(--warning)]/30 text-[var(--text-primary)] px-5 py-3 rounded-2xl shadow-xl z-[99] flex items-center space-x-3 backdrop-blur-xl"
          >
            <WifiOff className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
            <span className="text-sm font-medium">You&apos;re offline. Recording is disabled.</span>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {justReconnected && isOnline && (
          <m.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-0 left-4 right-4 bg-[var(--surface)]/95 border border-[var(--success)]/30 text-[var(--text-primary)] px-5 py-3 rounded-2xl shadow-xl z-[99] flex items-center space-x-3 backdrop-blur-xl"
          >
            <Wifi className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
            <span className="text-sm font-medium">Back online</span>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
