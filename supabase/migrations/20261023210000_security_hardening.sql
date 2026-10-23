-- Durcissement sécurité (audit du 2026-10-23)

-- 1. CRITIQUE : la policy "Profil perso" (ALL, auth.uid() = id) + le GRANT UPDATE par défaut
--    permettaient à n'importe quel utilisateur connecté de passer son propre
--    profiles.is_super_admin à true via l'API REST, et donc d'obtenir l'accès admin.
--    Seuls le service role / postgres peuvent désormais modifier ce flag.
create or replace function public.protect_super_admin_flag()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_super_admin := false;
    elsif new.is_super_admin is distinct from old.is_super_admin then
      raise exception 'is_super_admin ne peut pas être modifié';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_super_admin_flag on public.profiles;
create trigger protect_super_admin_flag
  before insert or update on public.profiles
  for each row execute function public.protect_super_admin_flag();


-- 2. Stockage des couvertures : tout utilisateur connecté pouvait envoyer ou supprimer
--    n'importe quel fichier du bucket (y compris les couvertures des autres).
--    Upload client (page edit) : chemin "<event_id>/<timestamp>.<ext>" → réservé à l'organisateur.
--    Les uploads via server actions passent par le service role et ne sont pas concernés.
drop policy if exists "upload event covers" on storage.objects;
create policy "upload event covers" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-covers'
    and exists (
      select 1 from public.events e
      where e.id::text = (storage.foldername(name))[1]
        and e.organizer_id = (select auth.uid())
    )
  );

drop policy if exists "delete own event covers" on storage.objects;
create policy "delete own event covers" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-covers'
    and owner_id = (select auth.uid())::text
  );


-- 3. Invités : un invité pouvait s'inscrire à n'importe quel événement (même brouillon)
--    et modifier lui-même sa table / sa place. On sépare organisateur et invité.
drop policy if exists "Invités de mes events" on public.event_guests;

create policy "Organisateur gère ses invités" on public.event_guests
  for all
  using (
    exists (
      select 1 from public.events
      where events.id = event_guests.event_id
        and events.organizer_id = (select auth.uid())
    )
  );

create policy "Invité lit sa réponse" on public.event_guests
  for select
  using ((select auth.uid()) = user_id);

create policy "Invité répond à un événement publié" on public.event_guests
  for insert
  with check (
    (select auth.uid()) = user_id
    and table_id is null
    and seat_index is null
    and exists (
      select 1 from public.events
      where events.id = event_guests.event_id
        and events.status = 'published'
    )
  );

create policy "Invité modifie sa réponse" on public.event_guests
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Invité supprime sa réponse" on public.event_guests
  for delete
  using ((select auth.uid()) = user_id);

-- Un invité ne peut pas changer d'événement ni se placer lui-même dans le plan de table.
create or replace function public.protect_guest_seating()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
     and not exists (
       select 1 from public.events
       where events.id = old.event_id and events.organizer_id = auth.uid()
     )
     and (new.event_id   is distinct from old.event_id
       or new.user_id    is distinct from old.user_id
       or new.table_id   is distinct from old.table_id
       or new.seat_index is distinct from old.seat_index)
  then
    raise exception 'Modification non autorisée';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_guest_seating on public.event_guests;
create trigger protect_guest_seating
  before update on public.event_guests
  for each row execute function public.protect_guest_seating();


-- 4. Fonctions SECURITY DEFINER : search_path figé (advisor Supabase) et
--    handle_new_user (trigger d'inscription) non appelable via /rest/v1/rpc.
alter function public.is_super_admin() set search_path = public;
alter function public.handle_new_user() set search_path = public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
