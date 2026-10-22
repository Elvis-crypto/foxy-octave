import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pitchOf } from "./pitch.ts";
import { gradeHit, shouldCall, tallyGrades } from "./score.ts";
import { langFromSignals } from "./locale.ts";

function sine(freq: number, sampleRate: number, length: number): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) out[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.4;
  return out;
}

describe("pitch and score", () => {
  it("hears a bar-like tone", () => {
    const heard = pitchOf(sine(440, 44100, 2048), 44100);
    assert.ok(heard);
    assert.ok(Math.abs(heard - 440) < 8);
    const high = pitchOf(sine(523.25, 44100, 2048), 44100);
    assert.ok(high);
    assert.ok(Math.abs(high - 523.25) < 12);
  });

  it("keeps early, late, and next door as different calls", () => {
    const notes = [
      { lane: 3, startBeat: 0 },
      { lane: 3, startBeat: 2 },
    ];
    const taken = new Set<number>();
    const bpm = 100;
    const spot = gradeHit(notes, { lane: 3, beat: 0.05 }, bpm, taken);
    const early = gradeHit(notes, { lane: 3, beat: 1.55 }, bpm, taken);
    assert.equal(spot?.verdict, "spot");
    assert.equal(early?.verdict, "early");

    const lateTaken = new Set<number>();
    const late = gradeHit(notes, { lane: 3, beat: 0.45 }, bpm, lateTaken);
    assert.equal(late?.verdict, "late");

    const nextTaken = new Set<number>();
    const next = gradeHit(notes, { lane: 4, beat: -0.4 }, bpm, nextTaken);
    assert.equal(next?.verdict, "next");
    assert.equal(next?.noteIndex, 0);

    const far = gradeHit(notes, { lane: 7, beat: 0 }, bpm, new Set());
    assert.equal(far, null);
    const tally = tallyGrades(2, [spot!, early!]);
    assert.deepEqual(tally, { spot: 1, early: 1, late: 0, next: 0, missed: 0 });
  });

  it("says spot on once, and stays quiet when calls would pile up", () => {
    assert.equal(shouldCall("spot", null, 0), true);
    assert.equal(shouldCall("spot", { verdict: "spot", atMs: 0 }, 400), false);
    assert.equal(shouldCall("late", { verdict: "spot", atMs: 0 }, 400), false);
    assert.equal(shouldCall("late", { verdict: "spot", atMs: 0 }, 1000), true);
    assert.equal(shouldCall("next", { verdict: "early", atMs: 0 }, 1200), true);
  });

  it("serves the language of the country, then the browser, and keeps a saved choice", () => {
    assert.equal(langFromSignals({ cookie: null, country: "HU", accept: "en" }), "hu");
    assert.equal(langFromSignals({ cookie: null, country: "DE", accept: "hu-HU,hu;q=0.9" }), "de");
    assert.equal(langFromSignals({ cookie: null, country: "AT", accept: "en" }), "de");
    assert.equal(langFromSignals({ cookie: null, country: "FR", accept: "en" }), "fr");
    assert.equal(langFromSignals({ cookie: null, country: "ES", accept: "en" }), "es");
    assert.equal(langFromSignals({ cookie: null, country: "DK", accept: "en" }), "da");
    assert.equal(langFromSignals({ cookie: null, country: null, accept: "hu-HU,en;q=0.5" }), "hu");
    assert.equal(langFromSignals({ cookie: null, country: null, accept: "fr-FR,en;q=0.8" }), "fr");
    assert.equal(langFromSignals({ cookie: null, country: null, accept: "da,en;q=0.5" }), "da");
    assert.equal(langFromSignals({ cookie: null, country: "US", accept: "es-ES,en;q=0.5" }), "es");
    assert.equal(langFromSignals({ cookie: null, country: null, accept: "en-US" }), "en");
    assert.equal(langFromSignals({ cookie: "lo-lang=en", country: "HU", accept: "hu" }), "en");
    assert.equal(langFromSignals({ cookie: "a=1; lo-lang=hu", country: "US", accept: "en" }), "hu");
    assert.equal(langFromSignals({ cookie: "lo-lang=da", country: "HU", accept: "hu" }), "da");
  });
});
