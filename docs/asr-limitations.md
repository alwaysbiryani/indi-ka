# Audio Transcription (ASR) Limitations and Implementation

## 30-Second Limit
The Sarvam AI `speech-to-text` API (and many similar synchronous ASR services) has a strict **30-second duration limit** per request. Files exceeding this duration will result in an error:
`Audio file having duration greater than 30 seconds is not supported`.

## Implementation Pattern (Chunking)
To handle recordings longer than 30 seconds, the application implements **client-side chunking** in `src/components/AudioRecorder.tsx`.

### Key Components:
1.  **Time-sliced Capture**: `MediaRecorder` emits chunks every ~25 seconds, safely below the 30-second API limit.
2.  **Direct Upload**: Each emitted chunk is sent as-is to `/api/transcribe` without decode/re-encode.
3.  **Bounded Parallelism + Ordered Merge**: Up to 2 chunk requests run in parallel, but results are merged in chunk index order so text remains stable.
4.  **Live Partial Updates**: The UI updates with each completed chunk while recording continues.
5.  **Fast Finalization**: On stop, the app only waits for any remaining queued chunk uploads.
6.  **Timing Telemetry**: Each segment captures roundtrip timing and backend provider timing (`provider_ms`) for performance diagnosis.

### Why this is faster
- Avoids repeatedly decoding increasingly large accumulated blobs.
- Avoids WAV conversion overhead and larger payload sizes.
- Reduces "time after stop" by transcribing incrementally during recording.
- Improves throughput for longer recordings with bounded parallel in-flight requests.

## Prevention of Future Issues
- Keep chunk interval under 30 seconds (current setting: ~25 seconds).
- Keep network concurrency low and bounded (current setting: `2`) to avoid provider throttling.
- Preserve ordered merge by chunk index to prevent transcript shuffling.
- Keep backend upload format aligned with provider expectations (`recording.webm` filename is preserved).
