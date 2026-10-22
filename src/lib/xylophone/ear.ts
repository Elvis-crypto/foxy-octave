import { centsBetween, pitchOf, rms } from "./pitch.ts";

/** Hears one xylophone strike at a time. The ring of a bar does not count twice. */
export class ToyEar {
  private constructor(
    private stream: MediaStream,
    private audio: AudioContext,
    private timer: number,
  ) {}

  static async start(onHit: (freq: number) => void): Promise<ToyEar> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-mic");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const audio = new AudioContext();
    const source = audio.createMediaStreamSource(stream);
    const analyser = audio.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    let primed: number | null = null;
    let lockUntil = 0;
    const timer = window.setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      const now = audio.currentTime;
      if (now < lockUntil) return;
      if (rms(buf) < 0.02) {
        primed = null;
        return;
      }
      const freq = pitchOf(buf, audio.sampleRate);
      if (!freq) {
        primed = null;
        return;
      }
      if (primed !== null && Math.abs(centsBetween(freq, primed)) < 45) {
        primed = null;
        lockUntil = now + 0.26;
        onHit(freq);
        return;
      }
      primed = freq;
    }, 40);
    return new ToyEar(stream, audio, timer);
  }

  stop(): void {
    window.clearInterval(this.timer);
    for (const track of this.stream.getTracks()) track.stop();
    void this.audio.close();
  }
}
