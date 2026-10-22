create table if not exists captures (
  id text primary key,
  tune_id text not null,
  title text not null,
  bpm integer not null,
  lines jsonb not null,
  wide jsonb,
  created_at timestamptz not null default now()
);
