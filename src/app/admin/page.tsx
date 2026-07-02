import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import OverviewEventRow from '@/components/admin/OverviewEventRow'
import OverviewUserRow  from '@/components/admin/OverviewUserRow'
import StatCard         from '@/components/admin/StatCard'

const C = {
  card:   'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  text:   '#FAF7F3',
  muted:  'rgba(250,247,243,0.4)',
  or:     '#D4A373',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profiles,  count: totalUsers  },
    { data: events,    count: totalEvents },
    { data: guests,    count: totalGuests },
  ] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name, created_at, is_super_admin', { count: 'exact' }).order('created_at', { ascending: false }),
    supabase.from('events').select('id, title, slug, status, event_date, organizer_id, created_at, profiles(first_name, last_name)', { count: 'exact' }).order('created_at', { ascending: false }),
    supabase.from('event_guests').select('id, group_size, status', { count: 'exact' }),
  ])

  const totalPersonnes = guests?.reduce((s: number, g: any) => s + (g.group_size ?? 1), 0) ?? 0
  const totalConfirmed = guests?.filter((g: any) => g.status === 'confirmed').reduce((s: number, g: any) => s + (g.group_size ?? 1), 0) ?? 0
  const totalPublished = events?.filter((e: any) => e.status === 'published').length ?? 0

  const STATS = [
    { label: 'Utilisateurs',      value: totalUsers    ?? 0, sub: 'inscrits',          href: '/admin/users'  },
    { label: 'Événements',        value: totalEvents   ?? 0, sub: `dont ${totalPublished} publiés`, href: '/admin/events' },
    { label: 'Inscriptions',      value: totalGuests   ?? 0, sub: 'RSVP reçus',        href: null            },
    { label: 'Personnes totales', value: totalPersonnes,     sub: `${totalConfirmed} confirmées`,   href: null            },
  ]

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 600, color: C.text, marginBottom: 6 }}>
          Vue d'ensemble
        </h1>
        <p style={{ fontSize: 13, color: C.muted }}>Plateforme Festila — données en temps réel</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }}>
        {STATS.map(stat => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} sub={stat.sub} href={stat.href ?? undefined} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Événements récents */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 500, color: C.text }}>
              Événements récents
            </h2>
            <Link href="/admin/events" style={{ fontSize: 11, color: C.or, textDecoration: 'none', fontWeight: 500 }}>
              Voir tout →
            </Link>
          </div>

          {!events?.length ? (
            <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '20px 0' }}>Aucun événement</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {events.map((ev: any) => {
                const org = ev.profiles
                return (
                  <OverviewEventRow
                    key={ev.id}
                    id={ev.id}
                    title={ev.title}
                    slug={ev.slug}
                    status={ev.status}
                    organizer={org ? `${org.first_name} ${org.last_name}` : '—'}
                    eventDate={ev.event_date}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Utilisateurs récents */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 500, color: C.text }}>
              Utilisateurs récents
            </h2>
            <Link href="/admin/users" style={{ fontSize: 11, color: C.or, textDecoration: 'none', fontWeight: 500 }}>
              Voir tout →
            </Link>
          </div>

          {!profiles?.length ? (
            <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '20px 0' }}>Aucun utilisateur</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {profiles.map((p: any) => (
                <OverviewUserRow
                  key={p.id}
                  id={p.id}
                  firstName={p.first_name ?? ''}
                  lastName={p.last_name ?? ''}
                  createdAt={p.created_at}
                  isAdmin={p.is_super_admin ?? false}
                  isSelf={user?.id === p.id}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
