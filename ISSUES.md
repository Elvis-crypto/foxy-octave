# Foxy Octave — current issues and concerns

This is the state of the kindergarten xylophone as of 22 October 2026. It is a phone-first page: eight or fifteen colored bars, a falling chart, a syllable dot, a small song book in Hungarian, English, French, German, Spanish, Danish, and one Scots tune, plus optional sign-in, bug notes, and a tip jar that stays behind an adult menu. Songs are free.

The list below is what is still wrong, fragile, or unfinished. It is not a changelog of what already works.

## 1. A public web address is not the same as this preview

The preview you have been using runs a development server with an in-memory database (PGLite) inside that one process. A Vercel deploy is different.

- **The instrument does not need a database.** The song book, the audio, the chart, and songs saved on the phone all live in the browser. That part can run on Vercel with nothing else configured.
- **Accounts, bug reports, and the quiet copy of new tunes do need Postgres.** Set `DATABASE_URL` on the Vercel project (a Neon pooled URL is what the migrator expects). `npm run build` applies `migrations/*.sql` when that variable is present, and skips it when it is absent. If the variable is set but the database cannot be reached from the build, the deploy fails.
- **Do not expect PGLite on Vercel.** The production bundle does not include `pglite.wasm` or `pglite.data` (about 16 MB together). Opening that fallback used to crash the production server. Production now refuses the embedded database instead of crashing, and answers `DATABASE_URL is not set` if a server call needs it. Even if the files were bundled, a serverless instance forgets memory on the next cold start, so reports would not stick.
- **Sign-in will not complete on a plain `*.vercel.app` host until the auth broker knows that host.** Sign-in goes through the Grok auth broker (`GROK_AUTH_ISSUER`, default `https://auth.grok.me`), not through Google directly. The deployer normally injects `GROK_AUTH_CLIENT_ID`, `GROK_AUTH_CLIENT_SECRET`, `BETTER_AUTH_URL`, and `BETTER_AUTH_SECRET`. Without those, the server falls back to a preview client that only accepts callbacks on `*.grok-sandbox.com`. A visitor on the public site can still play. The account button will not bring their tunes across phones until those variables exist and the broker allows the new origin.
- **`VITE_AUTH_ENABLED` is not "off" when it is missing.** It is off only when the value is the string `false`. A raw Vercel build therefore leaves sign-in switched on, aimed at the preview client. Set `VITE_AUTH_ENABLED=false` if this deploy should not offer accounts yet, or set the real broker client and `BETTER_AUTH_URL` to the public `https://…` origin if it should.
- **“Find a song” needs `XAI_API_KEY` on the server.** With no key, the search tells the visitor that lookup is off. The key must never be a `VITE_` variable.
- **Build install omits devDependencies.** Lint and Playwright are dev-only. The Vite, TanStack, Tailwind, and Nitro packages that the build actually imports are in `dependencies`, which is what Vercel needs. Do not move them back to devDependencies.
- **TanStack Start must stay on 1.168.60 or newer.** Older releases are refused by Vercel (CVE-2026-102989). Do not pin an older one.
- **There was no git repository and no `.gitignore`.** `node_modules`, `.output`, `.vercel`, screenshots, and the sandbox-only `.grok` folder must not be committed. `.grok/app-env.json` is optional; the build treats a missing file as “no extra flags”.

### Preview OAuth secret

`src/lib/auth/preview.ts` contains a live preview OAuth client id and secret so this sandbox can sign in without injected credentials. It is limited to `*.grok-sandbox.com` callbacks, but it is still a credential. A public GitHub repository publishes it. Rotate that preview client at the broker if the repository is public and you do not want the value in git history.

Payment addresses in the client are receive addresses. They are meant to be visible. There is no payer data and no private key in the app.

## 2. What is stored, and what is easy to get wrong

Phone storage is the key `little-octave.v1`.

- **A shipped song that was saved on the phone is thrown away when the book changes**, unless that save carries the current core stamp. That is deliberate: an old Boci without lyrics must not hide the fixed one. Songs the person added (`saved-…` ids) stay. An edit of a shipped song stays only while its stamp matches this version of the book.
- **The reference (source line) is editable.** An empty string means the person cleared it, and must not be filled back in from the book. A missing value means it was never set. On the server the column is named `source` because `FROM` is reserved SQL (`migrations/0006_tune_source.sql`). A database that has not run that migration will reject a signed-in save.
- **The quiet capture of a new sheet does not store the reference.** The capture hash is title, words, and notes only. Changing only the citation does not create a new captured row, and the captures table has no source column. Reference-only corrections are invisible there.
- **Bug reports are an open insert.** No account, no email, no IP address, three to eight hundred characters, plus the song id, title, language, and eight-or-fifteen size. There is no page that lists them. Read the `reports` table. There is also no rate limit, so the table can be filled with junk.
- **Captures are the same shape of risk:** anyone who can call the server can insert a sheet. There is no list in the app. That is intentional, but it is not moderated.
- **Microphone audio is not stored.** The ear listens live and drops the buffer.
- **A partner visit (`?from=` plus a short name) hides the tip jar for that visit only.** The tag is not written down, so it cannot be counted later. That counting was the reason the tag exists, and it is not built.
- **Do not put a personal email address in the page.**

## 3. The music

- **There is no B-flat.** In a Hungarian score, B often means B-flat and H means the note this toy calls B. The English letter B is that H. Striking A and H together is two notes, not a pitch between them. Songs that need B-flat are folded onto the nearest bar this toy has, which can be the wrong note.
- **Eight bars and fifteen bars are different rules, on purpose.** Eight bars: the smaller leap onto C4–C5. Fifteen bars: a written pitch stays when that bar exists, upper octave included. For songs added in the generator, the fifteen-bar line is the fitted original, and only the eight-bar line is folded afterwards. Do not run the eight-bar rule over the fifteen-bar sheet, and do not regenerate the older songs. Some of those older folds are still being corrected by hand. A wrong automatic pass would overwrite that work.
- **Extra syllables split a note in half.** If a verse has more syllables than sounding notes, the extras are spread across the line (Bresenham) and each extra syllable cuts that note into two equal halves. It is a fit so the dot can land, not a checked edition. A short pick-up or a held note can be cut in a place a singer would not choose. Some lines in the added book were lengthened so the split stays one extra, not three.
- **The syllable splitter is one general rule, not a table per song.** Hungarian digraphs (cs, gy, ny, sz, ty, zs, dz, dzs, ly), French “qu” as one consonant, and a short list of diphthongs are special-cased. It will still mis-count a name, an elision, or a compound. When there are fewer syllables than notes, the leftovers are placed by time, with the first and last syllable pinned to the first and last note. That mapping can sit on the wrong note in the middle of a line.
- **A silence is the letter `z`.** `z` is one beat, `z/` is half, `z2` is two. The Silence button inserts it at the cursor. A line may be only silence. A whole song of only silence is refused. Playback waits through the rest, including a rest after the last sounding note. Opening a shipped song into the editor rebuilds the line from the notes that sound, so a trailing rest that was never saved as text is not there until someone writes it. A saved line of `z` is kept, because the editor stores the text, not only the sounding notes.
- **The default bar order is low C on the left.** Flip turns it back to high C on the left. The saved flag still means “opposite of the factory order”. Anyone who had already turned Flip on, back when the factory order was high-on-the-left, now sees the old layout and has to tap Flip once to match the new default.
- **Your-turn scoring only knows the original eight bars.** On the fifteen-bar instrument the extra notes are not part of the tuning drill. The microphone path misses notes on an ordinary phone in an ordinary room. A score is not evidence that a child finished the song. A person has to watch that.
- **Search is one model call with web search, capped near eighty notes, and it can be wrong.** Paid sheet shops are excluded. The instruction is to refuse copyright and to refuse when no open melody exists. The model can still invent a tune, drop verses, or fold a note onto the wrong octave. A typed title that matches a song already in the book should open that song and not call the model; confirm that path before trusting a search result. A failed search is supposed to be remembered as a title someone asked for. That memory is the capture path, which needs the database.
- **The added songs are traditional melodies fitted onto this toy, not a critical edition.** French, German, Spanish, and Danish were brought up to ten each, plus Old MacDonald, on top of the original book. A teacher who knows the song may still disagree with a rhythm or a second verse. Those disagreements belong in the editor and in the bug notes, not in a fresh automatic rewrite of the whole book.
- **Scots is a filter for songs, not a language of the screen.** The interface is Magyar, English, Français, Deutsch, Español, and Dansk.
- **Untagged songs sit at the end of the list.** The order is: the language of the screen, then English (unless the screen is already English), then the other languages in chip order, alphabetical inside each language. A song someone created without a language tag does not join a group.

## 4. Accounts and two phones

- Sign-in is optional. A new or edited song is kept on the phone first. If the words, the notes, the title, or the reference actually changed, a copy is offered to the capture store either way, signed in or not.
- The same sheet is not stored twice. The capture id is a hash of the words and notes, so a second save of the same sheet does nothing.
- Signed in, the phone copy and the account copy are merged by time. A phone tune with no timestamp is uploaded. A newer timestamp wins.
- A remote copy of a shipped song whose stamp does not match the current book is deleted from the account on sync, so a stale Boci cannot come back down.
- The “sign in to keep this” bubble shows once after a new save and remembers being closed.
- None of the above crosses phones until sign-in works on that host and `DATABASE_URL` is set. See section 1.

## 5. The tip jar

- The jar is behind the fox, inside Options. Amounts stay hidden until that tap. Nothing about money is on the playing screen. A `?from=` visit hides the whole thing.
- Card amounts are hosted Stripe checkouts: 500 Ft, 1 500 Ft, and 4 000 Ft. The app does not see the card and does not know whether the payment finished. The line after a tap only says the thank-you is on the bank’s page.
- Crypto is a second step: one network at a time (EVM, Solana, Bitcoin, or a taproot address), the full address visible, one tap to copy. The app does not open a wallet session, does not choose a coin for the visitor, and does not see the transfer.
- If a link or an address were removed, the jar should hide. Today the addresses and links are written in the client, so the jar shows.

## 6. The screen

- The layout is a phone column. A wide window does not grow into a desktop instrument; it stays narrow.
- The language control is one native menu, not six pills, because six pills do not fit.
- The bug button’s explanation is a hover tip. A finger on a phone never hovers. The accessible name is the same sentence, so a screen reader gets it, but a sighted tap does not see the hint before the sheet opens. The sheet itself says what to write.
- The syllable dot has been sensitive to layout: the first syllable of a line must bounce, the arc must stay inside the stage, and the stage must shrink a little while the dot is on so the title bar does not cover the arc. Those timings are general, but they still depend on measuring the line after paint. A font that loads late can move the dot once.
- Options open and close over about four tenths of a second. The sheet is not open on first load, and it is not the place for language.
- Chart-only mode keeps the chart moving and does not strike the bars.
- Four chimes (wood, bell, glass, metal) stay in a two-by-two grid.
- Dark and light are stored on the phone. The first paint reads that value before React, so the background should not flash the wrong theme. If that script is blocked, the flash can return.
- The typefaces come from Google Fonts. If that host is blocked, the browser falls back and the dot’s measurements change.
- This page is not an offline app we control. After it has loaded, the notes are generated on the phone and the book is in the script. A cold open with no network can fail before any of that runs. There is no service worker of ours beyond whatever the hosting platform injects.

## 7. Tests and the production build

- `library.test.ts` and `score.test.ts` cover folds, syllable splits, rests, language order, and the rule that new songs fold eight bars only after the fifteen-bar line. They do not import the server modules (`reports.ts`, `cloud.ts`): a Node test cannot resolve the `@/` alias, and pulling those files in fails the run.
- The dev server is what the preview shows. A production preview used to die while opening PGLite (`pglite.data`, then `pglite.wasm` missing from the Nitro output). Production now skips that open. Confirm a production boot after this change before trusting a deploy.
- There is no automated test for Stripe, crypto copy, sign-in, or the bug-report insert.

## 8. What this deploy still will not do until someone configures it

| Need | Without configuration |
|---|---|
| Play a shipped song, flip the bars, follow syllables, edit a sheet on this phone | Works |
| Keep a song on this phone across refreshes | Works (`localStorage`) |
| Bug reports that can be read later | Needs `DATABASE_URL` and migration `0005` |
| Citation stored on the account | Needs `DATABASE_URL` and migration `0006` |
| The same songs on a second phone | Needs sign-in env from section 1, plus `DATABASE_URL` |
| Search for a song that is not in the book | Needs `XAI_API_KEY` |
| A page that lists bug reports | Not built. The table is the list |

## 9. Do not “fix” these by accident

- Do not regenerate eight-bar and fifteen-bar lines for songs already in the original book.
- Do not special-case syllable splits per song title.
- Do not drop a person’s own songs when the shipped book changes.
- Do not put an email address on the page.
- Do not charge for a song, and do not show the jar on the playing screen.
- Do not downgrade TanStack Start below 1.168.60.
- Do not treat a microphone score as a finished song.
