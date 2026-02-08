
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;
        const language = formData.get('language') as string; // 'hinglish', 'hi-IN', 'en-IN'

        // Priority: Header > Env Variable
        const apiKey = req.headers.get('x-api-key') || process.env.SARVAM_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'CONFIG_ERROR: API Key missing' }, { status: 401 });
        }

        if (!audioFile) {
            return NextResponse.json({ error: 'Audio file missing' }, { status: 400 });
        }

        // Convert File to Buffer
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const sarvamFormData = new FormData();
        const blob = new Blob([buffer], { type: audioFile.type });
        sarvamFormData.append('file', blob, 'audio.wav');
        sarvamFormData.append('model', 'saaras:v3');

        const asrResponse = await fetch('https://api.sarvam.ai/speech-to-text', {
            method: 'POST',
            headers: {
                'api-subscription-key': apiKey,
            },
            body: sarvamFormData as any,
        });

        if (!asrResponse.ok) {
            const errorText = await asrResponse.text();
            console.error("ASR Error:", errorText);

            // Handle Quota/Payment Errors specifically
            // Sarvam likely returns 402 or specific JSON for quota
            if (asrResponse.status === 402 ||
                (asrResponse.status === 400 && errorText.includes("quota")) ||
                (asrResponse.status === 403 && errorText.includes("subscription"))) {
                return NextResponse.json({
                    error: "QUOTA_EXHAUSTED",
                    details: "Your Sarvam AI free tier or subscription quota has been exhausted. Please contact the administrator (Manideep) to upgrade."
                }, { status: 402 });
            }

            return NextResponse.json({ error: `ASR Failed: ${errorText}` }, { status: asrResponse.status });
        }

        const asrData = await asrResponse.json();
        let transcript = asrData.transcript || "";

        // 2. Transliteration (if needed) - Sarvam usually handles hinglish well in saaras:v3 directly
        // But keeping this logic just in case user explicitly wants Roman script for sure.
        // However, saaras:v3 is good at code-mixing. If 'hinglish' is selected, we might want to ensure Roman.

        const hasDevanagari = /[\u0900-\u097F]/.test(transcript);

        if (language === 'hinglish' && hasDevanagari) {
            const transliterateResponse = await fetch('https://api.sarvam.ai/transliterate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': apiKey,
                },
                body: JSON.stringify({
                    input: transcript,
                    source_language_code: 'hi-IN',
                    target_language_code: 'en-IN',
                    speaker_gender: 'Male',
                    mode: 'formal',
                })
            });

            if (transliterateResponse.ok) {
                const transData = await transliterateResponse.json();
                transcript = transData.transliterated_text || transcript;
            } else {
                console.warn("Transliteration failed, returning original transcript.");
            }
        }

        return NextResponse.json({
            transcript,
            detected_language_code: asrData.language_code || 'auto'
        });

    } catch (error: any) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
