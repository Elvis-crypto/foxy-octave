/** Root-mean-square level of a mic buffer. */
export function rms(samples: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i]! * samples[i]!;
  return Math.sqrt(sum / samples.length);
}

/**
 * Pitch in Hz, or null when the buffer is quiet or unpitched.
 * A short YIN difference, good enough for one xylophone bar at a time.
 */
export function pitchOf(samples: ArrayLike<number>, sampleRate: number): number | null {
  const n = samples.length;
  if (n < 256 || rms(samples) < 0.018) return null;
  const minLag = Math.max(2, Math.floor(sampleRate / 1800));
  const maxLag = Math.min(Math.floor(n / 2) - 1, Math.floor(sampleRate / 150));
  if (maxLag <= minLag) return null;

  const diff = new Float32Array(maxLag + 1);
  for (let lag = 1; lag <= maxLag; lag += 1) {
    let sum = 0;
    const limit = n - lag;
    for (let i = 0; i < limit; i += 1) {
      const delta = samples[i]! - samples[i + lag]!;
      sum += delta * delta;
    }
    diff[lag] = sum;
  }

  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let lag = 1; lag <= maxLag; lag += 1) {
    running += diff[lag]!;
    cmnd[lag] = running === 0 ? 1 : (diff[lag]! * lag) / running;
  }

  let lag = minLag;
  while (lag <= maxLag && cmnd[lag]! > 0.18) lag += 1;
  if (lag > maxLag) return null;
  while (lag < maxLag && cmnd[lag + 1]! < cmnd[lag]!) lag += 1;
  if (cmnd[lag]! > 0.3) return null;

  const prev = cmnd[lag - 1] ?? 1;
  const next = cmnd[lag + 1] ?? 1;
  const here = cmnd[lag]!;
  const denom = prev + next - 2 * here;
  const shift = denom === 0 ? 0 : (prev - next) / (2 * denom);
  const period = lag + shift;
  if (period <= 0) return null;
  return sampleRate / period;
}

export function centsBetween(heard: number, reference: number): number {
  return 1200 * Math.log2(heard / reference);
}

/** Nearest learned bar, if the strike is close enough to be one of the eight. */
export function nearestBar(freq: number, profile: readonly number[]): number | null {
  let lane = -1;
  let best = 81;
  for (let i = 0; i < profile.length; i += 1) {
    const distance = Math.abs(centsBetween(freq, profile[i]!));
    if (distance < best) {
      best = distance;
      lane = i;
    }
  }
  return lane < 0 ? null : lane;
}
