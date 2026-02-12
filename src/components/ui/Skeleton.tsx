
'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse bg-[var(--surface-hover)] rounded-xl", className)} />
    );
}

export function TaglineSkeleton() {
    return (
        <div className="h-20 flex flex-col items-center justify-center space-y-2 mb-8 w-full">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-64 opacity-60" />
        </div>
    );
}
