import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SeatingPlanner from '@/components/dashboard/SeatingPlanner'

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .eq('id', id)
    .single()

  if (!event || event.organizer_id !== user?.id) notFound()

  const [{ data: tables }, { data: guests }] = await Promise.all([
    supabase.from('event_tables').select('*').eq('event_id', id).order('created_at', { ascending: true }),
    supabase.from('event_guests').select('id, first_name, last_name, group_size, status, table_id').eq('event_id', id).order('created_at', { ascending: true }),
  ])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12, color: '#9B8E7E', textDecoration: 'none', letterSpacing: '0.05em' }}>← {event.title}</Link>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 400, color: '#1A1208', marginTop: 8 }}>
          Plan de table
        </h1>
      </div>

      <SeatingPlanner eventId={id} tables={tables ?? []} guests={guests ?? []} />
    </div>
  )
}
