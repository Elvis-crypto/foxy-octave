import { ADDED } from "./added.ts";

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
    ["Boci, boci megfázott", "Varrtam neki nadrágot", "Nem akarta felvenni", "Ágyba kellett fektetni"],
    ["Kicsi kutya tarka", "Se füle, se farka", "Mégis olyan tarka", "Mint a macska farka"],
    ["Kicsi kutya megfázott", "Varrtam neki nadrágot", "Nem akarta felhúzni", "Nem tud benne táncolni"],
    ["Boci, boci tarka", "Se füle, se farka", "Azért olyan tarka", "Mert füle se farka"],
    ["Boci, boci tarka", "Se füle, se farka", "Itt maradunk lakni", "Itt lehet tejet kapni"],
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
    id: "sussfel",
    title: "Süss fel, nap",
    lang: "hu",
    bpm: 80,
    from: "https://hu.wikipedia.org/wiki/Süss_fel,_nap",
    eightFold: "leap",
    tune: [
    { source: "G A G", eight: "G A G", fifteen: "G A G" },
    { source: "G A G", eight: "G A G", fifteen: "G A G" },
    { source: "G/2 A/2 G/2 F/2 E/2 D/2 E/2 F/2", eight: "G/ A/ G/ F/ E/ D/ E/ F/", fifteen: "G/ A/ G/ F/ E/ D/ E/ F/" },
    { source: "E D C", eight: "E D C", fifteen: "E D C" },
    ],
    verses: [
    ["Süss fel, nap", "Fényes nap", "Kertek alatt a ludaim", "Megfagynak"],
    ["Süss fel, nap", "Fényes nap", "Kertek alatt kislibáim", "Megfagynak"],
    ["Süss fel, nap", "Fényes nap", "Kertek alatt kisbárányim", "Megfagynak"],
    ],
  },
  {
    id: "tavaszi",
    title: "Tavaszi szél",
    lang: "hu",
    bpm: 72,
    from: "https://hu.wikipedia.org/wiki/Tavaszi_szél_vizet_áraszt",
    eightFold: "leap",
    tune: [
    { source: "F G A/2 A3/2 G G/2 A/2 F G", eight: "F G A/ A3/2 G G/ A/ F G", fifteen: "F G A/ A3/2 G G/ A/ F G" },
    { source: "A/2 A3/2 G G/2 A/2 F2 C", eight: "A/ A3/2 G G/ A/ F2 C", fifteen: "A/ A3/2 G G/ A/ F2 C" },
    { source: "F G A/2 A3/2 G G/2 A/2 F/2 E/2 D", eight: "F G A/ A3/2 G G/ A/ F/ E/ D", fifteen: "F G A/ A3/2 G G/ A/ F/ E/ D" },
    { source: "G/2 G A/2 F E D2 D", eight: "G/ G A/ F E D2 D", fifteen: "G/ G A/ F E D2 D" },
    ],
    verses: [
    ["Tavaszi szél vizet áraszt", "Virágom, virágom", "Minden madár társat választ", "Virágom, virágom"],
    ["Hát én immár kit válasszak", "Virágom, virágom", "Te engemet, én tégedet", "Virágom, virágom"],
    ["Zöld pántlika, könnyű gúnya", "Virágom, virágom", "Mert azt a szél könnyen fújja", "Virágom, virágom"],
    ["De a fátyol nehéz ruha", "Virágom, virágom", "Mert azt a bú leszaggatja", "Virágom, virágom"],
    ],
  },
  {
    id: "szolo",
    title: "Érik a szőlő",
    lang: "hu",
    bpm: 116,
    from: "https://hu.wikipedia.org/wiki/Érik_a_szőlő",
    eightFold: "leap",
    tune: [
    { source: "D D/2 A D E", eight: "D D/ A D E", fifteen: "D D/ A D E" },
    { source: "C C/2 D E D", eight: "C C/ D E D", fifteen: "C C/ D E D" },
    { source: "C/2 B A A/2 D A", eight: "C/ B A A/ D A", fifteen: "C/ B A A/ D A" },
    { source: "G G/2 D G A", eight: "G G/ D G A", fifteen: "G G/ D G A" },
    { source: "F F/2 G A G", eight: "F F/ G A G", fifteen: "F F/ G A G" },
    { source: "F/2 E D D/2 G D", eight: "F/ E D D/ G D", fifteen: "F/ E D D/ G D" },
    ],
    verses: [
    ["Érik a szőlő", "Hajlik a vessző", "Bodor a levele", "Két szegény legény", "Szántani menne", "De nincsen kenyere"],
    ["Van vöröshagyma", "A tarisznyában", "Keserű magában", "Szolgalegénynek", "Hej, a szegénynek", "De kevés vacsora"],
    ],
  },
  {
    id: "twinkle",
    title: "Twinkle, Twinkle, Little Star",
    lang: "en",
    bpm: 96,
    from: "https://en.wikipedia.org/wiki/Twinkle,_Twinkle,_Little_Star",
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
    ["Twinkle, twinkle, little star", "How I wonder what you are", "Up above the world so high", "Like a diamond in the sky", "Twinkle, twinkle, little star", "How I wonder what you are"],
    ["When the blazing sun is gone", "When he nothing shines upon", "Then you show your little light", "Twinkle, twinkle, all the night", "Twinkle, twinkle, little star", "How I wonder what you are"],
    ["Then the traveller in the dark", "Thanks you for your tiny spark", "He could not see which way to go", "If you did not twinkle so", "Twinkle, twinkle, little star", "How I wonder what you are"],
    ["In the dark blue sky you keep", "And often through my curtains peep", "For you never shut your eye", "Till the sun is in the sky", "Twinkle, twinkle, little star", "How I wonder what you are"],
    ["'Tis your bright and tiny spark", "Lights the traveller in the dark", "Though I know not what you are", "Twinkle, twinkle, little star", "Twinkle, twinkle, little star", "How I wonder what you are"],
    ],
  },
  {
    id: "mary",
    title: "Mary Had a Little Lamb",
    lang: "en",
    bpm: 112,
    from: "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
    eightFold: "leap",
    tune: [
    { source: "E D C D E E E2", eight: "E D C D E E E2", fifteen: "E D C D E E E2" },
    { source: "D D D2", eight: "D D D2", fifteen: "D D D2" },
    { source: "E G G2", eight: "E G G2", fifteen: "E G G2" },
    { source: "E D C D E E E2", eight: "E D C D E E E2", fifteen: "E D C D E E E2" },
    { source: "D D E D C2", eight: "D D E D C2", fifteen: "D D E D C2" },
    ],
    verses: [
    ["Mary had a little lamb", "Little lamb", "Little lamb", "Mary had a little lamb", "Its fleece was white as snow"],
    ["And everywhere that Mary went", "Mary went", "Mary went", "Everywhere that Mary went", "The lamb was sure to go"],
    ["It followed her to school one day", "School one day", "School one day", "It followed her to school one day", "Which was against the rules"],
    ["It made the children laugh and play", "Laugh and play", "Laugh and play", "It made the children laugh and play", "To see a lamb at school"],
    ["Why does the lamb love Mary so", "Mary so", "Mary so", "Why does the lamb love Mary so", "The eager children cry"],
    ["Mary loves the lamb, you know", "Lamb, you know", "Lamb, you know", "Mary loves the lamb, you know", "The teacher did reply"],
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
    id: "frere",
    title: "Frère Jacques",
    lang: "fr",
    bpm: 104,
    from: "https://fr.wikipedia.org/wiki/Frère_Jacques_(chanson)",
    eightFold: "leap",
    tune: [
    { source: "C D E C", eight: "C D E C", fifteen: "C D E C" },
    { source: "C D E C", eight: "C D E C", fifteen: "C D E C" },
    { source: "E F G2", eight: "E F G2", fifteen: "E F G2" },
    { source: "E F G2", eight: "E F G2", fifteen: "E F G2" },
    { source: "G A G F E C", eight: "G A G F E C", fifteen: "G A G F E C" },
    { source: "G A G F E C", eight: "G A G F E C", fifteen: "G A G F E C" },
    { source: "C G C2", eight: "C G c2", fifteen: "C G C2" },
    { source: "C G C2", eight: "c G c2", fifteen: "C G C2" },
    ],
    verses: [
    ["Frère Jacques", "Frère Jacques", "Dormez-vous", "Dormez-vous", "Sonnez les matines", "Sonnez les matines", "Ding, dang, dong", "Ding, dang, dong"],
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
    id: "szilva",
    title: "Hull a szilva a fáról",
    lang: "hu",
    bpm: 60,
    from: "https://hu.wikipedia.org/wiki/Hull_a_szilva_a_fáról",
    eightFold: "leap",
    tune: [
    { source: "D/2 D/2 D/2 D/2 C/2 D D/2", eight: "D/ D/ D/ D/ C/ D D/", fifteen: "D/ D/ D/ D/ C/ D D/" },
    { source: "G/2 G/2 c/2 B/2 A/2 A D/2", eight: "G/ G/ c/ B/ A/ A D/", fifteen: "G/ G/ c/ B/ A/ A D/" },
    { source: "G c/2 B/2 A/2 G/2 F/2 C/2", eight: "G c/ B/ A/ G/ F/ C/", fifteen: "G c/ B/ A/ G/ F/ C/" },
    { source: "F/2 F/2 G/2 F/2 D D/2", eight: "F/ F/ G/ F/ D D/", fifteen: "F/ F/ G/ F/ D D/" },
    ],
    verses: [
    ["Hull a szilva a fáról", "most jövök a tanyáról", "ej, haj, ruca, ruca", "kukorica, derce"],
    ["Egyik ága lehajlott", "az én rózsám elhagyott", "ej, haj, ruca, ruca", "kukorica, derce"],
    ["Kis kalapom fekete", "pávatollu van benne", "ej, haj, ruca, ruca", "kukorica, derce"],
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
    ["Fogd a kontyot", "hogy ne lógjon", "ihaj a farod, hogy ne mozogjon", "ihaj a farod, hogy ne mozogjon"],
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
    id: "zoldag",
    title: "Bújj, bújj, zöld ág",
    lang: "hu",
    bpm: 60,
    from: "https://hu.wikipedia.org/wiki/Bújj,_bújj,_zöld_ág",
    eightFold: "leap",
    tune: [
    { source: "G A G E G G/2 A/2 G E", eight: "G A G E G G/ A/ G E", fifteen: "G A G E G G/ A/ G E" },
    { source: "G/2 G/2 G/2 A/2 G/2 F/2 E/2 D/2 E/2 D/2 E/2 D/2 C C", eight: "G/ G/ G/ A/ G/ F/ E/ D/ E/ D/ E/ D/ C C", fifteen: "G/ G/ G/ A/ G/ F/ E/ D/ E/ D/ E/ D/ C C" },
    { source: "G A G E G/2 E/2 G G/2 E/2 G", eight: "G A G E G/ E/ G G/ E/ G", fifteen: "G A G E G/ E/ G G/ E/ G" },
    { source: "G A G E G/2 E/2 G G/2 E/2 G", eight: "G A G E G/ E/ G G/ E/ G", fifteen: "G A G E G/ E/ G G/ E/ G" },
    { source: "G/2 A/2 G/2 F/2 E D G/2 A/2 G/2 F/2 E D E D C", eight: "G/ A/ G/ F/ E D G/ A/ G/ F/ E D E D C", fifteen: "G/ A/ G/ F/ E D G/ A/ G/ F/ E D E D C" },
    ],
    verses: [
    ["Bújj, bújj, zöld ág, zöld levelecske", "nyitva van az aranykapu, csak bújjatok rajta", "Nyisd ki, rózsám, kapudat, kapudat", "hadd kerüljem házadat, házadat", "szita, szita, péntek, szerelemcsütörtök, babszerda"],
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
    id: "duna",
    title: "Hej, Dunáról fúj a szél",
    lang: "hu",
    bpm: 60,
    from: "Hungarian folk song Hej, Dunáról fúj a szél. Public domain.",
    eightFold: "leap",
    tune: [
    { source: "A/2 A/2 G/2 E/2 A/2 A/2 G", eight: "A/ A/ G/ E/ A/ A/ G", fifteen: "A/ A/ G/ E/ A/ A/ G" },
    { source: "A/2 A/2 G/2 E/2 A/2 A/2 G", eight: "A/ A/ G/ E/ A/ A/ G", fifteen: "A/ A/ G/ E/ A/ A/ G" },
    { source: "A/2 E D/2 E/2 E/2 E", eight: "A/ E D/ E/ E/ E", fifteen: "A/ E D/ E/ E/ E" },
    { source: "D/2 D/2 C/2 A/2 D/2 D/2 C", eight: "D/ D/ C/ A/ D/ D/ C", fifteen: "D/ D/ C/ A/ D/ D/ C" },
    { source: "D/2 D/2 C/2 A/2 D/2 D/2 C", eight: "D/ D/ C/ A/ D/ D/ C", fifteen: "D/ D/ C/ A/ D/ D/ C" },
    { source: "D/2 A G/2 A/2 A/2 A", eight: "D/ A G/ A/ A/ A", fifteen: "D/ A G/ A/ A/ A" },
    ],
    verses: [
    ["Hej, Dunáról fúj a szél", "szegény embert mindig ér", "Dunáról fúj a szél", "Ha Dunáról nem fújna", "ilyen hideg sem volna", "Dunáról fúj a szél"],
    ["Hej, Dunáról fúj a szél", "feküdj mellém, majd nem ér", "Dunáról fúj a szél", "Nem fekszem én kend mellé", "úgy sem leszek a kendé", "Dunáról fúj a szél"],
    ["Hej, Jancsika, Jancsika", "mért nem nőttél nagyobbra", "Dunáról fúj a szél", "Nőttél volna nagyobbra", "lettél volna katona", "Dunáról fúj a szél"],
    ],
  },
  {
    id: "katalinka",
    title: "Katalinka, szállj el",
    lang: "hu",
    bpm: 60,
    from: "Hungarian folk song Katalinka, szállj el. Public domain.",
    eightFold: "leap",
    tune: [
    { source: "^F/2 ^F/2 E/2 E/2 D E", eight: "G/ G/ E/ E/ D E", fifteen: "G/ G/ E/ E/ D E" },
    { source: "^F/2 ^F/2 E/2 E/2 D E", eight: "G/ G/ E/ E/ D E", fifteen: "G/ G/ E/ E/ D E" },
    { source: "^F E/2 E/2 D E", eight: "G E/ E/ D E", fifteen: "G E/ E/ D E" },
    { source: "^F/2 ^F/2 E/2 E/2 D E", eight: "G/ G/ E/ E/ D E", fifteen: "G/ G/ E/ E/ D E" },
    { source: "^F/2 ^F/2 E/2 E/2 D E", eight: "G/ G/ E/ E/ D E", fifteen: "G/ G/ E/ E/ D E" },
    { source: "^F/2 ^F/2 E/2 E/2 D E", eight: "G/ G/ E/ E/ D E", fifteen: "G/ G/ E/ E/ D E" },
    { source: "^F/2 ^F/2 A/2 A/2 ^F/2 ^F/2 A/2 A/2", eight: "G/ G/ A/ A/ G/ G/ A/ A/", fifteen: "G/ G/ A/ A/ G/ G/ A/ A/" },
    { source: "^F/2 ^F/2 E/2 E/2 D D", eight: "G/ G/ E/ E/ D D", fifteen: "G/ G/ E/ E/ D D" },
    ],
    verses: [
    ["Katalinka, szállj el", "jönnek a törökök", "sós kútba tesznek", "onnan is kivesznek", "kerék alá tesznek", "onnan is kivesznek", "ihol jönnek a törökök", "mindjárt agyonvernek"],
    ],
  },
  {
    id: "lanc",
    title: "Lánc, lánc, eszterlánc",
    lang: "hu",
    bpm: 72,
    from: "Hungarian folk song Lánc, lánc, eszterlánc. Public domain.",
    eightFold: "leap",
    tune: [
    { source: "G E G/2 G/2 E A/2 G/2 F/2 E/2 D D/2", eight: "G E G/ G/ E A/ G/ F/ E/ D D/", fifteen: "G E G/ G/ E A/ G/ F/ E/ D D/" },
    { source: "G/2 G/2 E/2 E/2 G/2 G/2 E/2 E/2 A/2 G/2 F/2 E/2 D D/2", eight: "G/ G/ E/ E/ G/ G/ E/ E/ A/ G/ F/ E/ D D/", fifteen: "G/ G/ E/ E/ G/ G/ E/ E/ A/ G/ F/ E/ D D/" },
    { source: "G E/2 E/2 G/2 c/2 G G/2 c/2 G G/2 F/2 E/2 D/2 G/2 c/2 G G/2 c/2 G", eight: "G E/ E/ G/ c/ G G/ c/ G G/ F/ E/ D/ G/ c/ G G/ c/ G", fifteen: "G E/ E/ G/ c/ G G/ c/ G G/ F/ E/ D/ G/ c/ G G/ c/ G" },
    { source: "G/2 F/2 E/2 D/2 C C/2", eight: "G/ F/ E/ D/ C C/", fifteen: "G/ F/ E/ D/ C C/" },
    ],
    verses: [
    ["Lánc, lánc, eszterlánc, eszterlánci cérna", "cérna volna, selyem volna, mégis kifordulna", "Pénz volna, karika, karika, forduljon ki Marika, Marika", "Marikának lánca"],
    ],
  },
  {
    id: "ode",
    title: "Ode to Joy",
    lang: "de",
    bpm: 120,
    from: "Beethoven, Symphony No. 9, Ode to Joy theme. Schiller, An die Freude. Public domain.",
    eightFold: "leap",
    tune: [
    { source: "E E F G G F E D", eight: "E E F G G F E D", fifteen: "E E F G G F E D" },
    { source: "C C D E E3/2 D/2 D2", eight: "C C D E E3/2 D/ D2", fifteen: "C C D E E3/2 D/ D2" },
    { source: "E E F G G F E D", eight: "E E F G G F E D", fifteen: "E E F G G F E D" },
    { source: "C C D E D3/2 C/2 C2", eight: "C C D E D3/2 C/ C2", fifteen: "C C D E D3/2 C/ C2" },
    { source: "D D E C D E/2 F/2 E C", eight: "D D E C D E/ F/ E C", fifteen: "D D E C D E/ F/ E C" },
    { source: "D E/2 F/2 E D C D G", eight: "D E/ F/ E D C D G", fifteen: "D E/ F/ E D C D G" },
    { source: "E2 E F G G F E D", eight: "E2 E F G G F E D", fifteen: "E2 E F G G F E D" },
    { source: "C C D E D3/2 C/2 C2", eight: "C C D E D3/2 C/ C2", fifteen: "C C D E D3/2 C/ C2" },
    ],
    verses: [
    ["Freude, schöner Götterfunken", "Tochter aus Elysium", "Wir betreten feuertrunken", "Himmlische, dein Heiligtum", "Deine Zauber binden wieder", "Was die Mode streng geteilt", "Alle Menschen werden Brüder", "Wo dein sanfter Flügel weilt"],
    ["Wem der große Wurf gelungen", "Eines Freundes Freund zu sein", "Wer ein holdes Weib errungen", "Mische seinen Jubel ein", "Ja, wer auch nur eine Seele", "Sein nennt auf dem Erdenrund", "Und wer's nie gekonnt, der stehle", "Weinend sich aus diesem Bund"],
    ["Freude trinken alle Wesen", "An den Brüsten der Natur", "Alle Guten, alle Bösen", "Folgen ihrer Rosenspur", "Küsse gab sie uns und Reben", "Einen Freund, geprüft im Tod", "Wollust ward dem Wurm gegeben", "Und der Cherub steht vor Gott"],
    ],
  },
  {
    id: "brahms",
    title: "Wiegenlied",
    lang: "de",
    bpm: 66,
    from: "Brahms, Wiegenlied, Op. 49 No. 4. Public domain.",
    eightFold: "leap",
    tune: [
    { source: "E/2 E/2 G3/2 E/2 E", eight: "E/ E/ G3/2 E/ E", fifteen: "E/ E/ G3/2 E/ E" },
    { source: "G z E/2 G/2 c B3/2 A/2", eight: "G z E/ G/ c B3/2 A/", fifteen: "G z E/ G/ c B3/2 A/" },
    { source: "A G D/2 E/2 F D D/2 E/2", eight: "A G D/ E/ F D D/ E/", fifteen: "A G D/ E/ F D D/ E/" },
    { source: "F z D/2 F/2 B/2 A/2 G B", eight: "F z D/ F/ B/ A/ G B", fifteen: "F z D/ F/ B/ A/ G B" },
    { source: "c z c/2 c/2 c2 A/2 F/2", eight: "c z c/ c/ c2 A/ F/", fifteen: "c z c/ c/ c2 A/ F/" },
    { source: "G2 E/2 C/2 F G A G2", eight: "G2 E/ C/ F G A G2", fifteen: "G2 E/ C/ F G A G2" },
    { source: "c/2 c/2 c2 A/2 F/2", eight: "c/ c/ c2 A/ F/", fifteen: "c/ c/ c2 A/ F/" },
    { source: "G2 E/2 C/2 F E D C2", eight: "G2 E/ C/ F E D C2", fifteen: "G2 E/ C/ F E D C2" },
    ],
    verses: [
    ["Guten Abend, gut' Nacht", "mit Rosen bedacht", "mit Näglein besteckt", "schlupf unter die Deck", "Morgen früh, wenn Gott will", "wirst du wieder geweckt", "Morgen früh, wenn Gott will", "wirst du wieder geweckt"],
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
    { source: "G c3/2 c/2 c E D3/2 C/2 D E", eight: "G c3/2 c/ c E D3/2 C/ D E", fifteen: "G c3/2 c/ c E D3/2 C/ D E" },
    { source: "C3/2 C/2 E G A3 A", eight: "C3/2 C/ E G A3 A", fifteen: "C3/2 C/ E G A3 A" },
    { source: "G3/2 E/2 E C D3/2 C/2 D E", eight: "G3/2 E/ E C D3/2 C/ D E", fifteen: "G3/2 E/ E C D3/2 C/ D E" },
    { source: "C3/2 A/2 A G c3", eight: "C3/2 A/ A G c3", fifteen: "C3/2 A/ A G c3" },
    { source: "A G3/2 E/2 E C D3/2 C/2 D A", eight: "A G3/2 E/ E C D3/2 C/ D A", fifteen: "A G3/2 E/ E C D3/2 C/ D A" },
    { source: "G3/2 E/2 E G A3 A", eight: "G3/2 E/ E G A3 A", fifteen: "G3/2 E/ E G A3 A" },
    { source: "G3/2 E/2 E C D3/2 C/2 D E", eight: "G3/2 E/ E C D3/2 C/ D E", fifteen: "G3/2 E/ E C D3/2 C/ D E" },
    { source: "C3/2 A/2 A G c3", eight: "C3/2 A/ A G c3", fifteen: "C3/2 A/ A G c3" },
    ],
    verses: [
    ["Should auld acquaintance be forgot", "and never brought to mind?", "Should auld acquaintance be forgot", "and auld lang syne?", "For auld lang syne, my jo", "for auld lang syne", "we'll tak' a cup o' kindness yet", "for auld lang syne."],
    ["And surely ye'll be your pint-stoup", "and surely I'll be mine", "And we'll tak' a cup o' kindness yet", "for auld lang syne.", "For auld lang syne, my jo", "for auld lang syne", "we'll tak' a cup o' kindness yet", "for auld lang syne."],
    ["We twa hae run about the braes", "and pu'd the gowans fine", "But we've wander'd mony a weary fit", "sin' auld lang syne.", "For auld lang syne, my jo", "for auld lang syne", "we'll tak' a cup o' kindness yet", "for auld lang syne."],
    ["We twa hae paidl'd i' the burn", "frae morning sun till dine", "But seas between us braid hae roar'd", "sin' auld lang syne.", "For auld lang syne, my jo", "for auld lang syne", "we'll tak' a cup o' kindness yet", "for auld lang syne."],
    ["And there's a hand, my trusty fiere", "and gie's a hand o' thine", "And we'll tak' a right guid-willie waught", "for auld lang syne.", "For auld lang syne, my jo", "for auld lang syne", "we'll tak' a cup o' kindness yet", "for auld lang syne."],
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
    ["Au clair de la lune", "L'aimable Lubin", "Frappe chez la brune", "Ell' répond soudain", "Qui frapp' de la sorte", "Il dit à son tour", "Ouvrez votre porte", "Pour le dieu d'amour"],
    ["Au clair de la lune", "On n'y voit qu'un peu", "On chercha la plume", "On chercha le feu", "En cherchant d'la sorte", "Je n'sais c'qu'on trouva", "Mais je sais qu'la porte", "Sur eux se ferma"],
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
  {
    id: "grace",
    title: "Amazing Grace",
    lang: "en",
    bpm: 66,
    from: "John Newton, Amazing Grace, Olney Hymns. Public domain.",
    eightFold: "leap",
    tune: [
    { source: "D G2 B/2 G/2 B2 A G2 E D2 D", eight: "D G2 B/ G/ B2 A G2 E D2 D", fifteen: "D G2 B/ G/ B2 A G2 E D2 D" },
    { source: "G2 B/2 G/2 B2 A D2 B", eight: "G2 B/ G/ B2 A D2 B", fifteen: "G2 B/ G/ B2 A D2 B" },
    { source: "D3/2 B/2 D/2 B/2 G2 D E3/2 G/2 G/2 E/2 D2 D", eight: "D3/2 B/ D/ B/ G2 D E3/2 G/ G/ E/ D2 D", fifteen: "D3/2 B/ D/ B/ G2 D E3/2 G/ G/ E/ D2 D" },
    { source: "G2 B/2 G/2 B2 A G3", eight: "G2 B/ G/ B2 A G3", fifteen: "G2 B/ G/ B2 A G3" },
    ],
    verses: [
    ["Amazing grace! (how sweet the sound)", "That sav'd a wretch like me!", "I once was lost, but now am found", "Was blind, but now I see."],
    ["'Twas grace that taught my heart to fear", "And grace my fears reliev'd", "How precious did that grace appear", "The hour I first believ'd!"],
    ["Thro' many dangers, toils, and snares", "I have already come", "'Tis grace has brought me safe thus far", "And grace will lead me home."],
    ["The Lord has promis'd good to me", "His word my hope secures", "He will my shield and portion be", "As long as life endures."],
    ["Yes, when this flesh and heart shall fail", "And mortal life shall cease", "I shall possess, within the veil", "A life of joy and peace."],
    ["The earth shall soon dissolve like snow", "The sun forbear to shine", "But God, who call'd me here below", "Will be forever mine."],
    ],
  },
  {
    id: "cuca",
    title: "La Cucaracha",
    lang: "es",
    bpm: 132,
    from: "Traditional La Cucaracha. Public domain.",
    eightFold: "leap",
    tune: [
    { source: "G/2 G/2 G/2 c E/2 G/2 G/2 G/2 c E2", eight: "G/ G/ G/ c E/ G/ G/ G/ c E2", fifteen: "G/ G/ G/ c E/ G/ G/ G/ c E2" },
    { source: "C/2 C/2 B/2 B/2 A/2 A/2 G3/2", eight: "C/ C/ B/ B/ A/ A/ G3/2", fifteen: "C/ C/ B/ B/ A/ A/ G3/2" },
    { source: "G/2 G/2 G/2 B D/2 G/2 G/2 G/2 B D2", eight: "G/ G/ G/ B D/ G/ G/ G/ B D2", fifteen: "G/ G/ G/ B D/ G/ G/ G/ B D2" },
    { source: "G/2 A/2 G/2 F/2 E/2 D/2 C3", eight: "G/ A/ G/ F/ E/ D/ C3", fifteen: "G/ A/ G/ F/ E/ D/ C3" },
    { source: "G/2 G/2 c/2 c/2 E/2 E/2 G E2", eight: "G/ G/ c/ c/ E/ E/ G E2", fifteen: "G/ G/ c/ c/ E/ E/ G E2" },
    { source: "G/2 A/2 G/2 F/2 E/2 G/2 F D2", eight: "G/ A/ G/ F/ E/ G/ F D2", fifteen: "G/ A/ G/ F/ E/ G/ F D2" },
    { source: "G/2 G/2 B/2 B/2 D/2 D/2 F D2", eight: "G/ G/ B/ B/ D/ D/ F D2", fifteen: "G/ G/ B/ B/ D/ D/ F D2" },
    { source: "G/2 A/2 G/2 F/2 E/2 D/2 E C2", eight: "G/ A/ G/ F/ E/ D/ E C2", fifteen: "G/ A/ G/ F/ E/ D/ E C2" },
    ],
    verses: [
    ["La cucaracha, la cucaracha", "ya no puede caminar", "porque no tiene, porque le falta", "las dos patitas de atrás", "Dicen que la cucaracha", "es un animal pequeño", "y cuando entran en una casa", "se tiene que quedar dueño"],
    ],
  },
  ...ADDED,
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

