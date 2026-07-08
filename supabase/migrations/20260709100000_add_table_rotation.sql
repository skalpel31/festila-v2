alter table public.event_tables
  add column if not exists rotation numeric not null default 0;
