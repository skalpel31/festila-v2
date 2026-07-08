import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import InvitationCard from '@/components/dashboard/InvitationCard'
import DeleteEventInline from '@/components/dashboard/DeleteEventInline'

const C = { navy: '#0D1323', rose: '#E787B2', or: '#D4A373', cream: '#FAF7F3', blush: '#F7D9D2', sand: '#9B8E7E', white: '#fff' }

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Brouillon', color: '#9B8E7E', bg: '#F5EFE6' },
  published: { label: 'Publié',    color: '#2D8653', bg: '#EAF4EE' },
  closed:    { label: 'Terminé',   color: '#C0392B', bg: '#FDF0EE' },
}

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr); target.setHours(0,0,0,0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function CalIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function UsersIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> }
function ClockIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }

function EventRow({ event, guestStats, muted }: {
  event: any
  guestStats?: { confirmed: number; pending: number }
  muted?: boolean
}) {
  const s = STATUS[event.status] ?? STATUS.draft
  const dateFormatted = event.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <Link href={`/dashboard/events/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: C.white, border: '1px solid #EDE3D5', borderRadius: 14, padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 18, opacity: muted ? 0.65 : 1,
        boxShadow: '0px 4px 12px rgba(13,19,35,0.04)',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: C.navy }}>
          {event.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.cover_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'rgba(212,163,115,0.4)' }}>✦</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 600, color: C.navy, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {dateFormatted && <span style={{ fontSize: 12, color: C.sand }}>{dateFormatted}</span>}
            {guestStats && <span style={{ fontSize: 12, color: C.sand }}>· {guestStats.confirmed} confirmé{guestStats.confirmed > 1 ? 's' : ''}</span>}
          </div>
        </div>

        <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.color, background: s.bg, padding: '4px 11px', borderRadius: 999, fontWeight: 600, flexShrink: 0 }}>
          {s.label}
        </span>

        <div onClick={e => e.preventDefault()} style={{ flexShrink: 0 }}>
          <DeleteEventInline eventId={event.id} eventTitle={event.title} />
        </div>

        <span style={{ color: '#D4C9BB', fontSize: 18, flexShrink: 0 }}>›</span>
      </div>
    </Link>
  )
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ viewAs?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { viewAs } = await searchParams

  const { data: myProfile } = await supabase.from('profiles').select('first_name, is_super_admin').eq('id', user!.id).single()
  const targetId = (viewAs && myProfile?.is_super_admin) ? viewAs : user!.id
  const isViewingAs = targetId !== user!.id

  const { data: profile } = isViewingAs
    ? await supabase.from('profiles').select('first_name').eq('id', targetId).single()
    : { data: myProfile }

  const { data: events } = await supabase.from('events').select('*').eq('organizer_id', targetId).order('event_date', { ascending: true })

  const { data: invitations } = await supabase
    .from('event_guests')
    .select('*, events(id, title, slug, event_date, event_time, location, status, event_type, organizer_id)')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false })

  const hasEvents      = (events?.length ?? 0) > 0
  const hasInvitations = (invitations?.length ?? 0) > 0

  const upcomingEvents = events?.filter(e => !e.event_date || daysUntil(e.event_date) >= 0) ?? []
  const pastEvents     = events?.filter(e => e.event_date && daysUntil(e.event_date) < 0) ?? []

  const upcomingIds = upcomingEvents.map(e => e.id)
  const { data: allGuests } = upcomingIds.length
    ? await supabase.from('event_guests').select('event_id, status, group_size').in('event_id', upcomingIds)
    : { data: [] }

  const guestStatsByEvent = new Map<string, { confirmed: number; pending: number }>()
  allGuests?.forEach(g => {
    const cur = guestStatsByEvent.get(g.event_id) ?? { confirmed: 0, pending: 0 }
    if (g.status === 'confirmed') cur.confirmed += g.group_size ?? 1
    if (g.status === 'pending')   cur.pending   += g.group_size ?? 1
    guestStatsByEvent.set(g.event_id, cur)
  })

  const totalConfirmed = [...guestStatsByEvent.values()].reduce((s, v) => s + v.confirmed, 0)
  const nearestDays = upcomingEvents.find(e => e.event_date)?.event_date
    ? daysUntil(upcomingEvents.find(e => e.event_date)!.event_date)
    : null

  // Données organisateurs pour les cartes invitations
  const organizerIds = [...new Set(invitations?.map((inv: any) => inv.events?.organizer_id).filter(Boolean) ?? [])]
  const { data: organizers } = organizerIds.length
    ? await supabase.from('profiles').select('id, first_name, last_name').in('id', organizerIds)
    : { data: [] }
  const organizerMap = Object.fromEntries((organizers ?? []).map((p: any) => [p.id, p]))

  const upcomingInvitations = invitations?.filter((inv: any) => {
    if (!inv.events?.event_date) return true
    return daysUntil(inv.events.event_date) >= 0
  }) ?? []

  return (
    <div>

      {isViewingAs && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', marginBottom: 24, background: 'rgba(212,163,115,0.08)', border: '1px solid rgba(212,163,115,0.2)', borderRadius: 10 }}>
          <p style={{ fontSize: 12, color: C.or, fontFamily: "'Inter', system-ui, sans-serif" }}>
            <strong>Vue admin</strong> — vous consultez le dashboard de <strong>{profile?.first_name}</strong>
          </p>
          <Link href={`/admin/users/${targetId}`} style={{ fontSize: 12, color: C.or, textDecoration: 'none', fontWeight: 500 }}>
            ← Retour au profil admin
          </Link>
        </div>
      )}

      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 600, color: C.navy }}>
            Bienvenue, {profile?.first_name} !
          </h1>
          <p style={{ fontSize: 13, color: C.sand, marginTop: 5 }}>
            {hasEvents
              ? `${upcomingEvents.length} événement${upcomingEvents.length > 1 ? 's' : ''} à venir${pastEvents.length ? ` · ${pastEvents.length} passé${pastEvents.length > 1 ? 's' : ''}` : ''}`
              : hasInvitations
                ? `${upcomingInvitations.length} invitation${upcomingInvitations.length > 1 ? 's' : ''} à venir`
                : 'Votre espace événement personnel'}
          </p>
        </div>
        <Link href="/dashboard/events/new" style={{ display: 'inline-flex', alignItems: 'center', background: C.rose, color: '#fff', padding: '11px 22px', borderRadius: 999, fontSize: 12, letterSpacing: '0.08em', fontWeight: 500, textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
          + Créer un événement →
        </Link>
      </div>

      {/* VUE ORGANISATEUR — synthèse multi-événements */}
      {hasEvents && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { icon: <CalIcon />,   value: upcomingEvents.length,                          label: 'événements à venir' },
              { icon: <UsersIcon />, value: totalConfirmed,                                  label: 'invités confirmés (total)' },
              { icon: <ClockIcon />, value: nearestDays !== null && nearestDays >= 0 ? nearestDays : '—', label: 'jours avant le prochain' },
            ].map((stat, i) => (
              <div key={i} style={{ background: C.white, borderRadius: 12, padding: '20px 22px', border: '1px solid #EDE3D5', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)' }}>
                <div style={{ marginBottom: 10 }}>{stat.icon}</div>
                <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 600, color: C.navy, lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: C.sand, marginTop: 6 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {upcomingEvents.length > 0 && (
            <div style={{ marginBottom: pastEvents.length ? 28 : 32 }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 14 }}>
                Événements à venir
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingEvents.map(event => (
                  <EventRow key={event.id} event={event} guestStats={guestStatsByEvent.get(event.id)} />
                ))}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 600, color: C.sand, marginBottom: 14 }}>
                Événements passés
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pastEvents.map(event => (
                  <EventRow key={event.id} event={event} muted />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* VUE INVITÉ — si pas d'événements organisés, invitations en plein écran */}
      {!hasEvents && hasInvitations && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {upcomingInvitations.slice(0, 3).map((inv: any) => (
            <InvitationCard key={inv.id} invitation={inv} organizer={organizerMap[inv.events?.organizer_id]} />
          ))}
          {upcomingInvitations.length > 3 && (
            <Link href="/dashboard/invitations" style={{ textAlign: 'center', padding: '14px', fontSize: 12, color: C.or, textDecoration: 'none', fontWeight: 500 }}>
              Voir toutes mes invitations →
            </Link>
          )}
          <div style={{ background: C.navy, borderRadius: 14, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: C.cream, fontWeight: 500, marginBottom: 4 }}>Vous aussi, organisez un événement</p>
              <p style={{ fontSize: 12, color: 'rgba(250,247,243,0.5)' }}>Créez votre vitrine et invitez vos proches en quelques minutes</p>
            </div>
            <Link href="/dashboard/events/new" style={{ display: 'inline-flex', background: C.or, color: C.navy, padding: '11px 22px', borderRadius: 999, fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 20 }}>
              Créer un événement →
            </Link>
          </div>
        </div>
      )}

      {/* VUE INVITÉ sous la vue organisateur — si les deux */}
      {hasEvents && hasInvitations && upcomingInvitations.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 16 }}>
            Mes invitations à venir
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingInvitations.slice(0, 2).map((inv: any) => (
              <InvitationCard key={inv.id} invitation={inv} organizer={organizerMap[inv.events?.organizer_id]} />
            ))}
            {upcomingInvitations.length > 2 && (
              <Link href="/dashboard/invitations" style={{ textAlign: 'center', padding: '14px', fontSize: 12, color: C.or, textDecoration: 'none', fontWeight: 500 }}>
                Voir toutes mes invitations →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Aucun événement ni invitation */}
      {!hasEvents && !hasInvitations && (
        <div style={{ textAlign: 'center', padding: '72px 24px', background: C.white, borderRadius: 14, border: '1px solid #EDE3D5', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, color: '#EDE3D5', marginBottom: 20 }}>◇</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 500, color: C.navy, marginBottom: 10 }}>Votre espace événement vous attend</h2>
          <p style={{ fontSize: 13, color: C.sand, marginBottom: 28, lineHeight: 1.8 }}>
            Organisez un événement et partagez la vitrine avec vos invités,<br />ou attendez qu'on vous invite à un événement.
          </p>
          <Link href="/dashboard/events/new" style={{ display: 'inline-flex', background: C.rose, color: '#fff', padding: '13px 32px', borderRadius: 999, fontSize: 12, letterSpacing: '0.1em', fontWeight: 500, textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
            Créer mon premier événement →
          </Link>
        </div>
      )}
    </div>
  )
}
