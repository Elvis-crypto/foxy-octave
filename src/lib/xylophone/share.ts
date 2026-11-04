import { isLang, type Lang } from "./i18n.ts";

/** Share wording. Always "we played", never about the child. */
export const SHARE_COPY: Record<
  Lang,
  {
    played: string;
    stars: string;
    desc: string;
    share: string;
    shareTitle: string;
    copy: string;
    copied: string;
    request: string;
    requestTitle: string;
    requestSong: string;
    requestNote: string;
    requestContact: string;
    requestSend: string;
    requestSent: string;
    requestFail: string;
  }
> = {
  hu: {
    played: "Ezt játszottuk: {song}",
    stars: "{n} csillag",
    desc: "Rókás xilofon: a hangok a lapok színeiben hullanak. Játsszátok el ti is!",
    share: "Megosztás",
    shareTitle: "Küldd el másnak is",
    copy: "Link másolása",
    copied: "Link kimásolva",
    request: "Dalt kérek",
    requestTitle: "Melyik dalt tegyük fel?",
    requestSong: "A dal címe",
    requestNote: "Megjegyzés (nem kötelező)",
    requestContact: "E-mail, ha szólhatunk (nem kötelező)",
    requestSend: "Küldés",
    requestSent: "Megkaptuk, köszönjük!",
    requestFail: "Most nem sikerült. Próbáld újra kicsit később.",
  },
  en: {
    played: "We played: {song}",
    stars: "{n} stars",
    desc: "A fox xylophone: notes fall in the colors of the bars. Play it too!",
    share: "Share",
    shareTitle: "Send it to someone",
    copy: "Copy link",
    copied: "Link copied",
    request: "Request a song",
    requestTitle: "Which song should we add?",
    requestSong: "Song title",
    requestNote: "Note (optional)",
    requestContact: "Email, if we may tell you (optional)",
    requestSend: "Send",
    requestSent: "Got it, thank you!",
    requestFail: "That didn't work. Try again a little later.",
  },
  fr: {
    played: "On a joué : {song}",
    stars: "{n} étoiles",
    desc: "Un xylophone renard : les notes tombent aux couleurs des lames. À vous de jouer !",
    share: "Partager",
    shareTitle: "Envoyer à quelqu'un",
    copy: "Copier le lien",
    copied: "Lien copié",
    request: "Demander une chanson",
    requestTitle: "Quelle chanson ajouter ?",
    requestSong: "Titre de la chanson",
    requestNote: "Remarque (facultatif)",
    requestContact: "E-mail pour vous prévenir (facultatif)",
    requestSend: "Envoyer",
    requestSent: "Bien reçu, merci !",
    requestFail: "Ça n'a pas marché. Réessayez un peu plus tard.",
  },
  de: {
    played: "Wir haben gespielt: {song}",
    stars: "{n} Sterne",
    desc: "Ein Fuchs-Xylophon: Die Noten fallen in den Farben der Klangstäbe. Spielt mit!",
    share: "Teilen",
    shareTitle: "An jemanden schicken",
    copy: "Link kopieren",
    copied: "Link kopiert",
    request: "Lied wünschen",
    requestTitle: "Welches Lied sollen wir hinzufügen?",
    requestSong: "Liedtitel",
    requestNote: "Anmerkung (optional)",
    requestContact: "E-Mail für eine Rückmeldung (optional)",
    requestSend: "Senden",
    requestSent: "Angekommen, danke!",
    requestFail: "Das hat nicht geklappt. Bitte später noch einmal.",
  },
  es: {
    played: "Hemos tocado: {song}",
    stars: "{n} estrellas",
    desc: "Un xilófono zorro: las notas caen con los colores de las láminas. ¡Tocad vosotros también!",
    share: "Compartir",
    shareTitle: "Envíaselo a alguien",
    copy: "Copiar enlace",
    copied: "Enlace copiado",
    request: "Pedir una canción",
    requestTitle: "¿Qué canción añadimos?",
    requestSong: "Título de la canción",
    requestNote: "Nota (opcional)",
    requestContact: "Email para avisarte (opcional)",
    requestSend: "Enviar",
    requestSent: "¡Recibido, gracias!",
    requestFail: "No ha funcionado. Inténtalo un poco más tarde.",
  },
  da: {
    played: "Vi spillede: {song}",
    stars: "{n} stjerner",
    desc: "En ræve-xylofon: tonerne falder i stavenes farver. Spil med!",
    share: "Del",
    shareTitle: "Send den til nogen",
    copy: "Kopiér link",
    copied: "Link kopieret",
    request: "Ønsk en sang",
    requestTitle: "Hvilken sang skal vi tilføje?",
    requestSong: "Sangens titel",
    requestNote: "Bemærkning (valgfri)",
    requestContact: "E-mail, hvis vi må svare (valgfri)",
    requestSend: "Send",
    requestSent: "Modtaget, tak!",
    requestFail: "Det lykkedes ikke. Prøv igen lidt senere.",
  },
};

export type ShareParams = { song: string; stars: 1 | 2 | 3 | null; lang: Lang | null };

const SONG_ID = /^[A-Za-z0-9_-]{1,80}$/;

export function parseShare(search: URLSearchParams): ShareParams | null {
  const song = search.get("song") ?? "";
  if (!SONG_ID.test(song)) return null;
  const n = Number(search.get("stars"));
  const lang = search.get("lang");
  return { song, stars: n === 1 || n === 2 || n === 3 ? n : null, lang: isLang(lang) ? lang : null };
}

/** `?from=share&song=<id>` (+ stars and the sharer's language for the card). */
export function shareQuery(p: ShareParams): string {
  const q = new URLSearchParams({ from: "share", song: p.song });
  if (p.stars) q.set("stars", String(p.stars));
  if (p.lang) q.set("lang", p.lang);
  return `?${q.toString()}`;
}

/** Stars for a finished run: share of notes hit on time. */
export function starsFor(t: { spot: number; early: number; late: number; next: number; missed: number }): 1 | 2 | 3 {
  const total = t.spot + t.early + t.late + t.next + t.missed;
  if (!total) return 1;
  const good = (t.spot + 0.5 * (t.early + t.late)) / total;
  return good >= 0.8 ? 3 : good >= 0.5 ? 2 : 1;
}

export function playedLine(lang: Lang, song: string): string {
  return SHARE_COPY[lang].played.replace("{song}", song);
}
