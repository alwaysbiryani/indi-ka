# Audio Transcription (ASR) Limitations and Implementation

## 30-Second Limit
The Sarvam AI `speech-to-text` API (and many similar synchronous ASR services) has a strict **30-second duration limit** per request. Files exceeding this duration will result in an error:
`Audio file having duration greater than 30 seconds is not supported`.

## Implementation Pattern (Chunking)
To handle recordings longer than 30 seconds, the application implements **client-side chunking** in `src/components/AudioRecorder.tsx`.

### Key Components:
1.  **Interval-based Capture**: Every 30 seconds, the `MediaRecorder` is requested to flush its data (`requestData()`).
2.  **Audio Decoding**: The accumulated chunks are decoded into an `AudioBuffer` using `AudioContext`. This provides an accurate duration.
3.  **Slicing**: The `AudioBuffer` is sliced into segments of exactly 30 seconds (or less for the final chunk).
4.  **Encoding**: Each slice is encoded into a `WAV` blob (PCM 16-bit) before being sent to the `/api/transcribe` endpoint.
5.  **Sequential Processing**: The `lastProcessedTimeRef` tracks the progress to ensure no overlaps or gaps.

### Why not use raw blobs for chunks?
While the raw MediaRecorder blobs (usually WebM/Opus) are smaller, slicing them correctly at the byte level/time level is complex and often leads to corrupted files. Decoding to a raw `AudioBuffer` and slicing by sample index is the most reliable way to ensure seamless transcription across chunks.

## Prevention of Future Issues
- **Avoid "Premature Optimization"**: Do not send the entire `MediaRecorder` blob if its duration hasn't been verified to be under 30 seconds.
- **Immediate State Update**: Always update `lastProcessedTimeRef` *before* the asynchronous network call to prevent race conditions during the final `onstop` event.
- **WAV naming**: The backend currently expects a `.webm` extension in the FormData for Sarvam AI compatibility, even if the content is WAV. This is handled in `src/app/api/transcribe/route.ts`.
