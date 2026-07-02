import { createClient }    from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import HeroEditor from './HeroEditor'

export default async function HeroEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('id, title, slug, cover_image, event_date, event_time, location, event_type, status, hero_config, organizer_id')
    .eq('id', id)
    .single()

  if (!event || event.organizer_id !== user.id) notFound()

  return <HeroEditor event={event} />
}
