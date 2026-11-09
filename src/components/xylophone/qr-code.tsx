import { encode } from "uqr";

/** Quiet QR for a printed poster. The text is encoded, not written into the markup. */
export function QrCode({ text, label }: { text: string; label: string }) {
  if (!text) return <div className="aspect-square w-full rounded-2xl bg-white" aria-hidden />;
  const { data, size } = encode(text, { ecc: "M", border: 2 });
  const cells: string[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!data[y]?.[x]) continue;
      cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#241f1c"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img"><rect width="${size}" height="${size}" fill="#ffffff"/>${cells.join("")}</svg>`;
  return (
    <div
      className="aspect-square w-full bg-white"
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
