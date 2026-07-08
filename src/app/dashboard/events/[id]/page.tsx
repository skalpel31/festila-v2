import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CopyLinkButton from '@/components/dashboard/CopyLinkButton'
import DeleteEventButton from '@/components/dashboard/DeleteEventButton'
import ExportGuestsButton from '@/components/dashboard/ExportGuestsButton'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event || event.organizer_id !== user?.id) notFound()

  const { data: guests } = await supabase
    .from('event_guests')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  const confirmedCount  = guests?.filter(g => g.status === 'confirmed').reduce((sum, g) => sum + (g.group_size ?? 1), 0) ?? 0
  const pendingCount    = guests?.filter(g => g.status === 'pending').reduce((sum, g) => sum + (g.group_size ?? 1), 0) ?? 0
  const declinedCount   = guests?.filter(g => g.status === 'declined').length ?? 0
  const totalGuests     = confirmedCount + pendingCount

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    draft:     { label: 'Brouillon',  color: '#9B8E7E', bg: '#F5EFE6' },
    published: { label: 'Publié',     color: '#27AE60', bg: '#EAF7EE' },
    closed:    { label: 'Terminé',    color: '#C0392B', bg: '#FDF0EE' },
  }
  const s = statusLabel[event.status] ?? statusLabel.draft

  // Donut RSVP — cercle SVG maison, pas besoin d'une lib de graphiques pour 3 segments.
  const chartTotal = confirmedCount + pendingCount + declinedCount
  const DONUT_R = 58
  const DONUT_CIRC = 2 * Math.PI * DONUT_R
  const legend = [
    { label: 'Confirmés',  value: confirmedCount, color: '#8AA88F' },
    { label: 'En attente', value: pendingCount,   color: '#D4A373' },
    { label: 'Refusés',    value: declinedCount,  color: '#C17767' },
  ]
  const donutSegments = (() => {
    let acc = 0
    return legend.filter(l => l.value > 0).map(l => {
      const dash = chartTotal > 0 ? (l.value / chartTotal) * DONUT_CIRC : 0
      const seg = { ...l, dash, offset: -acc }
      acc += dash
      return seg
    })
  })()

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 36 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: '#9B8E7E', textDecoration: 'none', letterSpacing: '0.05em' }}>← Mes événements</Link>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 38, fontWeight: 400, color: '#1A1208', lineHeight: 1.1, marginTop: 8 }}>
            {event.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.color, background: s.bg, padding: '3px 10px', borderRadius: 999 }}>
              {s.label}
            </span>
            {event.event_type && (
              <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B84A80', background: '#FDEEF5', padding: '3px 10px', borderRadius: 999 }}>
                {event.event_type}
              </span>
            )}
          </div>
          {(event.event_date || event.location) && (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
              {event.event_date && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#6B5E50', fontFamily: "'Inter', system-ui, sans-serif" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4B8A8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
                  </svg>
                  {new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {event.event_time && ` · ${event.event_time.slice(0, 5)}`}
                </span>
              )}
              {event.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#6B5E50', fontFamily: "'Inter', system-ui, sans-serif" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4B8A8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 6.5-9 12-9 12s-9-5.5-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {event.location}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0, justifyContent: 'flex-end' }}>
          <CopyLinkButton url={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://festila.com'}/e/${event.slug}`} />
          <Link href={`/dashboard/events/${id}/edit`} style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 999, border: '1px solid #EDE3D5', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B8E7E', textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif" }}>
            Modifier
          </Link>
          <Link href={`/e/${event.slug}`} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 999, background: '#E787B2', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600, boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
            Voir la vitrine →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Confirmés',   value: confirmedCount },
          { label: 'En attente', value: pendingCount },
          { label: 'Total',      value: totalGuests },
          { label: 'Refusés',    value: declinedCount },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', border: '1px solid #EDE3D5', borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 40, fontWeight: 300, color: '#1A1208', lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: 11, color: '#9B8E7E', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Liste invités + répartition */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>

        <div style={{ background: '#fff', border: '1px solid #EDE3D5', borderRadius: 16, padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 400, color: '#1A1208' }}>
              Liste des invités
            </h2>
            <ExportGuestsButton guests={guests ?? []} eventTitle={event.title} />
          </div>

          {!guests?.length ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9B8E7E' }}>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, marginBottom: 8 }}>Aucun invité pour le moment</p>
              <p style={{ fontSize: 12 }}>Les invités apparaîtront ici dès qu'ils s'inscriront via la vitrine.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {guests.map(guest => (
                <div key={guest.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#FAF7F3', borderRadius: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, color: '#1A1208', fontWeight: 500 }}>{guest.first_name} {guest.last_name}</p>
                    {guest.group_size > 1 && (
                      <p style={{ fontSize: 11, color: '#9B8E7E', marginTop: 2 }}>{guest.group_size} personnes au total</p>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: guest.status === 'confirmed' ? '#27AE60' : guest.status === 'declined' ? '#C0392B' : '#9B8E7E',
                    background: guest.status === 'confirmed' ? '#EAF7EE' : guest.status === 'declined' ? '#FDF0EE' : '#F5EFE6',
                    padding: '3px 10px', borderRadius: 999
                  }}>
                    {guest.status === 'confirmed' ? 'Confirmé' : guest.status === 'declined' ? 'Refusé' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid #EDE3D5', borderRadius: 16, padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 400, color: '#1A1208', alignSelf: 'flex-start', marginBottom: 16 }}>
            Répartition
          </h2>

          <svg width="160" height="160" viewBox="0 0 160 160" style={{ width: '100%', maxWidth: 160, height: 'auto' }}>
            <g transform="rotate(-90 80 80)">
              <circle cx="80" cy="80" r={DONUT_R} fill="none" stroke="#F5EFE6" strokeWidth="16" />
              {donutSegments.map(seg => (
                <circle
                  key={seg.label}
                  cx="80" cy="80" r={DONUT_R} fill="none"
                  stroke={seg.color} strokeWidth="16"
                  strokeDasharray={`${seg.dash} ${DONUT_CIRC - seg.dash}`}
                  strokeDashoffset={seg.offset}
                />
              ))}
            </g>
            <text x="80" y="76" textAnchor="middle" fontSize="30" fontFamily="'Cormorant Garamond', Georgia, serif" fill="#1A1208">{chartTotal}</text>
            <text x="80" y="94" textAnchor="middle" fontSize="9" letterSpacing="0.1em" fill="#9B8E7E">INVITÉS</text>
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 20 }}>
            {legend.map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6B5E50' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{l.label}</span>
                <span style={{ color: '#1A1208', fontWeight: 500 }}>{l.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Zone danger */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #EDE3D5', display: 'flex', justifyContent: 'flex-end' }}>
        <DeleteEventButton eventId={id} />
      </div>

    </div>
  )
}
