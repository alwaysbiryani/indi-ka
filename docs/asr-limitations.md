# Audio Transcription (ASR) Limitations and Implementation

## 30-Second Limit
The Sarvam AI `speech-to-text` API (and many similar synchronous ASR services) has a strict **30-second duration limit** per request. Files exceeding this duration will result in an error:
`Audio file having duration greater than 30 seconds is not supported`.

## Implementation Pattern (Chunking)
To handle recordings longer than 30 seconds, the application implements **client-side chunking** in `src/components/AudioRecorder.tsx`.

### Key Components:
1.  **Continuous Capture**: `MediaRecorder` records one continuous WebM stream. We periodically call `requestData()` (first at ~4s, then every ~10s) to flush what's been captured so far.
2.  **Decode + Slice to WAV** (critical): WebM/Matroska is a streaming container — **only the first emitted blob carries the container header**, so later `requestData()` blobs are headerless fragments that no decoder (including Sarvam) can read on their own. We therefore keep **every** blob, decode the *full accumulated stream* via the Web Audio API (`decodeAudioData`), then slice out the not-yet-processed audio and re-encode each slice as a **self-contained WAV** file (`sliceAudioBuffer` + `bufferToWav` in `src/utils/audioProcessing.ts`). Each WAV segment is a valid, independently decodable file kept under the 30-second cap.
3.  **Bounded Parallelism + Ordered Merge**: Up to 3 segment requests run in parallel, but results are merged in segment index order so text remains stable.
4.  **Live Partial Updates**: Each flush emits the fresh (< 30s) tail as its own segment, so the UI updates incrementally while recording continues.
5.  **Fast Finalization**: On stop, the recording is decoded one last time and the remaining tail is enqueued; the app then waits only for any in-flight segment uploads.
6.  **Timing Telemetry**: Each segment captures roundtrip timing and backend provider timing (`provider_ms`) for performance diagnosis.

> ⚠️ **Do NOT send raw `requestData()` WebM blobs directly to the provider.** Only the first blob is a valid file; every subsequent fragment lacks the header and fails to decode, so only the first few seconds of audio ever get transcribed. This exact regression shipped once and silently broke transcription for any recording longer than the first flush interval.

## Prevention of Future Issues
- Keep each sliced segment under 30 seconds (current cap: `MAX_SEGMENT_SECONDS = 28`).
- Always slice from the *decoded* accumulated buffer and upload WAV — never a mid-stream WebM fragment.
- Keep network concurrency low and bounded (current setting: `3`) to avoid provider throttling.
- Preserve ordered merge by segment index to prevent transcript shuffling.
