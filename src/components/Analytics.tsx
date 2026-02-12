
'use client';

import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect, useState } from "react";

export function Analytics() {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        // Disable speed insights on mobile Safari specifically to avoid 
        // "Reduce Advanced Privacy Protections" banners/warnings.
        // We check for mobile Safari using a light-touch check.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // Only load on non-mobile or non-Safari browsers to be safe, 
        // or just disable for all mobile as per requirement "Mobile only — do not change desktop behavior"
        const isMobile = window.innerWidth < 768 || isIOS;

        if (!isMobile) {
            setShouldLoad(true);
        }
    }, []);

    if (!shouldLoad) return null;

    return <SpeedInsights />;
}
