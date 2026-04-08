
'use client';

import React, { useState, useRef } from 'react';
import { Mic, Loader2, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimpleScrollingWaveform } from '@/components/ui/Waveform';
import { cn } from '@/utils/cn';

interface AudioRecorderProps {
    onTranscriptionComplete: (text: string, detectedLanguage?: string, isPartial?: boolean, processingTime?: number) => void;
    onError: (msg: string) => void;
    language: string;
    apiKey: string;
    className?: string;
    isCompact?: boolean;
    variant?: 'default' | 'circular';
    onRecordingStart?: () => void;
    theme?: 'light' | 'dark';
    isOnline?: boolean;
}

const AudioRecorder = React.memo(function AudioRecorder({
    onTranscriptionComplete,
    onError,
    language,
    apiKey,
    className,
    isCompact,
    variant = 'default',
    onRecordingStart,
    theme = 'dark',
    isOnline = true
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");
    const [processingProgress, setProcessingProgress] = useState(0); // 0-100
    const [isMultiSegment, setIsMultiSegment] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
    const accumulatedTranscriptRef = useRef("");
    const detectedLanguageRef = useRef("auto");
    const [hasInteracted, setHasInteracted] = useState(true);
    const processingStartTimeRef = useRef<number | null>(null);
    const isProcessingRef = useRef(false);
    const segmentsCompletedRef = useRef(0);
    const totalSegmentsRef = useRef(1);
    const pendingSegmentsRef = useRef<Array<{ index: number; blob: Blob }>>([]);
    const inFlightSegmentsRef = useRef(0);
    const nextSegmentIndexRef = useRef(0);
    const nextEmitIndexRef = useRef(0);
    const pendingResultsRef = useRef<Map<number, { text: string; detectedLanguageCode: string }>>(new Map());
    const noMoreSegmentsRef = useRef(false);
    const resolveDrainRef = useRef<(() => void) | null>(null);
    const drainPromiseRef = useRef<Promise<void>>(Promise.resolve());
    const segmentTimingsRef = useRef<Array<{ index: number; requestMs: number; providerMs?: number; ok: boolean }>>([]);

    // Keep chunks under the provider's 30s hard cap with some safety margin.
    const TRANSCRIPTION_CHUNK_MS = 25000;
    const FORCED_FLUSH_EVERY_MS = 8000;
    const MAX_CONCURRENT_SEGMENTS = 2;

    React.useEffect(() => {
        const interacted = localStorage.getItem('audio_recorder_interacted');
        if (!interacted) setHasInteracted(false);
    }, []);

    // Auto-stop at 5 minutes
    React.useEffect(() => {
        if (recordingDuration >= 300) {
            stopRecording();
        }
    }, [recordingDuration]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (flushTimerRef.current) clearInterval(flushTimerRef.current);
        };
    }, []);

    const startRecording = async () => {
        if (!isOnline) {
            onError("You're offline. Connect to the internet to transcribe.");
            return;
        }
        processingStartTimeRef.current = null;
        if (!hasInteracted) {
            setHasInteracted(true);
            localStorage.setItem('audio_recorder_interacted', 'true');
        }
        // Haptic feedback on mobile
        if ('vibrate' in navigator) navigator.vibrate(40);
        if (onRecordingStart) onRecordingStart();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setActiveStream(stream);
            // Low bitrate optimization for faster upload
            const mediaRecorder = new MediaRecorder(stream, { audioBitsPerSecond: 16000 });
            mediaRecorderRef.current = mediaRecorder;

            const flushOrderedResults = () => {
                while (pendingResultsRef.current.has(nextEmitIndexRef.current)) {
                    const result = pendingResultsRef.current.get(nextEmitIndexRef.current);
                    pendingResultsRef.current.delete(nextEmitIndexRef.current);
                    nextEmitIndexRef.current += 1;
                    if (!result || !result.text) continue;
                    accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? " " : "") + result.text;
                    if (result.detectedLanguageCode) detectedLanguageRef.current = result.detectedLanguageCode;
                    onTranscriptionComplete(accumulatedTranscriptRef.current, detectedLanguageRef.current, true);
                }
            };

            const maybeResolveDrain = () => {
                if (!noMoreSegmentsRef.current) return;
                if (pendingSegmentsRef.current.length !== 0) return;
                if (inFlightSegmentsRef.current !== 0) return;
                if (resolveDrainRef.current) {
                    resolveDrainRef.current();
                    resolveDrainRef.current = null;
                }
            };

            const transcribeSegment = async (blob: Blob): Promise<{ text: string; detectedLanguageCode: string; providerMs?: number; ok: boolean; requestMs: number }> => {
                const requestStart = performance.now();
                try {
                    const formData = new FormData();
                    const extension = blob.type.includes('webm')
                        ? 'webm'
                        : blob.type.includes('wav')
                            ? 'wav'
                            : 'bin';
                    formData.append('audio', blob, `segment.${extension}`);

                    const response = await fetch(`/api/transcribe?language=${encodeURIComponent(language)}`, {
                        method: 'POST',
                        headers: { 'x-api-key': apiKey },
                        body: formData,
                    });

                    const requestMs = Math.round(performance.now() - requestStart);
                    if (response.ok) {
                        const data = await response.json();
                        return {
                            text: data.transcript || "",
                            detectedLanguageCode: data.detected_language_code || 'auto',
                            providerMs: data.metrics?.provider_ms,
                            ok: true,
                            requestMs,
                        };
                    } else {
                        const errData = await response.json();
                        onError(errData.details || errData.error || "Transcription failed");
                        return { text: "", detectedLanguageCode: 'auto', ok: false, requestMs };
                    }
                } catch (err) {
                    console.error("Segment transcription request failed", err);
                    return { text: "", detectedLanguageCode: 'auto', ok: false, requestMs: Math.round(performance.now() - requestStart) };
                }
            };

            const processSegmentTask = async (index: number, blob: Blob) => {
                inFlightSegmentsRef.current += 1;
                try {
                    const result = await transcribeSegment(blob);
                    pendingResultsRef.current.set(index, {
                        text: result.text,
                        detectedLanguageCode: result.detectedLanguageCode,
                    });
                    segmentTimingsRef.current.push({
                        index,
                        requestMs: result.requestMs,
                        providerMs: result.providerMs,
                        ok: result.ok,
                    });
                    flushOrderedResults();
                } finally {
                    inFlightSegmentsRef.current -= 1;
                    segmentsCompletedRef.current += 1;
                    if (isProcessingRef.current && totalSegmentsRef.current > 1) {
                        setProcessingProgress(
                            Math.round((segmentsCompletedRef.current / totalSegmentsRef.current) * 100)
                        );
                    }
                    pumpQueue();
                    maybeResolveDrain();
                }
            };

            const pumpQueue = () => {
                while (
                    inFlightSegmentsRef.current < MAX_CONCURRENT_SEGMENTS &&
                    pendingSegmentsRef.current.length > 0
                ) {
                    const task = pendingSegmentsRef.current.shift();
                    if (!task) break;
                    void processSegmentTask(task.index, task.blob);
                }
            };

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size <= 0) return;
                const index = nextSegmentIndexRef.current;
                nextSegmentIndexRef.current += 1;
                totalSegmentsRef.current += 1;
                pendingSegmentsRef.current.push({ index, blob: e.data });
                pumpQueue();
            };

            mediaRecorder.onstop = async () => {
                isProcessingRef.current = true;
                setIsProcessing(true);
                setProcessingProgress(0);
                setIsMultiSegment(false);
                setProcessingStatus("Finalizing...");
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                try {
                    noMoreSegmentsRef.current = true;
                    setIsMultiSegment(totalSegmentsRef.current > 1);
                    if (totalSegmentsRef.current > 1) {
                        setProcessingProgress(Math.round((segmentsCompletedRef.current / totalSegmentsRef.current) * 100));
                    }
                    maybeResolveDrain();
                    await drainPromiseRef.current;
                    setProcessingProgress(100);

                    if (segmentTimingsRef.current.length > 0) {
                        const count = segmentTimingsRef.current.length;
                        const requestAvg = Math.round(
                            segmentTimingsRef.current.reduce((acc, item) => acc + item.requestMs, 0) / count
                        );
                        const providerTimings = segmentTimingsRef.current
                            .map((item) => item.providerMs)
                            .filter((n): n is number => typeof n === 'number');
                        const providerAvg = providerTimings.length > 0
                            ? Math.round(providerTimings.reduce((acc, n) => acc + n, 0) / providerTimings.length)
                            : undefined;
                        console.info("[transcription-metrics]", {
                            segments: count,
                            concurrency: MAX_CONCURRENT_SEGMENTS,
                            avg_request_ms: requestAvg,
                            avg_provider_ms: providerAvg,
                            failed_segments: segmentTimingsRef.current.filter((item) => !item.ok).length,
                        });
                    }

                    if (processingStartTimeRef.current) {
                        const duration = (Date.now() - processingStartTimeRef.current) / 1000;
                        onTranscriptionComplete(accumulatedTranscriptRef.current, detectedLanguageRef.current, false, duration);
                    } else {
                        onTranscriptionComplete(accumulatedTranscriptRef.current, detectedLanguageRef.current, false);
                    }
                } finally {
                    isProcessingRef.current = false;
                    setIsProcessing(false);
                    setProcessingStatus("");
                    stream.getTracks().forEach(track => track.stop());
                    setActiveStream(null);
                }
            };

            mediaRecorder.start(TRANSCRIPTION_CHUNK_MS);
            setIsRecording(true);
            setRecordingDuration(0);
            accumulatedTranscriptRef.current = "";
            detectedLanguageRef.current = "auto";
            segmentsCompletedRef.current = 0;
            totalSegmentsRef.current = 0;
            pendingSegmentsRef.current = [];
            inFlightSegmentsRef.current = 0;
            nextSegmentIndexRef.current = 0;
            nextEmitIndexRef.current = 0;
            pendingResultsRef.current = new Map();
            noMoreSegmentsRef.current = false;
            segmentTimingsRef.current = [];
            drainPromiseRef.current = new Promise<void>((resolve) => {
                resolveDrainRef.current = resolve;
            });

            flushTimerRef.current = setInterval(() => {
                if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
                try {
                    mediaRecorderRef.current.requestData();
                } catch (err) {
                    console.warn("Periodic requestData failed", err);
                }
            }, FORCED_FLUSH_EVERY_MS);

            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch {
            onError("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            // Haptic feedback on mobile
            if ('vibrate' in navigator) navigator.vibrate([20, 30, 20]);
            processingStartTimeRef.current = Date.now();
            try {
                mediaRecorderRef.current.requestData();
            } catch (err) {
                console.warn("Final requestData failed before stop", err);
            }
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (flushTimerRef.current) {
                clearInterval(flushTimerRef.current);
                flushTimerRef.current = null;
            }
        }
    };

    const buttonBaseClasses = isCompact
        ? "w-full h-full bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-3xl font-bold text-sm uppercase tracking-widest flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-sm"
        : "w-full py-4 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-xl font-medium text-lg transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-sm";

    const processingClasses = isCompact
        ? "w-full h-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-tertiary)] rounded-3xl font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 cursor-wait"
        : "w-full py-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-tertiary)] rounded-xl font-medium text-lg flex items-center justify-center space-x-3 cursor-wait";

    if (variant === 'circular') {
        return (
            <div className={cn("flex flex-col items-center justify-center w-full", className)}>
                <AnimatePresence mode="wait">
                    {!isRecording && !isProcessing && (
                        <motion.button
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startRecording}
                            data-testid="record-button"
                            className="relative group w-64 h-64"
                        >
                            {!hasInteracted && (
                                <>
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-[var(--text-secondary)]/20"
                                        animate={{ scale: [1, 1.4], opacity: [0, 0.4, 0] }}
                                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-[var(--text-secondary)]/20"
                                        animate={{ scale: [1, 1.4], opacity: [0, 0.4, 0] }}
                                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
                                    />
                                </>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-hover)]/20 to-[var(--surface)]/5 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                            <div className={cn("relative w-full h-full bg-[var(--surface)] rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-[var(--border)]", !isOnline && "opacity-50")}>
                                {isOnline ? (
                                    <Mic className="w-16 h-16 text-[var(--text-primary)] mb-2" />
                                ) : (
                                    <WifiOff className="w-12 h-12 text-[var(--text-tertiary)] mb-2" />
                                )}
                                <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight uppercase">
                                    {isOnline ? 'Tap to Speak' : 'Offline'}
                                </span>
                            </div>
                        </motion.button>
                    )}

                    {isRecording && (
                        <div className="flex flex-col items-center justify-between w-full h-full py-2 sm:py-6 space-y-4 sm:space-y-8">
                            <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 space-y-6 sm:space-y-8">
                                <div className="w-full h-10 flex items-center px-4">
                                    <SimpleScrollingWaveform
                                        active={true}
                                        height={30}
                                        color={theme === 'dark' ? '#f4f4f5' : '#18181b'}
                                        barWidth={1}
                                        barGap={2}
                                        sensitivity={2}
                                        mediaStream={activeStream}
                                    />
                                </div>
                                <div className="flex flex-col items-center space-y-2">
                                    <div className="bg-[var(--surface-hover)] px-6 py-3 rounded-[24px] border border-[var(--border)] shadow-sm flex flex-col items-center space-y-1 backdrop-blur-sm">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-[var(--error)] rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                            <span className="text-[length:var(--font-size-caption)] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Recording</span>
                                        </div>
                                        <span className="text-2xl font-mono font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
                                            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={stopRecording}
                                data-testid="stop-button"
                                className="group flex flex-col items-center space-y-2 sm:space-y-4 active:scale-95 transition-all outline-none pb-4"
                            >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[1.5px] border-[var(--border)] flex items-center justify-center group-hover:border-[var(--error)]/50 transition-colors">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[var(--error)] rounded-[4px] shadow-sm" />
                                </div>
                                <span className="text-[length:var(--font-size-caption)] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] group-hover:text-[var(--error)] transition-colors">
                                    Stop Recording
                                </span>
                            </button>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="relative w-64 h-64">
                            <div className="absolute inset-0 bg-[var(--accent)]/5 rounded-full blur-xl" />
                            {/* SVG progress ring (visible for multi-segment) */}
                            {isMultiSegment && (
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
                                    <circle
                                        cx="128" cy="128" r="120"
                                        fill="none"
                                        stroke="var(--border)"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="128" cy="128" r="120"
                                        fill="none"
                                        stroke="var(--accent)"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 120}
                                        strokeDashoffset={2 * Math.PI * 120 * (1 - processingProgress / 100)}
                                        className="transition-all duration-500 ease-out"
                                    />
                                </svg>
                            )}
                            <div className="w-full h-full bg-[var(--surface)]/90 rounded-full flex flex-col items-center justify-center border-4 border-transparent backdrop-blur-sm">
                                {isMultiSegment ? (
                                    <>
                                        <span className="text-4xl font-bold text-[var(--accent)] tabular-nums mb-2">{processingProgress}%</span>
                                        <span className="text-[length:var(--font-size-caption)] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                                            Transcribing...
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin mb-4" />
                                        <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest px-8 text-center leading-tight">
                                            {processingStatus || "Processing..."}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col items-center justify-center w-full", isCompact ? "h-full" : "", className)}>
            <AnimatePresence mode="wait">
                {!isRecording && !isProcessing && (
                    <motion.div
                        key="idle"
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        className={cn("w-full", isCompact ? "h-full" : "")}
                    >
                        <button onClick={startRecording} className={buttonBaseClasses}>
                            <Mic className="w-5 h-5" />
                            <span>{isCompact ? "Tap" : "Tap to Speak"}</span>
                        </button>
                    </motion.div>
                )}

                {isRecording && (
                    <motion.div
                        key="recording"
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        className={cn("w-full", isCompact ? "h-full" : "flex flex-col items-center justify-center")}
                    >
                        <div
                            className={cn(
                                "w-full flex items-center justify-center bg-[var(--error)] rounded-3xl transition-all shadow-xl active:scale-95 cursor-pointer",
                                isCompact ? "h-full" : "h-32 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6"
                            )}
                            onClick={stopRecording}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-white rounded-sm animate-pulse" />
                                <span className="text-sm font-bold text-white uppercase tracking-widest">STOP</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {isProcessing && (
                    <motion.div
                        key="processing"
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        className={cn("w-full", isCompact ? "h-full" : "")}
                    >
                        <div className={processingClasses}>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{isCompact ? "Processing" : (processingStatus || "Processing...")}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default AudioRecorder;
