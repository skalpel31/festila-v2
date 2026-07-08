'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function assertOwner(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: event } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', eventId)
    .single()

  if (!event || event.organizer_id !== user.id) throw new Error('Accès refusé')
  return supabase
}

export type TableShape = 'round' | 'rect'

export async function createTable(eventId: string, input: { name: string; shape: TableShape; seats: number; pos_x: number; pos_y: number }) {
  const supabase = await assertOwner(eventId)
  const { data, error } = await supabase.from('event_tables').insert({ event_id: eventId, ...input }).select().single()
  if (error) throw new Error("Erreur lors de la création de la table.")
  revalidatePath(`/dashboard/events/${eventId}/plan`)
  return data
}

export async function updateTable(eventId: string, tableId: string, input: Partial<{ name: string; shape: TableShape; seats: number; pos_x: number; pos_y: number }>) {
  const supabase = await assertOwner(eventId)
  const { error } = await supabase.from('event_tables').update(input).eq('id', tableId).eq('event_id', eventId)
  if (error) throw new Error('Erreur lors de la mise à jour de la table.')
  revalidatePath(`/dashboard/events/${eventId}/plan`)
}

export async function deleteTable(eventId: string, tableId: string) {
  const supabase = await assertOwner(eventId)
  const { error } = await supabase.from('event_tables').delete().eq('id', tableId).eq('event_id', eventId)
  if (error) throw new Error('Erreur lors de la suppression de la table.')
  revalidatePath(`/dashboard/events/${eventId}/plan`)
}

export async function assignGuestToTable(eventId: string, guestId: string, tableId: string | null) {
  const supabase = await assertOwner(eventId)
  const { error } = await supabase.from('event_guests').update({ table_id: tableId }).eq('id', guestId).eq('event_id', eventId)
  if (error) throw new Error("Erreur lors de l'assignation de l'invité.")
  revalidatePath(`/dashboard/events/${eventId}/plan`)
}
