
'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sliceAudioBuffer, bufferToWav } from '@/utils/audioProcessing';
import { MicrophoneWaveform } from '@/components/ui/Waveform';
import { cn } from '@/utils/cn';

interface AudioRecorderProps {
    onTranscriptionComplete: (text: string, detectedLanguage?: string, isPartial?: boolean) => void;
    onError: (msg: string) => void;
    language: string;
    apiKey: string;
    className?: string;
    variant?: 'default' | 'compact' | 'circular' | 'side-by-side';
    onRecordingStart?: () => void;
    autoStart?: boolean;
}

export default function AudioRecorder({
    onTranscriptionComplete,
    onError,
    language,
    apiKey,
    className,
    variant = 'default',
    onRecordingStart,
    autoStart = false
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastProcessedTimeRef = useRef(0);
    const isTranscribingPartRef = useRef(false);
    const accumulatedTranscriptRef = useRef("");
    const detectedLanguageRef = useRef("auto");

    const isCompact = variant === 'compact' || variant === 'side-by-side';
    const isCircular = variant === 'circular';

    // Auto-stop at 5 minutes
    React.useEffect(() => {
        if (recordingDuration >= 300) {
            stopRecording();
        }
    }, [recordingDuration]);

    // Coordinate Auto-Start for seamless transitions
    React.useEffect(() => {
        if (autoStart && !isRecording && !isProcessing) {
            startRecording();
            onRecordingStart?.(); // Notify parent to clear flags
        }
    }, [autoStart]);

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        if (onRecordingStart) onRecordingStart();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            const processAvailableSegments = async (isFinal = false) => {
                if (isTranscribingPartRef.current && !isFinal) return;
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size === 0) return;

                try {
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    const duration = audioBuffer.duration;

                    while (lastProcessedTimeRef.current + 30 <= duration || (isFinal && lastProcessedTimeRef.current < duration)) {
                        const start = lastProcessedTimeRef.current;
                        const end = isFinal ? Math.min(start + 30, duration) : start + 30;
                        if (end - start < 0.5 && isFinal) break;

                        isTranscribingPartRef.current = true;
                        const slicedBuffer = sliceAudioBuffer(audioBuffer, start, end, audioContext);
                        const slicedBlob = bufferToWav(slicedBuffer);

                        const formData = new FormData();
                        formData.append('audio', slicedBlob, `segment_${start}.wav`);
                        formData.append('language', language);

                        const response = await fetch('/api/transcribe', {
                            method: 'POST',
                            headers: { 'x-api-key': apiKey },
                            body: formData,
                        });

                        if (response.ok) {
                            const data = await response.json();
                            const newText = data.transcript;
                            accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? " " : "") + newText;
                            if (data.detected_language_code) detectedLanguageRef.current = data.detected_language_code;
                            onTranscriptionComplete(accumulatedTranscriptRef.current, detectedLanguageRef.current, true);
                        }
                        lastProcessedTimeRef.current = end;
                        if (isFinal && lastProcessedTimeRef.current >= duration) break;
                    }
                } catch (err) {
                    console.error("Background transcription error:", err);
                } finally {
                    isTranscribingPartRef.current = false;
                }
            };

            mediaRecorder.onstop = async () => {
                setIsProcessing(true);
                setProcessingStatus("Finalizing...");

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                try {
                    await processAvailableSegments(true);
                    onTranscriptionComplete(accumulatedTranscriptRef.current, detectedLanguageRef.current, false);
                } catch (error: any) {
                    console.error("Transcription error:", error);
                    onError(error.message || "Failed to process audio");
                } finally {
                    setIsProcessing(false);
                    setProcessingStatus("");
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start(30000);
            setIsRecording(true);
            setRecordingDuration(0);
            lastProcessedTimeRef.current = 0;
            accumulatedTranscriptRef.current = "";

            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => {
                    const next = prev + 1;
                    if (next % 30 === 0) {
                        mediaRecorder.requestData();
                        processAvailableSegments(false);
                    }
                    return next;
                });
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            onError("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const getButtonClasses = () => {
        if (isCircular) {
            return "w-64 h-64 rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-950 transition-all duration-700 active:scale-95 group border-[12px] border-zinc-200 dark:border-white/10 backdrop-blur-md overflow-hidden relative";
        }
        if (variant === 'side-by-side') {
            return "w-full h-full bg-white dark:bg-white/10 hover:bg-zinc-50 dark:hover:bg-white/20 text-zinc-900 dark:text-white rounded-[32px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center justify-center space-x-3 shadow-[0_12px_24px_rgba(0,0,0,0.05)] border-b-8 border-zinc-200 dark:border-white/10 backdrop-blur-xl";
        }
        if (isCompact) {
            return "w-full min-h-[48px] px-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl hover:bg-white/80 text-zinc-900 dark:text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.99] flex items-center justify-center space-x-2 border border-zinc-200 dark:border-white/40 shadow-sm";
        }
        return "w-full py-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl hover:bg-white/80 text-zinc-900 dark:text-white rounded-2xl font-bold text-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 border border-zinc-200 dark:border-white/40 shadow-sm";
    };

    const getProcessingClasses = () => {
        if (isCircular) {
            return "w-64 h-64 rounded-full bg-zinc-100 dark:bg-zinc-900 border-4 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 flex flex-col items-center justify-center space-y-3 cursor-wait shadow-inner";
        }
        return isCompact
            ? "w-full min-h-[48px] px-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 cursor-wait"
            : "w-full py-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl font-medium text-lg flex items-center justify-center space-x-3 cursor-wait";
    };

    return (
        <div className={cn("flex flex-col items-center justify-center w-full", className)}>
            <AnimatePresence mode="wait">
                {!isRecording && !isProcessing && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={cn("relative z-20", isCircular ? "" : "w-full h-full")}
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                if (variant === 'side-by-side' && onRecordingStart) {
                                    onRecordingStart();
                                } else {
                                    startRecording();
                                }
                            }}
                            className={getButtonClasses()}
                        >
                            {/* Premium Black Filling Hover Effect */}
                            {isCircular && (
                                <motion.div
                                    className="absolute inset-0 bg-zinc-950 rounded-full z-0"
                                    initial={{ scale: 0 }}
                                    whileHover={{ scale: 1.2 }}
                                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                />
                            )}

                            <motion.div
                                className="relative z-10 flex flex-col items-center space-y-2 transition-colors duration-700 group-hover:text-white"
                                whileHover={isCircular ? { scale: 1.05 } : {}}
                            >
                                <Mic className={cn(
                                    isCircular ? "w-12 h-12 mb-2" : isCompact ? "w-4 h-4" : "w-5 h-5",
                                    isCircular && "animate-pulse"
                                )} />
                                <span className={isCircular ? "text-xl font-black uppercase tracking-tighter" : ""}>
                                    Speak
                                </span>
                            </motion.div>
                        </button>
                    </motion.div>
                )}

                {isRecording && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full flex flex-col items-center justify-center"
                    >
                        <div
                            className={cn(
                                "flex flex-col items-center justify-center relative transition-all duration-500 ease-out",
                                isCircular
                                    ? "h-64 w-64 bg-transparent"
                                    : "w-full h-40 rounded-[32px] border border-white dark:border-white/5 p-8 bg-white/40 dark:bg-white/10 backdrop-blur-2xl shadow-xl"
                            )}
                        >
                            {/* Minimalism Waveform Background */}
                            <MicrophoneWaveform
                                active={isRecording}
                                height={60}
                                barWidth={3}
                                barGap={4}
                                barRadius={2}
                                className="absolute inset-0 m-auto w-[85%] opacity-30 pointer-events-none"
                            />

                            <div className="relative z-10 flex flex-col items-center space-y-6 pt-8">
                                {/* Precise Timer */}
                                <div className="bg-white/80 dark:bg-zinc-900/80 px-5 py-2.5 rounded-2xl border border-white dark:border-white/10 shadow-sm">
                                    <span className="text-sm font-mono font-black text-zinc-900 dark:text-zinc-100 tracking-widest">
                                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                                        <span className="text-zinc-400 dark:text-zinc-500 ml-1">/ 5:00</span>
                                    </span>
                                </div>

                                {/* Tactile Stop Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        stopRecording();
                                    }}
                                    className={cn(
                                        "flex items-center space-x-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-10 py-5 rounded-[28px] shadow-lg hover:shadow-xl transition-all active:scale-95 border-b-8 border-zinc-200 dark:border-zinc-800 group",
                                        !isCircular && "px-8 py-4"
                                    )}
                                >
                                    <div className="w-4 h-4 bg-red-500 rounded-sm group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-inherit">Stop Recording</span>
                                </button>
                            </div>
                        </div>

                        {!isCircular && (
                            <div className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-800 mr-auto mt-4 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                                <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}

                {isProcessing && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={cn("relative", isCircular ? "" : "w-full")}
                    >
                        {/* AI Aura during processing */}
                        {isCircular && (
                            <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl animate-pulse" />
                        )}

                        <div className={getProcessingClasses()}>
                            <div className="relative">
                                <Loader2 className={cn("animate-spin text-zinc-400 dark:text-zinc-500", isCircular ? "w-10 h-10 mb-2" : "w-5 h-5")} />
                                <Sparkles className={cn("absolute -top-1 -right-1 text-blue-500 animate-pulse", isCircular ? "w-4 h-4" : "w-2 h-2")} />
                            </div>
                            <span className={cn("font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500", isCircular ? "text-[10px] px-6 text-center leading-relaxed" : "text-[11px]")}>
                                {processingStatus || "Analyzing..."}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
