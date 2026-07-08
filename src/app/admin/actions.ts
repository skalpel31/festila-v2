'use server'

import { redirect } from 'next/navigation'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: p } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single()
  if (!p?.is_super_admin) throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

export async function deleteEvent(eventId: string) {
  await assertSuperAdmin()
  const admin = createAdminClient()
  await admin.from('event_guests').delete().eq('event_id', eventId)
  await admin.from('events').delete().eq('id', eventId)
  redirect('/admin')
}

export async function deleteUser(userId: string) {
  const { userId: meId } = await assertSuperAdmin()
  if (userId === meId) throw new Error('Impossible de supprimer votre propre compte')

  const admin = createAdminClient()

  const { data: userEvents } = await admin.from('events').select('id').eq('organizer_id', userId)
  if (userEvents?.length) {
    await admin.from('event_guests').delete().in('event_id', userEvents.map(e => e.id))
    await admin.from('events').delete().eq('organizer_id', userId)
  }
  await admin.from('event_guests').delete().eq('user_id', userId)
  await admin.from('profiles').delete().eq('id', userId)

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(`Erreur suppression auth: ${error.message}`)

  redirect('/admin')
}
