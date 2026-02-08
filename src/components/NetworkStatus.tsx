
'use client'
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatusProps {
    fixed?: boolean;
}

export default function NetworkStatus({ fixed = true }: NetworkStatusProps) {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className={`${fixed ? 'fixed bottom-4 right-4 z-50' : 'relative w-full justify-center'} px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-sm transition-colors text-xs font-medium flex items-center space-x-2 ${isOnline
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}>
            {isOnline ? (
                <>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Online</span>
                </>
            ) : (
                <>
                    <WifiOff className="w-3 h-3" />
                    <span>Offline</span>
                </>
            )}
        </div>
    );
}
