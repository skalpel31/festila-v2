import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DeleteEventInline from '@/components/dashboard/DeleteEventInline'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Brouillon', color: '#9B8E7E', bg: '#F5EFE6' },
  published: { label: 'Publié',    color: '#2D8653', bg: '#EAF4EE' },
  closed:    { label: 'Terminé',   color: '#C0392B', bg: '#FDF0EE' },
}

export default async function EventsListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', user!.id)
    .order('event_date', { ascending: true })

  const count = events?.length ?? 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 600, color: '#0D1323' }}>
            Mes événements
          </h1>
          <p style={{ fontSize: 13, color: '#9B8E7E', marginTop: 5 }}>
            {count === 0 ? 'Aucun événement créé' : `${count} événement${count > 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/dashboard/events/new" style={{ display: 'inline-flex', alignItems: 'center', background: '#E787B2', color: '#fff', padding: '11px 22px', borderRadius: 999, fontSize: 12, letterSpacing: '0.08em', fontWeight: 500, textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
          + Créer un événement →
        </Link>
      </div>

      {count === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 24px', background: '#fff', borderRadius: 14, border: '1px solid #EDE3D5', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, color: '#EDE3D5', marginBottom: 20 }}>◇</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: '#0D1323', marginBottom: 10 }}>Aucun événement pour le moment</h2>
          <p style={{ fontSize: 13, color: '#9B8E7E', marginBottom: 28 }}>Créez votre première vitrine en quelques minutes.</p>
          <Link href="/dashboard/events/new" style={{ display: 'inline-flex', background: '#E787B2', color: '#fff', padding: '12px 28px', borderRadius: 999, fontSize: 12, letterSpacing: '0.1em', fontWeight: 500, textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
            Créer mon premier événement →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events!.map(event => {
            const s = STATUS[event.status] ?? STATUS.draft
            const dateFormatted = event.event_date
              ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : null

            return (
              <Link key={event.id} href={`/dashboard/events/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ background: '#fff', border: '1px solid #EDE3D5', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0px 4px 12px rgba(13,19,35,0.04)', transition: 'box-shadow 0.2s' }}>

                  {/* Photo ou placeholder */}
                  <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#0D1323' }}>
                    {event.cover_image ? (
                      <img src={event.cover_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'rgba(212,163,115,0.4)' }}>✦</span>
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {event.event_type && (
                        <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4A373', fontWeight: 600 }}>
                          {event.event_type}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontWeight: 600, color: '#0D1323', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {dateFormatted && <span style={{ fontSize: 12, color: '#9B8E7E' }}>{dateFormatted}</span>}
                      {event.location && <span style={{ fontSize: 12, color: '#9B8E7E' }}>· {event.location}</span>}
                    </div>
                  </div>

                  {/* Statut + suppression + flèche */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.color, background: s.bg, padding: '4px 12px', borderRadius: 999, fontWeight: 600 }}>
                      {s.label}
                    </span>
                    <DeleteEventInline eventId={event.id} eventTitle={event.title} />
                    <span style={{ color: '#D4C9BB', fontSize: 18 }}>›</span>
                  </div>

                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
