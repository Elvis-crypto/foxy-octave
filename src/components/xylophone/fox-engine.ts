/**
 * The fox, procedurally. One fixed-step simulation (60 Hz) drives a small SVG
 * skeleton by writing `transform` / `opacity` attributes, never layout.
 *
 * - Every pose value eases toward its target (exponential smoothing), so one
 *   behavior blends into the next instead of snapping.
 * - Movement is velocity-based: accelerate, arrive, decelerate; turning around
 *   sweeps the facing through a narrow arc with a small lift and lean.
 * - Tail (three linked segments), head and ears are damped springs, so they lag
 *   and overshoot (follow-through).
 * - Objects have their own light physics and react to the fox and to taps.
 */
import type { FoxSceneKind } from "./fox-kinds";

export type Behavior =
  | "walk" | "trot" | "sit" | "tilt" | "sniff" | "pounce" | "chase" | "yawn" | "curl"
  | "roll" | "catch" | "wag" | "hop" | "confused" | "dance";

export const BEHAVIORS: readonly Behavior[] = [
  "walk", "trot", "sit", "tilt", "sniff", "pounce", "chase", "yawn", "curl", "roll", "catch", "wag", "hop", "confused", "dance",
];

export type ObjKind =
  | "ball" | "butterfly" | "mushroom" | "flower" | "snowman" | "snowball" | "leaves" | "puddle"
  | "duck" | "stump" | "mouse" | "drum" | "bell" | "notes";

export const OBJECTS: readonly ObjKind[] = [
  "ball", "butterfly", "mushroom", "flower", "snowman", "snowball", "leaves", "puddle", "duck", "stump", "mouse", "drum", "bell", "notes",
];

/** A few toys per scene, never more than three. */
export const SCENE_OBJECTS: Record<FoxSceneKind, readonly ObjKind[]> = {
  walk: ["ball", "mushroom", "stump"],
  winter: ["snowman", "mouse", "snowball"],
  autumn: ["leaves", "mushroom", "stump"],
  spring: ["butterfly", "flower", "ball"],
  night: ["stump", "notes"],
  dance: ["drum", "bell", "notes"],
  rain: ["puddle", "mushroom"],
  pond: ["duck", "stump", "flower"],
};

const LENGTH: Record<Behavior, number> = {
  walk: 0, trot: 0, sit: 4.2, tilt: 3.6, sniff: 3.2, pounce: 2.4, chase: 2.6, yawn: 2.6, curl: 7,
  roll: 1.8, catch: 1.6, wag: 1.4, hop: 1.6, confused: 1.8, dance: 4.8,
};

const MOODS: Record<FoxSceneKind, { playing: Behavior[]; resting: Behavior[] }> = {
  walk: { playing: ["trot", "trot", "tilt", "wag"], resting: ["walk", "sniff", "sit", "tilt"] },
  winter: { playing: ["trot", "pounce", "trot"], resting: ["walk", "pounce", "sniff", "sit"] },
  autumn: { playing: ["trot", "catch", "trot"], resting: ["catch", "walk", "sniff", "roll"] },
  spring: { playing: ["trot", "trot", "chase"], resting: ["walk", "walk", "sniff", "roll"] },
  night: { playing: ["tilt", "sit", "yawn"], resting: ["curl", "yawn", "tilt"] },
  dance: { playing: ["dance", "hop", "dance", "chase"], resting: ["dance", "sit", "chase"] },
  rain: { playing: ["trot", "sit"], resting: ["walk", "sit", "sniff"] },
  pond: { playing: ["tilt", "trot", "sit"], resting: ["sit", "tilt", "sniff", "walk"] },
};

const IDLE: Behavior[] = ["sit", "tilt", "sniff", "yawn", "chase", "roll", "walk"];

export function nextBehavior(kind: FoxSceneKind, playing: boolean, paused: boolean, roll = Math.random()): Behavior {
  const pool = paused ? IDLE : playing ? MOODS[kind].playing : MOODS[kind].resting;
  if (!playing && roll < 0.15) return IDLE[Math.floor((roll / 0.15) * IDLE.length)]!;
  return pool[Math.floor(roll * pool.length) % pool.length]!;
}

/* ---------- small math ---------- */
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
/** 0→1→0 over [a,b]. */
const bump = (u: number, a: number, b: number) => (u <= a || u >= b ? 0 : Math.sin(((u - a) / (b - a)) * Math.PI));
const env = (u: number, inn: number, out: number) => ease(u / inn) * ease((1 - u) / out);

type Spring = { v: number; d: number };
function spring(s: Spring, target: number, k: number, c: number, dt: number) {
  s.d += (k * (target - s.v) - c * s.d) * dt;
  s.v += s.d * dt;
}

/* ---------- pose ---------- */
type Pose = {
  sit: number; crouch: number; curl: number; head: number; earF: number; earB: number; tail: number;
  wag: number; wagRate: number; mouth: number; shut: number; jump: number; spin: number; sx: number; sy: number;
  paw: number; lean: number; perch: number;
};
const REST: Pose = {
  sit: 0, crouch: 0, curl: 0, head: 0, earF: 0, earB: 0, tail: 0, wag: 0, wagRate: 6, mouth: 0, shut: 0,
  jump: 0, spin: 0, sx: 1, sy: 1, paw: 0, lean: 0, perch: 0,
};
/** Smoothing rates (per second). Fast values for the parts of a jump. */
const RATE: Partial<Record<keyof Pose, number>> = { jump: 22, spin: 18, sx: 16, sy: 16, paw: 16, mouth: 10 };

/* ---------- objects ---------- */
export type Obj = {
  kind: ObjKind; x: number; y: number; vx: number; vy: number; rot: number; vr: number;
  wob: Spring; size: number; t: number; peek: number; hidden: number; parts: { x: number; y: number; vx: number; vy: number; life: number }[];
};

function makeObj(kind: ObjKind, x: number): Obj {
  return {
    kind, x, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, wob: { v: 0, d: 0 }, size: kind === "snowball" ? 4 : 1, t: Math.random() * 3,
    peek: 0, hidden: 0, parts: Array.from({ length: kind === "leaves" ? 9 : kind === "puddle" ? 7 : kind === "notes" ? 1 : 0 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 })),
  };
}

export type Els = {
  root: SVGGElement; whole: SVGGElement; body: SVGGElement; shadow: SVGEllipseElement; stand: SVGGElement; curled: SVGGElement;
  breathe: SVGGElement; torso: SVGGElement; haunch: SVGGElement; head: SVGGElement; earF: SVGGElement; earB: SVGGElement;
  eye: SVGGElement; shut: SVGPathElement; mouth: SVGPathElement; tail1: SVGGElement; tail2: SVGGElement; tail3: SVGGElement;
  legs: { hip: SVGGElement; knee: SVGGElement }[]; bubble: SVGTextElement;
  objs: Map<Obj, { g: SVGGElement; a?: SVGGElement; b?: SVGGElement; parts: SVGElement[] }>;
};

type Mode =
  | { b: Behavior; t: number; dur: number }
  | { b: "visit"; t: number; dur: number; obj: Obj; stage: 0 | 1 | 2 };

/** x positions of the legs (hip pivots), and whether they are hind legs. */
export const LEGS = [
  { x: 34, hind: true, phase: Math.PI },
  { x: 56, hind: false, phase: 0 },
  { x: 38, hind: true, phase: 0 },
  { x: 60, hind: false, phase: Math.PI },
] as const;

const FOX_SCALE = 0.72;
const GAP: Record<ObjKind, number> = {
  ball: 15, butterfly: 16, mushroom: 22, flower: 22, snowman: 30, snowball: 20, leaves: 30, puddle: 26,
  duck: 46, stump: 0, mouse: 34, drum: 24, bell: 24, notes: 0,
};
const LENGTH_VISIT: Record<ObjKind, number> = {
  ball: 3.4, butterfly: 4.5, mushroom: 2.6, flower: 2.6, snowman: 3.4, snowball: 3, leaves: 2.2, puddle: 2.2,
  duck: 4, stump: 4.4, mouse: 2.8, drum: 4, bell: 4, notes: 1.6,
};

export type EngineInput = {
  kind: FoxSceneKind; playing: boolean; paused: boolean; bpm: number; force: Behavior | null; forceObj: ObjKind | null;
};

export class FoxEngine {
  width = 360;
  readonly height = 48;
  els: Els | null = null;
  input: EngineInput = { kind: "walk", playing: false, paused: false, bpm: 100, force: null, forceObj: null };
  objs: Obj[] = [];

  private x = 160;
  private vx = 0;
  private tx = 160;
  private vmax = 40;
  private facing = 1;
  private faceTarget = 1;
  private ground = 0;
  private prevAy = 0;
  private gait = 0;
  private wagPhase = 0;
  private time = 0;
  private acc = 0;
  private blink = 3;
  private blinkT = 0;
  private twitch = 4;
  private twitchT = 0;
  private bubbleT = 0;
  private bubbleText = "";
  private mode: Mode = { b: "sit", t: 0, dur: 3 };
  private pose: Pose = { ...REST, sit: 1 };
  private tailS: Spring[] = [{ v: 0, d: 0 }, { v: 0, d: 0 }, { v: 0, d: 0 }];
  private headS: Spring = { v: 0, d: 0 };
  private earS: Spring[] = [{ v: 0, d: 0 }, { v: 0, d: 0 }];
  private beatAcc = 0;
  private visitsSince = 0;

  setObjects(kinds: readonly ObjKind[]) {
    const slots = kinds.length === 1 ? [0.72] : kinds.length === 2 ? [0.2, 0.78] : [0.12, 0.5, 0.86];
    this.objs = kinds.map((kind, i) => makeObj(kind, slots[i]! * this.width));
    for (const obj of this.objs) obj.y = obj.kind === "butterfly" ? 16 : 0;
  }

  resize(width: number) {
    const ratio = width / (this.width || width);
    this.width = width;
    for (const obj of this.objs) obj.x *= ratio;
    this.x = clamp(this.x * ratio, 30, width - 30);
    this.tx = clamp(this.tx * ratio, 30, width - 30);
  }

  /* ---------- decisions ---------- */
  start(b: Behavior | "auto") {
    const { force, forceObj } = this.input;
    if (forceObj) {
      const obj = this.objs.find((o) => o.kind === forceObj);
      if (obj) return this.visit(obj);
    }
    let pick: Behavior = b === "auto" ? (force ?? nextBehavior(this.input.kind, this.input.playing, this.input.paused)) : b;
    // Toys: now and then (and more when resting) the fox goes to one.
    if (b === "auto" && !force && this.objs.length && !this.input.paused) {
      const chance = this.input.playing ? 0.3 : 0.55;
      if (Math.random() < chance || this.visitsSince > 2) {
        this.visitsSince = 0;
        return this.visit(this.objs[Math.floor(Math.random() * this.objs.length)]!);
      }
      this.visitsSince += 1;
    }
    if (this.input.kind === "night" && !this.input.playing && pick === "walk") pick = "curl";
    let dur = LENGTH[pick];
    if (pick === "walk" || pick === "trot") {
      let to = 30 + Math.random() * (this.width - 60);
      if (Math.abs(to - this.x) < this.width * 0.25) to = this.x < this.width / 2 ? this.x + this.width * 0.4 : this.x - this.width * 0.4;
      this.tx = clamp(to, 30, this.width - 30);
      this.vmax = pick === "trot" ? 95 : 42;
      dur = 9;
    } else {
      this.tx = this.x;
    }
    if (pick === "catch") this.spawnNote(this.x + this.facing * 16, 0.55 * LENGTH.catch);
    this.mode = { b: pick, t: 0, dur };
  }

  visit(obj: Obj) {
    this.mode = { b: "visit", t: 0, dur: 12, obj, stage: 0 };
    if (obj.kind === "notes") {
      this.mode.stage = 1;
      this.mode.dur = LENGTH_VISIT.notes;
      this.spawnNote(this.x + this.facing * 16, 0.55 * LENGTH_VISIT.notes);
    }
  }

  react(kind: "good" | "oops" | "done" | "tap") {
    const pick: Behavior = kind === "good" ? "wag" : kind === "oops" ? "confused" : kind === "done" ? "hop" : Math.random() < 0.5 ? "hop" : "wag";
    this.tx = this.x;
    this.mode = { b: pick, t: 0, dur: LENGTH[pick] };
    if (pick === "confused") this.say("?");
    if (pick === "hop") this.say("♪");
  }

  say(text: string) {
    this.bubbleText = text;
    this.bubbleT = 1.4;
    if (this.els) this.els.bubble.textContent = text;
  }

  /** A tap on a toy. */
  poke(obj: Obj) {
    const dir = obj.x > this.x ? 1 : -1;
    switch (obj.kind) {
      case "ball": obj.vx += dir * 120; obj.vy = -70; break;
      case "butterfly": obj.vx = (Math.random() - 0.5) * 160; obj.vy = -60; break;
      case "mouse": obj.peek = 1; obj.hidden = 0; obj.t = 0; break;
      case "leaves": this.burst(obj, 1); break;
      case "puddle": this.burst(obj, 1); break;
      case "duck": obj.vy = -50; obj.wob.d += 200; break;
      case "snowball": obj.vx += dir * 60; break;
      case "notes": this.spawnNote(obj.x, 1); break;
      default: obj.wob.d += 260;
    }
  }

  private spawnNote(x: number, fallTime: number) {
    const holder = this.objs.find((o) => o.kind === "notes") ?? null;
    const part = holder?.parts[0];
    if (!holder || !part) return;
    part.x = clamp(x, 10, this.width - 10);
    part.y = -10;
    part.vy = 34 / Math.max(0.3, fallTime);
    part.life = fallTime + 0.4;
  }

  private burst(obj: Obj, power: number) {
    for (const p of obj.parts) {
      p.x = obj.x + (Math.random() - 0.5) * 10;
      p.y = -3;
      p.vx = (Math.random() - 0.5) * 120 * power;
      p.vy = -(60 + Math.random() * 70) * power;
      p.life = 1.6 + Math.random() * 0.6;
    }
    obj.wob.d -= 200;
  }

  /* ---------- simulation ---------- */
  frame(dt: number) {
    this.acc = Math.min(this.acc + dt, 0.1);
    const step = 1 / 60;
    while (this.acc >= step) {
      this.step(step);
      this.acc -= step;
    }
    this.render();
  }

  private target(): { pose: Pose; ground: number } {
    const p: Pose = { ...REST };
    const m = this.mode;
    const t = m.t;
    const u = m.dur ? clamp(t / m.dur, 0, 1) : 0;
    let ground = 0;
    const b = m.b;
    if (b === "sit") { p.sit = 1; p.head = 6; p.tail = -26; }
    if (b === "tilt") { p.sit = 1; p.head = 4 - 16 * bump(u, 0.15, 0.85); p.earF = -8 * bump(u, 0.2, 0.8); p.tail = -26; }
    if (b === "sniff") { p.head = 30 + 4 * Math.sin(t * 15); p.crouch = 0.35; p.tail = 6; p.earF = 6; }
    if (b === "pounce") this.pouncePose(p, u);
    if (b === "chase") { p.head = 22; p.tail = 30; p.wag = 1; p.wagRate = 16; p.jump = 2 * Math.abs(Math.sin(t * 9)); }
    if (b === "yawn") { const e = bump(u, 0.12, 0.88); p.sit = 1; p.head = -20 * e; p.mouth = e; p.shut = e; p.tail = -26; }
    if (b === "curl") { p.curl = 1; p.shut = 1; }
    if (b === "roll") { p.spin = 360 * ease(clamp((u - 0.12) / 0.7, 0, 1)); p.crouch = bump(u, 0, 0.3) * 0.6; p.sy = 1 - 0.12 * bump(u, 0.75, 1); p.sx = 1 + 0.08 * bump(u, 0.75, 1); }
    if (b === "catch") { const j = bump(u, 0.3, 0.85); p.jump = 16 * j; p.head = -34 * env(u, 0.3, 0.3); p.mouth = bump(u, 0.45, 0.7); p.crouch = bump(u, 0.05, 0.32) * 0.7 + bump(u, 0.8, 1) * 0.5; p.sx = 1 - 0.06 * j; p.sy = 1 + 0.08 * j; }
    if (b === "wag") { p.sit = 0.7; p.wag = 1; p.wagRate = 19; p.head = -8; p.tail = 10; }
    if (b === "hop") this.hopPose(p, u);
    if (b === "confused") { p.sit = 0.85; p.head = -24 * env(u, 0.15, 0.2); p.earF = -18 * env(u, 0.15, 0.2); p.tail = -20; }
    if (b === "dance") {
      const beat = 60 / clamp(this.input.bpm, 50, 180);
      const ph = (t / beat) * Math.PI;
      p.jump = 6 * Math.abs(Math.sin(ph)); p.lean = 7 * Math.sin(ph); p.wag = 1; p.wagRate = Math.PI / beat * 2; p.tail = 18;
      p.paw = Math.max(0, Math.sin(ph * 0.5)); p.sy = 1 + 0.05 * Math.sin(ph * 2); p.sx = 2 - p.sy;
    }
    if (b === "walk" || b === "trot") { p.tail = b === "trot" ? 18 : 4; p.head = b === "trot" ? 4 : 8; }
    if (b === "visit") ground = this.visitPose(p, m.obj, m.stage, t);
    return { pose: p, ground };
  }

  private pouncePose(p: Pose, u: number) {
    const crouch = bump(u, 0, 0.42);
    const air = bump(u, 0.3, 0.55);
    const nose = env(clamp((u - 0.5) / 0.36, 0, 1), 0.15, 0.3);
    p.crouch = crouch;
    p.lean = -6 * crouch + 66 * nose - 22 * air;
    p.jump = 22 * air - 3 * nose;
    p.tail = 30 * air + 40 * nose;
    p.wag = nose;
    p.wagRate = 20;
    p.sy = 1 - 0.14 * crouch + 0.1 * air;
    p.sx = 2 - p.sy;
  }

  private hopPose(p: Pose, u: number) {
    const a = bump(u, 0.1, 0.45);
    const b = bump(u, 0.55, 0.9);
    p.jump = 16 * a + 12 * b;
    p.crouch = bump(u, 0, 0.12) + bump(u, 0.43, 0.57) + bump(u, 0.88, 1) * 0.6;
    p.sy = 1 + 0.12 * (a + b) - 0.14 * p.crouch;
    p.sx = 2 - p.sy;
    p.lean = -10 * b;
    p.wag = 1;
    p.wagRate = 18;
    p.tail = 26;
    p.head = -10;
  }

  /** Approach and interaction with one toy. Returns the ground height under the fox. */
  private visitPose(p: Pose, obj: Obj, stage: 0 | 1 | 2, t: number): number {
    const k = obj.kind;
    if (stage === 0) { p.tail = 10; p.head = 6; return 0; }
    const u = clamp(t / LENGTH_VISIT[k], 0, 1);
    switch (k) {
      case "ball":
        if (t < 0.6) { p.paw = bump(t / 0.6, 0, 1); p.head = 18; p.crouch = 0.3; } else { p.tail = 22; p.wag = 0.6; p.wagRate = 12; p.head = 10; }
        return 0;
      case "butterfly":
        p.head = -26; p.earF = -6; p.tail = 16; p.wag = 0.4;
        p.jump = 10 * bump((t % 1.5) / 1.5, 0.6, 0.95) * (obj.y < 18 ? 1 : 0.3);
        return 0;
      case "mushroom": case "flower":
        p.head = 32 + 3 * Math.sin(t * 14); p.crouch = 0.3; p.tail = 8; p.earF = 8;
        return 0;
      case "snowman":
        p.sit = 1; p.head = -14 - 6 * bump(u, 0.3, 0.8); p.tail = -24; p.earF = -8 * bump(u, 0.3, 0.8);
        return 0;
      case "snowball":
        p.head = 26; p.crouch = 0.25; p.tail = 12;
        return 0;
      case "leaves": case "mouse":
        this.pouncePose(p, k === "mouse" ? u : clamp(u * 1.1, 0, 1));
        return 0;
      case "puddle":
        this.hopPose(p, clamp(u * 1.4, 0, 1));
        if (u > 0.7) { p.wag = 1; p.wagRate = 26; p.sx = 1 + 0.04 * Math.sin(t * 40); }
        return 0;
      case "duck":
        p.sit = 1; p.head = -6 * Math.sin(t * 1.4) - 4; p.earF = 6 * Math.sin(t * 2.1); p.tail = -24;
        return 0;
      case "stump": {
        const on = ease(clamp((t - 0.25) / 0.35, 0, 1)) * (1 - ease(clamp((t - (LENGTH_VISIT.stump - 0.6)) / 0.35, 0, 1)));
        p.jump = 10 * (bump(t, 0.15, 0.65) + bump(t, LENGTH_VISIT.stump - 0.7, LENGTH_VISIT.stump - 0.1));
        p.sit = on; p.head = 4 - 10 * on * bump(u, 0.3, 0.8); p.tail = -20 * on;
        return 9.5 * on;
      }
      case "drum": case "bell": {
        const beat = 60 / clamp(this.input.bpm, 50, 180);
        const ph = (t % beat) / beat;
        p.sit = 0.9; p.paw = Math.max(0, 1 - ph * 3) * 0.9; p.head = 10; p.tail = -10; p.wag = 0.5; p.wagRate = Math.PI * 2 / beat;
        return 0;
      }
      case "notes": {
        const j = bump(u, 0.3, 0.85);
        p.jump = 16 * j; p.head = -34 * env(u, 0.3, 0.3); p.mouth = bump(u, 0.45, 0.7); p.crouch = bump(u, 0.05, 0.32) * 0.7;
        return 0;
      }
    }
    return 0;
  }

  private step(dt: number) {
    this.time += dt;
    const m = this.mode;
    m.t += dt;

    // Visit: walk up to the toy, then play with it.
    if (m.b === "visit") {
      const obj = m.obj;
      if (m.stage === 0) {
        const gap = GAP[obj.kind];
        const side = gap === 0 ? Math.sign(this.facing || 1) : obj.x >= this.x ? 1 : -1;
        this.tx = clamp(obj.x - side * gap, 26, this.width - 26);
        this.vmax = this.input.playing ? 90 : 55;
        if (obj.kind === "butterfly") { m.stage = 1; m.t = 0; }
        else if (Math.abs(this.x - this.tx) < 4 && Math.abs(this.vx) < 8) {
          this.faceTarget = side;
          if (Math.abs(this.facing - this.faceTarget) < 0.2) { m.stage = 1; m.t = 0; }
        } else if (m.t > 8) {
          this.start("auto");
          return;
        }
      } else if (m.stage === 1) {
        this.interact(obj, m.t, dt);
        if (m.t >= LENGTH_VISIT[obj.kind]) { m.stage = 2; }
      }
      if (m.stage === 2) { this.start("auto"); return; }
    } else if (m.b === "sniff") {
      this.tx = this.x + this.facing * 4; this.vmax = 8;
    } else if (m.b === "roll") {
      this.vmax = 30; if (m.t < 0.1) this.tx = clamp(this.x + this.facing * 20, 26, this.width - 26);
    } else if (m.b === "pounce") {
      this.vmax = 110; if (m.t > 0.7 && m.t < 0.75) this.tx = clamp(this.x + this.facing * 24, 26, this.width - 26);
    } else if (m.b === "chase") {
      this.faceTarget = Math.sin(m.t * 5) >= 0 ? 1 : -1; this.tx = this.x;
    } else if (m.b === "dance") {
      const beat = 60 / clamp(this.input.bpm, 50, 180);
      this.faceTarget = Math.floor(m.t / (beat * 4)) % 2 === 0 ? 1 : -1;
    }

    const arrived = (m.b === "walk" || m.b === "trot") && Math.abs(this.x - this.tx) < 4 && Math.abs(this.vx) < 6;
    if (arrived || (m.b !== "walk" && m.b !== "trot" && m.b !== "visit" && m.t >= m.dur)) this.start("auto");

    // Locomotion: arrive steering with an acceleration limit. Turning first slows the fox.
    const dx = this.tx - this.x;
    const wantDir = Math.abs(dx) > 3 ? Math.sign(dx) : 0;
    if (wantDir !== 0) this.faceTarget = wantDir;
    const turning = 1 - Math.abs(this.facing);
    const sameWay = Math.sign(this.facing) === wantDir;
    let desired = clamp(dx * 2.2, -this.vmax, this.vmax);
    if (wantDir !== 0 && !sameWay) desired = 0;
    desired *= 1 - turning;
    const accel = 160;
    const ax = clamp((desired - this.vx) / dt, -accel, accel);
    this.vx += ax * dt;
    this.x = clamp(this.x + this.vx * dt, 20, this.width - 20);
    this.facing += clamp(this.faceTarget - this.facing, -dt * 4.5, dt * 4.5);

    // Pose: ease every value toward its target.
    const { pose: target, ground } = this.target();
    for (const key of Object.keys(target) as (keyof Pose)[]) {
      const rate = RATE[key] ?? 7;
      this.pose[key] = lerp(this.pose[key], target[key], 1 - Math.exp(-rate * dt));
    }
    if (this.mode.b !== "roll" && this.pose.spin > 300) this.pose.spin = 0;
    this.ground = lerp(this.ground, ground, 1 - Math.exp(-14 * dt));

    const speed = Math.abs(this.vx);
    this.gait += dt * (speed / 20) * Math.PI * 2 * (speed > 60 ? 0.85 : 1);
    this.wagPhase += dt * this.pose.wagRate;

    // Springs: tail follows body motion and lags segment by segment; head and ears overlap.
    const ay = this.pose.jump - this.prevAy;
    this.prevAy = this.pose.jump;
    const run = clamp(speed / 90, 0, 1);
    const t1 = 10 + this.pose.tail + run * 22 + this.pose.wag * 18 * Math.sin(this.wagPhase) + 3 * Math.sin(this.time * 1.7) - this.pose.curl * 20;
    this.tailS[0]!.d += ay * 40 + ax * 0.02 * this.facing;
    spring(this.tailS[0]!, t1, 90, 11, dt);
    spring(this.tailS[1]!, this.tailS[0]!.v * 0.55 + this.pose.wag * 10 * Math.sin(this.wagPhase - 0.9), 70, 8, dt);
    spring(this.tailS[2]!, this.tailS[1]!.v * 0.6 + this.pose.wag * 8 * Math.sin(this.wagPhase - 1.8), 55, 6, dt);
    const lean = clamp(ax * this.facing * 0.03, -6, 6);
    spring(this.headS, this.pose.head - lean * 0.8 + run * 6, 80, 13, dt);
    this.headS.d += ay * 25;
    spring(this.earS[0]!, this.pose.earF - this.headS.d * 0.06 - run * 14, 120, 10, dt);
    spring(this.earS[1]!, this.pose.earB - this.headS.d * 0.05 - run * 12, 110, 9, dt);
    this.leanNow = lerp(this.leanNow, lean, 1 - Math.exp(-6 * dt));

    // Blinks and ear twitches.
    this.blink -= dt;
    if (this.blink <= 0) { this.blinkT = 0.14; this.blink = 2 + Math.random() * 3.5; }
    this.blinkT = Math.max(0, this.blinkT - dt);
    this.twitch -= dt;
    if (this.twitch <= 0) { this.twitchT = 0.3; this.twitch = 3 + Math.random() * 5; this.earS[Math.random() < 0.6 ? 0 : 1]!.d -= 260; }
    this.twitchT = Math.max(0, this.twitchT - dt);
    this.bubbleT = Math.max(0, this.bubbleT - dt);

    this.stepObjects(dt);
  }

  private leanNow = 0;

  private interact(obj: Obj, t: number, dt: number) {
    const k = obj.kind;
    const nose = this.x + this.facing * 20;
    if (k === "ball") {
      if (t > 0.3 && t - dt <= 0.3) { obj.vx = this.facing * (90 + Math.random() * 50); obj.vy = -60; }
      if (t > 0.6) { this.tx = clamp(obj.x - Math.sign(obj.vx || this.facing) * 16, 26, this.width - 26); this.vmax = 90; }
    } else if (k === "butterfly") {
      const side = obj.x >= this.x ? 1 : -1;
      this.tx = clamp(obj.x - side * 18, 26, this.width - 26);
      this.vmax = 60;
    } else if (k === "mushroom" || k === "flower" || k === "snowman") {
      if (t > 0.8 && t - dt <= 0.8) obj.wob.d += 220 * this.facing;
    } else if (k === "snowball") {
      if (t < 0.2) this.tx = clamp(this.x + this.facing * 60, 26, this.width - 26);
      this.vmax = 26;
      const want = nose + this.facing * obj.size;
      if (Math.abs(obj.x - want) < 14) { obj.vx = this.vx; obj.x = lerp(obj.x, want, 0.3); obj.size = Math.min(7.5, obj.size + Math.abs(this.vx) * dt * 0.03); }
    } else if (k === "leaves" || k === "mouse") {
      const len = LENGTH_VISIT[k];
      if (t > len * 0.28 && t - dt <= len * 0.28) this.tx = clamp(obj.x - this.facing * 6, 26, this.width - 26);
      this.vmax = 120;
      if (k === "mouse") { if (t < len * 0.25) obj.peek = 1; else obj.hidden = 1; }
      if (k === "leaves" && t > len * 0.5 && t - dt <= len * 0.5) this.burst(obj, 1);
    } else if (k === "puddle") {
      if (t < 0.1) this.tx = clamp(obj.x, 26, this.width - 26);
      this.vmax = 70;
      if (t > 0.75 && t - dt <= 0.75) this.burst(obj, 0.8);
    } else if (k === "duck") {
      if (Math.abs(obj.x - this.x) < 56) obj.vx += Math.sign(obj.x - this.x || 1) * 18 * dt;
    } else if (k === "stump") {
      this.tx = obj.x; this.vmax = 40;
    } else if (k === "drum" || k === "bell") {
      const beat = 60 / clamp(this.input.bpm, 50, 180);
      this.beatAcc += dt;
      if (this.beatAcc >= beat) { this.beatAcc -= beat; obj.wob.d += k === "drum" ? -260 : 320 * this.facing; }
    }
  }

  private stepObjects(dt: number) {
    const W = this.width;
    for (const obj of this.objs) {
      obj.t += dt;
      spring(obj.wob, 0, obj.kind === "bell" ? 60 : 140, obj.kind === "bell" ? 3 : 9, dt);
      if (obj.kind === "ball" || obj.kind === "snowball") {
        obj.vy += 420 * dt;
        obj.y = Math.min(0, obj.y + obj.vy * dt);
        if (obj.y >= 0 && obj.vy > 0) obj.vy = obj.vy > 60 ? -obj.vy * 0.45 : 0;
        obj.vx *= Math.exp(-(obj.kind === "ball" ? 1.1 : 3) * dt);
        obj.x += obj.vx * dt;
        const r = obj.kind === "ball" ? 5 : obj.size;
        if (obj.x < r + 2 || obj.x > W - r - 2) { obj.vx = -obj.vx * 0.6; obj.x = clamp(obj.x, r + 2, W - r - 2); }
        obj.rot += (obj.vx * dt * 180) / (Math.PI * r);
        if (obj.kind === "snowball" && Math.abs(obj.vx) < 1 && obj.size > 7) obj.size = lerp(obj.size, 4, dt * 0.2);
      } else if (obj.kind === "butterfly") {
        const tx = W * (0.5 + 0.4 * Math.sin(obj.t * 0.23) * Math.cos(obj.t * 0.11));
        const ty = 14 + 8 * Math.sin(obj.t * 0.7);
        obj.vx += ((tx - obj.x) * 0.8 + Math.sin(obj.t * 3.1) * 30) * dt;
        obj.vy += ((ty - obj.y) * 1.5 + Math.cos(obj.t * 4.3) * 40) * dt;
        obj.vx *= Math.exp(-1.2 * dt);
        obj.vy *= Math.exp(-2 * dt);
        obj.x = clamp(obj.x + obj.vx * dt, 8, W - 8);
        obj.y = clamp(obj.y + obj.vy * dt, 4, 30);
      } else if (obj.kind === "duck") {
        obj.vx *= Math.exp(-0.8 * dt);
        obj.vx += Math.sin(obj.t * 0.4) * 2 * dt;
        obj.x = clamp(obj.x + obj.vx * dt, W * 0.62, W - 12);
        obj.vy += 300 * dt;
        obj.y = Math.min(0, obj.y + obj.vy * dt);
      } else if (obj.kind === "mouse") {
        if (obj.hidden > 0) { obj.peek = lerp(obj.peek, 0, 1 - Math.exp(-20 * dt)); obj.hidden = Math.max(0, obj.hidden - dt * 0.4); }
        else {
          const cycle = obj.t % 5;
          const near = Math.abs(obj.x - this.x) < 90 && this.mode.b === "visit";
          obj.peek = lerp(obj.peek, near || (cycle > 1.2 && cycle < 3.4) ? 1 : 0, 1 - Math.exp(-6 * dt));
        }
      } else if (obj.kind === "notes") {
        if (obj.t > 6 && !(this.mode.b === "visit" && this.mode.obj === obj)) { obj.t = 0; this.spawnNote(20 + Math.random() * (W - 40), 2.2); }
      }
      for (const part of obj.parts) {
        if (part.life <= 0) continue;
        part.life -= dt;
        if (obj.kind === "notes") { part.y += part.vy * dt; continue; }
        part.vy += (obj.kind === "leaves" ? 160 : 380) * dt;
        part.vx *= Math.exp(-(obj.kind === "leaves" ? 2.2 : 0.6) * dt);
        part.x += part.vx * dt;
        part.y = Math.min(0, part.y + part.vy * dt);
        if (part.y >= 0) { part.vy = 0; part.vx *= 0.8; }
      }
    }
  }

  /* ---------- drawing ---------- */
  private render() {
    const e = this.els;
    if (!e) return;
    const p = this.pose;
    const H = this.height - 2;
    const f = this.facing;
    const fx = Math.sign(f || 1) * Math.max(0.16, Math.abs(f));
    const turnLift = 3 * (1 - Math.abs(f));
    const lift = p.jump + turnLift + this.ground;
    const s = FOX_SCALE;
    e.root.setAttribute("transform", `translate(${this.x.toFixed(2)} ${(H - lift).toFixed(2)}) scale(${(fx * s).toFixed(3)} ${s})`);
    e.shadow.setAttribute("transform", `translate(${this.x.toFixed(2)} ${(H - this.ground).toFixed(2)}) scale(${(Math.max(0.35, 1 - p.jump / 30) * s).toFixed(3)} ${s})`);
    e.shadow.setAttribute("opacity", (0.13 * Math.max(0.35, 1 - p.jump / 30)).toFixed(3));

    const speed = Math.abs(this.vx);
    const amp = clamp(speed / 45, 0, 1) * (1 - p.sit) * (1 - p.curl);
    const bob = speed > 4 ? Math.abs(Math.sin(this.gait)) * (speed > 60 ? 2.2 : 1.2) * amp : 0;
    const crouchY = p.crouch * 4;
    const breath = 1 + 0.025 * Math.sin(this.time * 2.1);
    e.whole.setAttribute(
      "transform",
      `translate(0 ${(crouchY - bob).toFixed(2)}) rotate(${(p.spin + p.lean * 0.4).toFixed(2)} 0 -12) scale(${p.sx.toFixed(3)} ${p.sy.toFixed(3)})`,
    );
    e.stand.setAttribute("opacity", (1 - p.curl).toFixed(3));
    e.curled.setAttribute("opacity", p.curl.toFixed(3));
    e.breathe.setAttribute("transform", `translate(48 51) scale(1 ${breath.toFixed(3)}) translate(-48 -51)`);
    e.body.setAttribute(
      "transform",
      `translate(0 ${(7 * p.sit).toFixed(2)}) rotate(${(-26 * p.sit).toFixed(2)} 36 40) rotate(${(p.lean * 0.6 + this.leanNow).toFixed(2)} 46 44)`,
    );
    e.torso.setAttribute("transform", `translate(46 44) scale(1 ${breath.toFixed(3)}) translate(-46 -44)`);
    e.haunch.setAttribute("opacity", ease(p.sit * 1.2).toFixed(3));

    LEGS.forEach((leg, i) => {
      const el = e.legs[i]!;
      const ph = this.gait + leg.phase + (leg.hind ? 0.5 : 0);
      let hip = 26 * amp * Math.sin(ph);
      let knee = (leg.hind ? -1 : 1) * 30 * amp * Math.max(0, Math.sin(ph + Math.PI / 2));
      hip -= p.crouch * (leg.hind ? -18 : 14);
      knee += p.crouch * (leg.hind ? -34 : 26);
      if (leg.hind) {
        hip = lerp(hip, -82, p.sit);
        knee = lerp(knee, 150, p.sit);
      } else {
        hip = lerp(hip, 26, p.sit);
        if (i === 3) { hip -= 58 * p.paw; knee += 70 * p.paw; }
      }
      el.hip.setAttribute("transform", `rotate(${hip.toFixed(2)} ${leg.x} 36)`);
      el.knee.setAttribute("transform", `rotate(${knee.toFixed(2)} ${leg.x} 44)`);
    });

    const headRot = this.headS.v + 20 * p.sit * 0.55;
    e.head.setAttribute("transform", `rotate(${headRot.toFixed(2)} 60 30)`);
    e.earF.setAttribute("transform", `rotate(${this.earS[0]!.v.toFixed(2)} 68 18)`);
    e.earB.setAttribute("transform", `rotate(${this.earS[1]!.v.toFixed(2)} 63 19)`);
    const shut = Math.max(p.shut, this.blinkT > 0 ? 1 : 0);
    e.eye.setAttribute("transform", `translate(73 23.4) scale(1 ${(1 - 0.9 * shut).toFixed(3)}) translate(-73 -23.4)`);
    e.shut.setAttribute("opacity", (shut > 0.6 ? 1 : 0).toString());
    e.mouth.setAttribute("transform", `translate(80 29.4) scale(${(0.3 + p.mouth).toFixed(3)} ${(0.2 + 2.4 * p.mouth).toFixed(3)}) translate(-80 -29.4)`);
    e.tail1.setAttribute("transform", `rotate(${this.tailS[0]!.v.toFixed(2)} 32 31)`);
    e.tail2.setAttribute("transform", `rotate(${this.tailS[1]!.v.toFixed(2)} 22 31.5)`);
    e.tail3.setAttribute("transform", `rotate(${this.tailS[2]!.v.toFixed(2)} 13 31)`);
    e.bubble.setAttribute("opacity", Math.min(1, this.bubbleT * 2).toFixed(2));
    e.bubble.setAttribute("transform", `translate(${(this.x + this.facing * 18).toFixed(1)} ${(H - 34 - lift - (1.4 - this.bubbleT) * 6).toFixed(1)})`);
    if (this.bubbleText && e.bubble.textContent !== this.bubbleText) e.bubble.textContent = this.bubbleText;

    for (const obj of this.objs) {
      const view = e.objs.get(obj);
      if (!view) continue;
      this.drawObj(obj, view, H);
    }
  }

  private drawObj(obj: Obj, view: { g: SVGGElement; a?: SVGGElement; b?: SVGGElement; parts: SVGElement[] }, H: number) {
    const k = obj.kind;
    const w = obj.wob.v;
    let tf = `translate(${obj.x.toFixed(2)} ${(H + obj.y).toFixed(2)})`;
    if (k === "ball") tf += ` rotate(${obj.rot.toFixed(1)} 0 -5)`;
    if (k === "snowball") tf += ` scale(${(obj.size / 5).toFixed(3)}) rotate(${obj.rot.toFixed(1)} 0 -5)`;
    if (k === "mushroom" || k === "drum") tf += ` scale(${(1 + w * 0.004).toFixed(3)} ${(1 - w * 0.006).toFixed(3)})`;
    if (k === "flower" || k === "snowman" || k === "bell") tf += ` rotate(${clamp(w * 0.12, -30, 30).toFixed(2)} 0 ${k === "bell" ? -22 : 0})`;
    if (k === "leaves") tf += ` scale(${(1 - w * 0.002).toFixed(3)} ${(1 + w * 0.003).toFixed(3)})`;
    if (k === "duck") tf = `translate(${obj.x.toFixed(2)} ${(H - 1 + obj.y + Math.sin(obj.t * 2.2) * 0.8).toFixed(2)}) rotate(${(Math.sin(obj.t * 1.6) * 4 + w * 0.05).toFixed(2)})`;
    if (k === "butterfly") tf = `translate(${obj.x.toFixed(2)} ${obj.y.toFixed(2)}) scale(${obj.vx < 0 ? -1 : 1} 1)`;
    if (k === "notes") tf = "translate(0 0)";
    view.g.setAttribute("transform", tf);
    if (k === "butterfly" && view.a && view.b) {
      const flap = 0.25 + 0.75 * Math.abs(Math.cos(obj.t * 18));
      view.a.setAttribute("transform", `scale(${flap.toFixed(3)} 1)`);
      view.b.setAttribute("transform", `scale(${flap.toFixed(3)} 1)`);
    }
    if (k === "mouse" && view.a) view.a.setAttribute("transform", `translate(0 ${(7 * (1 - obj.peek)).toFixed(2)})`);
    if (k === "snowman" && view.a) view.a.setAttribute("transform", `rotate(${clamp(w * 0.2, -25, 25).toFixed(2)} 0 -14)`);
    if (k === "puddle" && view.a) {
      const r = (obj.t * 0.6) % 1;
      view.a.setAttribute("transform", `scale(${(0.4 + r).toFixed(3)} ${(0.4 + r).toFixed(3)})`);
      view.a.setAttribute("opacity", (0.6 * (1 - r)).toFixed(3));
    }
    obj.parts.forEach((part, i) => {
      const el = view.parts[i];
      if (!el) return;
      if (part.life <= 0) { el.setAttribute("opacity", "0"); return; }
      const x = k === "notes" ? part.x : part.x - obj.x;
      const y = k === "notes" ? part.y : part.y;
      el.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${((part.vx + i * 40) * 2).toFixed(1)})`);
      el.setAttribute("opacity", Math.min(1, part.life * 2).toFixed(2));
    });
  }

  /** One still frame (reduced motion): sitting, or curled up at night. */
  still() {
    this.mode = { b: this.input.kind === "night" ? "curl" : "sit", t: 0, dur: 9999 };
    this.tx = this.x;
    const { pose } = this.target();
    this.pose = { ...pose };
    this.headS.v = pose.head;
    this.tailS.forEach((s) => (s.v = -10));
    this.render();
  }

  /** Move the fox somewhere sensible at mount. */
  place(x: number) {
    this.x = this.tx = clamp(x, 30, this.width - 30);
  }

  get behavior(): string {
    return this.mode.b === "visit" ? `visit:${this.mode.obj.kind}` : this.mode.b;
  }
}
