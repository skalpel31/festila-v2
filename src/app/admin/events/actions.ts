'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: p } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single()
  if (!p?.is_super_admin) throw new Error('Accès refusé')

  await supabase.from('event_guests').delete().eq('event_id', eventId)
  await supabase.from('events').delete().eq('id', eventId)
  redirect('/admin/events')
}
