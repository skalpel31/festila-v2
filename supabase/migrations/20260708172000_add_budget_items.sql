-- Budget tracking per event: line items (poste de dépense) + an overall envelope on events.

alter table public.events
  add column if not exists budget_total numeric(10,2);

create table public.budget_items (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  category          text not null,
  name              text not null,
  vendor            text,
  estimated_amount  numeric(10,2) not null default 0,
  actual_amount     numeric(10,2),
  paid_amount       numeric(10,2) not null default 0,
  due_date          date,
  notes             text,
  created_at        timestamptz not null default now()
);

create index budget_items_event_id_idx on public.budget_items(event_id);

alter table public.budget_items enable row level security;

-- Même règle que "Mes événements" : le organisateur gère librement ses propres lignes.
create policy "Mes lignes de budget" on public.budget_items
  for all
  using (
    exists (
      select 1 from public.events
      where events.id = budget_items.event_id
        and events.organizer_id = auth.uid()
    )
  );

-- Même règle que "super_admin_all_events" : lecture seule pour le super admin.
create policy "super_admin_all_budget_items" on public.budget_items
  for select
  using (
    is_super_admin() = true
    or exists (
      select 1 from public.events
      where events.id = budget_items.event_id
        and events.organizer_id = auth.uid()
    )
  );
