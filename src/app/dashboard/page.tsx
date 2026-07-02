import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import InvitationCard from '@/components/dashboard/InvitationCard'
import QRShareCard from '@/components/dashboard/QRShareCard'
import CoverAndHeroCard from '@/components/dashboard/CoverAndHeroCard'

const C = { navy: '#0D1323', rose: '#E787B2', or: '#D4A373', cream: '#FAF7F3', blush: '#F7D9D2', sand: '#9B8E7E', white: '#fff' }

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr); target.setHours(0,0,0,0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function CalIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function UsersIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> }
function CheckIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ viewAs?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { viewAs } = await searchParams

  // Vérifier si super admin pour autoriser le viewAs
  const { data: myProfile } = await supabase.from('profiles').select('first_name, is_super_admin').eq('id', user!.id).single()
  const targetId = (viewAs && myProfile?.is_super_admin) ? viewAs : user!.id
  const isViewingAs = targetId !== user!.id

  const { data: profile } = isViewingAs
    ? await supabase.from('profiles').select('first_name').eq('id', targetId).single()
    : { data: myProfile }

  // Événements organisés
  const { data: events } = await supabase.from('events').select('*').eq('organizer_id', targetId).order('event_date', { ascending: true })

  // Invitations reçues
  const { data: invitations } = await supabase
    .from('event_guests')
    .select('*, events(id, title, slug, event_date, event_time, location, status, event_type, organizer_id)')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false })

  const hasEvents      = (events?.length ?? 0) > 0
  const hasInvitations = (invitations?.length ?? 0) > 0

  // Données pour la vue organisateur
  const nextEvent = events?.find(e => e.event_date && daysUntil(e.event_date) >= 0) ?? events?.[0]
  const { data: guests } = nextEvent
    ? await supabase.from('event_guests').select('status, group_size').eq('event_id', nextEvent.id)
    : { data: [] }

  const confirmed = guests?.filter(g => g.status === 'confirmed').reduce((s, g) => s + (g.group_size ?? 1), 0) ?? 0
  const pending   = guests?.filter(g => g.status === 'pending').reduce((s, g) => s + (g.group_size ?? 1), 0) ?? 0
  const total     = confirmed + pending
  const daysLeft  = nextEvent?.event_date ? daysUntil(nextEvent.event_date) : null

  // Données organisateurs pour les cartes invitations
  const organizerIds = [...new Set(invitations?.map((inv: any) => inv.events?.organizer_id).filter(Boolean) ?? [])]
  const { data: organizers } = organizerIds.length
    ? await supabase.from('profiles').select('id, first_name, last_name').in('id', organizerIds)
    : { data: [] }
  const organizerMap = Object.fromEntries((organizers ?? []).map((p: any) => [p.id, p]))

  // Invitations à venir (non passées)
  const upcomingInvitations = invitations?.filter((inv: any) => {
    if (!inv.events?.event_date) return true
    return daysUntil(inv.events.event_date) >= 0
  }) ?? []

  return (
    <div>

      {/* Bannière admin quand on visualise un autre utilisateur */}
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
              ? 'Voici l\'état actuel de votre événement'
              : hasInvitations
                ? `${upcomingInvitations.length} invitation${upcomingInvitations.length > 1 ? 's' : ''} à venir`
                : 'Votre espace événement personnel'}
          </p>
        </div>
        <Link href="/dashboard/events/new" style={{ display: 'inline-flex', alignItems: 'center', background: C.rose, color: '#fff', padding: '11px 22px', borderRadius: 999, fontSize: 12, letterSpacing: '0.08em', fontWeight: 500, textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
          + Créer un événement →
        </Link>
      </div>

      {/* VUE ORGANISATEUR */}
      {hasEvents && nextEvent && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { icon: <CalIcon />,   value: daysLeft !== null && daysLeft >= 0 ? daysLeft : '—', label: 'jours restants' },
              { icon: <UsersIcon />, value: confirmed,                                            label: 'invités confirmés' },
              { icon: <CheckIcon />, value: total,                                                label: 'total personnes' },
            ].map((stat, i) => (
              <div key={i} style={{ background: C.white, borderRadius: 12, padding: '20px 22px', border: '1px solid #EDE3D5', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)' }}>
                <div style={{ marginBottom: 10 }}>{stat.icon}</div>
                <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 600, color: C.navy, lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: C.sand, marginTop: 6 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.4fr 0.8fr', gap: 16, marginBottom: hasInvitations ? 32 : 0 }}>

            <QRShareCard
              title={nextEvent.title}
              slug={nextEvent.slug ?? ''}
              status={nextEvent.status}
              eventId={nextEvent.id}
            />

            <CoverAndHeroCard
              eventId={nextEvent.id}
              eventTitle={nextEvent.title}
              coverImage={nextEvent.cover_image ?? null}
              coverImageMobile={nextEvent.cover_image_mobile ?? null}
              slug={nextEvent.slug ?? ''}
            />

            <div style={{ background: C.white, borderRadius: 12, padding: '24px', border: '1px solid #EDE3D5', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 18 }}>Réponses des invités</h2>
              {total === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: 13, color: C.sand, lineHeight: 1.8 }}>Aucune réponse pour l'instant.</p>
                  <Link href={`/e/${nextEvent.slug}`} target="_blank" style={{ display: 'inline-block', marginTop: 12, fontSize: 12, color: C.or, fontWeight: 500, textDecoration: 'none' }}>Partager la vitrine →</Link>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <svg width="100" height="100" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F0EBE4" strokeWidth="3.2"/>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2D8653" strokeWidth="3.2"
                        strokeDasharray={`${(confirmed/total)*100} ${100-(confirmed/total)*100}`}
                        strokeDashoffset="25" strokeLinecap="round"/>
                      <text x="18" y="19" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0D1323" fontFamily="Playfair Display, serif">{Math.round((confirmed/total)*100)}%</text>
                      <text x="18" y="25" textAnchor="middle" fontSize="3.5" fill="#9B8E7E" fontFamily="Inter, sans-serif">acceptés</text>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[{ label: 'Acceptés', value: confirmed, color: '#2D8653' }, { label: 'En attente', value: pending, color: C.or }].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                          <span style={{ fontSize: 12, color: C.navy }}>{r.label}</span>
                        </div>
                        <span style={{ fontSize: 12, color: C.sand, fontWeight: 500 }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={`/dashboard/events/${nextEvent.id}`} style={{ display: 'block', marginTop: 16, fontSize: 12, color: C.or, fontWeight: 500, textDecoration: 'none' }}>Voir la liste →</Link>
                </>
              )}
            </div>
          </div>
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
