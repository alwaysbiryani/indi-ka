
'use client';

import { useState, useEffect, RefObject } from 'react';

export function useIntersectionObserver(elementRef: RefObject<Element | null>, threshold = 0.1) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold }
        );

        const currentElement = elementRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
    }, [elementRef, threshold]);

    return isVisible;
}
