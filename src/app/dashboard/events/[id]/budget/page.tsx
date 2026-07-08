import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BudgetManager from '@/components/dashboard/BudgetManager'

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select('id, title, budget_total, organizer_id')
    .eq('id', id)
    .single()

  if (!event || event.organizer_id !== user?.id) notFound()

  const { data: items } = await supabase
    .from('budget_items')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: true })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12, color: '#9B8E7E', textDecoration: 'none', letterSpacing: '0.05em' }}>← {event.title}</Link>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 400, color: '#1A1208', marginTop: 8 }}>
          Budget
        </h1>
      </div>

      <BudgetManager eventId={id} budgetTotal={event.budget_total} items={items ?? []} />
    </div>
  )
}
