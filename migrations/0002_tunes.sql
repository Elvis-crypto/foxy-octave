create table if not exists tunes (
  user_id text not null,
  id text not null,
  title text not null,
  bpm integer not null,
  lines jsonb not null,
  wide jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
