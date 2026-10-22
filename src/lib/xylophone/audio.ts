type Voice = { osc: AudioScheduledSourceNode; extra: AudioNode[]; when: number };

export type Chime = "wood" | "bell" | "glass" | "metal";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sampleBus: GainNode | null = null;
let sampling = false;
let noise: AudioBuffer | null = null;
let muted = false;
let chime: Chime = "wood";
const voices: Voice[] = [];

function context(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error("This browser has no Web Audio.");
    ctx = new Ctor({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = muted ? 0.0001 : 0.8;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function peekAudio(): AudioContext | null {
  return ctx;
}

export function unlockAudio(): AudioContext {
  const audio = context();
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

export function setMuted(next: boolean): void {
  muted = next;
  if (!master || !ctx) return;
  master.gain.setTargetAtTime(next ? 0.0001 : 0.8, ctx.currentTime, 0.02);
}

export function setChime(next: Chime): void {
  chime = next;
}

function output(): GainNode | null {
  if (!ctx || !master) return null;
  if (!sampling) return master;
  if (!sampleBus) {
    sampleBus = ctx.createGain();
    sampleBus.gain.value = 0.8;
    sampleBus.connect(ctx.destination);
  }
  return sampleBus;
}

/** Three notes of the chosen chime, loud enough to hear even if the toy is muted. */
export function previewChime(kind: Chime): void {
  chime = kind;
  sampling = true;
  const audio = unlockAudio();
  const now = audio.currentTime;
  strike(72, now, 0.42);
  strike(76, now + 0.18, 0.36);
  strike(79, now + 0.36, 0.32);
  sampling = false;
}

function remember(osc: AudioScheduledSourceNode, extra: AudioNode[], when: number): void {
  const voice: Voice = { osc, extra, when };
  voices.push(voice);
  osc.onended = () => {
    const index = voices.indexOf(voice);
    if (index >= 0) voices.splice(index, 1);
    try {
      osc.disconnect();
      for (const node of extra) node.disconnect();
    } catch {
      /* already disconnected */
    }
  };
}

function drop(voice: Voice): void {
  try {
    voice.osc.stop();
  } catch {
    /* already stopped */
  }
}

/** Stop notes that have not begun. Notes already ringing are left to finish. */
export function cancelUpcoming(): void {
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const voice of voices) {
    if (voice.when > now + 0.03) drop(voice);
  }
}

export function silenceAll(): void {
  for (const voice of [...voices]) drop(voice);
  voices.length = 0;
}

function strike(midi: number, when: number, level: number): void {
  if (chime === "bell") {
    tone(midi, when, level, [
      { ratio: 1, type: "sine", gain: 0.34, attack: 0.012, life: 1.5 },
      { ratio: 2.01, type: "sine", gain: 0.12, attack: 0.01, life: 0.9 },
      { ratio: 2.76, type: "sine", gain: 0.08, attack: 0.008, life: 0.55 },
      { ratio: 5.4, type: "sine", gain: 0.03, attack: 0.004, life: 0.22 },
    ]);
    return;
  }
  if (chime === "glass") {
    tone(midi, when, level, [
      { ratio: 1, type: "sine", gain: 0.28, attack: 0.002, life: 0.7 },
      { ratio: 2.74, type: "triangle", gain: 0.12, attack: 0.002, life: 0.38 },
      { ratio: 4.2, type: "sine", gain: 0.07, attack: 0.001, life: 0.22 },
    ]);
    return;
  }
  if (chime === "metal") {
    tone(midi, when, level, [
      { ratio: 1, type: "sine", gain: 0.26, attack: 0.001, life: 2.2 },
      { ratio: 2.01, type: "sine", gain: 0.11, attack: 0.001, life: 1.7 },
      { ratio: 2.76, type: "sine", gain: 0.14, attack: 0.001, life: 1.15 },
      { ratio: 5.04, type: "sine", gain: 0.06, attack: 0.001, life: 0.7 },
      { ratio: 8.14, type: "triangle", gain: 0.03, attack: 0.001, life: 0.28 },
    ]);
    tone(midi + 12, when, level * 0.22, [{ ratio: 1, type: "sine", gain: 0.18, attack: 0.001, life: 0.16 }]);
    return;
  }
  const audio = context();
  const bus = output();
  if (!bus) return;
  const start = Math.max(when, audio.currentTime + 0.005);
  if (when < audio.currentTime - 0.08) return;
  const freq = 440 * 2 ** ((midi - 69) / 12);
  const ring = Math.min(1.35, Math.max(0.48, 0.5 + (72 - midi) * 0.045));
  const partials = [
    { ratio: 1, gain: 0.4, life: 1, chirp: true },
    { ratio: 1.0035, gain: 0.15, life: 0.9, chirp: false },
    { ratio: 2, gain: 0.18, life: 0.32, chirp: false },
    { ratio: 3, gain: 0.13, life: 0.2, chirp: false },
    { ratio: 5.6, gain: 0.055, life: 0.07, chirp: false },
    { ratio: 8.4, gain: 0.028, life: 0.04, chirp: false },
  ];
  for (const partial of partials) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    const tone = freq * partial.ratio;
    if (partial.chirp) {
      osc.frequency.setValueAtTime(tone * 1.012, start);
      osc.frequency.exponentialRampToValueAtTime(tone, start + 0.035);
    } else {
      osc.frequency.setValueAtTime(tone, start);
    }
    const peak = Math.max(0.0001, level * partial.gain);
    const life = Math.max(0.04, ring * partial.life);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + life);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(start);
    osc.stop(start + life + 0.02);
    remember(osc, [gain], when);
  }

  if (!noise) {
    const length = Math.floor(audio.sampleRate * 0.03);
    noise = audio.createBuffer(1, length, audio.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.18));
  }
  const tick = audio.createBufferSource();
  const tickGain = audio.createGain();
  const filter = audio.createBiquadFilter();
  tick.buffer = noise;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(Math.min(4800, Math.max(1100, freq * 3.4)), start);
  filter.Q.setValueAtTime(1.4, start);
  tickGain.gain.setValueAtTime(Math.max(0.0001, level * 0.16), start);
  tickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.028);
  tick.connect(filter);
  filter.connect(tickGain);
  tickGain.connect(bus);
  tick.start(start);
  tick.stop(start + 0.04);
  remember(tick, [filter, tickGain], when);
}

function tone(
  midi: number,
  when: number,
  level: number,
  partials: { ratio: number; type: OscillatorType; gain: number; attack: number; life: number }[],
): void {
  const audio = context();
  const bus = output();
  if (!bus) return;
  const start = Math.max(when, audio.currentTime + 0.005);
  if (when < audio.currentTime - 0.08) return;
  const freq = 440 * 2 ** ((midi - 69) / 12);
  for (const partial of partials) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = partial.type;
    osc.frequency.setValueAtTime(freq * partial.ratio, start);
    const peak = Math.max(0.0001, level * partial.gain);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + partial.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + partial.life);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(start);
    osc.stop(start + partial.life + 0.02);
    remember(osc, [gain], when);
  }
}

export function scheduleBar(midi: number, when: number): void {
  strike(midi, when, 0.34);
}

export function playBarNow(midi: number): void {
  const audio = unlockAudio();
  strike(midi, audio.currentTime, 0.34);
}

export function scheduleClick(when: number): void {
  const audio = context();
  const bus = master;
  if (!bus) return;
  const start = Math.max(when, audio.currentTime + 0.005);
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(880, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.06, start + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.06);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(start);
  osc.stop(start + 0.07);
  remember(osc, [gain], when);
}
