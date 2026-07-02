import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EventRow from '@/components/admin/EventRow'

const C = {
  card:   'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  text:   '#FAF7F3',
  muted:  'rgba(250,247,243,0.4)',
  or:     '#D4A373',
  green:  '#2D8653',
  red:    '#C0392B',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Brouillon', color: 'rgba(250,247,243,0.4)',  bg: 'rgba(255,255,255,0.05)' },
  published: { label: 'Publié',    color: '#2D8653',                bg: 'rgba(45,134,83,0.12)'   },
  closed:    { label: 'Terminé',   color: '#C0392B',                bg: 'rgba(192,57,43,0.12)'   },
}

const FILTERS = [
  { value: '',          label: 'Tous'       },
  { value: 'published', label: 'Publiés'    },
  { value: 'draft',     label: 'Brouillons' },
  { value: 'closed',    label: 'Terminés'   },
]

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  const query = supabase
    .from('events')
    .select('id, title, slug, status, event_date, event_type, organizer_id, created_at, profiles(first_name, last_name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query.eq('status', status)

  const [
    { data: events, count: totalFiltered },
    { data: allEvents },
    { data: guests },
  ] = await Promise.all([
    query,
    supabase.from('events').select('status'),
    supabase.from('event_guests').select('event_id, status, group_size'),
  ])

  // Compteurs par statut pour les tabs
  const countByStatus = {
    '':          allEvents?.length ?? 0,
    published:   allEvents?.filter(e => e.status === 'published').length ?? 0,
    draft:       allEvents?.filter(e => e.status === 'draft').length ?? 0,
    closed:      allEvents?.filter(e => e.status === 'closed').length ?? 0,
  }

  // Invités par événement
  const guestsByEvent = Object.fromEntries(
    (events ?? []).map(e => [
      e.id,
      {
        confirmed: guests?.filter(g => g.event_id === e.id && g.status === 'confirmed').reduce((s, g) => s + (g.group_size ?? 1), 0) ?? 0,
        total:     guests?.filter(g => g.event_id === e.id).length ?? 0,
      },
    ])
  )

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 600, color: C.text, marginBottom: 6 }}>
          Événements
        </h1>
        <p style={{ fontSize: 13, color: C.muted }}>
          {countByStatus['']} événement{countByStatus[''] > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Tabs filtre */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, width: 'fit-content', border: `1px solid ${C.border}` }}>
        {FILTERS.map(f => {
          const active = (status ?? '') === f.value
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/events?status=${f.value}` : '/admin/events'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 7, textDecoration: 'none',
                background: active ? 'rgba(212,163,115,0.15)' : 'transparent',
                color: active ? C.or : C.muted,
                fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: active ? 500 : 400,
                transition: 'all 0.15s',
                border: active ? '1px solid rgba(212,163,115,0.25)' : '1px solid transparent',
              }}
            >
              {f.label}
              <span style={{ fontSize: 10, background: active ? 'rgba(212,163,115,0.2)' : 'rgba(255,255,255,0.07)', color: active ? C.or : C.muted, padding: '1px 6px', borderRadius: 999 }}>
                {countByStatus[f.value as keyof typeof countByStatus]}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>

        {/* En-tête */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 130px 100px 110px 80px 36px', gap: 0, padding: '12px 24px', borderBottom: `1px solid ${C.border}` }}>
          {['Événement', 'Organisateur', 'Date', 'Type', 'Statut', 'Confirmés', ''].map(col => (
            <p key={col} style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, fontWeight: 500 }}>
              {col}
            </p>
          ))}
        </div>

        {/* Lignes */}
        {!events?.length ? (
          <p style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: C.muted }}>
            Aucun événement{status ? ` avec le statut "${STATUS_CONFIG[status]?.label}"` : ''}
          </p>
        ) : (
          events.map((ev: any, i) => {
            const org    = ev.profiles
            const gCount = guestsByEvent[ev.id]
            return (
              <EventRow
                key={ev.id}
                id={ev.id}
                title={ev.title}
                slug={ev.slug}
                status={ev.status}
                eventDate={ev.event_date}
                eventType={ev.event_type}
                orgName={org ? `${org.first_name} ${org.last_name}` : ''}
                confirmed={gCount.confirmed}
                totalRsvp={gCount.total}
                isLast={i === events.length - 1}
              />
            )
          })
        )}
      </div>

      {/* Total filtré */}
      {totalFiltered !== null && totalFiltered > 0 && (
        <p style={{ marginTop: 14, fontSize: 12, color: C.muted, textAlign: 'right' }}>
          {totalFiltered} résultat{totalFiltered > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
