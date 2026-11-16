-- Additive: song start/finish reuse site_events; path is for page-hit views.
-- Preview deploys may run this against production, so this file only adds.
alter table site_events add column if not exists path text;
create index if not exists site_events_path on site_events (day, kind, path);
create index if not exists site_events_song on site_events (day, kind, song);
