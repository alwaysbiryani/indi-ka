
/**
 * Slices an AudioBuffer from startTime to endTime.
 */
export function sliceAudioBuffer(audioBuffer: AudioBuffer, startTime: number, endTime: number, context: AudioContext): AudioBuffer {
    const frameStart = Math.floor(startTime * audioBuffer.sampleRate);
    const frameEnd = Math.floor(endTime * audioBuffer.sampleRate);
    const frameCount = frameEnd - frameStart;

    const newBuffer = context.createBuffer(
        audioBuffer.numberOfChannels,
        frameCount,
        audioBuffer.sampleRate
    );

    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const channelData = audioBuffer.getChannelData(i);
        const slicedData = channelData.slice(frameStart, frameEnd); // use slice() which works on TypedArrays
        newBuffer.copyToChannel(slicedData, i);
    }

    return newBuffer;
}

/**
 * Encodes AudioBuffer into a WAV Blob.
 */
export function bufferToWav(abuffer: AudioBuffer): Blob {
    let numOfChan = abuffer.numberOfChannels,
        length = abuffer.length * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for (i = 0; i < numOfChan; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF); // scale to 16-bit signed int
            view.setInt16(pos, sample, true);          // write 16-bit sample
            pos += 2;
        }
        offset++;                                     // next sample index
    }

    return new Blob([buffer], { type: "audio/wav" });
}
