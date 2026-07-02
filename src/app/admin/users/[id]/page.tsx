import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeleteUserButton from '@/components/admin/DeleteUserButton'

const C  = { navy: '#0D1323', or: '#D4A373', cream: '#FAF7F3', sand: '#9B8E7E', white: '#fff', rose: '#E787B2' }
const CA = { text: '#FAF7F3', muted: 'rgba(250,247,243,0.4)', border: 'rgba(255,255,255,0.07)' }

const STATUS_EVENT: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Brouillon', color: '#9B8E7E',  bg: 'rgba(155,142,126,0.1)' },
  published: { label: 'Publié',    color: '#2D8653',  bg: 'rgba(45,134,83,0.1)'   },
  closed:    { label: 'Terminé',   color: '#C0392B',  bg: 'rgba(192,57,43,0.1)'   },
}

const STATUS_GUEST: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmé',   color: '#2D8653' },
  pending:   { label: 'En attente', color: '#9B8E7E' },
  declined:  { label: 'Refusé',     color: '#C0392B' },
  cancelled: { label: 'Annulé',     color: '#C0392B' },
}

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const d     = new Date(dateStr); d.setHours(0,0,0,0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user: me } } = await supabase.auth.getUser()
  if (!me) redirect('/login')
  const { data: meProfile } = await supabase.from('profiles').select('is_super_admin').eq('id', me.id).single()
  if (!meProfile?.is_super_admin) redirect('/dashboard')

  const [{ data: profile }, { data: events }, { data: invitations }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('events').select('id, title, slug, status, event_date, event_time, location, event_type').eq('organizer_id', id).order('event_date', { ascending: true }),
    supabase.from('event_guests').select('id, status, group_size, events(id, title, slug, event_date, event_type, organizer_id)').eq('user_id', id).order('created_at', { ascending: false }),
  ])

  if (!profile) notFound()

  const isSelf   = me.id === id
  const fullName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
  const initials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()

  // Stats dashboard
  const nextEvent  = events?.find(e => e.event_date && daysUntil(e.event_date) >= 0) ?? events?.[0]
  const { data: guests } = nextEvent
    ? await supabase.from('event_guests').select('status, group_size').eq('event_id', nextEvent.id)
    : { data: [] }
  const confirmed = guests?.filter(g => g.status === 'confirmed').reduce((s, g) => s + (g.group_size ?? 1), 0) ?? 0
  const pending   = guests?.filter(g => g.status === 'pending').reduce((s, g) => s + (g.group_size ?? 1), 0) ?? 0
  const daysLeft  = nextEvent?.event_date ? daysUntil(nextEvent.event_date) : null

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Barre admin en haut */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, padding: '12px 20px', background: 'rgba(212,163,115,0.06)', border: '1px solid rgba(212,163,115,0.15)', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: CA.muted, textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Utilisateurs
          </Link>
          <span style={{ fontSize: 12, color: CA.muted }}>·</span>
          <p style={{ fontSize: 12, color: C.or, fontWeight: 500 }}>Vue admin — {fullName}</p>
        </div>
        {!isSelf && <DeleteUserButton userId={id} name={fullName} />}
      </div>

      {/* Header utilisateur — style dashboard */}
      <div style={{ background: C.white, borderRadius: 14, padding: '28px 32px', marginBottom: 20, border: '1px solid #EDE3D5', boxShadow: '0 4px 12px rgba(13,19,35,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: profile.is_super_admin ? C.or : C.rose, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials || '?'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.navy }}>
                  {fullName || 'Sans nom'}
                </h1>
                {profile.is_super_admin && (
                  <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.or, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.2)', padding: '2px 7px', borderRadius: 999 }}>
                    Super Admin
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: C.sand }}>
                Inscrit le {new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, textAlign: 'center' }}>
            <div><p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: C.navy }}>{events?.length ?? 0}</p><p style={{ fontSize: 11, color: C.sand, marginTop: 2 }}>événements</p></div>
            <div><p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#2D8653' }}>{events?.filter(e => e.status === 'published').length ?? 0}</p><p style={{ fontSize: 11, color: C.sand, marginTop: 2 }}>publiés</p></div>
            <div><p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: C.navy }}>{invitations?.length ?? 0}</p><p style={{ fontSize: 11, color: C.sand, marginTop: 2 }}>invitations</p></div>
          </div>
        </div>
      </div>

      {/* Stats prochain événement — si existe */}
      {nextEvent && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'jours restants',    value: daysLeft !== null && daysLeft >= 0 ? daysLeft : '—' },
            { label: 'invités confirmés', value: confirmed                                            },
            { label: 'en attente',        value: pending                                              },
          ].map((s, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 12, padding: '20px 22px', border: '1px solid #EDE3D5', boxShadow: '0 4px 12px rgba(13,19,35,0.06)' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: C.sand, marginTop: 6 }}>{s.label}</p>
              {i === 0 && <p style={{ fontSize: 11, color: C.or, marginTop: 4, fontWeight: 500 }}>{nextEvent.title}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Deux colonnes : événements + invitations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Événements */}
        <div style={{ background: C.white, borderRadius: 14, padding: '24px', border: '1px solid #EDE3D5', boxShadow: '0 4px 12px rgba(13,19,35,0.06)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 16 }}>
            Événements créés
          </h2>
          {!events?.length ? (
            <p style={{ fontSize: 13, color: C.sand, textAlign: 'center', padding: '20px 0' }}>Aucun événement</p>
          ) : events.map((ev, i) => {
            const s = STATUS_EVENT[ev.status] ?? STATUS_EVENT.draft
            return (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < events.length - 1 ? '1px solid #F0EBE4' : 'none', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: C.navy, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                  {ev.event_date && <p style={{ fontSize: 11, color: C.sand, marginTop: 2 }}>{new Date(ev.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                  {ev.slug && <a href={`/e/${ev.slug}`} target="_blank" style={{ fontSize: 12, color: C.sand, textDecoration: 'none' }}>↗</a>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Invitations */}
        <div style={{ background: C.white, borderRadius: 14, padding: '24px', border: '1px solid #EDE3D5', boxShadow: '0 4px 12px rgba(13,19,35,0.06)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 16 }}>
            Invitations reçues
          </h2>
          {!(invitations as any[])?.length ? (
            <p style={{ fontSize: 13, color: C.sand, textAlign: 'center', padding: '20px 0' }}>Aucune invitation</p>
          ) : (invitations as any[]).map((inv, i) => {
            const s  = STATUS_GUEST[inv.status] ?? STATUS_GUEST.pending
            const ev = inv.events
            return (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < (invitations as any[]).length - 1 ? '1px solid #F0EBE4' : 'none', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev?.title ?? '—'}</p>
                  {ev?.event_date && <p style={{ fontSize: 11, color: C.sand, marginTop: 2 }}>{new Date(ev.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                </div>
                <span style={{ fontSize: 10, color: s.color, background: `${s.color}18`, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
