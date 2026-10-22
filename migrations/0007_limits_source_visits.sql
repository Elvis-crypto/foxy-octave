-- Rate limits read these: a daily-rotating hash of the caller, never the address itself.
alter table reports add column if not exists client_key text;
alter table captures add column if not exists client_key text;
-- The reference line of a captured sheet (named `source`, as on tunes).
alter table captures add column if not exists source text;
create index if not exists reports_client_recent on reports (client_key, created_at desc);
create index if not exists captures_client_recent on captures (client_key, created_at desc);
create index if not exists captures_created_at on captures (created_at desc);
-- Partner visits (?from=tag): one counter per tag per day. No visitor data.
create table if not exists partner_visits (
  tag text not null,
  day date not null default current_date,
  visits integer not null default 0,
  primary key (tag, day)
);
