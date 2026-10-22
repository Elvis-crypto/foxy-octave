import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A small fox along the bottom of the screen. Decorative only: aria-hidden,
 * no pointer events, and it sits under the controls, never over the bars.
 * The scene follows the song (snow for winter, butterflies for spring, stars
 * for lullabies, dancing for folk dances). With prefers-reduced-motion the
 * scene is drawn still.
 */

export type FoxSceneKind = "walk" | "winter" | "autumn" | "spring" | "night" | "dance" | "rain" | "pond";

const SCENES: Record<Exclude<FoxSceneKind, "walk">, readonly string[]> = {
  winter: ["jingle-bells", "mennybol-az-angyal", "elesett-a-lud"],
  autumn: ["szolo", "szilva", "osszel-erik-babam", "felulrol-fuj", "debrecenbe"],
  spring: [
    "tavaszi", "katalinka", "voegel", "kuckuck", "bienchen", "golya", "en-kis-kertet", "choux",
    "csiga-biga", "sussfel", "zoldag", "haeschen", "kis-kece-lanyom", "baa", "oldmac", "mary", "boci",
  ],
  night: ["twinkle", "maman", "csillagok", "brahms", "dodo", "clair", "hajnalcsillag", "eine-kleine", "ablakomba", "loup"],
  dance: [
    "hopp", "lanc", "cuca", "avignon", "pajara", "rueda", "patio", "megismerni-a-kanaszt", "komaromi-kisleany",
    "aki", "part", "bujjitt", "saints", "pferdchen", "alouette", "ainsi", "hoved", "pinpon", "aserrin",
    "ha-en-cica-volnek", "cifra-palota", "a-jo-lovas-katonanak", "jakob", "frere", "happy-birthday",
  ],
  rain: ["rain", "itsy", "duna"],
  pond: ["kiskacsa", "entchen", "row", "pollitos"],
};

const WORDS: [FoxSceneKind, RegExp][] = [
  ["winter", /\b(tél|hó|snow|schnee|neige|nieve|sne|christmas|karácsony|jingle)/i],
  ["night", /\b(lullaby|altató|csillag|star|stern|étoile|estrella|moon|lune|hold|nacht|night|éj|dodo|sleep)/i],
  ["spring", /\b(tavasz|spring|frühling|printemps|primavera|forår|virág|flower|blume|madár|bird|vogel|oiseau)/i],
  ["autumn", /\b(ősz|autumn|herbst|automne|otoño|efterår)/i],
  ["dance", /\b(tánc|dance|tanz|danse|baile|dans|csárdás)/i],
  ["rain", /\b(eső|rain|regen|pluie|lluvia)/i],
];

export function sceneFor(id: string, title: string): FoxSceneKind {
  for (const [kind, ids] of Object.entries(SCENES) as [FoxSceneKind, readonly string[]][]) {
    if (ids.includes(id)) return kind;
  }
  for (const [kind, pattern] of WORDS) if (pattern.test(title)) return kind;
  return "walk";
}

export type FoxCue = { kind: "good" | "oops" | "done"; at: number } | null;

export type Behavior =
  | "walk" | "trot" | "sit" | "tilt" | "sniff" | "pounce" | "chase" | "yawn" | "curl"
  | "roll" | "catch" | "wag" | "hop" | "confused" | "dance";

export const BEHAVIORS: readonly Behavior[] = [
  "walk", "trot", "sit", "tilt", "sniff", "pounce", "chase", "yawn", "curl", "roll", "catch", "wag", "hop", "confused", "dance",
];

/** How long one go of each behavior lasts, in ms. Moves are timed by distance instead. */
const LENGTH: Record<Behavior, number> = {
  walk: 0, trot: 0, sit: 4200, tilt: 3600, sniff: 3200, pounce: 2400, chase: 2400, yawn: 2600, curl: 7000,
  roll: 1800, catch: 2000, wag: 1400, hop: 1600, confused: 1800, dance: 4800,
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

/** Waiting between songs or paused: small idle things. */
const IDLE: Behavior[] = ["sit", "tilt", "sniff", "yawn", "chase", "roll", "walk"];

export function nextBehavior(kind: FoxSceneKind, playing: boolean, paused: boolean, roll = Math.random()): Behavior {
  const pool = paused ? IDLE : playing ? MOODS[kind].playing : MOODS[kind].resting;
  // Now and then something from the whole idle list, so the fox is not predictable.
  if (!playing && roll < 0.15) return IDLE[Math.floor((roll / 0.15) * IDLE.length)]!;
  return pool[Math.floor(roll * pool.length) % pool.length]!;
}

const ORANGE = "#e57a35";
const DEEP = "#c25f24";
const CREAM = "#fbf3e7";
const SOCK = "#2f241d";

function Leg({ x, back, phase }: { x: number; back?: boolean; phase: "a" | "b" }) {
  return (
    <g className={`fx-leg fx-leg-${phase}`} style={{ transformOrigin: `${x}px 37px` }}>
      <path d={`M${x - 2.6} 35 C${x - 2.8} 41 ${x - 2.2} 44 ${x - 1.6} 46 L${x + 1.8} 46 C${x + 2.2} 43 ${x + 2.8} 40 ${x + 2.6} 35 Z`} fill={back ? DEEP : ORANGE} />
      <path d={`M${x - 1.6} 45.5 L${x - 1.5} 50 Q${x} 52.2 ${x + 3} 51.4 Q${x + 3} 50 ${x + 1.8} 49.6 L${x + 1.8} 45.5 Z`} fill={SOCK} />
    </g>
  );
}

function FoxBody() {
  return (
    <>
      <ellipse className="fx-shadow" cx="46" cy="52.5" rx="19" ry="2" fill="#000" opacity="0.12" />
      <g className="fx-tail" style={{ transformOrigin: "30px 31px" }}>
        <path d="M31 31 C22 32 12 29 7 21 C4 16 5 11 8 8 C9 13 12 16 15 17 C13 12 14 9 16 7 C17 12 20 16 25 19 C28 21 31 24 33 27 Z" fill={ORANGE} />
        <path d="M31 29 C24 29 17 26 13 21 C17 23 23 24 29 24 Z" fill={DEEP} opacity="0.55" />
        <path d="M8 8 C5 11 4 16 7 21 C8 18 9 16 11 15 C9 13 8 11 8 8 Z" fill={CREAM} />
      </g>
      <Leg x={34} back phase="b" />
      <Leg x={56} back phase="a" />
      <g className="fx-torso" style={{ transformOrigin: "46px 44px" }}>
        <path d="M28 34 C28 26 37 23.5 47 24 C56 24.5 63 27 63.5 33 C64 40 56 43.5 46 43.5 C36 43.5 28 41 28 34 Z" fill={ORANGE} />
        <path d="M35 40 C41 44 53 44 59 38.5 C54 41 43 42 35 40 Z" fill={CREAM} />
        <path d="M33 27 C38 25 44 24.6 50 25 C45 26.5 39 27.5 33 27 Z" fill={DEEP} opacity="0.35" />
      </g>
      <Leg x={38} phase="a" />
      <Leg x={60} phase="b" />
      <g className="fx-head" style={{ transformOrigin: "60px 30px" }}>
        <g className="fx-ear fx-ear-back" style={{ transformOrigin: "63px 19px" }}>
          <path d="M60.5 20 C60 15 60.5 11 62 8.5 C64 11 66 14.5 67 18 Z" fill={DEEP} />
        </g>
        <path d="M56 28 C56 21 62 17 69 17.5 C73 18 76 21 81 23.2 C84 24.4 86 25.4 86 26.8 C86 28.4 83.5 29.2 80 29.6 C75 30.2 70 32.6 64.5 32.6 C59.5 32.6 56 31 56 28 Z" fill={ORANGE} />
        <path d="M64 31 C70 31.6 77 30 83 28.2 C81 30.4 75.5 32.4 69 33 C67 33.1 65.4 32.4 64 31 Z" fill={CREAM} />
        <path className="fx-mouth" style={{ transformOrigin: "80px 29.4px" }} d="M76 29.2 C78 31.6 82 31.6 83.6 29 C81 29.8 78.5 29.8 76 29.2 Z" fill="#7a2f22" />
        <g className="fx-ear fx-ear-front" style={{ transformOrigin: "68px 18px" }}>
          <path d="M64.5 18.5 C65 13 66.6 9 68.6 6.8 C70.4 10 71.6 14 71.6 18.4 Z" fill={ORANGE} />
          <path d="M66.4 17.5 C66.8 14 67.6 11.4 68.7 9.6 C69.7 12 70.2 14.6 70.2 17.4 Z" fill={SOCK} opacity="0.8" />
        </g>
        <circle cx="85.6" cy="26.4" r="1.6" fill={SOCK} />
        <g className="fx-eye" style={{ transformOrigin: "73px 23.4px" }}>
          <ellipse cx="73" cy="23.4" rx="1.35" ry="1.7" fill={SOCK} />
          <circle cx="73.4" cy="22.8" r="0.45" fill="#fff" />
        </g>
        <path className="fx-shut" d="M71.2 23.6 Q73 25 74.8 23.6" stroke={SOCK} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      </g>
    </>
  );
}

function CurledFox() {
  return (
    <g className="fx-curled">
      <ellipse cx="48" cy="52.5" rx="20" ry="2" fill="#000" opacity="0.12" />
      <g className="fx-breathe" style={{ transformOrigin: "48px 51px" }}>
        <path d="M28 51 C26 40 36 33 48 33 C60 33 69 40 68 51 Z" fill={ORANGE} />
        <path d="M34 50 C34 44 40 40 47 40 C42 43 40 47 41 50 Z" fill={DEEP} opacity="0.4" />
        <g className="fx-tail-curl" style={{ transformOrigin: "66px 48px" }}>
          <path d="M66 48 C70 44 74 46 72 50.5 C68 52 54 52.6 44 51.6 C52 49.6 60 50 66 48 Z" fill={ORANGE} />
          <path d="M44 51.6 C40 51.2 38 50 39 48.6 C41 49.6 43 50.4 47 50.8 Z" fill={CREAM} />
        </g>
        <path d="M49 47 C49 41 54 38 59 39 C63 40 66 43 68 46 C66 48.6 60 49.6 55 49.6 C51 49.6 49 48.6 49 47 Z" fill={ORANGE} />
        <path d="M55 39.5 L56 33.5 L59.6 39.2 Z M59.8 39.6 L62.4 34 L63.4 41 Z" fill={DEEP} />
        <path d="M57 44 Q58.8 45.2 60.6 44" stroke={SOCK} strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <circle cx="67.4" cy="46.2" r="1.3" fill={SOCK} />
      </g>
    </g>
  );
}

const flakes = [6, 18, 31, 44, 57, 70, 83, 94];
const stars = [8, 22, 37, 63, 77, 91];
const leaves = [10, 30, 52, 72, 88];
const drops = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
const FOX_W = 72;

function forcedBehavior(): Behavior | null {
  if (typeof window === "undefined") return null;
  const want = new URLSearchParams(window.location.search).get("fox");
  return want && (BEHAVIORS as readonly string[]).includes(want) ? (want as Behavior) : null;
}

export function FoxScene({
  id,
  title,
  playing,
  paused = false,
  cue = null,
}: {
  id: string;
  title: string;
  playing: boolean;
  paused?: boolean;
  cue?: FoxCue;
}) {
  const kind = sceneFor(id, title);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const [behavior, setBehavior] = useState<Behavior>("sit");
  const [x, setX] = useState(0.45);
  const [travelMs, setTravelMs] = useState(0);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [hidden, setHidden] = useState(false);
  const [still, setStill] = useState(false);
  const [forced] = useState(forcedBehavior);
  const timer = useRef<number | undefined>(undefined);
  const state = useRef({ kind, playing, paused, x: 0.45 });
  state.current = { ...state.current, kind, playing, paused };

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width));
    observer.observe(box);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setStill(media.matches);
    const visible = () => setHidden(document.hidden);
    motion();
    visible();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visible);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);

  // The behavior loop. Stops while the tab is hidden or motion is reduced.
  const schedule = useCallback((pick?: Behavior) => {
    window.clearTimeout(timer.current);
    const { kind: k, playing: on, paused: held } = state.current;
    const next = pick ?? nextBehavior(k, on, held);
    let ms = LENGTH[next];
    if (next === "walk" || next === "trot") {
      const from = state.current.x;
      let to = 0.08 + Math.random() * 0.84;
      if (Math.abs(to - from) < 0.25) to = from < 0.5 ? Math.min(0.92, from + 0.4) : Math.max(0.08, from - 0.4);
      const speed = next === "trot" ? 1.6 : 3.6; // seconds across the whole strip
      ms = Math.max(1200, Math.abs(to - from) * speed * 1000);
      setFacing(to > from ? 1 : -1);
      setTravelMs(ms);
      setX(to);
      state.current.x = to;
    } else {
      setTravelMs(0);
    }
    setBehavior(next);
    timer.current = window.setTimeout(() => schedule(), ms);
  }, []);

  useEffect(() => {
    if (forced) {
      setBehavior(forced);
      return;
    }
    if (still || hidden) {
      window.clearTimeout(timer.current);
      if (still) {
        setTravelMs(0);
        setBehavior(kind === "night" ? "curl" : "sit");
      }
      return;
    }
    schedule(playing ? (kind === "night" ? "tilt" : kind === "dance" ? "dance" : "trot") : paused ? "sit" : undefined);
    return () => window.clearTimeout(timer.current);
  }, [still, hidden, playing, paused, kind, forced, schedule]);

  // Reactions from the game: a wag for a right note, a puzzled tilt for a wrong one, a hop at the end.
  useEffect(() => {
    if (!cue || still || hidden || forced) return;
    const pick: Behavior = cue.kind === "good" ? "wag" : cue.kind === "oops" ? "confused" : "hop";
    window.clearTimeout(timer.current);
    setTravelMs(0);
    setBehavior(pick);
    timer.current = window.setTimeout(() => schedule(), LENGTH[pick]);
  }, [cue, still, hidden, forced, schedule]);

  const span = Math.max(0, width - FOX_W);
  const left = forced ? span * 0.45 : span * x;
  const moving = behavior === "walk" || behavior === "trot";

  return (
    <div
      ref={boxRef}
      aria-hidden
      data-scene={kind}
      data-fox={behavior}
      className={`fox-scene pointer-events-none relative mt-1 h-12 shrink-0 overflow-hidden rounded-xl ${playing ? "is-playing" : ""} ${hidden ? "is-hidden" : ""}`}
    >
      {kind === "winter"
        ? flakes.map((at, i) => (
            <span key={at} className="fox-flake absolute top-0 size-1 rounded-full bg-white/90 shadow-[0_0_2px_#9fb4c8]" style={{ left: `${at}%`, animationDelay: `${(i * 0.7) % 4}s` }} />
          ))
        : null}
      {kind === "winter" ? <span className="absolute inset-x-0 bottom-0 h-1.5 rounded-full bg-white/80 dark:bg-white/30" /> : null}
      {kind === "night" ? (
        <>
          <span className="absolute top-1 right-[12%] size-4 rounded-full bg-[#f4e3a1] shadow-[0_0_8px_#f4e3a1]" />
          {stars.map((at, i) => (
            <span key={at} className="fox-star absolute text-[8px] leading-none text-[#e9c95a]" style={{ left: `${at}%`, top: `${(i % 3) * 7 + 2}px`, animationDelay: `${i * 0.5}s` }}>
              ✦
            </span>
          ))}
        </>
      ) : null}
      {kind === "autumn"
        ? leaves.map((at, i) => (
            <span key={at} className="fox-leaf absolute top-0 h-1.5 w-2 rounded-[60%_0] bg-[#d9822b]" style={{ left: `${at}%`, animationDelay: `${i * 1.1}s` }} />
          ))
        : null}
      {kind === "rain"
        ? drops.map((at, i) => (
            <span key={at} className="fox-drop absolute top-0 h-2 w-px bg-[#7aa3c7]" style={{ left: `${at}%`, animationDelay: `${(i * 0.37) % 1.2}s` }} />
          ))
        : null}
      {kind === "pond" ? (
        <>
          <span className="absolute right-0 bottom-0 h-2 w-2/5 rounded-t-full bg-[#9cc7d9]/70" />
          <span className="fox-bob absolute right-[14%] bottom-1.5 text-[11px] leading-none">🦆</span>
        </>
      ) : null}
      <div
        className="fx-mover absolute bottom-0 left-0"
        style={{ transform: `translate3d(${left}px,0,0)`, transition: travelMs ? `transform ${travelMs}ms linear` : "none" }}
      >
        <div className={`fx-root fx-${behavior}`} style={{ transform: `scaleX(${facing})` }}>
          {kind === "spring" && moving ? <span className="fox-butterfly absolute -top-1 right-[-14px] text-[11px] leading-none">🦋</span> : null}
          {behavior === "catch" ? (
            <span className="fx-falling absolute right-[2px] text-[11px] leading-none text-coral">{kind === "autumn" ? "🍂" : "♪"}</span>
          ) : null}
          {behavior === "pounce" ? <span className="fx-puff absolute right-[4px] bottom-0 h-2 w-6 rounded-full bg-white/90" /> : null}
          {behavior === "confused" ? <span className="fx-bubble absolute -top-1 right-[6px] text-[11px] font-bold leading-none text-ink" style={{ scale: `${facing} 1` }}>?</span> : null}
          {behavior === "hop" || behavior === "dance" ? <span className="fx-bubble absolute -top-1 right-[2px] text-[10px] leading-none text-coral">♪</span> : null}
          {behavior === "curl" ? <span className="fox-zzz absolute top-0 right-[10px] text-[9px] font-medium text-muted">z</span> : null}
          <svg viewBox="0 0 96 56" width={FOX_W} height={42} className="block overflow-visible">
            {behavior === "curl" ? <CurledFox /> : <g className="fx-whole" style={{ transformOrigin: "46px 52px" }}><FoxBody /></g>}
          </svg>
        </div>
      </div>
    </div>
  );
}
