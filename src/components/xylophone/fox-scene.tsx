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

type Pose = "trot" | "sit" | "sleep" | "dance";

function Fox({ pose }: { pose: Pose }) {
  if (pose === "sleep") {
    return (
      <svg viewBox="0 0 64 32" className="h-7 w-14" aria-hidden>
        <g className="fox-breathe">
          <ellipse cx="32" cy="22" rx="20" ry="9" fill="#e07a3a" />
          <path d="M14 24 Q4 14 18 12 Q30 12 34 22 Z" fill="#e8894a" />
          <path d="M14 24 Q8 20 12 15 Q16 18 18 22 Z" fill="#fbf4ea" />
          <circle cx="44" cy="20" r="7" fill="#e07a3a" />
          <path d="M40 15 L42 8 L45 14 Z M46 14 L49 8 L50 16 Z" fill="#c4612a" />
          <path d="M48 22 q3 1 5 -1" stroke="#2b211b" strokeWidth="1" fill="none" />
          <path d="M42 19 q2 1 3 0" stroke="#2b211b" strokeWidth="1" fill="none" />
        </g>
      </svg>
    );
  }
  const body = (
    <>
      <path className="fox-tail" d="M12 18 Q0 12 4 4 Q10 12 18 14 Z" fill="#e8894a" />
      <path className="fox-tail" d="M4 4 Q2 8 6 9 Q5 6 4 4 Z" fill="#fbf4ea" />
      <ellipse cx="28" cy="18" rx="14" ry="7" fill="#e07a3a" />
      <ellipse cx="30" cy="21" rx="8" ry="3.5" fill="#fbf4ea" />
      <g className={pose === "trot" ? "fox-legs-a" : ""}>
        <rect x="18" y="22" width="3" height="8" rx="1.5" fill="#2b211b" />
        <rect x="34" y="22" width="3" height="8" rx="1.5" fill="#2b211b" />
      </g>
      <g className={pose === "trot" ? "fox-legs-b" : ""}>
        <rect x="22" y="22" width="3" height="8" rx="1.5" fill="#3a2c23" />
        <rect x="38" y="22" width="3" height="8" rx="1.5" fill="#3a2c23" />
      </g>
      <g className={pose === "sit" ? "fox-nod" : ""}>
        <path d="M40 14 Q48 6 54 12 L62 16 Q56 20 46 20 Z" fill="#e07a3a" />
        <path d="M54 17 L62 16 Q57 20 52 20 Z" fill="#fbf4ea" />
        <path d="M42 11 L44 2 L48 9 Z M48 9 L52 2 L52 11 Z" fill="#c4612a" />
        <circle cx="62" cy="16" r="1.4" fill="#2b211b" />
        <circle cx="51" cy="12.5" r="1.2" fill="#2b211b" />
      </g>
    </>
  );
  return (
    <svg viewBox="0 0 64 32" className="h-8 w-16" aria-hidden>
      {body}
    </svg>
  );
}

const flakes = [6, 18, 31, 44, 57, 70, 83, 94];
const stars = [8, 22, 37, 63, 77, 91];
const leaves = [10, 30, 52, 72, 88];
const drops = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];

export function FoxScene({ id, title, playing }: { id: string; title: string; playing: boolean }) {
  const kind = sceneFor(id, title);
  const pose: Pose =
    kind === "night" ? "sleep" : kind === "dance" ? "dance" : playing || kind === "spring" ? "trot" : "sit";
  const moving = pose === "trot";
  return (
    <div
      aria-hidden
      data-scene={kind}
      className={`fox-scene pointer-events-none relative mt-1 h-10 shrink-0 overflow-hidden rounded-xl ${playing ? "is-playing" : ""}`}
    >
      {kind === "winter"
        ? flakes.map((left, i) => (
            <span key={left} className="fox-flake absolute top-0 size-1 rounded-full bg-white/90 shadow-[0_0_2px_#9fb4c8]" style={{ left: `${left}%`, animationDelay: `${(i * 0.7) % 4}s` }} />
          ))
        : null}
      {kind === "winter" ? <span className="absolute inset-x-0 bottom-0 h-1.5 rounded-full bg-white/80 dark:bg-white/30" /> : null}
      {kind === "night" ? (
        <>
          <span className="absolute top-1 right-[12%] size-4 rounded-full bg-[#f4e3a1] shadow-[0_0_8px_#f4e3a1]" />
          {stars.map((left, i) => (
            <span key={left} className="fox-star absolute text-[8px] leading-none text-[#e9c95a]" style={{ left: `${left}%`, top: `${(i % 3) * 7 + 2}px`, animationDelay: `${i * 0.5}s` }}>
              ✦
            </span>
          ))}
          <span className="fox-zzz absolute bottom-6 left-[calc(50%+22px)] text-[9px] font-medium text-muted">z</span>
        </>
      ) : null}
      {kind === "autumn"
        ? leaves.map((left, i) => (
            <span key={left} className="fox-leaf absolute top-0 h-1.5 w-2 rounded-[60%_0] bg-[#d9822b]" style={{ left: `${left}%`, animationDelay: `${i * 1.1}s` }} />
          ))
        : null}
      {kind === "rain"
        ? drops.map((left, i) => (
            <span key={left} className="fox-drop absolute top-0 h-2 w-px bg-[#7aa3c7]" style={{ left: `${left}%`, animationDelay: `${(i * 0.37) % 1.2}s` }} />
          ))
        : null}
      {kind === "pond" ? (
        <>
          <span className="absolute right-0 bottom-0 h-2 w-2/5 rounded-t-full bg-[#9cc7d9]/70" />
          <span className="fox-bob absolute right-[14%] bottom-1.5 text-[11px] leading-none">🦆</span>
        </>
      ) : null}
      {kind === "dance" ? (
        <>
          <span className="fox-note absolute bottom-5 left-[calc(50%-26px)] text-[10px] text-coral">♪</span>
          <span className="fox-note absolute bottom-5 left-[calc(50%+26px)] text-[10px] text-coral" style={{ animationDelay: "0.6s" }}>
            ♫
          </span>
        </>
      ) : null}
      <div
        className={`absolute bottom-0 ${moving ? "fox-run" : pose === "dance" ? "fox-dance left-[calc(50%-32px)]" : "left-[calc(50%-32px)]"} ${kind === "winter" && moving ? "fox-hop" : ""}`}
      >
        {kind === "spring" ? (
          <span className="fox-butterfly absolute -top-1 -right-5 text-[11px] leading-none">🦋</span>
        ) : null}
        <Fox pose={pose} />
      </div>
    </div>
  );
}
