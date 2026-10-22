# Project Xylophone

Status: version 2 is playable. Timing windows below are a starting point until a phone session against this fox.

The app opens in Hungarian when the viewer's address is in Hungary, and in English otherwise. A language already chosen on the phone, or the lo-lang cookie, wins over the address.

App name: **Foxy Octave** (Rókás oktáv). Phone-first, also usable on a computer. No accounts. Added tunes stay in the browser on that device.

## The instrument

Eight bars, fox standing: short pale C at the top, long slate C at the bottom.

| Lane | Bar | Role | Color |
|---|---|---|---|
| 1 | C | high, shortest | pale lemon `#E4DFA8` |
| 2 | B | | butter yellow `#E6C85A` |
| 3 | A | | orange `#E07A28` |
| 4 | G | | red `#E14B42` |
| 5 | F | | dusty rose `#C9A39C` |
| 6 | E | | pale sage `#C5C9A8` |
| 7 | D | | mint `#6FB56A` |
| 8 | C | low, longest | slate `#8B97A3` |

On screen, lanes run left to right in that order. Flip swaps them. Computer keys A S D F G H J K follow the lanes left to right. Space starts and pauses Listen.

## How a song becomes these eight bars

1. If the tune is diatonic in another major key, transpose it into C major.
2. Fold every note by octaves onto these eight bars.
3. The two C's are chosen by the smallest leap from the previous note.
4. A sharp or flat snaps to the nearest bar.

Paste format: letters A–G, spaces between notes. `G2` is a longer note, `C/2` is shorter, lowercase `c` is the high C. A loose ABC fragment is accepted (`K:`, `L:`, bar lines).

## Done

- Falling chart in the bar colors, letters on the lanes, hit line, mallet playback.
- Tempo, four-beat count-in, pause, resume, stop.
- Listen plays the song. Tapping a bar, or the computer keys, only makes that sound. Scoring is Your turn, not Listen.
- Nine built-in rhymes, with the current line of words under the chart: Twinkle, Mary Had a Little Lamb, Hot Cross Buns, Frère Jacques, Row Your Boat, London Bridge, Baa Baa Black Sheep, Rain Rain Go Away, Itsy Bitsy Spider.
- Flip, mute, and the last tune are remembered on the device.
- Add a tune by pasting notes. Kept in the browser. Empty, unreadable, or oversized pastes are refused.
- The app opens from the viewer's address: Hungary in Hungarian, anywhere else in English. Magyar and English still switch the words, and that choice stays on the phone.
- Your turn listens on the microphone. The first time, each bar is struck once so the app learns this toy. Then the chart falls in silence.
- Four separate calls, never folded into one word: spot on, early, late, next door. A neighbor is next door even if it was also early or late. Farther misses get no callout.
- Spot on is the right bar within 160 ms. Early and late are that bar from 160 ms out to 420 ms. Next door is a neighbor inside 420 ms.
- Callouts wait 0.9 s between them. A run of spot-on calls is said once. The end-of-song score always shows all four, plus missed notes.
- Five Hungarian rhymes lead the list: Boci, boci tarka, Kis kacsa fürdik, Süss fel, nap, Tavaszi szél, Érik a szőlő. The English rhymes are still there.
- Songs are a vertical list you can scroll, not a sideways strip. The current one is filled in.

## Not done

Nothing waiting. Edited songs stay on the phone until the person signs in under Options.

## Milestones

1. Chart. Done.
2. Library, words, flip, tap or key. Done.
3. Paste a melody and keep it. Done.
4. Title requests. Done. A name we already have opens. Any other name can look up an open public-domain sheet, which is folded into C and kept. Copyrighted songs are refused.
5. Listen and score. Done. Hungary or not decides the first language. Your turn learns the eight bars, then calls spot on, early, late, and next door separately.