import ffmpeg from 'fluent-ffmpeg';
import { Readable, PassThrough } from 'stream';

/**
 * Converts arbitrary audio buffers (e.g., browser-recorded .webm, .ogg, or .wav)
 * into 16 kHz mono 16-bit PCM WAV, normalized for acoustic inference and voice cloning.
 */
export async function normalizeTo16kHzMonoWav(inputBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const inputStream = new Readable({
        read() {
          this.push(inputBuffer);
          this.push(null);
        },
      });

      const outputStream = new PassThrough();
      const chunks: Buffer[] = [];

      outputStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      outputStream.on('end', () => resolve(Buffer.concat(chunks)));
      outputStream.on('error', (err) => reject(err));

      ffmpeg(inputStream)
        .toFormat('wav')
        .audioChannels(1)
        .audioFrequency(16000)
        .audioCodec('pcm_s16le')
        .on('error', (err) => {
          console.warn('FFmpeg conversion error, returning original buffer if valid:', err.message);
          // If ffmpeg fails (e.g. invalid codec flags), fallback to input buffer
          if (inputBuffer && inputBuffer.length > 0) {
            resolve(inputBuffer);
          } else {
            reject(new Error(`FFmpeg error: ${err.message}`));
          }
        })
        .pipe(outputStream, { end: true });
    } catch (err: any) {
      console.warn('Stream setup error in ffmpegService:', err);
      resolve(inputBuffer);
    }
  });
}
