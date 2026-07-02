'use server'

import { redirect } from 'next/navigation'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  const { data: { user: me } } = await supabase.auth.getUser()
  if (!me) throw new Error('Non authentifié')

  const { data: meProfile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', me.id)
    .single()
  if (!meProfile?.is_super_admin) throw new Error('Accès refusé')

  if (userId === me.id) throw new Error('Impossible de supprimer votre propre compte')

  // Supprimer les données dans l'ordre (invités → événements de l'user → profil → auth)
  const { data: userEvents } = await supabase
    .from('events')
    .select('id')
    .eq('organizer_id', userId)

  if (userEvents?.length) {
    await supabase.from('event_guests').delete().in('event_id', userEvents.map(e => e.id))
    await supabase.from('events').delete().eq('organizer_id', userId)
  }

  // RSVP où l'user est invité
  await supabase.from('event_guests').delete().eq('user_id', userId)

  // Profil
  await supabase.from('profiles').delete().eq('id', userId)

  // Compte auth (nécessite service role)
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(`Erreur suppression auth: ${error.message}`)

  redirect('/admin/users')
}
