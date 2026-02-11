
'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sliceAudioBuffer, bufferToWav } from '@/utils/audioProcessing';
import { MicrophoneWaveform, CircularMicrophoneWaveform, SimpleScrollingWaveform } from '@/components/ui/Waveform';
import { cn } from '@/utils/cn';

interface AudioRecorderProps {
    onTranscriptionComplete: (text: string, detectedLanguage?: string, isPartial?: boolean) => void;
    onError: (msg: string) => void;
    language: string;
    apiKey: string;
    className?: string;
    isCompact?: boolean;
    variant?: 'default' | 'circular';
    onRecordingStart?: () => void;
    theme?: 'light' | 'dark';
}

export default function AudioRecorder({
    onTranscriptionComplete,
    onError,
    language,
    apiKey,
    className,
    isCompact,
    variant = 'default',
    onRecordingStart,
    theme = 'dark'
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

    // Auto-stop at 5 minutes
    React.useEffect(() => {
        if (recordingDuration >= 300) {
            stopRecording();
        }
    }, [recordingDuration]);

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

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            const processAvailableSegments = async (isFinal = false) => {
                if (isTranscribingPartRef.current && !isFinal) return;

                if (chunksRef.current.length === 0) {
                    console.log("No audio chunks available yet");
                    return;
                }

                const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
                console.log(`Processing segments, blob size: ${audioBlob.size}, isFinal: ${isFinal}`);

                if (audioBlob.size === 0) return;

                try {
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const arrayBuffer = await audioBlob.arrayBuffer();

                    // decodeAudioData can fail for short/incomplete blobs in some browsers
                    let audioBuffer;
                    try {
                        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    } catch (decodeErr) {
                        console.error("decodeAudioData failed", decodeErr);
                        // Fallback: If final and decoding failed, we can't do regular segmenting
                        // but maybe we can try sending the whole blob if it's the first attempt
                        if (isFinal && lastProcessedTimeRef.current === 0) {
                            console.log("Attempting full blob transcription fallback...");
                            await transcribeSegment(audioBlob, 0);
                        }
                        return;
                    }

                    const duration = audioBuffer.duration;
                    console.log(`Audio duration: ${duration}s, Last processed: ${lastProcessedTimeRef.current}s`);

                    while (lastProcessedTimeRef.current + 30 <= duration || (isFinal && lastProcessedTimeRef.current < duration)) {
                        const start = lastProcessedTimeRef.current;
                        const end = isFinal ? Math.min(start + 30, duration) : start + 30;

                        if (end - start < 0.5 && isFinal && lastProcessedTimeRef.current > 0) break; // too short and not the first segment

                        console.log(`Transcribing segment: ${start}s to ${end}s`);
                        const slicedBuffer = sliceAudioBuffer(audioBuffer, start, end, audioContext);
                        const slicedBlob = bufferToWav(slicedBuffer);

                        await transcribeSegment(slicedBlob, start);
                        lastProcessedTimeRef.current = end;

                        if (isFinal && lastProcessedTimeRef.current >= duration) break;
                    }
                } catch (err) {
                    console.error("Transcription processing error:", err);
                } finally {
                    isTranscribingPartRef.current = false;
                }
            };

            const transcribeSegment = async (blob: Blob, startTime: number) => {
                isTranscribingPartRef.current = true;
                try {
                    const formData = new FormData();
                    formData.append('audio', blob, `segment_${startTime}.wav`);
                    formData.append('language', language);

                    const response = await fetch('/api/transcribe', {
                        method: 'POST',
                        headers: { 'x-api-key': apiKey },
                        body: formData,
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const newText = data.transcript;
                        console.log(`Segment transcription success: "${newText}"`);
                        if (newText) {
                            accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? " " : "") + newText;
                            if (data.detected_language_code) detectedLanguageRef.current = data.detected_language_code;
                            // Live update the UI
                            onTranscriptionComplete(accumulatedTranscriptRef.current, detectedLanguageRef.current, true);
                        }
                    } else {
                        const errData = await response.json();
                        console.error("API Error:", errData);
                        onError(errData.details || errData.error || "Transcription failed");
                    }
                } catch (err) {
                    console.error("Segment transcription request failed", err);
                } finally {
                    isTranscribingPartRef.current = false;
                }
            };

            mediaRecorder.onstop = async () => {
                console.log("MediaRecorder stopped. Finalizing...");
                setIsProcessing(true);
                setProcessingStatus("Finalizing transcription...");

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                try {
                    // Give a small delay to ensure the final ondataavailable has been processed
                    await new Promise(resolve => setTimeout(resolve, 200));
                    await processAvailableSegments(true);

                    console.log(`Final transcription: "${accumulatedTranscriptRef.current}"`);
                    onTranscriptionComplete(accumulatedTranscriptRef.current, detectedLanguageRef.current, false);
                } catch (error: any) {
                    console.error("Finalization error:", error);
                    onError(error.message || "Failed to finalize transcription");
                } finally {
                    setIsProcessing(false);
                    setProcessingStatus("");
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start(30000); // Fire ondataavailable every 30s
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

    const buttonBaseClasses = isCompact
        ? "w-full h-full bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-900 rounded-3xl font-bold text-sm uppercase tracking-widest flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-sm"
        : "w-full py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-medium text-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 shadow-sm";

    const processingClasses = isCompact
        ? "w-full h-full bg-zinc-50 border border-zinc-100 text-zinc-400 rounded-3xl font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 cursor-wait"
        : "w-full py-4 bg-zinc-50 border border-zinc-100 text-zinc-400 rounded-xl font-medium text-lg flex items-center justify-center space-x-3 cursor-wait";


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
                            className="relative group w-64 h-64"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-200/20 to-zinc-100/5 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                            <div className="relative w-full h-full bg-white rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-zinc-100">
                                <Mic className="w-16 h-16 text-zinc-900 mb-2" />
                                <span className="text-2xl font-bold text-zinc-900 tracking-tight">SPEAK</span>
                            </div>
                        </motion.button>
                    )}

                    {isRecording && (
                        <div className="flex flex-col items-center justify-center w-full space-y-12 py-10">
                            {/* Minimal Linear Waveform */}
                            <div className="w-full flex flex-col items-center space-y-6">
                                <div className="w-full h-10 flex items-center px-4">
                                    <SimpleScrollingWaveform
                                        active={true}
                                        height={30}
                                        color={theme === 'dark' ? '#f4f4f5' : '#18181b'}
                                        barWidth={1}
                                        barGap={2}
                                        sensitivity={2}
                                    />
                                </div>
                                <div className="flex flex-col items-center space-y-2">
                                    <div className="bg-[var(--surface-hover)] px-6 py-3 rounded-[24px] border border-[var(--border)] shadow-sm flex flex-col items-center space-y-1 backdrop-blur-sm">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Recording</span>
                                        </div>
                                        <span className="text-2xl font-mono font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
                                            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Minimal Stop Button */}
                            <button
                                onClick={stopRecording}
                                className="group flex flex-col items-center space-y-4 active:scale-95 transition-all outline-none"
                            >
                                <div className="w-20 h-20 rounded-full border-[1.5px] border-zinc-100 flex items-center justify-center group-hover:border-red-500/50 transition-colors">
                                    <div className="w-7 h-7 bg-red-500 rounded-[4px] shadow-sm" />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] group-hover:text-red-500 transition-colors">
                                    Stop Recording
                                </span>
                            </button>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="relative w-64 h-64">
                            <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-xl" />
                            <div className="w-full h-full bg-white/90 rounded-full flex flex-col items-center justify-center border-4 border-zinc-50 backdrop-blur-sm">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-8 text-center leading-tight">
                                    {processingStatus || "Processing..."}
                                </span>
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
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        className={cn("w-full", isCompact ? "h-full" : "")}
                    >
                        <button onClick={startRecording} className={buttonBaseClasses}>
                            <Mic className={isCompact ? "w-5 h-5" : "w-5 h-5"} />
                            <span>{isCompact ? "Speak" : "Tap to Speak"}</span>
                        </button>
                    </motion.div>
                )}

                {isRecording && (
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        className={cn("w-full", isCompact ? "h-full" : "flex flex-col items-center justify-center")}
                    >
                        <div
                            className={cn(
                                "w-full flex items-center justify-center bg-red-600 rounded-3xl transition-all shadow-xl active:scale-95 cursor-pointer",
                                isCompact ? "h-full" : "h-32 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6"
                            )}
                            onClick={stopRecording}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-white rounded-sm animate-pulse" />
                                <span className="text-sm font-bold text-white uppercase tracking-widest">
                                    STOP
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {isProcessing && (
                    <motion.div
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
}
