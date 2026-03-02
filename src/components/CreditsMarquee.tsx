
'use client';

import React from 'react';
import { Cloud, Github, Layout, Cpu, Globe } from 'lucide-react';

const credits = [
    { name: 'Sarvam AI', role: 'Transcription', icon: <Cloud className="w-3.5 h-3.5" />, link: 'https://www.sarvam.ai/' },
    { name: 'Google Antigravity', role: 'IDE', icon: <Cpu className="w-3.5 h-3.5" />, link: 'https://antigravity.google/' },
    { name: 'Vercel', role: 'Deployment', icon: <Globe className="w-3.5 h-3.5" />, link: 'https://vercel.com/' },
    { name: 'Excalidraw', role: 'Wireframing', icon: <Layout className="w-3.5 h-3.5" />, link: 'https://excalidraw.com/' },
    { name: 'Developer', role: 'Repo', icon: <Github className="w-3.5 h-3.5" />, link: 'https://github.com/alwaysbiryani/indi-ka' },
];

/**
 * Pure CSS marquee — no Framer Motion, no JS animation loop.
 * Uses CSS `@keyframes` with `translate3d` for GPU-composited scrolling.
 * Two copies of the list create a seamless infinite loop.
 * Pauses on hover via `[&:hover]` targeting the container.
 */
export function CreditsMarquee() {
    const creditItems = credits.map((credit, idx) => (
        <a
            key={idx}
            href={credit.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2.5 px-4 mx-2 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
            <div className="text-[var(--text-primary)]">
                {credit.icon}
            </div>
            <div className="flex items-baseline space-x-1.5">
                <span className="text-[length:var(--font-size-caption)] font-bold text-[var(--text-primary)] tracking-wide">
                    {credit.name}
                </span>
                <span className="text-[length:var(--font-size-caption)] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    {credit.role}
                </span>
            </div>
        </a>
    ));

    return (
        <div className="mt-auto pb-[max(env(safe-area-inset-bottom),1.5rem)] relative z-10 w-full">
            <div className="w-full overflow-hidden flex items-center h-10 bg-[var(--surface)]/50 backdrop-blur-sm border-y border-[var(--border)] [&:hover_.marquee-track]:pause-marquee">
                <div
                    className="marquee-track flex items-center shrink-0 animate-marquee"
                    style={{ willChange: 'transform' }}
                >
                    {/* First copy */}
                    {creditItems}
                    {/* Second copy for seamless loop */}
                    {creditItems}
                </div>
            </div>
        </div>
    );
}
