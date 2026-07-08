-- Retour à des sièges fixes (indexés) par table plutôt qu'un positionnement
-- libre en pixels : chaque table affiche ses N places (selon sa capacité)
-- déjà positionnées, et un invité occupe un index de siège précis.
alter table public.event_guests
  drop column if exists seat_x,
  drop column if exists seat_y,
  add column if not exists seat_index int;
