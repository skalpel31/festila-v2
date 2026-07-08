-- Position libre de l'invité autour de sa table (repère local, non tourné —
-- la rotation de la table s'applique visuellement via le transform CSS du parent).
alter table public.event_guests
  add column if not exists seat_x numeric,
  add column if not exists seat_y numeric;
