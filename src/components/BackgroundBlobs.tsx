
'use client';

import React, { useState, useEffect, memo } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

export const BackgroundBlobs = memo(function BackgroundBlobs() {
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const isMobile = useIsMobile();

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div
                className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-[#FF9933]/[0.02] rounded-full aurora-animate will-change-transform"
                style={{
                    filter: isMobile ? 'blur(32px)' : 'blur(64px)',
                }}
            />
            <div
                className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] bg-[#138808]/[0.02] rounded-full aurora-animate will-change-transform"
                style={{
                    animationDelay: '1s',
                    filter: isMobile ? 'blur(32px)' : 'blur(64px)',
                }}
            />
        </div>
    );
});
