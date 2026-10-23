import { useEffect, useMemo, useRef, useState } from "react";
import { BEHAVIORS, FoxEngine, LEGS, OBJECTS, SCENE_OBJECTS, type Behavior, type Els, type Obj, type ObjKind } from "./fox-engine";
import { sceneFor, type FoxSceneKind } from "./fox-kinds";

export { BEHAVIORS, OBJECTS, nextBehavior } from "./fox-engine";
export type { Behavior, ObjKind } from "./fox-engine";
export { sceneFor, type FoxSceneKind } from "./fox-kinds";

export type FoxCue = { kind: "good" | "oops" | "done"; at: number } | null;

const ORANGE = "#e57a35";
const DEEP = "#c25f24";
const CREAM = "#fbf3e7";
const SOCK = "#2f241d";

const flakes = [6, 18, 31, 44, 57, 70, 83, 94];
const stars = [8, 22, 37, 63, 77, 91];
const leaves = [10, 30, 52, 72, 88];
const drops = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];

function param<T extends string>(name: string, list: readonly T[]): T | null {
  if (typeof window === "undefined") return null;
  const want = new URLSearchParams(window.location.search).get(name);
  return want && (list as readonly string[]).includes(want) ? (want as T) : null;
}

function Backdrop({ kind }: { kind: FoxSceneKind }) {
  return (
    <>
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
      {kind === "pond" ? <span className="absolute right-0 bottom-0 h-2 w-2/5 rounded-t-full bg-[#9cc7d9]/70" /> : null}
    </>
  );
}

type ObjView = { g: SVGGElement; a?: SVGGElement; b?: SVGGElement; parts: SVGElement[] };

function ObjShape({ obj, bind }: { obj: Obj; bind: (part: "a" | "b" | number, el: SVGElement | null) => void }) {
  const a = (el: SVGGElement | null) => bind("a", el);
  const b = (el: SVGGElement | null) => bind("b", el);
  const part = (i: number) => (el: SVGElement | null) => bind(i, el);
  switch (obj.kind) {
    case "ball":
      return (
        <>
          <circle cy={-5} r={5} fill="#e4574b" />
          <path d="M-5 -5 A5 5 0 0 0 5 -5 Z" fill="#f6e7c8" />
          <circle cy={-5} r={1.4} fill="#3d6fb3" />
        </>
      );
    case "snowball":
      return (
        <>
          <circle cy={-5} r={5} fill="#fdfdfd" stroke="#cfdbe6" strokeWidth={0.6} />
          <path d="M-3 -6 q2 -2 4 -1" stroke="#cfdbe6" strokeWidth={0.6} fill="none" />
        </>
      );
    case "butterfly":
      return (
        <>
          <g ref={a}>
            <ellipse cx={3} cy={-1.5} rx={3.4} ry={2.6} fill="#f0a531" />
            <ellipse cx={2.4} cy={1.8} rx={2.2} ry={1.7} fill="#e2713a" />
          </g>
          <g ref={b} transform="scale(-1 1)">
            <g>
              <ellipse cx={3} cy={-1.5} rx={3.4} ry={2.6} fill="#f6bb4f" />
              <ellipse cx={2.4} cy={1.8} rx={2.2} ry={1.7} fill="#ea8a46" />
            </g>
          </g>
          <rect x={-0.5} y={-3} width={1} height={6} rx={0.5} fill={SOCK} />
        </>
      );
    case "mushroom":
      return (
        <>
          <path d="M-2.2 0 L-1.6 -6 L1.6 -6 L2.2 0 Z" fill="#f3e9d6" />
          <path d="M-7 -5.5 C-7 -11 7 -11 7 -5.5 Z" fill="#d6453a" />
          <circle cx={-3} cy={-8} r={1} fill="#fff" />
          <circle cx={2} cy={-9} r={0.9} fill="#fff" />
          <circle cx={4.4} cy={-6.6} r={0.7} fill="#fff" />
        </>
      );
    case "flower":
      return (
        <>
          <path d="M0 0 C1 -5 -1 -9 0 -13" stroke="#5c9a4a" strokeWidth={1.2} fill="none" />
          <path d="M0 -5 C3 -7 5 -6 6 -4 C3 -3 1 -4 0 -5 Z" fill="#6fae55" />
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse key={deg} cx={0} cy={-16} rx={1.8} ry={3} fill="#f28cb1" transform={`rotate(${deg} 0 -13.5)`} />
          ))}
          <circle cy={-13.5} r={1.8} fill="#f6c945" />
        </>
      );
    case "snowman":
      return (
        <>
          <circle cy={-7} r={7} fill="#fdfdfd" stroke="#d3dfe9" strokeWidth={0.6} />
          <g ref={a}>
            <circle cy={-18} r={5} fill="#fdfdfd" stroke="#d3dfe9" strokeWidth={0.6} />
            <circle cx={-1.6} cy={-19} r={0.7} fill={SOCK} />
            <circle cx={1.6} cy={-19} r={0.7} fill={SOCK} />
            <path d="M0 -17.5 L5 -16.8 L0 -16.4 Z" fill="#ec7a2b" />
            <path d="M-4.6 -14.4 Q0 -12.6 4.6 -14.4 L4.6 -13 Q0 -11.4 -4.6 -13 Z" fill="#d6453a" />
          </g>
          <circle cy={-9} r={0.7} fill={SOCK} />
          <circle cy={-5.5} r={0.7} fill={SOCK} />
        </>
      );
    case "leaves":
      return (
        <>
          {[[-8, -1, "#d9822b"], [-3, -3, "#c65b2a"], [3, -2, "#e2a23b"], [8, -1, "#b9542b"], [0, -5, "#d9822b"], [-5, -4, "#e2a23b"], [5, -4.5, "#c65b2a"]].map(([x, y, c], i) => (
            <ellipse key={i} cx={x as number} cy={y as number} rx={3.6} ry={2.2} fill={c as string} transform={`rotate(${i * 37} ${x} ${y})`} />
          ))}
          {obj.parts.map((_, i) => (
            <path key={i} ref={part(i)} d="M-2 0 C-1 -1.6 1 -1.6 2 0 C1 1.6 -1 1.6 -2 0 Z" fill={["#d9822b", "#c65b2a", "#e2a23b"][i % 3]} opacity={0} />
          ))}
        </>
      );
    case "puddle":
      return (
        <>
          <ellipse cy={-1} rx={15} ry={2.6} fill="#8fb6d3" opacity={0.85} />
          <g ref={a}>
            <ellipse cy={-1} rx={9} ry={1.6} fill="none" stroke="#e8f2f8" strokeWidth={0.6} />
          </g>
          {obj.parts.map((_, i) => (
            <circle key={i} ref={part(i)} r={1} fill="#a9cbe2" opacity={0} />
          ))}
        </>
      );
    case "duck":
      return (
        <>
          <path d="M-7 -3 C-7 -7 -2 -8 2 -7 C5 -6.5 7 -5 7 -3 C5 -1 -4 -1 -7 -3 Z" fill="#8a6a4a" />
          <path d="M-5 -4 C-2 -6 2 -6 4 -4.5 C1 -3.6 -2 -3.6 -5 -4 Z" fill="#a8896a" />
          <circle cx={4.6} cy={-9} r={2.8} fill="#2f7d4f" />
          <path d="M7 -9.4 L10 -8.6 L7 -8 Z" fill="#f2b33d" />
          <circle cx={5.4} cy={-9.6} r={0.5} fill="#111" />
          <rect x={3} y={-6.8} width={3} height={0.8} fill="#fff" />
        </>
      );
    case "stump":
      return (
        <>
          <path d="M-9 0 L-8 -9.5 L8 -9.5 L9 0 Z" fill="#8a5a36" />
          <path d="M-5 0 L-4.6 -9 M2 0 L2.4 -9" stroke="#6f4528" strokeWidth={0.7} />
          <ellipse cy={-9.5} rx={8} ry={2} fill="#d2a46f" />
          <ellipse cy={-9.5} rx={4.5} ry={1.1} fill="none" stroke="#a8784a" strokeWidth={0.5} />
        </>
      );
    case "mouse":
      return (
        <>
          <clipPath id="fox-hole-clip">
            <rect x={-10} y={-14} width={20} height={13.6} />
          </clipPath>
          <g clipPath="url(#fox-hole-clip)">
            <g ref={a}>
              <circle cx={-2.2} cy={-6.6} r={1.6} fill="#b8aea4" />
              <circle cx={2.2} cy={-6.6} r={1.6} fill="#b8aea4" />
              <ellipse cy={-3.4} rx={3.2} ry={3} fill="#9d938a" />
              <circle cx={-1.2} cy={-3.8} r={0.5} fill="#111" />
              <circle cx={1.2} cy={-3.8} r={0.5} fill="#111" />
              <circle cy={-2.2} r={0.6} fill="#e58a9b" />
            </g>
          </g>
          <ellipse cy={-0.5} rx={6} ry={1.6} fill="#3a2c23" opacity={0.85} />
        </>
      );
    case "drum":
      return (
        <>
          <path d="M-7 -1 L-7 -8 L7 -8 L7 -1 Z" fill="#d6453a" />
          <path d="M-7 -6 L-3.5 -2 L0 -6 L3.5 -2 L7 -6" stroke="#f6c945" strokeWidth={0.8} fill="none" />
          <ellipse cy={-8} rx={7} ry={1.8} fill="#f3e9d6" stroke="#b9a58a" strokeWidth={0.5} />
          <ellipse cy={-1} rx={7} ry={1.6} fill="#b33a31" />
        </>
      );
    case "bell":
      return (
        <>
          <path d="M-6 0 L-6 -25 L6 -25" stroke="#8a5a36" strokeWidth={1.2} fill="none" />
          <path d="M0 -25 L0 -22" stroke="#8a5a36" strokeWidth={0.8} />
          <path d="M-3.6 -13 C-3.6 -19 -2.4 -22 0 -22 C2.4 -22 3.6 -19 3.6 -13 L4.4 -12 L-4.4 -12 Z" fill="#e9c24a" stroke="#b8902a" strokeWidth={0.5} />
          <circle cy={-11.4} r={0.9} fill="#b8902a" />
        </>
      );
    case "notes":
      return (
        <text ref={part(0)} fontSize={11} fill="#e0745f" textAnchor="middle" opacity={0}>
          ♪
        </text>
      );
  }
}

function Leg({ x, back, bind }: { x: number; back: boolean; bind: (hip: SVGGElement | null, knee: SVGGElement | null) => void }) {
  const hip = useRef<SVGGElement | null>(null);
  const knee = useRef<SVGGElement | null>(null);
  return (
    <g ref={(el) => { hip.current = el; bind(el, knee.current); }}>
      <path d={`M${x - 2.8} 34 C${x - 3} 39 ${x - 2.4} 43 ${x - 1.9} 45.5 L${x + 2} 45.5 C${x + 2.4} 42 ${x + 3} 39 ${x + 2.8} 34 Z`} fill={back ? DEEP : ORANGE} />
      <g ref={(el) => { knee.current = el; bind(hip.current, el); }}>
        <path d={`M${x - 1.9} 44 L${x - 1.6} 50 Q${x} 52.4 ${x + 3.2} 51.6 Q${x + 3.4} 50.2 ${x + 1.9} 49.8 L${x + 2} 44 Z`} fill={SOCK} />
      </g>
    </g>
  );
}

export function FoxScene({
  id,
  title,
  playing,
  paused = false,
  cue = null,
  bpm = 100,
  toys = true,
}: {
  id: string;
  title: string;
  playing: boolean;
  paused?: boolean;
  cue?: FoxCue;
  bpm?: number;
  toys?: boolean;
}) {
  const kind = sceneFor(id, title);
  const [force] = useState(() => param<Behavior>("fox", BEHAVIORS));
  const [forceObj] = useState(() => param<ObjKind>("obj", OBJECTS));
  const engine = useMemo(() => {
    const made = new FoxEngine();
    if (typeof window !== "undefined") {
      const slow = Number(new URLSearchParams(window.location.search).get("slow"));
      if (slow >= 1 && slow <= 20) made.timeScale = 1 / slow;
    }
    return made;
  }, []);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const [objs, setObjs] = useState<Obj[]>([]);
  const els = useRef<Partial<Els> & { legs: { hip: SVGGElement; knee: SVGGElement }[]; objs: Map<Obj, ObjView> }>({ legs: [], objs: new Map() });
  const [behavior, setBehavior] = useState("sit");

  engine.input = { kind, playing, paused, bpm, force, forceObj };

  const kinds = useMemo<readonly ObjKind[]>(() => (forceObj ? [forceObj] : toys ? SCENE_OBJECTS[kind] : []), [forceObj, toys, kind]);

  useEffect(() => {
    engine.setObjects(kinds);
    els.current.objs = new Map();
    setObjs([...engine.objs]);
    engine.start("auto");
  }, [engine, kinds]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry!.contentRect.width);
      if (w > 0) {
        engine.resize(w);
        setWidth(w);
      }
    });
    observer.observe(box);
    const w = box.getBoundingClientRect().width;
    if (w > 0) {
      engine.resize(w);
      engine.place(w * 0.45);
      setWidth(w);
    }
    return () => observer.disconnect();
  }, [engine]);

  // The loop: requestAnimationFrame, fixed 60 Hz steps inside. Off when hidden or with reduced motion.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = 0;
    let shown = 0;
    const tick = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      engine.els = els.current as Els;
      engine.frame(dt);
      if (now - shown > 500) {
        shown = now;
        setBehavior(engine.behavior);
      }
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      last = 0;
      engine.els = els.current as Els;
      if (media.matches) {
        engine.still();
        setBehavior(engine.behavior);
        return;
      }
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    run();
    media.addEventListener("change", run);
    document.addEventListener("visibilitychange", run);
    return () => {
      cancelAnimationFrame(raf);
      media.removeEventListener("change", run);
      document.removeEventListener("visibilitychange", run);
    };
  }, [engine, objs]);

  useEffect(() => {
    if (cue && !force) engine.react(cue.kind);
  }, [cue, engine, force]);

  useEffect(() => {
    if (!force) engine.start(playing ? (kind === "night" ? "tilt" : kind === "dance" ? "dance" : "trot") : paused ? "sit" : "auto");
  }, [playing, paused, kind, engine, force]);

  const set = <K extends keyof Els>(key: K) => (el: Els[K] | null) => {
    if (el) (els.current as Record<string, unknown>)[key] = el;
  };
  const bindLeg = (i: number) => (hip: SVGGElement | null, knee: SVGGElement | null) => {
    if (hip && knee) els.current.legs[i] = { hip, knee };
  };
  const bindFrontLeg = (i: number, el: SVGGElement | null) => {
    if (!el) return;
    const list = ((els.current as Partial<Els>).fLegs ??= []);
    list[i] = { g: el, shade: el.querySelector("[data-shade]") as SVGElement };
  };
  const bindObj = (obj: Obj) => (key: "g" | "a" | "b" | number, el: SVGElement | null) => {
    if (!el) return;
    const map = els.current.objs;
    const view = map.get(obj) ?? ({ parts: [] } as unknown as ObjView);
    if (typeof key === "number") view.parts[key] = el;
    else (view as Record<string, unknown>)[key] = el;
    map.set(obj, view);
  };

  const legEls = LEGS.map((leg, i) => <Leg key={i} x={leg.x} back={i < 2} bind={bindLeg(i)} />);

  return (
    <div
      ref={boxRef}
      data-scene={kind}
      data-fox={behavior}
      className={`fox-scene relative mt-1 h-12 shrink-0 overflow-hidden rounded-xl ${playing ? "is-playing" : ""}`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Backdrop kind={kind} />
      </div>
      <svg
        aria-hidden
        width="100%"
        height={48}
        viewBox={`0 0 ${width} 48`}
        className="pointer-events-none absolute inset-0 block overflow-visible"
        style={{ touchAction: "manipulation" }}
      >
        {objs.map((obj, i) => (
          <g
            key={`${obj.kind}-${i}`}
            ref={(el) => bindObj(obj)("g", el)}
            data-obj={obj.kind}
            className="cursor-pointer"
            style={{ pointerEvents: "auto" }}
            onPointerDown={(event) => {
              event.stopPropagation();
              engine.poke(obj);
            }}
          >
            <ObjShape obj={obj} bind={(key, el) => bindObj(obj)(key, el)} />
          </g>
        ))}
        <ellipse ref={set("shadow")} rx={19} ry={2} fill="#000" opacity={0.13} />
        <g
          ref={set("root")}
          className="cursor-pointer"
          style={{ pointerEvents: "auto" }}
          onPointerDown={(event) => {
            event.stopPropagation();
            engine.react("tap");
          }}
        >
          <g ref={set("whole")}>
            <g ref={set("side")}>
            <g transform="translate(-46 -52)">
              <g ref={set("stand")}>
                <g ref={set("body")}>
                  <g ref={set("tail1")}>
                    <path d="M33 29.5 C29 27 24 27.4 21 28.6 L21.6 35 C25 34.6 29 34 33 32.6 Z" fill={ORANGE} />
                    <g ref={set("tail2")}>
                      <path d="M22.6 28.4 C18 27 13.4 26.6 11.6 27.4 L12 35.4 C15 35.8 19 35.6 22.8 35 Z" fill={ORANGE} />
                      <ellipse cx={17} cy={31.4} rx={6.6} ry={4.6} fill={ORANGE} />
                      <path d="M24 33.6 C19 35.4 14 35.2 11 33.8" stroke={DEEP} strokeWidth={1.1} fill="none" opacity={0.35} />
                      <g ref={set("tail3")}>
                        <ellipse cx={9.4} cy={30} rx={6} ry={4.6} fill={ORANGE} transform="rotate(-16 9.4 30)" />
                        <path d="M6.4 26.2 C2.6 26.6 1 29 1.8 31.4 C3 33.6 6 33.4 7.6 32.2 C8.6 30 8.2 27.6 6.4 26.2 Z" fill={CREAM} />
                      </g>
                    </g>
                  </g>
                  {legEls[0]}
                  {legEls[1]}
                  <g ref={set("torso")}>
                    <path d="M28 34 C28 26 37 23.5 47 24 C56 24.5 63 27 63.5 33 C64 40 56 43.5 46 43.5 C36 43.5 28 41 28 34 Z" fill={ORANGE} />
                    <path d="M35 40 C41 44 53 44 59 38.5 C54 41 43 42 35 40 Z" fill={CREAM} />
                    <path d="M33 27 C38 25 44 24.6 50 25 C45 26.5 39 27.5 33 27 Z" fill={DEEP} opacity={0.35} />
                  </g>
                  {legEls[2]}
                  <g ref={set("haunch")} opacity={0}>
                    <ellipse cx={37} cy={40} rx={9} ry={7} fill={ORANGE} />
                    <path d="M30 42 C32 46 40 47.5 45 45" stroke={DEEP} strokeWidth={0.9} fill="none" opacity={0.6} />
                    <path d="M33 46.6 L44 46.6 Q46 47.6 44 48.4 L33 48.4 Z" fill={SOCK} />
                  </g>
                  {legEls[3]}
                  <g ref={set("head")}>
                    <g ref={set("earB")}>
                      <path d="M60.5 20 C60 15 60.5 11 62 8.5 C64 11 66 14.5 67 18 Z" fill={DEEP} />
                    </g>
                    <path d="M56 28 C56 21 62 17 69 17.5 C73 18 76 21 81 23.2 C84 24.4 86 25.4 86 26.8 C86 28.4 83.5 29.2 80 29.6 C75 30.2 70 32.6 64.5 32.6 C59.5 32.6 56 31 56 28 Z" fill={ORANGE} />
                    <path d="M64 31 C70 31.6 77 30 83 28.2 C81 30.4 75.5 32.4 69 33 C67 33.1 65.4 32.4 64 31 Z" fill={CREAM} />
                    <path ref={set("mouth")} d="M76 29.2 C78 31.6 82 31.6 83.6 29 C81 29.8 78.5 29.8 76 29.2 Z" fill="#7a2f22" />
                    <g ref={set("earF")}>
                      <path d="M64.5 18.5 C65 13 66.6 9 68.6 6.8 C70.4 10 71.6 14 71.6 18.4 Z" fill={ORANGE} />
                      <path d="M66.4 17.5 C66.8 14 67.6 11.4 68.7 9.6 C69.7 12 70.2 14.6 70.2 17.4 Z" fill={SOCK} opacity={0.8} />
                    </g>
                    <circle cx={85.6} cy={26.4} r={1.6} fill={SOCK} />
                    <g ref={set("eye")}>
                      <ellipse cx={73} cy={23.4} rx={1.35} ry={1.7} fill={SOCK} />
                      <circle cx={73.4} cy={22.8} r={0.45} fill="#fff" />
                    </g>
                    <path ref={set("shut")} d="M71.2 23.6 Q73 25 74.8 23.6" stroke={SOCK} strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0} />
                  </g>
                </g>
              </g>
              <g ref={set("curled")} opacity={0}>
                <g ref={set("breathe")}>
                  <path d="M28 51 C26 40 36 33 48 33 C60 33 69 40 68 51 Z" fill={ORANGE} />
                  <path d="M34 50 C34 44 40 40 47 40 C42 43 40 47 41 50 Z" fill={DEEP} opacity={0.4} />
                  <path d="M66 48 C70 44 74 46 72 50.5 C68 52 54 52.6 44 51.6 C52 49.6 60 50 66 48 Z" fill={ORANGE} />
                  <path d="M44 51.6 C40 51.2 38 50 39 48.6 C41 49.6 43 50.4 47 50.8 Z" fill={CREAM} />
                  <path d="M49 47 C49 41 54 38 59 39 C63 40 66 43 68 46 C66 48.6 60 49.6 55 49.6 C51 49.6 49 48.6 49 47 Z" fill={ORANGE} />
                  <path d="M55 39.5 L56 33.5 L59.6 39.2 Z M59.8 39.6 L62.4 34 L63.4 41 Z" fill={DEEP} />
                  <path d="M57 44 Q58.8 45.2 60.6 44" stroke={SOCK} strokeWidth={0.9} fill="none" strokeLinecap="round" />
                  <circle cx={67.4} cy={46.2} r={1.3} fill={SOCK} />
                </g>
              </g>
            </g>
            </g>
            <g ref={set("front")} opacity={0}>
              <g ref={set("fTail")}>
                <path d="M0 -12 C-6 -14 -12 -20 -11 -27 C-10 -31 -6 -31 -4 -28 C-2 -23 0 -17 0 -12 Z" fill={ORANGE} />
                <path d="M-11 -27 C-10.6 -31 -6.4 -31.4 -4.6 -28.6 C-6.6 -29 -9 -28.4 -11 -27 Z" fill={CREAM} />
              </g>
              {[0, 1].map((i) => (
                <g key={i} ref={(el) => bindFrontLeg(i, el)}>
                  <path d="M-2.2 -11 L-2 -1 Q0 0.6 2 -1 L2.2 -11 Z" fill={DEEP} />
                  <path d="M-2.1 -4 L-2 -1 Q0 0.6 2 -1 L2.1 -4 Z" fill={SOCK} />
                  <path data-shade d="M-2.2 -11 L-2 -1 Q0 0.6 2 -1 L2.2 -11 Z" fill={SOCK} opacity={0} />
                </g>
              ))}
              <g ref={set("fBody")}>
                <ellipse cx={0} cy={-15} rx={9.5} ry={10} fill={ORANGE} />
                <path d="M-5.6 -22 C-6.4 -14 -4 -8 0 -6.4 C4 -8 6.4 -14 5.6 -22 C3 -19.4 -3 -19.4 -5.6 -22 Z" fill={CREAM} />
                <g ref={set("fHaunch")} opacity={0}>
                  <ellipse cx={-8} cy={-6} rx={4.4} ry={5} fill={DEEP} />
                  <ellipse cx={8} cy={-6} rx={4.4} ry={5} fill={DEEP} />
                </g>
                <ellipse ref={set("fShade")} cx={0} cy={-15} rx={5} ry={9} fill={DEEP} opacity={0} />
              </g>
              {[2, 3].map((i) => (
                <g key={i} ref={(el) => bindFrontLeg(i, el)}>
                  <path d="M-2.1 -14 L-1.9 -1 Q0 0.8 1.9 -1 L2.1 -14 Z" fill={ORANGE} />
                  <path d="M-2 -5 L-1.9 -1 Q0 0.8 1.9 -1 L2 -5 Z" fill={SOCK} />
                  <path data-shade d="M-2.1 -14 L-1.9 -1 Q0 0.8 1.9 -1 L2.1 -14 Z" fill={SOCK} opacity={0} />
                </g>
              ))}
              <g ref={set("fHead")}>
                <g ref={set("fEarL")}>
                  <path d="M-9.4 -36 L-7.6 -46.6 L-2.6 -38.4 Z" fill={ORANGE} />
                  <path d="M-8.2 -37.4 L-7.4 -43.6 L-4.6 -38.8 Z" fill={SOCK} opacity={0.8} />
                </g>
                <g ref={set("fEarR")}>
                  <path d="M9.4 -36 L7.6 -46.6 L2.6 -38.4 Z" fill={ORANGE} />
                  <path d="M8.2 -37.4 L7.4 -43.6 L4.6 -38.8 Z" fill={SOCK} opacity={0.8} />
                </g>
                <path d="M-10.5 -33 C-10.5 -38.6 -5.6 -40 0 -40 C5.6 -40 10.5 -38.6 10.5 -33 C10.5 -29 6 -26 3 -23.4 C1.6 -22.2 -1.6 -22.2 -3 -23.4 C-6 -26 -10.5 -29 -10.5 -33 Z" fill={ORANGE} />
                <path d="M-10.4 -31.6 C-7 -30.4 -4 -29 -2.8 -26.4 C-2 -24 -1 -23 0 -23 C1 -23 2 -24 2.8 -26.4 C4 -29 7 -30.4 10.4 -31.6 C9 -28 5.6 -25.4 3 -23.4 C1.6 -22.2 -1.6 -22.2 -3 -23.4 C-5.6 -25.4 -9 -28 -10.4 -31.6 Z" fill={CREAM} />
                <g ref={set("fEyes")}>
                  <ellipse cx={-4.2} cy={-32} rx={1.25} ry={1.6} fill={SOCK} />
                  <ellipse cx={4.2} cy={-32} rx={1.25} ry={1.6} fill={SOCK} />
                  <circle cx={-3.8} cy={-32.6} r={0.4} fill="#fff" />
                  <circle cx={4.6} cy={-32.6} r={0.4} fill="#fff" />
                </g>
                <ellipse cx={0} cy={-26.2} rx={1.7} ry={1.3} fill={SOCK} />
                <ellipse ref={set("fMouth")} cx={0} cy={-24.6} rx={1.6} ry={1.2} fill="#7a2f22" />
              </g>
            </g>
          </g>
        </g>
        <text ref={set("bubble")} fontSize={11} fontWeight={700} textAnchor="middle" fill="currentColor" className="text-ink" opacity={0} />
      </svg>
    </div>
  );
}
