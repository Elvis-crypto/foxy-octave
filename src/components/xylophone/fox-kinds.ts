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

