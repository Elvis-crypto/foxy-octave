import { writeFileSync } from "node:fs";
import { parseEvents } from "../src/lib/xylophone/parse.ts";
import { syllabifyLine } from "../src/lib/xylophone/syllables.ts";
import { foldEight, foldFifteen } from "../src/lib/xylophone/theory.ts";

type Line = { abc: string; words: string[] };
type Draft = { id: string; title: string; lang: string; bpm: number; from: string; lines: Line[] };

const songs: Draft[] = [
  {
    id: "oldmac",
    title: "Old MacDonald",
    lang: "en",
    bpm: 116,
    from: "Traditional Old MacDonald Had a Farm. Public domain.",
    lines: [
      { abc: "G G G D E E D", words: ["Old MacDonald had a farm", "Old MacDonald had a farm", "Old MacDonald had a farm"] },
      { abc: "B B A A G", words: ["E-I-E-I-O", "E-I-E-I-O", "E-I-E-I-O"] },
      { abc: "D D D A B B A", words: ["And on that farm he had a cow", "And on that farm he had a pig", "And on that farm he had a duck"] },
      { abc: "B B A A G", words: ["E-I-E-I-O", "E-I-E-I-O", "E-I-E-I-O"] },
    ],
  },
  {
    id: "maman",
    title: "Ah! vous dirai-je, maman",
    lang: "fr",
    bpm: 96,
    from: "Traditional Ah! vous dirai-je, maman. Public domain.",
    lines: [
      { abc: "C C G G A A G", words: ["Ah! vous dirai-je, maman"] },
      { abc: "F F E E D D C", words: ["Ce qui cause mon tourment"] },
      { abc: "G G F F E E D D", words: ["Papa veut que je raisonne"] },
      { abc: "G G F F E E D D C", words: ["Comme une grande personne"] },
      { abc: "C C G G A A G", words: ["Moi je dis que les bonbons"] },
      { abc: "F F E E D D C", words: ["Valent mieux que la raison"] },
    ],
  },
  {
    id: "alouette",
    title: "Alouette",
    lang: "fr",
    bpm: 112,
    from: "Traditional Alouette. Public domain.",
    lines: [
      { abc: "c c d e c d e c d e c", words: ["Alouette, gentille alouette", "Je te plumerai la tête", "Alouette, gentille alouette"] },
      { abc: "c d e c d e c c c", words: ["Alouette, je te plumerai", "Et la tête, et la tête", "Alouette, je te plumerai"] },
    ],
  },
  {
    id: "ainsi",
    title: "Ainsi font",
    lang: "fr",
    bpm: 108,
    from: "Traditional Ainsi font, font, font. Public domain.",
    lines: [
      { abc: "c c d e c", words: ["Ainsi font, font, font", "Ainsi font, font, font"] },
      { abc: "c c d e f e d c c", words: ["Les petites marionnettes", "Les petites marionnettes"] },
      { abc: "c c d e c", words: ["Ainsi font, font, font", "Ainsi font, font, font"] },
      { abc: "c d e f e d c c c", words: ["Trois petits tours et puis s'en vont", "Trois petits tours et puis s'en vont"] },
    ],
  },
  {
    id: "dodo",
    title: "Fais dodo",
    lang: "fr",
    bpm: 84,
    from: "Traditional Fais dodo, Colas mon p'tit frère. Public domain.",
    lines: [
      { abc: "e g g a g f e d c c", words: ["Fais dodo, Colas mon petit frère", "Fais dodo, Colas mon petit frère"] },
      { abc: "e g g a g e d c", words: ["Fais dodo, t'auras du gâteau", "Fais dodo, t'auras du lolo"] },
    ],
  },
  {
    id: "choux",
    title: "Savez-vous planter les choux",
    lang: "fr",
    bpm: 120,
    from: "Traditional Savez-vous planter les choux. Public domain.",
    lines: [
      { abc: "c c c d e e e", words: ["Savez-vous planter les choux", "Savez-vous planter les choux", "On les plante avec les doigts"] },
      { abc: "d d c d e e d c", words: ["À la mode, à la mode", "À la mode, à la mode", "À la mode, à la mode"] },
      { abc: "c c c d e e e", words: ["Savez-vous planter les choux", "On les plante avec le nez", "On les plante avec les pieds"] },
      { abc: "d d c B c c c", words: ["À la mode de chez nous", "À la mode de chez nous", "À la mode de chez nous"] },
    ],
  },
  {
    id: "souris",
    title: "Une souris verte",
    lang: "fr",
    bpm: 104,
    from: "Traditional Une souris verte. Public domain.",
    lines: [
      { abc: "C E G G E C", words: ["Une souris verte", "Je l'attrape par la queue", "Je la trempe dans l'huile"] },
      { abc: "C E G A G E", words: ["Qui courait dans l'herbe", "Je la montre à ces messieurs", "Je la trempe dans l'eau"] },
      { abc: "G G A G F E D C", words: ["Je la mets dans un coffret", "Ces messieurs me disent", "Ça fait un escargot tout chaud"] },
    ],
  },
  {
    id: "loup",
    title: "Promenons-nous dans les bois",
    lang: "fr",
    bpm: 100,
    from: "Traditional Promenons-nous dans les bois. Public domain.",
    lines: [
      { abc: "c c c d e e e", words: ["Promenons-nous dans les bois", "Loup y es-tu", "Que fais-tu"] },
      { abc: "d d e c d e f g", words: ["Pendant que le loup n'y est pas", "M'entends-tu", "Je mets ma chemise"] },
      { abc: "e e d c B c d e", words: ["Si le loup y était", "Que fais-tu", "Je mets mon pantalon"] },
      { abc: "d c B c", words: ["Il nous mangerait", "Je mets ma culotte", "Je vais à la chasse"] },
    ],
  },
  {
    id: "haenschen",
    title: "Hänschen klein",
    lang: "de",
    bpm: 112,
    from: "Traditional Hänschen klein. Public domain.",
    lines: [
      { abc: "E G G G A G E", words: ["Hänschen klein ging allein", "Doch die Mutter weinet sehr"] },
      { abc: "F A A G F E D", words: ["In die weite Welt hinein", "Hat gar kein Geld mehr"] },
      { abc: "C E G G F E D", words: ["Stock und Hut steht ihm gut", "Da besinnet sich das Kind"] },
      { abc: "C E D C", words: ["Ist gar wohlgemut", "Kehrte wieder heim"] },
    ],
  },
  {
    id: "entchen",
    title: "Alle meine Entchen",
    lang: "de",
    bpm: 100,
    from: "Traditional Alle meine Entchen. Public domain.",
    lines: [
      { abc: "C D E F G G", words: ["Alle meine Entchen"] },
      { abc: "A A A A G", words: ["Schwimmen auf dem See"] },
      { abc: "A A A A G", words: ["Köpfchen in das Wasser"] },
      { abc: "F E D C", words: ["Schwänzchen in die Höh"] },
    ],
  },
  {
    id: "kuchen",
    title: "Backe, backe Kuchen",
    lang: "de",
    bpm: 108,
    from: "Traditional Backe, backe Kuchen. Public domain.",
    lines: [
      { abc: "C C D E E D", words: ["Backe, backe Kuchen"] },
      { abc: "C C D E F E D", words: ["Der Bäcker hat gerufen"] },
      { abc: "E E F G G F", words: ["Wer will guten Kuchen backen"] },
      { abc: "E D C D E D C", words: ["Der muss haben sieben Sachen"] },
    ],
  },
  {
    id: "bienchen",
    title: "Summ, summ, summ",
    lang: "de",
    bpm: 96,
    from: "Traditional Summ, summ, summ. Public domain.",
    lines: [
      { abc: "E E E", words: ["Summ, summ, summ", "Summ, summ, summ"] },
      { abc: "G G E E D", words: ["Bienchen summ herum", "Bienchen flieg herum"] },
      { abc: "E F G G A G F E", words: ["Ei, wir tun dir nichts zuleide", "Such in Blumen, such in Blumen"] },
      { abc: "F E D C D E D C", words: ["Flieg nur aus in Wald und Heide", "Dir dein Schlafzimmer"] },
    ],
  },
  {
    id: "kuckuck",
    title: "Kuckuck",
    lang: "de",
    bpm: 108,
    from: "Traditional Kuckuck, Kuckuck, ruft's aus dem Wald. Public domain.",
    lines: [
      { abc: "G E G E", words: ["Kuckuck, Kuckuck"] },
      { abc: "F D F D", words: ["ruft aus dem Wald"] },
      { abc: "C D E F G E F D E C", words: ["Lasset uns singen, tanzen und springen"] },
      { abc: "G E C D E C D C", words: ["Frühling, Frühling wird es nun bald"] },
    ],
  },
  {
    id: "haeschen",
    title: "Häschen in der Grube",
    lang: "de",
    bpm: 92,
    from: "Traditional Häschen in der Grube. Public domain.",
    lines: [
      { abc: "C D E F G E", words: ["Häschen in der Grube", "Häschen hüpf", "Komm nach Haus"] },
      { abc: "F E D C", words: ["saß und schlief", "Häschen hüpf", "armes Häschen"] },
      { abc: "E F G A G", words: ["Armes Häschen, bist du krank", "Häschen hüpf", "Komm nach Haus"] },
      { abc: "G F E D C", words: ["Dass du nicht mehr hüpfen kannst", "Häschen hüpf", "armes Häschen"] },
    ],
  },
  {
    id: "pferdchen",
    title: "Hopp, hopp, hopp",
    lang: "de",
    bpm: 126,
    from: "Traditional Hopp, hopp, hopp, Pferdchen lauf Galopp. Public domain.",
    lines: [
      { abc: "C C C", words: ["Hopp, hopp, hopp", "Hopp, hopp, hopp", "Hopp, hopp, hopp"] },
      { abc: "E E D C", words: ["Pferdchen lauf Galopp", "Pferdchen lauf Galopp", "Pferdchen lauf Galopp"] },
      { abc: "E F G G A G F E", words: ["Über Stock und über Steine", "Aber zwischen diesen beiden", "Zwischen diesen beiden Beinen"] },
      { abc: "A G F E D C", words: ["Aber brich dir nicht die Beine", "Fehlt noch einer, fällt er runter", "Ist ein Loch, da fällt er runter"] },
    ],
  },
  {
    id: "voegel",
    title: "Alle Vögel sind schon da",
    lang: "de",
    bpm: 116,
    from: "Traditional Alle Vögel sind schon da. Public domain.",
    lines: [
      { abc: "C E G G G A G", words: ["Alle Vögel sind schon da", "Wie sie alle lustig sind"] },
      { abc: "F F E E D C", words: ["Alle Vögel, alle", "Flink und froh sich regen"] },
      { abc: "A A G F E D", words: ["Amsel, Drossel, Fink und Star", "Amsel, Drossel, Fink und Star"] },
      { abc: "C E D C D E C", words: ["Und die ganze Vogelschar", "Wünschen dir ein frohes Jahr"] },
    ],
  },
  {
    id: "pollitos",
    title: "Los pollitos dicen",
    lang: "es",
    bpm: 92,
    from: "Traditional Los pollitos dicen. Public domain.",
    lines: [
      { abc: "E E G G G E", words: ["Los pollitos dicen", "Cuando tienen hambre"] },
      { abc: "G G E E E C", words: ["pío, pío, pío", "cuando tienen frío"] },
      { abc: "C E G G F E", words: ["La gallina busca", "La gallina busca"] },
      { abc: "D C B, C D E C", words: ["el maíz y el trigo", "el maíz y el trigo"] },
    ],
  },
  {
    id: "gato",
    title: "Estaba el señor don Gato",
    lang: "es",
    bpm: 112,
    from: "Traditional Estaba el señor don Gato. Public domain.",
    lines: [
      { abc: "C E G G A G E C", words: ["Estaba el señor don Gato", "Recibe una carta escrita", "Por no saber leer ni escribir"] },
      { abc: "F A A G F E D C D E F", words: ["sentadito en un tejado", "que si quiere ser su marido", "se cayó del tejado abajo"] },
      { abc: "E G c c B A G", words: ["Con un traje muy planchado", "La gatita respondona", "Se rompió siete costillas"] },
      { abc: "G F E D C D E D C", words: ["y un sombrero de pico", "le manda una esquela", "y la punta del espinazo"] },
    ],
  },
  {
    id: "boton",
    title: "Debajo de un botón",
    lang: "es",
    bpm: 104,
    from: "Traditional Debajo de un botón. Public domain.",
    lines: [
      { abc: "C C D E F E D", words: ["Debajo de un botón", "Debajo de un botón"] },
      { abc: "E F G A G F E", words: ["tón, tón, tón que encontró Martín", "tón, tón, que encontró Martín"] },
      { abc: "C C D E F E D", words: ["Había un ratón", "Había un ratón"] },
      { abc: "E D C D E D C", words: ["tón, tón, tón", "ay, qué chiquitín"] },
    ],
  },
  {
    id: "patio",
    title: "El patio de mi casa",
    lang: "es",
    bpm: 108,
    from: "Traditional El patio de mi casa. Public domain.",
    lines: [
      { abc: "G G E E D C E D C", words: ["El patio de mi casa", "Cuando llueve se moja"] },
      { abc: "E F G A G", words: ["es particular", "como los demás"] },
      { abc: "A A G F E D C D E", words: ["Cuando llueve se moja", "Agáchense y vuélvanse"] },
      { abc: "C E D C", words: ["como los demás", "a empezar"] },
    ],
  },
  {
    id: "aserrin",
    title: "Aserrín, aserrán",
    lang: "es",
    bpm: 100,
    from: "Traditional Aserrín, aserrán. Public domain.",
    lines: [
      { abc: "C E G G E C", words: ["Aserrín, aserrán"] },
      { abc: "G A G F E D", words: ["los maderos de San Juan"] },
      { abc: "E E G G A G", words: ["Piden pan, no les dan"] },
      { abc: "F E D C E D C D E", words: ["piden queso, les dan hueso"] },
    ],
  },
  {
    id: "pinpon",
    title: "Pin Pon",
    lang: "es",
    bpm: 116,
    from: "Traditional Pin Pon es un muñeco. Public domain.",
    lines: [
      { abc: "C E G G A G E", words: ["Pin Pon es un muñeco", "Pin Pon da los buenos días"] },
      { abc: "F A A G F E D", words: ["muy guapo y de cartón", "levantando los bracitos"] },
      { abc: "E G c c B A G", words: ["Se lava la carita", "Pin Pon dame la manita"] },
      { abc: "G F E D C D E C", words: ["con agua y con jabón", "con un fuerte apretón"] },
    ],
  },
  {
    id: "pajara",
    title: "La pájara pinta",
    lang: "es",
    bpm: 108,
    from: "Traditional Estaba la pájara pinta. Public domain.",
    lines: [
      { abc: "C D E F G A G F", words: ["Estaba la pájara pinta", "Date prisa, amigo Juan"] },
      { abc: "E F G A G F E", words: ["sentada en su verde limón", "que te espera tu mamá"] },
      { abc: "G A B c B A G F E D", words: ["Con el pico recoge la rama", "Date prisa, amigo Juan"] },
      { abc: "F E D C E D C D E", words: ["con la rama recoge la flor", "que te espera tu mamá"] },
    ],
  },
  {
    id: "rueda",
    title: "A la rueda rueda",
    lang: "es",
    bpm: 120,
    from: "Traditional A la rueda, rueda. Public domain.",
    lines: [
      { abc: "G G E E D C G E D C", words: ["A la rueda, rueda", "Los de adelante corren mucho"] },
      { abc: "E F G G E D C D E", words: ["de pan y canela", "y los de atrás se quedarán"] },
      { abc: "A A G F E D", words: ["Dame un beso", "tras, tras, tras"] },
      { abc: "C E D C E D C D C", words: ["y vete a la escuela", "una vuelta más"] },
    ],
  },
  {
    id: "duermete",
    title: "Duérmete, mi niño",
    lang: "es",
    bpm: 76,
    from: "Traditional Duérmete, mi niño. Public domain.",
    lines: [
      { abc: "E E G G E C", words: ["Duérmete, mi niño", "Duérmete, lucerito"] },
      { abc: "G A G F E D", words: ["duérmete, solito", "de la mañana"] },
      { abc: "C E G c B A G", words: ["Que viene el coco", "Duérmete, mi niño"] },
      { abc: "F E D C E D C C", words: ["y se lleva a los niños", "duérmete, mi amor"] },
    ],
  },
  {
    id: "jakob",
    title: "Mester Jakob",
    lang: "da",
    bpm: 100,
    from: "Traditional Mester Jakob. Public domain.",
    lines: [
      { abc: "C D E C C D E C", words: ["Mester Jakob, mester Jakob", "Hører du ej klokken", "Bim, bam, bum"] },
      { abc: "E F G2 E F G2", words: ["sover du, sover du", "hører du ej klokken", "bim, bam, bum"] },
      { abc: "G/ A/ G/ F/ E C G/ A/ G/ F/ E C", words: ["Hører du ej klokken", "Bim, bam, bum", "Mester Jakob"] },
      { abc: "C G C2 C G C2", words: ["bim, bam, bum", "mester Jakob", "sover du"] },
    ],
  },
  {
    id: "brille",
    title: "Bro, bro, brille",
    lang: "da",
    bpm: 108,
    from: "Traditional Bro, bro, brille. Public domain.",
    lines: [
      { abc: "C E G G", words: ["Bro, bro, brille"] },
      { abc: "A G F E D", words: ["klokken ringer elleve"] },
      { abc: "E F G A G", words: ["kejseren står på trappen"] },
      { abc: "F E D C", words: ["og kys den jomfru"] },
    ],
  },
  {
    id: "krage",
    title: "Højt på en gren en krage",
    lang: "da",
    bpm: 96,
    from: "Traditional Højt på en gren en krage. Public domain.",
    lines: [
      { abc: "C E G G A G E", words: ["Højt på en gren en krage", "Kragen vil ikke tie"] },
      { abc: "F A A G F E D", words: ["sad og sang i sommersol", "før den får en osteskorpe"] },
      { abc: "E G c c B A G", words: ["Kom, lille krage, kom", "Så flyver kragen hjem"] },
      { abc: "G F E D C", words: ["og syng en lille sang", "til sin egen gren"] },
    ],
  },
  {
    id: "ranke",
    title: "Ride, ride ranke",
    lang: "da",
    bpm: 100,
    from: "Traditional Ride, ride ranke. Public domain.",
    lines: [
      { abc: "C E G G E C", words: ["Ride, ride ranke"] },
      { abc: "G A G F E D", words: ["hesten hedder Blanke"] },
      { abc: "E F G A G E", words: ["Hvor skal vi ride hen"] },
      { abc: "F E D C E D C", words: ["vi rider til kongens gård"] },
    ],
  },
  {
    id: "hoppe",
    title: "Hoppe, hoppe rytter",
    lang: "da",
    bpm: 120,
    from: "Traditional Hoppe, hoppe rytter. Public domain.",
    lines: [
      { abc: "C C E E G", words: ["Hoppe, hoppe rytter", "Hoppe, hoppe rytter"] },
      { abc: "A G F E D", words: ["hesten går i skridt", "hesten går i trav"] },
      { abc: "E E G G c", words: ["Hoppe, hoppe rytter", "Hoppe, hoppe rytter"] },
      { abc: "A G F E D C", words: ["hesten går galop", "nu er turen slut"] },
    ],
  },
  {
    id: "kjole",
    title: "Se, min kjole",
    lang: "da",
    bpm: 104,
    from: "Traditional Se, min kjole. Public domain.",
    lines: [
      { abc: "E E G E", words: ["Se, min kjole", "Se, min kjole"] },
      { abc: "G A G F E D", words: ["den er rød som rose", "den er blå som himlen"] },
      { abc: "C E G c B A", words: ["Alle små børn de synger", "Alle små børn de danser"] },
      { abc: "G F E D C", words: ["når de ser den kjole", "når de ser den kjole"] },
    ],
  },
  {
    id: "ole",
    title: "Ole sad på en knold",
    lang: "da",
    bpm: 92,
    from: "Traditional Ole sad på en knold og sang. Public domain.",
    lines: [
      { abc: "C E G G A G E", words: ["Ole sad på en knold og sang", "Han sang om en pige så fin"] },
      { abc: "F A A G F E D", words: ["om en pige så ven og god", "og om solen på himlen"] },
      { abc: "E G c c B A G", words: ["Kom og syng med Ole", "Ole synger endnu"] },
      { abc: "G F E D C", words: ["på den lille knold", "på den lille knold"] },
    ],
  },
  {
    id: "bjoernen",
    title: "Bjørnen sover",
    lang: "da",
    bpm: 88,
    from: "Traditional Bjørnen sover. Public domain.",
    lines: [
      { abc: "C C D E", words: ["Bjørnen sover", "Bjørnen sover"] },
      { abc: "F F E D", words: ["i sit hul", "hele dagen"] },
      { abc: "E F G A G", words: ["Den er ikke farlig", "Når den vågner, danser vi"] },
      { abc: "F E D C", words: ["bare man er stille", "rundt omkring dens hul"] },
    ],
  },
  {
    id: "hoved",
    title: "Hoved, skulder, knæ og tå",
    lang: "da",
    bpm: 112,
    from: "Traditional Hoved, skulder, knæ og tå. Public domain.",
    lines: [
      { abc: "C C D C E D C", words: ["Hoved, skulder, knæ og tå", "Hoved, skulder, knæ og tå"] },
      { abc: "C E G G", words: ["knæ og tå", "knæ og tå"] },
      { abc: "G G A G F E D", words: ["Øjne, ører, mund og næse", "Øjne, ører, mund og næse"] },
      { abc: "C E D C D E C", words: ["hoved, skulder, knæ og tå", "hoved, skulder, knæ og tå"] },
    ],
  },
  {
    id: "soeland",
    title: "Jeg gik mig over sø og land",
    lang: "da",
    bpm: 104,
    from: "Traditional Jeg gik mig over sø og land. Public domain.",
    lines: [
      { abc: "C E G G A G E C", words: ["Jeg gik mig over sø og land", "Så mødte jeg en gammel mand"] },
      { abc: "F A A G F E D", words: ["der mødte jeg en gammel mand", "han sagde til mig, lille ven"] },
      { abc: "E G c c B A G", words: ["Goddag, goddag, min lille ven", "Hvor skal du hen, min lille ven"] },
      { abc: "G F E D C", words: ["hvor skal du hen", "jeg går min vej"] },
    ],
  },
];

const NAMES = ["C", "^C", "D", "^D", "E", "F", "^F", "G", "^G", "A", "^A", "B"] as const;

function lengthToken(beats: number): string {
  let numerator = Math.round(beats * 8);
  let denominator = 8;
  if (numerator < 1) numerator = 1;
  while (numerator % 2 === 0 && denominator % 2 === 0) {
    numerator /= 2;
    denominator /= 2;
  }
  if (denominator === 1) return numerator === 1 ? "" : String(numerator);
  if (numerator === 1) return denominator === 2 ? "/" : `/${denominator}`;
  return `${numerator}/${denominator}`;
}

function token(midi: number, beats: number): string {
  const pc = NAMES[((midi % 12) + 12) % 12] ?? "C";
  const octave = Math.floor(midi / 12) - 1;
  const accidental = pc.startsWith("^") ? "^" : "";
  const letter = pc.slice(accidental.length);
  let body = letter;
  if (octave >= 5) body = letter.toLowerCase() + "'".repeat(octave - 5);
  else if (octave < 4) body = letter + ",".repeat(4 - octave);
  return accidental + body + lengthToken(beats);
}

function expand(events: { midi: number | null; beats: number }[], syllables: number) {
  const sounding = events.filter((event) => event.midi !== null);
  if (syllables <= sounding.length) return events;
  const splits = sounding.map(() => 0);
  let acc = 0;
  for (let i = 0; i < sounding.length; i += 1) {
    acc += syllables;
    const take = Math.floor(acc / sounding.length);
    acc -= take * sounding.length;
    splits[i] = take - 1;
  }
  const out: { midi: number | null; beats: number }[] = [];
  let index = 0;
  for (const event of events) {
    if (event.midi === null) {
      out.push(event);
      continue;
    }
    const pieces = [event.beats];
    for (let k = 0; k < (splits[index] ?? 0); k += 1) {
      let long = 0;
      for (let t = 1; t < pieces.length; t += 1) if (pieces[t]! > pieces[long]!) long = t;
      const half = pieces[long]! / 2;
      pieces.splice(long, 1, half, half);
    }
    for (const beats of pieces) out.push({ midi: event.midi, beats });
    index += 1;
  }
  return out;
}

function abcOf(events: { midi: number | null; beats: number }[], placed: readonly (number | null)[]): string {
  return events.map((event, index) => (event.midi === null || placed[index] === null ? `z${lengthToken(event.beats)}` : token(placed[index]!, event.beats))).join(" ");
}

const blocks = songs.map((song) => {
  const tune = song.lines.map((line) => {
    const events = parseEvents(line.abc);
    const need = Math.max(0, ...line.words.map((word) => syllabifyLine(word).length));
    const fitted = expand(events, need);
    const before = events.filter((event) => event.midi !== null).length;
    const after = fitted.filter((event) => event.midi !== null).length;
    if (after !== before) console.log(`${song.id}: ${before} -> ${after} for ${need} syllables | ${line.words[0]}`);
    for (const word of line.words) {
      const count = syllabifyLine(word).length;
      if (count > after) throw new Error(`${song.id} still short: ${word}`);
    }
    const written = foldFifteen(fitted.map((event) => event.midi));
    const single = foldEight(written);
    return {
      source: line.abc,
      fifteen: abcOf(fitted, written),
      eight: abcOf(fitted, single),
    };
  });
  const verses: string[][] = [];
  const verseCount = Math.max(...song.lines.map((line) => line.words.length));
  for (let verse = 0; verse < verseCount; verse += 1) {
    verses.push(song.lines.map((line) => line.words[verse] ?? line.words[0] ?? ""));
  }
  return { id: song.id, title: song.title, lang: song.lang, bpm: song.bpm, from: song.from, eightFold: "leap" as const, tune, verses };
});

const body = blocks
  .map((song) => {
    const tune = song.tune
      .map((line) => `    { source: ${JSON.stringify(line.source)}, eight: ${JSON.stringify(line.eight)}, fifteen: ${JSON.stringify(line.fifteen)} },`)
      .join("\n");
    const verses = song.verses.map((verse) => `    [${verse.map((line) => JSON.stringify(line)).join(", ")}],`).join("\n");
    return `  {
    id: ${JSON.stringify(song.id)},
    title: ${JSON.stringify(song.title)},
    lang: ${JSON.stringify(song.lang)},
    bpm: ${song.bpm},
    from: ${JSON.stringify(song.from)},
    eightFold: "leap",
    tune: [
${tune}
    ],
    verses: [
${verses}
    ],
  }`;
  })
  .join(",\n");

writeFileSync(
  "src/lib/xylophone/added.ts",
  `import type { RepertoireSong } from "./repertoire.ts";

/** New songs. fifteen is the written two-octave sheet. eight is only the single-octave fold. */
export const ADDED: readonly RepertoireSong[] = [
${body},
];
`,
);
console.log(`wrote ${blocks.length} songs`);
