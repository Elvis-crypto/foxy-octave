import { ADDED } from "./added.ts";
import { RECORDER } from "./recorder.ts";

/** Each song keeps the source line, then the two toy folds of that same line.
 * Verses that repeat the tune are words only. verses[n][i] belongs to tune[i].
 *
 * Eight bars, eightFold "leap": the smaller leap onto C4–C5.
 * Eight bars, eightFold "keep": a note that is already a bar stays there (Boci).
 * Fifteen bars: the written pitch stays when that bar exists, upper octave included.
 */
export type EightFold = "leap" | "keep";

export type TuneLine = {
  source: string;
  eight: string;
  fifteen: string;
};

export type RepertoireSong = {
  id: string;
  title: string;
  lang: "hu" | "en" | "fr" | "de" | "es" | "sco" | "da";
  bpm: number;
  from: string;
  eightFold: EightFold;
  tune: TuneLine[];
  verses: string[][];
};

export const REPERTOIRE: readonly RepertoireSong[] = [
  {
    id: "boci",
    title: "Boci, boci tarka",
    lang: "hu",
    bpm: 108,
    from: "https://hu.wikipedia.org/wiki/Boci,_boci_tarka",
    eightFold: "keep",
    tune: [
    { source: "C/2 E/2 C/2 E/2 G G", eight: "C/ E/ C/ E/ G G", fifteen: "C/ E/ C/ E/ G G" },
    { source: "C/2 E/2 C/2 E/2 G G", eight: "C/ E/ C/ E/ G G", fifteen: "C/ E/ C/ E/ G G" },
    { source: "c/2 B/2 A/2 G/2 F A", eight: "c/ B/ A/ G/ F A", fifteen: "c/ B/ A/ G/ F A" },
    { source: "G/2 F/2 E/2 D/2 C C", eight: "G/ F/ E/ D/ C C", fifteen: "G/ F/ E/ D/ C C" },
    ],
    verses: [
    ["Boci, boci tarka", "Se füle, se farka", "Oda megyünk lakni", "Ahol tejet kapni"],
    ],
  },
  {
    id: "kiskacsa",
    title: "Kis kacsa fürdik",
    lang: "hu",
    bpm: 88,
    from: "https://hu.wikipedia.org/wiki/Kis_kacsa_fürdik",
    eightFold: "leap",
    tune: [
    { source: "D D/2 D/2 A A B A/2 G/2 G G", eight: "D D/ D/ A A B A/ G/ G G", fifteen: "D D/ D/ A A B A/ G/ G G" },
    { source: "A G/2 F/2 F F G F/2 E/2 D D", eight: "A G/ F/ F F G F/ E/ D D", fifteen: "A G/ F/ F F G F/ E/ D D" },
    ],
    verses: [
    ["Kis kacsa fürdik fekete tóban", "Anyjához készül Lengyelországba"],
    ["Síkos a talpa, magas a sarka", "Fordulj ki, fordulj, szép aranyalma"],
    ],
  },
  {
    id: "buns",
    title: "Hot Cross Buns",
    lang: "en",
    bpm: 100,
    from: "https://en.wikipedia.org/wiki/Hot_Cross_Buns",
    eightFold: "leap",
    tune: [
    { source: "E D C2", eight: "E D C2", fifteen: "E D C2" },
    { source: "E D C2", eight: "E D C2", fifteen: "E D C2" },
    { source: "C/2 C/2 C/2 C/2 D/2 D/2 D/2 D/2", eight: "C/ C/ C/ C/ D/ D/ D/ D/", fifteen: "C/ C/ C/ C/ D/ D/ D/ D/" },
    { source: "E D C2", eight: "E D C2", fifteen: "E D C2" },
    { source: "E/2 E/2 E/2 E/2 E D", eight: "E/ E/ E/ E/ E D", fifteen: "E/ E/ E/ E/ E D" },
    { source: "C/2 D/2 E/2 F/2 D2", eight: "C/ D/ E/ F/ D2", fifteen: "C/ D/ E/ F/ D2" },
    { source: "C/2 C/2 C/2 C/2 D/2 D/2 D/2 D/2", eight: "C/ C/ C/ C/ D/ D/ D/ D/", fifteen: "C/ C/ C/ C/ D/ D/ D/ D/" },
    { source: "E D C2", eight: "E D C2", fifteen: "E D C2" },
    ],
    verses: [
    ["Hot cross buns", "Hot cross buns", "One a penny, two a penny", "Hot cross buns", "If you have no daughters", "Give them to your sons", "One a penny, two a penny", "Hot cross buns"],
    ],
  },
  {
    id: "row",
    title: "Row, Row, Row Your Boat",
    lang: "en",
    bpm: 108,
    from: "https://en.wikipedia.org/wiki/Row,_Row,_Row_Your_Boat",
    eightFold: "leap",
    tune: [
    { source: "C C C D/2 E/2", eight: "C C C D/ E/", fifteen: "C C C D/ E/" },
    { source: "E D/2 E/2 F/2 G3/2", eight: "E D/ E/ F/ G3/2", fifteen: "E D/ E/ F/ G3/2" },
    { source: "c/2 c/2 c/2 G/2 G/2 G/2", eight: "c/ c/ c/ G/ G/ G/", fifteen: "c/ c/ c/ G/ G/ G/" },
    { source: "E/2 E/2 E/2 C/2 C/2 C/2", eight: "E/ E/ E/ C/ C/ C/", fifteen: "E/ E/ E/ C/ C/ C/" },
    { source: "G/2 F/2 E/2 D/2 C2", eight: "G/ F/ E/ D/ C2", fifteen: "G/ F/ E/ D/ C2" },
    ],
    verses: [
    ["Row, row, row your boat", "Gently down the stream", "Merrily, merrily", "Merrily, merrily", "Life is but a dream"],
    ],
  },
  {
    id: "london",
    title: "London Bridge",
    lang: "en",
    bpm: 108,
    from: "https://en.wikipedia.org/wiki/London_Bridge_Is_Falling_Down",
    eightFold: "leap",
    tune: [
    { source: "G A G F E F G2", eight: "G A G F E F G2", fifteen: "G A G F E F G2" },
    { source: "D E F2", eight: "D E F2", fifteen: "D E F2" },
    { source: "E F G2", eight: "E F G2", fifteen: "E F G2" },
    { source: "G A G F E F G2", eight: "G A G F E F G2", fifteen: "G A G F E F G2" },
    { source: "D G E C2", eight: "D G E C2", fifteen: "D G E C2" },
    ],
    verses: [
    ["London Bridge is falling down", "Falling down", "Falling down", "London Bridge is falling down", "My fair lady"],
    ["Build it up with wood and clay", "Wood and clay", "Wood and clay", "Build it up with wood and clay", "My fair lady"],
    ["Wood and clay will wash away", "Wash away", "Wash away", "Wood and clay will wash away", "My fair lady"],
    ["Build it up with iron bars", "Iron bars", "Iron bars", "Build it up with iron bars", "My fair lady"],
    ["Iron bars will bend and break", "Bend and break", "Bend and break", "Iron bars will bend and break", "My fair lady"],
    ],
  },
  {
    id: "baa",
    title: "Baa, Baa, Black Sheep",
    lang: "en",
    bpm: 96,
    from: "https://en.wikipedia.org/wiki/Baa,_Baa,_Black_Sheep",
    eightFold: "leap",
    tune: [
    { source: "C C G G A A G2", eight: "C C G G A A G2", fifteen: "C C G G A A G2" },
    { source: "F F E E D D C2", eight: "F F E E D D C2", fifteen: "F F E E D D C2" },
    { source: "G G F F E E D2", eight: "G G F F E E D2", fifteen: "G G F F E E D2" },
    { source: "G G F F E E D2", eight: "G G F F E E D2", fifteen: "G G F F E E D2" },
    { source: "C C G G A A G2", eight: "C C G G A A G2", fifteen: "C C G G A A G2" },
    { source: "F F E E D D C2", eight: "F F E E D D C2", fifteen: "F F E E D D C2" },
    ],
    verses: [
    ["Baa, baa, black sheep, have you any wool?", "Yes sir, yes sir, three bags full", "One for the master and one for the dame", "And one for the little boy who lives down the lane", "Baa, baa, black sheep, have you any wool?", "Yes sir, yes sir, three bags full"],
    ],
  },
  {
    id: "rain",
    title: "Rain, Rain, Go Away",
    lang: "en",
    bpm: 100,
    from: "https://en.wikipedia.org/wiki/Rain_Rain_Go_Away",
    eightFold: "leap",
    tune: [
    { source: "G G E G A2", eight: "G G E G A2", fifteen: "G G E G A2" },
    { source: "G G E A G E D2", eight: "G G E A G E D2", fifteen: "G G E A G E D2" },
    { source: "G G E A G E D2", eight: "G G E A G E D2", fifteen: "G G E A G E D2" },
    { source: "G G E G A2", eight: "G G E G A2", fifteen: "G G E G A2" },
    ],
    verses: [
    ["Rain, rain, go away", "Come again another day", "Little Arthur wants to play", "Rain, rain, go away"],
    ],
  },
  {
    id: "itsy",
    title: "Itsy Bitsy Spider",
    lang: "en",
    bpm: 108,
    from: "https://en.wikipedia.org/wiki/Itsy_Bitsy_Spider",
    eightFold: "leap",
    tune: [
    { source: "G C C C D E E", eight: "G c c c D E E", fifteen: "G C C C D E E" },
    { source: "E D C D E C", eight: "E D C D E C", fifteen: "E D C D E C" },
    { source: "E E F G", eight: "E E F G", fifteen: "E E F G" },
    { source: "G F E F G E", eight: "G F E F G E", fifteen: "G F E F G E" },
    { source: "C C D E", eight: "C C D E", fifteen: "C C D E" },
    { source: "E D C D E C", eight: "E D C D E C", fifteen: "E D C D E C" },
    { source: "G G C C C D E E", eight: "G G c c c D E E", fifteen: "G G C C C D E E" },
    { source: "E D C D E C2", eight: "E D C D E C2", fifteen: "E D C D E C2" },
    ],
    verses: [
    ["The itsy bitsy spider", "Climbed up the water spout", "Down came the rain", "And washed the spider out", "Out came the sun", "And dried up all the rain", "And the itsy bitsy spider", "Went up the spout again"],
    ],
  },
  {
    id: "hopp",
    title: "Hopp, Juliska",
    lang: "hu",
    bpm: 90,
    from: "Hungarian folk song Hopp, Juliska. Public domain.",
    eightFold: "leap",
    tune: [
    { source: "c G G E", eight: "c G G E", fifteen: "c G G E" },
    { source: "c G G E", eight: "C G G E", fifteen: "c G G E" },
    { source: "F F/2 G/2 A G D D D C", eight: "F F/ G/ A G D D D C", fifteen: "F F/ G/ A G D D D C" },
    { source: "F F/2 G/2 A G D D D C", eight: "F F/ G/ A G D D D C", fifteen: "F F/ G/ A G D D D C" },
    ],
    verses: [
    ["Hopp, Juliska", "hopp, Mariska", "hej, gyere vélem egy pár táncra", "hej, gyere vélem egy pár táncra"],
    ["Fordulj, bolha", "csosszantóra", "Járd meg a táncot régi módra", "Járd meg a táncot régi módra"],
    ["Így kell járni", "úgy kell járni", "Sári, Kati tudja, hogy kell járni", "Sári, Kati tudja, hogy kell járni"],
    ],
  },
  {
    id: "part",
    title: "A part alatt",
    lang: "hu",
    bpm: 72,
    from: "https://hu.wikipedia.org/wiki/A_part_alatt",
    eightFold: "leap",
    tune: [
    { source: "C/2 C/2 A G z", eight: "C/ C/ A G z", fifteen: "C/ C/ A G z" },
    { source: "C/2 C/2 A G z", eight: "c/ c/ A G z", fifteen: "C/ C/ A G z" },
    { source: "F E D/2 C/2 D/2 E/2", eight: "F E D/ C/ D/ E/", fifteen: "F E D/ C/ D/ E/" },
    { source: "F E D/2 C/2 D C", eight: "F E D/ C/ D C", fifteen: "F E D/ C/ D C" },
    ],
    verses: [
    ["A part alatt", "A part alatt", "három varjú kaszál", "három varjú kaszál"],
    ["Róka gyűjti", "Róka gyűjti", "Szúnyog kévét köti", "Szúnyog kévét köti"],
    ["Bolha ugrik", "Bolha ugrik", "Hányja a szekérre", "Hányja a szekérre"],
    ["Mén a szekér", "Mén a szekér", "Majd a malomba ér", "Majd a malomba ér"],
    ["A malomba", "A malomba", "Három tarka macska", "Három tarka macska"],
    ["Egyik szitál", "másik rostál", "Harmadik követ vág", "Harmadik követ vág"],
    ["Szürke szamár", "vizet hoz már", "Tekenőbe tölti", "Tekenőbe tölti"],
    ["Tehén dagaszt", "Tehén dagaszt", "Kemencébe rakja", "Kemencébe rakja"],
    ["Medve várja", "Medve várja", "Kisült-e a cipó", "Kisült-e a cipó"],
    ["Tyúk a cipót", "csipegeti", "Hangya morzsát szedi", "Hangya morzsát szedi"],
    ],
  },
  {
    id: "aki",
    title: "Aki nem lép egyszerre",
    lang: "hu",
    bpm: 60,
    from: "Hungarian folk song Aki nem lép egyszerre. Public domain.",
    eightFold: "leap",
    tune: [
    { source: "C/2 C/2 C/2 E/2 G/2 G/2 G G/2 E/2 E/2 G/2 C/2 C/2 C", eight: "C/ C/ C/ E/ G/ G/ G G/ E/ E/ G/ c/ c/ c", fifteen: "C/ C/ C/ E/ G/ G/ G G/ E/ E/ G/ C/ C/ C" },
    ],
    verses: [
    ["Aki nem lép egyszerre, nem kap rétest estére"],
    ["mert a rétes nagyon jó, katonának az való"],
    ],
  },
  {
    id: "bujjitt",
    title: "Bújj, bújj, itt megyek",
    lang: "hu",
    bpm: 60,
    from: "Hungarian folk song Bújj, bújj, itt megyek. Public domain.",
    eightFold: "leap",
    tune: [
    { source: "E D C/2 E/2 C", eight: "E D C/ E/ C", fifteen: "E D C/ E/ C" },
    { source: "E/2 E/2 D/2 D/2 C/2 E/2 C", eight: "E/ E/ D/ D/ C/ E/ C", fifteen: "E/ E/ D/ D/ C/ E/ C" },
    { source: "E D C D", eight: "E D C D", fifteen: "E D C D" },
    { source: "E D C D", eight: "E D C D", fifteen: "E D C D" },
    { source: "C/2 C/2 D/2 D/2 C/2 C/2 C/2 C/2", eight: "C/ C/ D/ D/ C/ C/ C/ C/", fifteen: "C/ C/ D/ D/ C/ C/ C/ C/" },
    ],
    verses: [
    ["Bújj, bújj, itt megyek", "Tüzes lapátot viszek", "Egyet szólok", "Kettőt szólok", "Harmadikra rádtalálok"],
    ],
  },
  {
    id: "golya",
    title: "Gólya, gólya, gilice",
    lang: "hu",
    bpm: 60,
    from: "https://hu.wikipedia.org/wiki/Gólya,_gólya,_gilice",
    eightFold: "leap",
    tune: [
    { source: "A/2 A/2 G/2 G/2 F/2 A/2 F", eight: "A/ A/ G/ G/ F/ A/ F", fifteen: "A/ A/ G/ G/ F/ A/ F" },
    { source: "A/2 A/2 G/2 G/2 F/2 A/2 F", eight: "A/ A/ G/ G/ F/ A/ F", fifteen: "A/ A/ G/ G/ F/ A/ F" },
    { source: "A/2 A/2 G/2 A/2 _B/2 A/2 G", eight: "A/ A/ G/ A/ B/ A/ G", fifteen: "A/ A/ G/ A/ B/ A/ G" },
    { source: "A/2 A/2 G/2 A/2 _B/2 A/2 G", eight: "A/ A/ G/ A/ B/ A/ G", fifteen: "A/ A/ G/ A/ B/ A/ G" },
    { source: "A G A G A/2 A/2 G/2 G/2 F F", eight: "A G A G A/ A/ G/ G/ F F", fifteen: "A G A G A/ A/ G/ G/ F F" },
    ],
    verses: [
    ["Gólya, gólya, gilice", "mitől véres a lábad", "Török gyerek elvágta", "magyar gyerek gyógyítja", "síppal, dobbal, nádi hegedűvel"],
    ],
  },
  {
    id: "auld",
    title: "Auld Lang Syne",
    lang: "sco",
    bpm: 90,
    from: "https://en.wikipedia.org/wiki/Auld_Lang_Syne",
    eightFold: "leap",
    tune: [
    { source: "G c3/2 c/ c e d3/2 c/ d", eight: "G c3/2 c/ c E D3/2 C/ D", fifteen: "G c3/2 c/ c e d3/2 c/ d" },
    { source: "e c3/2 c/ e g a3", eight: "E C3/2 C/ E G A3", fifteen: "e c3/2 c/ e g a3" },
    { source: "a g3/2 e/ e c d3/2 c/ d", eight: "A G3/2 E/ E C D3/2 C/ D", fifteen: "a g3/2 e/ e c d3/2 c/ d" },
    { source: "e c3/2 A/ A G c3", eight: "E C3/2 A/ A G c3", fifteen: "e c3/2 A/ A G c3" },
    { source: "a g3/2 e/ e c d3/2 c/ d", eight: "A G3/2 E/ E C D3/2 C/ D", fifteen: "a g3/2 e/ e c d3/2 c/ d" },
    { source: "e c3/2 c/ e g a3", eight: "E C3/2 C/ E G A3", fifteen: "e c3/2 c/ e g a3" },
    { source: "a g3/2 e/ e c d3/2 c/ d", eight: "A G3/2 E/ E C D3/2 C/ D", fifteen: "a g3/2 e/ e c d3/2 c/ d" },
    { source: "e c3/2 A/ A G c3", eight: "E C3/2 A/ A G c3", fifteen: "e c3/2 A/ A G c3" },
    ],
    verses: [
    ["Should auld acquaintance be forgot", "and never brought to mind?", "Should auld acquaintance be forgot", "and auld lang syne?", "For auld lang syne, my jo", "for auld lang syne", "we'll tak' a cup o' kindness yet", "for auld lang syne."],
    ["We twa hae run about the braes", "and pu'd the gowans fine", "But we've wander'd mony a weary fit", "sin' auld lang syne.", "For auld lang syne, my jo", "for auld lang syne", "we'll tak' a cup o' kindness yet", "for auld lang syne."],
    ["We twa hae paidl'd i' the burn", "frae morning sun till dine", "But seas between us braid hae roar'd", "sin' auld lang syne.", "For auld lang syne, my jo", "for auld lang syne", "we'll tak' a cup o' kindness yet", "for auld lang syne."],
    ],
  },
  {
    id: "clair",
    title: "Au clair de la lune",
    lang: "fr",
    bpm: 72,
    from: "https://fr.wikipedia.org/wiki/Au_clair_de_la_lune",
    eightFold: "leap",
    tune: [
    { source: "F F F G A2 G2", eight: "F F F G A2 G2", fifteen: "F F F G A2 G2" },
    { source: "F A G G F4", eight: "F A G G F4", fifteen: "F A G G F4" },
    { source: "F F F G A2 G2", eight: "F F F G A2 G2", fifteen: "F F F G A2 G2" },
    { source: "F A G G F4", eight: "F A G G F4", fifteen: "F A G G F4" },
    { source: "G G G G D2 D2", eight: "G G G G D2 D2", fifteen: "G G G G D2 D2" },
    { source: "G F E D C4", eight: "G F E D C4", fifteen: "G F E D C4" },
    { source: "F F F G A2 G2", eight: "F F F G A2 G2", fifteen: "F F F G A2 G2" },
    { source: "F A G G F4", eight: "F A G G F4", fifteen: "F A G G F4" },
    ],
    verses: [
    ["Au clair de la lune", "Mon ami Pierrot", "Prête-moi ta plume", "Pour écrire un mot", "Ma chandelle est morte", "Je n'ai plus de feu", "Ouvre-moi ta porte", "Pour l'amour de Dieu"],
    ["Au clair de la lune", "Pierrot répondit", "Je n'ai pas de plume", "Je suis dans mon lit", "Va chez la voisine", "Je crois qu'elle y est", "Car dans sa cuisine", "On bat le briquet"],
    ],
  },
  {
    id: "avignon",
    title: "Sur le pont d'Avignon",
    lang: "fr",
    bpm: 120,
    from: "https://fr.wikipedia.org/wiki/Sur_le_pont_d%27Avignon",
    eightFold: "leap",
    tune: [
    { source: "F/2 F/2 F G/2 G/2 G", eight: "F/ F/ F G/ G/ G", fifteen: "F/ F/ F G/ G/ G" },
    { source: "A/2 B/2 c/2 F/2 E/2 F/2 G/2 c/2", eight: "A/ B/ c/ F/ E/ F/ G/ c/", fifteen: "A/ B/ c/ F/ E/ F/ G/ c/" },
    { source: "F/2 F/2 F G/2 G/2 G", eight: "F/ F/ F G/ G/ G", fifteen: "F/ F/ F G/ G/ G" },
    { source: "A/2 B/2 c/2 F/2 G/2 E/2 F", eight: "A/ B/ c/ F/ G/ E/ F", fifteen: "A/ B/ c/ F/ G/ E/ F" },
    { source: "F/2 F/2 F/2 F/2 G F", eight: "F/ F/ F/ F/ G F", fifteen: "F/ F/ F/ F/ G F" },
    { source: "F/2 F/2 F/2 F/2 G F", eight: "F/ F/ F/ F/ G F", fifteen: "F/ F/ F/ F/ G F" },
    { source: "F/2 F/2 F G/2 G/2 G", eight: "F/ F/ F G/ G/ G", fifteen: "F/ F/ F G/ G/ G" },
    { source: "A/2 B/2 c/2 F/2 E/2 F/2 G/2 c/2", eight: "A/ B/ c/ F/ E/ F/ G/ c/", fifteen: "A/ B/ c/ F/ E/ F/ G/ c/" },
    { source: "F/2 F/2 F G/2 G/2 G", eight: "F/ F/ F G/ G/ G", fifteen: "F/ F/ F G/ G/ G" },
    { source: "A/2 B/2 c/2 F/2 G/2 E/2 F", eight: "A/ B/ c/ F/ G/ E/ F", fifteen: "A/ B/ c/ F/ G/ E/ F" },
    ],
    verses: [
    ["Sur le pont d'Avignon", "on y danse, on y danse", "sur le pont d'Avignon", "on y danse tous en rond", "Les belles dames font comm' ça", "et puis encor' comm' ça", "Sur le pont d'Avignon", "on y danse, on y danse", "sur le pont d'Avignon", "on y danse tous en rond"],
    ],
  },
  ...ADDED,
  ...RECORDER,
];

function coreStamp(song: RepertoireSong): string {
  const body = JSON.stringify([song.title, song.bpm, song.tune, song.verses]);
  let hash = 5381;
  for (let i = 0; i < body.length; i += 1) hash = Math.imul(hash, 33) ^ body.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

/** One stamp per built-in song. A phone copy of that song is kept only while this still matches. */
export const CORE_STAMPS: Readonly<Record<string, string>> = Object.fromEntries(
  REPERTOIRE.map((song) => [song.id, coreStamp(song)]),
);

