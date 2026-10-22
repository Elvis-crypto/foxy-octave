# Features to build

Implementation list for the reach note. Build in this order: songs a teacher can trust, then the options sheet and a larger instrument, then a quiet capture of new tunes, then Support inside that sheet.

Do not name a shop, a SKU, or a brand in the interface.

The listen / your-turn ear misses notes on a normal phone. Do not use it to decide whether a child finished a song, and do not build a counter on top of it. Finishing a song is watched by a person. The ear can be improved later for the player. It is not part of this list.

## 1. Finish the starter book

The boxed songs are one verse or one short lyric. Several Hungarian ones have more verses that óvodas sing. Search is also told to stop at one short verse under 80 notes (`lookup.ts`), so a found tune arrives incomplete on purpose.

Out of the box, complete the verses for the songs already shipped, after checking the melody the same way as last time (open transcription, then fold). Do not invent a second half.

Priority, because these are the ones a teacher will ask for by name:

- Boci, boci tarka
- Süss fel, nap
- Tavaszi szél vizet áraszt
- Kis kacsa fürdik
- Érik a szőlő

Then the English ones that are cut short: Mary Had a Little Lamb, London Bridge, Baa Baa Black Sheep, Itsy Bitsy Spider.

Add more traditional public-domain songs only after each melody is checked against an open source. Candidates, not a promise: Hej, Dunáról fúj a szél; Hüvelykujjam; Ciróka, ciróka; A part alatt; Hopp, Juliska; Ez ki háza, ki háza. If a melody cannot be verified, leave it out. A wrong tune is worse than a short list.

Keep the lyric line in time with the notes, one verse after another, not a single line repeated.

## 2. Search that can find a real sheet

Today a lookup is one model call with web search, paid sheet sites excluded, and the prompt demands a single short verse. That is why known public-domain songs come back missing or not at all.

Change the lookup in this order:

- If the typed name matches a starter song, open that song. Do not call the model.
- If it matches a title you have already verified and stored, open that.
- Only then search. Ask for the full traditional verse set that is public domain, still one voice, still no chords, still refuse copyrighted tunes. Raise the note cap enough for several verses, and keep the refusal when the tune is not public domain or no open melody exists.
- Prefer an open transcription you can name (a public archive or a Wikipedia/LilyPond-style source) over a guessed melody. If the model cannot point at one, return not-found rather than a made-up tune.

The folded result still follows whatever instrument size is selected (section 4).

A search that fails still counts as a song someone asked for. Keep the typed title (section 3).

## 3. Quiet song bank

Songs people add or that search returns currently stay in that browser only (`localStorage`). You never see them.

Keep a private copy of every accepted tune: title, ABC, tempo, language, and whether it was typed or found. Also keep a typed title when the search fails and there is no ABC yet. No account, no child audio, no name of the visitor.

- On this device, keep doing what save already does.
- Also append the same fields to a private list you can export. Other visitors do not see that list and do not see each other's tunes in the picker.
- You review a tune before it can become a starter song. Captured does not mean published.
- A classroom visit does not need this to be visible. Capture can run without a control on screen.
- Do not store microphone audio. The bank is sheet text.

If there is no server to append to, the phone you own can still download what was typed on that phone. Other people's searches will not appear until a server exists. Do not pretend they sync before that.

A free server, when you are ready, is the Postgres this app already knows how to run. Do not add a second host, and do not use a public Google Sheet. See section 8. Do not run this on a computer in the house.

## 4. Options, and a larger xylophone

One Options button. It opens one sheet and closes again. This sheet is the only adult panel. There is no second parent page.

First item: instrument size.

- Eight bars remains the default. Same letters, same colors, same C-to-C fold as now (`BARS`, `placeMelody`, `foldEvents`).
- A larger size adds the next diatonic notes above high C, a second octave of the same letters, drawn as a lighter shade of the same paints so it does not imitate a particular toy. Fit the bars on the phone by making them narrower before you add horizontal scrolling.
- Folding follows the size. A note that already lands on the selected bars stays there. A note outside them still folds in by the smallest leap, inside the selected range only. Transpose-to-C stays.
- The keyboard and the on-screen letters cover every bar of the selected size.
- Your-turn tuning is built for eight strikes. On the larger size, keep scoring on the original eight until tuning knows the extra bars. Do not pretend the extra bars are calibrated.
- Remember the choice on the device, next to the other saved settings.

Second item on the same sheet, hidden until it is asked for: a fox with a heart, and next to it the sentence that the songs stay free and this treats the fox. Tapping the fox reveals Support (section 5). The amounts are not visible before that tap. Language stays in the header. The sheet is not shown while notes are falling, and it is not open when the page first loads.

## 5. Tip jar

A parent who has decided to pay should not have to hunt, make an account, or type an amount. A child who is playing should not see it at all.

Placement: behind the fox inside Options. The fox and the sentence sit on the sheet. The amounts appear only after the fox is tapped. Nowhere on the playing view, the browse list, or the first screen. No crypto mark on the xylophone.

The payment buttons are dummies until a hosted checkout and an address exist. A tap tells the adult it is not open yet. It must not open a bank, copy an address, or send anyone anywhere. When it goes live, replace the dummy action and hide the fox if the link or the address is missing.

Once they open Support, traditional payment first:

- Preset amounts (a small one, a middle one, a larger one). One tap opens a hosted checkout already in your name. Do not build card fields. A payment link from a normal processor or a bank payment page is enough. The app does not see the card and does not store a payer.
- Crypto is the second choice, not a row of coins beside the amounts. One chain, one address. One tap copies the address and the amount, or opens a payment link the wallet already understands. Show the address in short with a way to check the full string before sending. You hold the keys. The app does not custody and does not connect a wallet session in this version.

After a tap, say that the thank-you happens in the wallet or the bank, and that the songs stay free either way. No receipt inside the app.

If the hosted link or an address is not configured, hide Support.

If the page was opened with a partner tag on the link (`?from=` and a short name), hide Support for that visit. Ordinary visits still see it. The tag is only so you can count openings from a QR later. Do not store who the visitor is.

## 8. Keep an edited song, quietly

Built. The thirty-one starter songs stay in `repertoire.ts`. An edit, a new song, or a sheet accepted from search is still kept on the phone first. If the words or the notes are actually different, a copy is stored either way, signed in or not. The same sheet is not stored twice. Options has the account row. A bubble points there once, after that new save, and remembers being closed. Signing in also keeps the tunes under the account and brings them back down onto another phone.

## Done when

- A teacher can open Boci, Süss fel, and Tavaszi szél and hear the verses they know, with no jar on screen.
- Search finds a known public-domain song that is not in the starter list, with more than a fragment, or it says it cannot.
- A title typed into search, found or not, shows up in the private export.
- Options switches to the larger instrument and a melody that used to fold now stays up on the extra bars when it fits.
- From Options, the fox reveals three amounts and crypto. Each tap says the jar is not open yet: it does not open a bank, copy an address, or leave the page. None of it shows while the notes are falling, or when the link has a partner tag. Live checkout replaces that message later.
