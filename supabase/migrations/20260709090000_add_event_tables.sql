-- Plan de table : tables positionnées librement sur un plan visuel,
-- invités assignés par table (pas de siège individuel).

create table public.event_tables (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  shape       text not null default 'round' check (shape in ('round', 'rect')),
  seats       int not null default 8,
  pos_x       numeric not null default 50,
  pos_y       numeric not null default 50,
  created_at  timestamptz not null default now()
);

create index event_tables_event_id_idx on public.event_tables(event_id);

alter table public.event_tables enable row level security;

create policy "Mes tables" on public.event_tables
  for all
  using (
    exists (
      select 1 from public.events
      where events.id = event_tables.event_id
        and events.organizer_id = auth.uid()
    )
  );

create policy "super_admin_all_event_tables" on public.event_tables
  for select
  using (
    is_super_admin() = true
    or exists (
      select 1 from public.events
      where events.id = event_tables.event_id
        and events.organizer_id = auth.uid()
    )
  );

alter table public.event_guests
  add column if not exists table_id uuid references public.event_tables(id) on delete set null;
