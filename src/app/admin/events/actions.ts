'use server'

import { redirect } from 'next/navigation'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: p } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single()
  if (!p?.is_super_admin) throw new Error('Accès refusé')

  const admin = createAdminClient()
  await admin.from('event_guests').delete().eq('event_id', eventId)
  await admin.from('events').delete().eq('id', eventId)
  redirect('/admin/events')
}
