# Foxy Octave

A fox xylophone trainer for kids — https://foxy-octave.vercel.app

## Share links

`/?from=share&song=<id>&stars=<1-3>&lang=<hu|en|fr|de|es|da>` opens that song, and its
server-rendered `og:image` is `/api/og/share?song=<id>&stars=<n>&lang=<lang>` — a
"we played <song>" card (never about the child). Code: `src/lib/xylophone/share.ts`,
`share-card.server.ts`, `server/share-meta.ts`. Regenerate baked fonts/fox with
`node scripts/build-share-assets.mjs`.

Donations on `?from=` links: hiding them is suspended via `HIDE_TIPS_ON_FROM = false`
in `src/components/xylophone/app.tsx` — set it to `true` to restore.

## Reading song requests

Requests are stored in `song_requests` (migration 0008) and never shown in the app.
Run in the Neon SQL editor (the database behind `DATABASE_URL`):

```sql
select created_at at time zone 'Europe/Budapest' as at, title, note, contact, ui_lang
from song_requests
order by created_at desc
limit 100;

-- Most requested titles
select lower(title) as title, count(*) from song_requests group by 1 order by 2 desc;
```

Rate limit: 5 per caller per 30 min, 200 per hour overall (`SONG_REQUEST_LIMIT`).
