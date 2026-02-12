
'use client';

import React, { useState, useEffect } from 'react';

export function BackgroundBlobs() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-[#FF9933]/[0.02] rounded-full aurora-animate" />
            <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] bg-[#138808]/[0.02] rounded-full aurora-animate" style={{ animationDelay: '1s' }} />
        </div>
    );
}
