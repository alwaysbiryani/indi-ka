
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Github, Layout, Cpu, Globe } from 'lucide-react';

const credits = [
    { name: 'Sarvam AI', role: 'Transcription', icon: <Cloud className="w-3.5 h-3.5" />, link: 'https://www.sarvam.ai/' },
    { name: 'Google Antigravity', role: 'IDE', icon: <Cpu className="w-3.5 h-3.5" />, link: 'https://antigravity.google/' },
    { name: 'Vercel', role: 'Deployment', icon: <Globe className="w-3.5 h-3.5" />, link: 'https://vercel.com/' },
    { name: 'Excalidraw', role: 'Wireframing', icon: <Layout className="w-3.5 h-3.5" />, link: 'https://excalidraw.com/' },
    { name: 'Developer', role: 'Repo', icon: <Github className="w-3.5 h-3.5" />, link: 'https://github.com/alwaysbiryani/indi-ka' },
];

export function CreditsMarquee() {
    const [isPaused, setIsPaused] = useState(false);

    return (
        <div className="mt-auto pb-8 relative z-10">
            <div className="w-full overflow-hidden flex items-center h-12 bg-[var(--surface)]/50 backdrop-blur-sm border-y border-[var(--border)]">
                <motion.div
                    className="flex items-center shrink-0"
                    animate={{
                        x: isPaused ? 0 : [0, -1000],
                        transition: {
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 40,
                                ease: "linear",
                            }
                        }
                    }}
                    onHoverStart={() => setIsPaused(true)}
                    onHoverEnd={() => setIsPaused(false)}
                >
                    {[...credits, ...credits, ...credits].map((credit, idx) => (
                        <a
                            key={idx}
                            href={credit.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2.5 px-4 mx-2 group/item shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <div className="text-[var(--text-primary)]">
                                {credit.icon}
                            </div>
                            <div className="flex items-baseline space-x-1.5">
                                <span className="text-[11px] font-bold text-[var(--text-primary)] tracking-wide">
                                    {credit.name}
                                </span>
                                <span className="text-[9px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                    {credit.role}
                                </span>
                            </div>
                        </a>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
