'use client';

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

export function Analytics() {
    if (typeof window === "undefined") return null;

    // Keep analytics off mobile (including iOS) to reduce runtime overhead.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = window.innerWidth < 768 || isIOS;

    if (isMobile) return null;

    return (
        <>
            <SpeedInsights />
            <VercelAnalytics />
        </>
    );
}
