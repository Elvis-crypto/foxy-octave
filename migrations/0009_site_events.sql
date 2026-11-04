-- Cookieless visitor stats. `visitor` is a SHA-256 of (secret salt, day, address,
-- browser) that changes every day, so nobody can be followed across days and no
-- address is kept. `src` is the ?ref= or ?from= tag (or 'direct').
create table if not exists site_events (
  id bigserial primary key,
  day date not null default current_date,
  kind text not null,            -- 'view' | 'share'
  src text not null default 'direct',
  session_start boolean not null default false,
  referrer_host text,
  song text,
  channel text,                  -- share: native | copy | whatsapp | facebook
  visitor text not null,
  created_at timestamptz not null default now()
);
create index if not exists site_events_day on site_events (day, kind, src);
create index if not exists site_events_visitor on site_events (visitor, created_at desc);
