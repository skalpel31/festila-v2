import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import InvitationCard from '@/components/dashboard/InvitationCard'

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string }>
}) {
  const { confirmed } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invitations } = await supabase
    .from('event_guests')
    .select('*, events(id, title, slug, event_date, event_time, location, status, event_type, organizer_id)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const organizerIds = [...new Set(invitations?.map((inv: any) => inv.events?.organizer_id).filter(Boolean) ?? [])]
  const { data: organizers } = organizerIds.length
    ? await supabase.from('profiles').select('id, first_name, last_name').in('id', organizerIds)
    : { data: [] }
  const organizerMap = Object.fromEntries((organizers ?? []).map((p: any) => [p.id, p]))

  const active    = invitations?.filter((i: any) => i.status !== 'cancelled') ?? []
  const cancelled = invitations?.filter((i: any) => i.status === 'cancelled') ?? []
  const count     = active.length

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 600, color: '#0D1323' }}>
          Mes invitations
        </h1>
        <p style={{ fontSize: 13, color: '#9B8E7E', marginTop: 5 }}>
          {count === 0 ? 'Aucune invitation pour le moment' : `${count} invitation${count > 1 ? 's' : ''} reçue${count > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Confirmation toast */}
      {confirmed && (
        <div style={{ background: '#EAF4EE', border: '1px solid #C8E6D4', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2D8653', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p style={{ fontSize: 13, color: '#1A5C38', fontWeight: 500 }}>Votre présence a bien été confirmée !</p>
        </div>
      )}

      {count === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 24px', background: '#fff', borderRadius: 14, border: '1px solid #EDE3D5', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, color: '#EDE3D5', marginBottom: 20 }}>◇</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: '#0D1323', marginBottom: 10 }}>
            Aucune invitation reçue
          </h2>
          <p style={{ fontSize: 13, color: '#9B8E7E', lineHeight: 1.8, marginBottom: 28 }}>
            Quand quelqu'un vous invite à un événement via Festila,<br />votre invitation apparaîtra ici.
          </p>
          <Link href="/dashboard/events/new" style={{ display: 'inline-flex', background: '#E787B2', color: '#fff', padding: '12px 28px', borderRadius: 999, fontSize: 12, letterSpacing: '0.1em', fontWeight: 500, textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
            Créer mon propre événement →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {active.map((inv: any) => (
            <InvitationCard
              key={inv.id}
              invitation={inv}
              organizer={organizerMap[inv.events?.organizer_id]}
            />
          ))}

          {cancelled.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9B8E7E', marginBottom: 12 }}>Présences annulées</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.6 }}>
                {cancelled.map((inv: any) => (
                  <div key={inv.id} style={{ background: '#fff', border: '1px solid #EDE3D5', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, color: '#0D1323', marginBottom: 2 }}>{inv.events?.title}</p>
                      <p style={{ fontSize: 11, color: '#9B8E7E' }}>Présence annulée</p>
                    </div>
                    <a href={`/e/${inv.events?.slug}`} style={{ fontSize: 11, color: '#E787B2', textDecoration: 'none' }}>Se réinscrire →</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA créer événement */}
          <div style={{ background: '#0D1323', borderRadius: 14, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: '#FAF7F3', fontWeight: 500, marginBottom: 4 }}>
                Vous aussi, organisez un événement
              </p>
              <p style={{ fontSize: 12, color: 'rgba(250,247,243,0.5)' }}>
                Créez votre vitrine et invitez vos proches en quelques minutes
              </p>
            </div>
            <Link href="/dashboard/events/new" style={{ display: 'inline-flex', background: '#E787B2', color: '#fff', padding: '11px 22px', borderRadius: 999, fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 20, boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
              Créer un événement →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
