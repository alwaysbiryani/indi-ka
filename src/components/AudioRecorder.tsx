
'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioRecorderProps {
    onTranscriptionComplete: (text: string, detectedLanguage?: string) => void;
    onError: (msg: string) => void;
    language: string;
    apiKey: string;
    className?: string;
    isCompact?: boolean;
}

export default function AudioRecorder({ onTranscriptionComplete, onError, language, apiKey, className, isCompact }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                setIsProcessing(true);
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                formData.append('language', language);

                try {
                    const response = await fetch('/api/transcribe', {
                        method: 'POST',
                        headers: { 'x-api-key': apiKey },
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        onError(errorData.details || errorData.error || 'Transcription failed');
                    } else {
                        const data = await response.json();
                        onTranscriptionComplete(data.transcript, data.detected_language_code);
                    }

                } catch (error: any) {
                    console.error("Transcription error:", error);
                    onError(`Network Error: ${error.message}`);
                } finally {
                    setIsProcessing(false);
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            onError("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
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
                        className="w-full"
                    >
                        <button onClick={stopRecording} className={recordingClasses}>
                            <Square className={isCompact ? "w-3.5 h-3.5 fill-current" : "w-5 h-5 fill-current"} />
                            <span>Listening...</span>
                        </button>
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
                            <span>Processing...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
