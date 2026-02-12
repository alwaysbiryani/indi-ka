
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
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

        const sarvamFormData = new FormData();
        const arrayBuffer = await audioFile.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });

        sarvamFormData.append('file', blob, 'recording.webm');
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
            detected_language_code: asrData.language_code || 'auto'
        });

    } catch (error: any) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
