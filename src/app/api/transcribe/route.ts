
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const routeStart = performance.now();
    try {
        const { searchParams } = new URL(req.url);
        const language = searchParams.get('language') || 'hinglish';

        const headerKey = req.headers.get('x-api-key');
        let apiKey = (headerKey && headerKey !== 'undefined' && headerKey !== 'null') ? headerKey : (process.env.SARVAM_API_KEY || process.env.NEXT_PUBLIC_SARVAM_API_KEY);
        apiKey = apiKey?.trim();

        if (!apiKey || apiKey === 'your_api_key_here' || apiKey === '') {
            return NextResponse.json({ error: 'CONFIG_ERROR: API Key missing' }, { status: 401 });
        }

        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'Audio file missing' }, { status: 400 });
        }

        // Some browsers send codec-qualified MIME types (e.g. "audio/webm;codecs=opus")
        // while the ASR provider expects a base MIME value ("audio/webm").
        const normalizedMime = (audioFile.type || '')
            .split(';')[0]
            .trim()
            .toLowerCase() || 'application/octet-stream';

        const providerFilename = audioFile.name || (normalizedMime === 'audio/webm' ? 'recording.webm' : 'recording.bin');

        const sarvamFormData = new FormData();
        sarvamFormData.append('file', audioFile, providerFilename);
        sarvamFormData.append('model', 'saaras:v3');

        if (language === 'hinglish' || language === 'auto') {
            sarvamFormData.append('language_code', 'hi-IN');
            sarvamFormData.append('mode', 'translit');
        } else if (language === 'hi-IN') {
            sarvamFormData.append('language_code', 'hi-IN');
            sarvamFormData.append('mode', 'transcribe');
        } else {
            sarvamFormData.append('language_code', 'en-IN');
            sarvamFormData.append('mode', 'transcribe');
        }

        const providerStart = performance.now();
        const asrResponse = await fetch('https://api.sarvam.ai/speech-to-text', {
            method: 'POST',
            headers: {
                'api-subscription-key': apiKey,
            },
            body: sarvamFormData,
        });
        const providerMs = Math.round(performance.now() - providerStart);

        if (!asrResponse.ok) {
            const errorText = await asrResponse.text();
            console.error("ASR Error:", errorText);

            if (asrResponse.status === 402 ||
                (asrResponse.status === 400 && errorText.includes("quota")) ||
                (asrResponse.status === 403 && errorText.includes("subscription"))) {
                return NextResponse.json({
                    error: "QUOTA_EXHAUSTED",
                    details: "Your Sarvam AI free tier or subscription quota has been exhausted."
                }, { status: 402 });
            }

            return NextResponse.json({ error: `ASR Failed: ${errorText}` }, { status: asrResponse.status });
        }

        const asrData = await asrResponse.json();

        return NextResponse.json({
            transcript: asrData.transcript || "",
            detected_language_code: asrData.language_code || 'auto',
            metrics: {
                provider_ms: providerMs,
                route_ms: Math.round(performance.now() - routeStart),
            },
        });

    } catch (error: unknown) {
        console.error("Error processing request:", error);
        const message = error instanceof Error ? error.message : 'Unknown transcription error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
