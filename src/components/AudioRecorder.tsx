
'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sliceAudioBuffer, bufferToWav } from '@/utils/audioProcessing';

interface AudioRecorderProps {
    onTranscriptionComplete: (text: string, detectedLanguage?: string, isPartial?: boolean) => void;
    onError: (msg: string) => void;
    language: string;
    apiKey: string;
    className?: string;
    isCompact?: boolean;
}

export default function AudioRecorder({ onTranscriptionComplete, onError, language, apiKey, className, isCompact }: AudioRecorderProps) {
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
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);

                    // Background transcription: if we have enough for a new 30s segment
                    // and we're not currently transcribing a part
                    const currentTotalDuration = chunksRef.current.length * 30; // approx if timeslice is 30s
                    // Better to check recordingDuration for more accuracy
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

                        if (end - start < 0.5 && isFinal) break; // too short

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

                            // Live update the UI
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
                setProcessingStatus("Finalizing transcription...");

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
        ? "w-full min-h-[48px] px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 rounded-xl font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center space-x-2 shadow-sm"
        : "w-full py-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 rounded-xl font-medium text-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 shadow-sm";

    const recordingClasses = isCompact
        ? "w-full min-h-[48px] px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center space-x-2 shadow-sm ring-2 ring-red-500/10 animate-pulse"
        : "w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 shadow-sm ring-4 ring-red-500/10 animate-pulse";

    const processingClasses = isCompact
        ? "w-full min-h-[48px] px-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 cursor-wait"
        : "w-full py-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl font-medium text-lg flex items-center justify-center space-x-3 cursor-wait";

    return (
        <div className={`flex flex-col items-center justify-center w-full ${className}`}>
            <AnimatePresence mode="wait">
                {!isRecording && !isProcessing && (
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        className="w-full"
                    >
                        <button onClick={startRecording} className={buttonBaseClasses}>
                            <Mic className={isCompact ? "w-4 h-4" : "w-5 h-5"} />
                            <span>Tap to Speak</span>
                        </button>
                    </motion.div>
                )}

                {isRecording && (
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        className="w-full flex flex-col items-center space-y-3"
                    >
                        <button onClick={stopRecording} className={recordingClasses}>
                            <Square className={isCompact ? "w-3.5 h-3.5 fill-current" : "w-5 h-5 fill-current"} />
                            <span>{recordingDuration >= 270 ? "Stopping soon..." : "Listening..."}</span>
                        </button>
                        {recordingDuration >= 270 && (
                            <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[11px] font-bold text-red-500 animate-pulse text-center leading-tight"
                            >
                                Almost at the limit - we’ll stop at 5:00 to transcribe. <br /> Feel free to continue after.
                            </motion.p>
                        )}
                        <span className="text-[10px] font-mono text-zinc-400">
                            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')} / 5:00
                        </span>
                    </motion.div>
                )}

                {isProcessing && (
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        className="w-full"
                    >
                        <div className={processingClasses}>
                            <Loader2 className={isCompact ? "w-4 h-4 animate-spin" : "w-5 h-5 animate-spin"} />
                            <span>{processingStatus || "Processing..."}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
