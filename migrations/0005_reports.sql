create table if not exists reports (
  id text primary key,
  body text not null,
  song_id text,
  song_title text,
  ui_lang text,
  span integer,
  created_at timestamptz not null default now()
);

create index if not exists reports_created_at on reports (created_at desc);
