
'use client';

import React from 'react';

export function BackgroundBlobs() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-[#FF9933]/[0.02] rounded-full aurora-animate" />
            <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] bg-[#138808]/[0.02] rounded-full aurora-animate" style={{ animationDelay: '1s' }} />
        </div>
    );
}
