const KEY = "little-octave.toy";

export function loadToy(): number[] | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "") as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 8) return null;
    if (!parsed.every((freq) => typeof freq === "number" && freq > 80 && freq < 4000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveToy(freqs: readonly number[]): void {
  localStorage.setItem(KEY, JSON.stringify(freqs));
}

export function clearToy(): void {
  localStorage.removeItem(KEY);
}
