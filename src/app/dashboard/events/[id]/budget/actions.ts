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

export async function upsertBudgetTotal(eventId: string, budgetTotal: number | null) {
  const supabase = await assertOwner(eventId)
  const { error } = await supabase
    .from('events')
    .update({ budget_total: budgetTotal })
    .eq('id', eventId)
    .eq('organizer_id', (await supabase.auth.getUser()).data.user!.id)

  if (error) throw new Error('Erreur lors de la sauvegarde du budget.')
  revalidatePath(`/dashboard/events/${eventId}/budget`)
}

export type BudgetItemInput = {
  category: string
  name: string
  vendor: string | null
  estimated_amount: number
  actual_amount: number | null
  paid_amount: number
  due_date: string | null
  notes: string | null
}

export async function createBudgetItem(eventId: string, input: BudgetItemInput) {
  const supabase = await assertOwner(eventId)
  const { error } = await supabase.from('budget_items').insert({ event_id: eventId, ...input })
  if (error) throw new Error("Erreur lors de l'ajout de la ligne.")
  revalidatePath(`/dashboard/events/${eventId}/budget`)
}

export async function updateBudgetItem(eventId: string, itemId: string, input: BudgetItemInput) {
  const supabase = await assertOwner(eventId)
  const { error } = await supabase.from('budget_items').update(input).eq('id', itemId).eq('event_id', eventId)
  if (error) throw new Error('Erreur lors de la mise à jour.')
  revalidatePath(`/dashboard/events/${eventId}/budget`)
}

export async function deleteBudgetItem(eventId: string, itemId: string) {
  const supabase = await assertOwner(eventId)
  const { error } = await supabase.from('budget_items').delete().eq('id', itemId).eq('event_id', eventId)
  if (error) throw new Error('Erreur lors de la suppression.')
  revalidatePath(`/dashboard/events/${eventId}/budget`)
}
