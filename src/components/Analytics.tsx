'use client';

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";

export function Analytics() {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        // Disable insights on mobile Safari specifically to avoid 
        // "Reduce Advanced Privacy Protections" banners/warnings.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // Only load on non-mobile or non-Safari browsers to be safe, 
        // or just disable for all mobile as per privacy/performance audits.
        const isMobile = window.innerWidth < 768 || isIOS;

        if (!isMobile) {
            setShouldLoad(true);
        }
    }, []);

    if (!shouldLoad) return null;

    return (
        <>
            <SpeedInsights />
            <VercelAnalytics />
        </>
    );
}
