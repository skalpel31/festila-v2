'use server'

import { revalidatePath } from 'next/cache'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { HeroConfig }   from '@/lib/hero-config'

export async function uploadCoverImage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const file    = formData.get('file')    as File
  const eventId = formData.get('eventId') as string
  if (!file || file.size === 0) throw new Error('Aucun fichier sélectionné')
  if (file.size > 10 * 1024 * 1024)      throw new Error('Fichier trop lourd (max 10 MB)')

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) throw new Error('Format non accepté (JPG, PNG ou WEBP uniquement)')

  // Vérifier que l'utilisateur est propriétaire de l'événement
  const { data: event } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', eventId)
    .single()
  if (!event || event.organizer_id !== user.id) throw new Error('Non autorisé')

  const admin = createAdminClient()
  const ext   = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const path  = `${user.id}/${eventId}/${Date.now()}.${ext}`

  // Créer le bucket s'il n'existe pas encore (ignoré si déjà présent)
  await admin.storage.createBucket('event-covers', { public: true }).catch(() => {})

  const bytes = await file.arrayBuffer()
  const { error } = await admin.storage
    .from('event-covers')
    .upload(path, bytes, { contentType: file.type, upsert: true })
  if (error) throw new Error('Erreur lors de l\'upload : ' + error.message)

  const { data: { publicUrl } } = admin.storage.from('event-covers').getPublicUrl(path)

  await admin.from('events').update({ cover_image: publicUrl }).eq('id', eventId)

  revalidatePath(`/dashboard`)
  revalidatePath(`/dashboard/events/${eventId}`)

  return { url: publicUrl }
}

export async function uploadMobileCoverImage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const file    = formData.get('file')    as File
  const eventId = formData.get('eventId') as string
  if (!file || file.size === 0) throw new Error('Aucun fichier sélectionné')
  if (file.size > 10 * 1024 * 1024)      throw new Error('Fichier trop lourd (max 10 MB)')

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) throw new Error('Format non accepté (JPG, PNG ou WEBP uniquement)')

  const { data: event } = await supabase
    .from('events').select('id, organizer_id').eq('id', eventId).single()
  if (!event || event.organizer_id !== user.id) throw new Error('Non autorisé')

  const admin = createAdminClient()
  const ext   = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const path  = `mobile/${user.id}/${eventId}/${Date.now()}.${ext}`

  await admin.storage.createBucket('event-covers', { public: true }).catch(() => {})

  const bytes = await file.arrayBuffer()
  const { error } = await admin.storage
    .from('event-covers')
    .upload(path, bytes, { contentType: file.type, upsert: true })
  if (error) throw new Error('Erreur lors de l\'upload : ' + error.message)

  const { data: { publicUrl } } = admin.storage.from('event-covers').getPublicUrl(path)

  await admin.from('events').update({ cover_image_mobile: publicUrl }).eq('id', eventId)

  revalidatePath(`/dashboard`)
  revalidatePath(`/dashboard/events/${eventId}`)

  return { url: publicUrl }
}

export async function saveHeroConfig(eventId: string, config: HeroConfig) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: event } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single()
  if (!event || event.organizer_id !== user.id) throw new Error('Non autorisé')

  const admin = createAdminClient()
  const { error } = await admin
    .from('events')
    .update({ hero_config: config })
    .eq('id', eventId)

  if (error) throw new Error('Erreur sauvegarde : ' + error.message)

  revalidatePath(`/dashboard`)
  revalidatePath(`/e`)
}
