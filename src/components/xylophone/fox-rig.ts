/**
 * One fox, one set of shapes. Every part lives at a point on a small 3D body
 * (f = forward, s = the fox's right, y = down) and is projected by a yaw angle:
 *   screen x = f·sinθ − s·cosθ,  depth toward the viewer t = f·cosθ − s·sinθ.
 * θ = +90° faces right, 0° faces the viewer, 180° faces away. Head, shoulders,
 * hips and tail each get their own θ so a turn ripples through the body.
 * Shapes change by transform or path `d`; draw order follows depth, so near
 * and far parts trade places only when their depths cross. Nothing is drawn twice.
 */
const NS = "http://www.w3.org/2000/svg";
const ORANGE = "#e57a35";
const DEEP = "#c25f24";
const CREAM = "#fbf3e7";
const SOCK = "#2f241d";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const band = (lo: number, hi: number, v: number) => ease((v - lo) / (hi - lo));
const D = Math.PI / 180;
const n2 = (v: number) => v.toFixed(2);

export type RigState = {
  yawHead: number; yawSh: number; yawHip: number; yawTail: number; // radians
  sit: number; headPitch: number; earF: number; earB: number; mouth: number; shut: number;
  tail: readonly number[]; tailSide: number; legs: readonly { hip: number; knee: number }[]; breath: number;
};

type P = { x: number; y: number; t: number };
type Pt = [number, number];

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
}

function hull(points: Pt[]): Pt[] {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop(); lower.push(p); }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]!; while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop(); upper.push(p); }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

/** A closed, softly rounded outline through hull points (quadratic through midpoints). */
function blob(points: Pt[]): string {
  const h = hull(points);
  if (h.length < 3) return "M0 0Z";
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${n2(mid(h[h.length - 1]!, h[0]!)[0])} ${n2(mid(h[h.length - 1]!, h[0]!)[1])}`;
  for (let i = 0; i < h.length; i++) {
    const p = h[i]!; const m = mid(p, h[(i + 1) % h.length]!);
    d += `Q${n2(p[0])} ${n2(p[1])} ${n2(m[0])} ${n2(m[1])}`;
  }
  return d + "Z";
}

/** A tapered ribbon through a polyline (the tail). */
function ribbon(pts: Pt[], widths: number[]): string {
  const L: Pt[] = []; const R: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)]!; const b = pts[Math.min(pts.length - 1, i + 1)]!;
    let dx = b[0] - a[0]; let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const w = widths[i]!;
    L.push([pts[i]![0] - dy * w, pts[i]![1] + dx * w]);
    R.push([pts[i]![0] + dy * w, pts[i]![1] - dx * w]);
  }
  const ring = L.concat(R.reverse());
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(ring[ring.length - 1]!, ring[0]!);
  let d = `M${n2(start[0])} ${n2(start[1])}`;
  for (let i = 0; i < ring.length; i++) { const p = ring[i]!; const m = mid(p, ring[(i + 1) % ring.length]!); d += `Q${n2(p[0])} ${n2(p[1])} ${n2(m[0])} ${n2(m[1])}`; }
  return d + "Z";
}

type Leg = { g: SVGGElement; up: SVGGElement; low: SVGGElement; foot: SVGCircleElement; shadeU: SVGPathElement; shadeL: SVGPathElement };

/** f offsets and sides: 0 hind far, 1 front far, 2 hind near, 3 front near (near = fox's left, s < 0). */
const LEG3 = [
  { f: -12, s: 4, front: false }, { f: 10.5, s: 4, front: true },
  { f: -8.5, s: -4, front: false }, { f: 14, s: -4, front: true },
];
const UPPER = "M-2.8 0 C-3 4 -2.5 8 -2 10.6 L2 10.6 C2.5 8 3 4 2.8 0 Z";
const LOWER = "M-2 -0.4 L-1.8 7 Q0 8.6 1.8 7 L2 -0.4 Z";

export class FoxRig {
  private root: SVGGElement;
  private order = "";
  private headOrder = "";
  private tail: SVGPathElement; private tip: SVGPathElement; private tailG: SVGGElement;
  private legs: Leg[] = [];
  private haunch: SVGCircleElement[] = [];
  private torso: SVGCircleElement; private back: SVGCircleElement; private belly: SVGCircleElement; private bib: SVGCircleElement; private neck: SVGCircleElement;
  private head: SVGGElement; private skull: SVGCircleElement; private snout: SVGPathElement; private cheek: SVGPathElement;
  private ears: { g: SVGGElement; outer: SVGPathElement; inner: SVGPathElement; shade: SVGPathElement }[] = [];
  private eyes: { g: SVGGElement; eye: SVGCircleElement; shine: SVGCircleElement }[] = [];
  private nose: SVGCircleElement; private mouth: SVGCircleElement;
  private torsoG: SVGGElement;

  constructor(root: SVGGElement) {
    this.root = root;
    while (root.firstChild) root.removeChild(root.firstChild);
    this.tailG = el("g", {}, root);
    this.tail = el("path", { fill: ORANGE }, this.tailG);
    this.tip = el("path", { fill: CREAM }, this.tailG);
    for (let i = 0; i < 4; i++) {
      const g = el("g", {}, root);
      const up = el("g", {}, g);
      el("path", { d: UPPER, fill: LEG3[i]!.front ? ORANGE : DEEP }, up);
      const shadeU = el("path", { d: UPPER, fill: SOCK, opacity: 0 }, up);
      const low = el("g", {}, g);
      el("path", { d: LOWER, fill: SOCK }, low);
      const shadeL = el("path", { d: LOWER, fill: "#000", opacity: 0 }, low);
      const foot = el("circle", { r: 1, fill: SOCK }, g);
      this.legs.push({ g, up, low, foot, shadeU, shadeL });
    }
    for (let i = 0; i < 2; i++) this.haunch.push(el("circle", { r: 1, fill: i === 0 ? DEEP : ORANGE, opacity: 0 }, root));
    this.torsoG = el("g", {}, root);
    this.torso = el("circle", { r: 1, fill: ORANGE }, this.torsoG);
    this.back = el("circle", { r: 1, fill: DEEP, opacity: 0.28 }, this.torsoG);
    this.belly = el("circle", { r: 1, fill: CREAM }, this.torsoG);
    this.bib = el("circle", { r: 1, fill: CREAM }, root);
    this.neck = el("circle", { r: 1, fill: ORANGE }, root);
    this.head = el("g", {}, root);
    for (let i = 0; i < 2; i++) {
      const g = el("g", {}, this.head);
      const outer = el("path", { fill: ORANGE, stroke: ORANGE, "stroke-width": 0.8, "stroke-linejoin": "round" }, g);
      const inner = el("path", { fill: SOCK, opacity: 0.8 }, g);
      const shade = el("path", { fill: SOCK, opacity: 0 }, g);
      this.ears.push({ g, outer, inner, shade });
    }
    this.skull = el("circle", { r: 1, fill: ORANGE }, this.head);
    this.snout = el("path", { fill: ORANGE, stroke: ORANGE, "stroke-width": 1, "stroke-linejoin": "round" }, this.head);
    this.cheek = el("path", { fill: CREAM, stroke: CREAM, "stroke-width": 0.6, "stroke-linejoin": "round" }, this.head);
    this.mouth = el("circle", { r: 1, fill: "#7a2f22" }, this.head);
    this.nose = el("circle", { r: 1.6, fill: SOCK }, this.head);
    for (let i = 0; i < 2; i++) {
      const g = el("g", {}, this.head);
      this.eyes.push({ g, eye: el("circle", { r: 1, fill: SOCK }, g), shine: el("circle", { r: 0.42, fill: "#fff" }, g) });
    }
  }

  draw(st: RigState) {
    const beta = 26 * st.sit * D;
    const drop = 7 * st.sit;
    const pitch = (f: number, y: number): [number, number] => {
      const pf = -8, py = -10;
      const df = f - pf, dy = y - py;
      return [pf + df * Math.cos(beta) + dy * Math.sin(beta), py + dy * Math.cos(beta) - df * Math.sin(beta) + drop];
    };
    const proj = (f: number, s: number, y: number, yaw: number, pitched = true): P => {
      const [pf, py] = pitched ? pitch(f, y) : [f, y];
      const sn = Math.sin(yaw), cs = Math.cos(yaw);
      return { x: pf * sn - s * cs, y: py, t: pf * cs - s * sn };
    };
    const yawBody = (st.yawSh + st.yawHip) / 2;
    const sB = Math.sin(yawBody), cB = Math.cos(yawBody);
    const parts: { node: Element; t: number; k: string }[] = [];

    // Torso: an ellipsoid seen from the current yaw.
    const pf = proj(17.5, 0, -18, yawBody), pb = proj(-17.5, 0, -18, yawBody), pc = proj(0, 0, -18, yawBody);
    const dx = (pf.x - pb.x) / 2, dy = (pf.y - pb.y) / 2;
    const w = 8.6 * Math.abs(cB);
    const along = Math.hypot(dx, dy);
    const rx = Math.sqrt(along * along + w * w);
    const angle = dx < 0 ? Math.atan2(-dy, -dx) / D * (along / rx) : Math.atan2(dy, dx) / D * (along / rx);
    this.torso.setAttribute("transform", `translate(${n2(pc.x)} ${n2(pc.y)}) rotate(${n2(angle)}) scale(${n2(rx)} ${n2(9.8 * st.breath)})`);
    const pk = proj(-2, 0, -24, yawBody);
    this.back.setAttribute("transform", `translate(${n2(pk.x)} ${n2(pk.y)}) rotate(${n2(angle)}) scale(${n2(rx * 0.78)} 3)`);
    const pBel = proj(2, 0, -10.8, yawBody);
    this.belly.setAttribute("transform", `translate(${n2(pBel.x)} ${n2(pBel.y)}) rotate(${n2(angle)}) scale(${n2(Math.sqrt((12 * sB) ** 2 + (4.5 * cB) ** 2))} 2.3)`);
    parts.push({ node: this.torsoG, t: 0, k: "t" });

    // Chest bib and neck follow the shoulders.
    const sS = Math.sin(st.yawSh), cS = Math.cos(st.yawSh);
    const pBib = proj(14, 0, -16, st.yawSh);
    this.bib.setAttribute("transform", `translate(${n2(pBib.x)} ${n2(pBib.y)}) scale(${n2(2.6 + 3.8 * Math.abs(cS))} 6.6)`);
    this.bib.setAttribute("opacity", n2(band(-0.3, -0.12, cS)));
    parts.push({ node: this.bib, t: pBib.t + 0.6, k: "b" });
    const pN = proj(14, 0, -25, st.yawSh);
    this.neck.setAttribute("transform", `translate(${n2(pN.x)} ${n2(pN.y)}) scale(${n2(Math.sqrt((6.5 * sS) ** 2 + (6.2 * cS) ** 2))} 7.2)`);
    parts.push({ node: this.neck, t: pN.t * 0.9 + 0.3, k: "n" });

    // Haunches show when sitting.
    [5, -5].forEach((s, i) => {
      const h = proj(-9, s, -9.5, st.yawHip);
      const node = this.haunch[i]!;
      node.setAttribute("transform", `translate(${n2(h.x)} ${n2(h.y)}) scale(${n2(7.4 * Math.abs(Math.sin(st.yawHip)) + 4.2 * Math.abs(Math.cos(st.yawHip)))} 6.8)`);
      node.setAttribute("opacity", n2(ease(st.sit * 1.3)));
      parts.push({ node, t: h.t + 0.4, k: `h${i}` });
    });

    // Legs: each segment swings in the fox's own fore/aft plane, then is projected.
    LEG3.forEach((spec, i) => {
      const leg = this.legs[i]!;
      const yaw = spec.front ? st.yawSh : st.yawHip;
      const sn = Math.sin(yaw);
      const hip = proj(spec.f, spec.s, -16, yaw);
      const a1 = (st.legs[i]!.hip - 26 * st.sit) * D;
      const a2 = a1 + st.legs[i]!.knee * D;
      const seg = (a: number) => {
        let vx = -Math.sin(a) * sn, vy = Math.cos(a);
        const len = Math.hypot(vx, vy);
        if (len < 0.3) { vx = (vx / (len || 1)) * 0.3; vy = vy >= 0 ? Math.sqrt(0.09 - vx * vx) : -Math.sqrt(Math.max(0, 0.09 - vx * vx)); }
        const l = Math.hypot(vx, vy);
        return { vx, vy, ux: vy / l, uy: -vx / l };
      };
      const u = seg(a1);
      leg.up.setAttribute("transform", `matrix(${n2(u.ux)} ${n2(u.uy)} ${n2(u.vx)} ${n2(u.vy)} ${n2(hip.x)} ${n2(hip.y)})`);
      const kx = hip.x + u.vx * 9.8, ky = hip.y + u.vy * 9.8;
      const l = seg(a2);
      leg.low.setAttribute("transform", `matrix(${n2(l.ux)} ${n2(l.uy)} ${n2(l.vx)} ${n2(l.vy)} ${n2(kx)} ${n2(ky)})`);
      const fx = kx + l.vx * 7.6, fy = ky + l.vy * 7.6;
      leg.foot.setAttribute("transform", `translate(${n2(fx + 1.1 * sn)} ${n2(fy - 0.4)}) scale(${n2(2.1 + 1.3 * Math.abs(sn))} 1.5)`);
      const far = clamp(-hip.t / 5, 0, 1);
      leg.shadeU.setAttribute("opacity", n2(far * 0.38));
      leg.shadeL.setAttribute("opacity", n2(far * 0.3));
      parts.push({ node: leg.g, t: hip.t, k: `l${i}` });
    });

    // Tail: a chain hung off the hips, projected with the (lagging) tail yaw.
    const anchor = pitch(-16, -20);
    let f = anchor[0], s = 0, y = anchor[1];
    const pts: Pt[] = []; let tSum = 0;
    const sT = Math.sin(st.yawTail), cT = Math.cos(st.yawTail);
    const lens = [0, 8, 8, 8, 7];
    const rest = [-4, 6, 16, 26];
    for (let k = 0; k < lens.length; k++) {
      if (k > 0) {
        let up = rest[k - 1]!;
        for (let j = 0; j < Math.min(k, 3); j++) up += st.tail[j]!;
        const pa = up * D - beta;
        const side = st.tailSide * k * 0.3;
        f -= lens[k]! * Math.cos(pa) * Math.cos(side);
        s += lens[k]! * Math.cos(pa) * Math.sin(side);
        y -= lens[k]! * Math.sin(pa);
      }
      pts.push([f * sT - s * cT, y]); tSum += f * cT - s * sT;
    }
    this.tail.setAttribute("d", ribbon(pts, [2.6, 4.6, 5.4, 5, 2.2]));
    this.tip.setAttribute("d", ribbon(pts.slice(3).map((p, i, arr) => (i === 0 ? [lerp(p[0], arr[1]![0], 0.15), lerp(p[1], arr[1]![1], 0.15)] : p)), [4.4, 2.3]));
    parts.push({ node: this.tailG, t: tSum / pts.length, k: "tl" });

    // Head.
    const hA = proj(21, 0, -27.5, st.yawSh);
    const hy = st.yawHead;
    const hs = Math.sin(hy), hc = Math.cos(hy);
    const alpha = (st.headPitch + 11 * st.sit - 26 * st.sit) * D;
    const hp = (f2: number, s2: number, y2: number): P => {
      const pf2 = -7, py2 = 4; const df = f2 - pf2, dy2 = y2 - py2;
      const F = pf2 + df * Math.cos(alpha) - dy2 * Math.sin(alpha);
      const Y = py2 + dy2 * Math.cos(alpha) + df * Math.sin(alpha);
      return { x: hA.x + F * hs - s2 * hc, y: hA.y + Y, t: F * hc - s2 * hs };
    };
    const hparts: { node: Element; t: number; k: string }[] = [];
    const sk = hp(0, 0, 0);
    this.skull.setAttribute("transform", `translate(${n2(sk.x)} ${n2(sk.y)}) rotate(${n2((alpha / D) * hs)}) scale(${n2(Math.sqrt((9.2 * hs) ** 2 + (8.4 * hc) ** 2))} 7.8)`);
    hparts.push({ node: this.skull, t: 0, k: "s" });
    const snoutPts = [hp(4.5, 0, -3.8), hp(4.5, 0, 4.6), hp(4, 3.6, 1), hp(4, -3.6, 1), hp(18.5, 0, 1.2), hp(16.6, 1.5, 1.8), hp(16.6, -1.5, 1.8)];
    this.snout.setAttribute("d", blob(snoutPts.map((p) => [p.x, p.y])));
    hparts.push({ node: this.snout, t: 9 * hc + 0.3, k: "m" });
    const cheekPts = [hp(2.5, 7.2, 2.2), hp(2.5, -7.2, 2.2), hp(8, 0, 6), hp(12, 2.6, 4.6), hp(12, -2.6, 4.6), hp(16.8, 0, 3.4), hp(-1, 6, 0.4), hp(-1, -6, 0.4)];
    this.cheek.setAttribute("d", blob(cheekPts.map((p) => [p.x, p.y])));
    hparts.push({ node: this.cheek, t: 8 * hc + 0.45, k: "c" });
    const nz = hp(18.4, 0, 1);
    this.nose.setAttribute("transform", `translate(${n2(nz.x - 1.4 * hs * 0)} ${n2(nz.y)})`);
    hparts.push({ node: this.nose, t: 18 * hc + 0.7, k: "z" });
    const mo = hp(14.6, 0, 3.9);
    this.mouth.setAttribute("transform", `translate(${n2(mo.x)} ${n2(mo.y)}) scale(${n2(0.9 + 2.6 * st.mouth)} ${n2(0.28 + 2.4 * st.mouth)})`);
    hparts.push({ node: this.mouth, t: 14 * hc + 0.6, k: "o" });

    [1, -1].forEach((side, i) => {
      const ear = this.ears[i]!;
      const r = (i === 0 ? st.earB : st.earF) * D;
      const e = side;
      const baseC = { f: -0.5, y: -5.8 };
      const tipF = baseC.f - 10.5 * Math.sin(r), tipY = baseC.y - 10.5 * Math.cos(r);
      const pts3: [number, number, number][] = [[2, 4.4 * e, -5.4], [-3, 4.4 * e, -6.2], [-0.5, 2.2 * e, -6.6], [-0.5, 6.6 * e, -4.8], [tipF, 5.4 * e, tipY]];
      const pr = pts3.map(([a, b, c]) => hp(a, b, c));
      ear.outer.setAttribute("d", blob(pr.map((p) => [p.x, p.y])));
      const cx = pr.reduce((acc, p) => acc + p.x, 0) / pr.length, cy = pr.reduce((acc, p) => acc + p.y, 0) / pr.length;
      const inner = pr.map((p): Pt => [cx + (p.x - cx) * 0.55, cy + (p.y - cy) * 0.6 + 0.6]);
      ear.inner.setAttribute("d", blob(inner));
      ear.inner.setAttribute("opacity", n2(0.8 * band(-0.25, 0.05, hc)));
      const t = 4.4 * -e * hs - 0.6 * hc;
      ear.shade.setAttribute("d", blob(pr.map((p) => [p.x, p.y])));
      ear.shade.setAttribute("opacity", n2(clamp(-t / 4.4, 0, 1) * 0.3));
      hparts.push({ node: ear.g, t, k: `e${i}` });
    });

    [3.6, -3.6].forEach((s2, i) => {
      const eye = this.eyes[i]!;
      const p = hp(6.6, s2, -2.2);
      const facing = 0.55 * hc - Math.sign(s2) * 0.83 * hs;
      const vis = band(-0.1, 0.06, facing);
      const fore = 0.3 + 0.7 * clamp(facing, 0, 1);
      eye.eye.setAttribute("transform", `translate(${n2(p.x)} ${n2(p.y)}) scale(${n2(1.35 * fore)} ${n2(1.7 * (1 - 0.88 * st.shut))})`);
      eye.shine.setAttribute("transform", `translate(${n2(p.x + 0.4 * (hs >= 0 ? 1 : -1) * fore)} ${n2(p.y - 0.6)})`);
      eye.shine.setAttribute("opacity", n2(st.shut > 0.5 ? 0 : 1));
      eye.g.setAttribute("opacity", n2(vis));
      hparts.push({ node: eye.g, t: p.t + 0.9, k: `y${i}` });
    });

    hparts.sort((a, b) => a.t - b.t);
    const hk = hparts.map((p) => p.k).join();
    if (hk !== this.headOrder) { this.headOrder = hk; for (const p of hparts) this.head.appendChild(p.node); }
    parts.push({ node: this.head, t: hA.t + 1.2, k: "H" });

    parts.sort((a, b) => a.t - b.t);
    const key = parts.map((p) => p.k).join();
    if (key !== this.order) { this.order = key; for (const p of parts) this.root.appendChild(p.node); }
  }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
