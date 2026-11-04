-- Song requests from the app. Never shown publicly; read them with SQL (see README).
create table if not exists song_requests (
  id text primary key,
  title text not null,
  note text,
  contact text,
  ui_lang text,
  client_key text,
  created_at timestamptz not null default now()
);
create index if not exists song_requests_client_recent on song_requests (client_key, created_at desc);
create index if not exists song_requests_created_at on song_requests (created_at desc);
