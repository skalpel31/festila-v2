import { createClient } from '@/lib/supabase/server'
import UserRow from '@/components/admin/UserRow'

const C = {
  text:  '#FAF7F3',
  muted: 'rgba(250,247,243,0.4)',
  or:    '#D4A373',
}

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: { user: me } } = await supabase.auth.getUser()

  const [
    { data: profiles, count: totalUsers },
    { data: events },
    { data: guests },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, created_at, is_super_admin', { count: 'exact' })
      .order('created_at', { ascending: false }),
    supabase.from('events').select('organizer_id, status'),
    supabase.from('event_guests').select('user_id'),
  ])

  const totalAdmins = profiles?.filter(p => p.is_super_admin).length ?? 0

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 600, color: C.text, marginBottom: 6 }}>
          Utilisateurs
        </h1>
        <p style={{ fontSize: 13, color: C.muted }}>
          {totalUsers ?? 0} compte{(totalUsers ?? 0) > 1 ? 's' : ''} enregistré{(totalUsers ?? 0) > 1 ? 's' : ''}
          {totalAdmins > 0 && ` · ${totalAdmins} admin${totalAdmins > 1 ? 's' : ''}`}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {!profiles?.length ? (
          <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: 40 }}>Aucun utilisateur</p>
        ) : profiles.map(p => (
          <UserRow
            key={p.id}
            id={p.id}
            firstName={p.first_name ?? ''}
            lastName={p.last_name ?? ''}
            createdAt={p.created_at}
            isAdmin={p.is_super_admin ?? false}
            evTotal={events?.filter(e => e.organizer_id === p.id).length ?? 0}
            evPublished={events?.filter(e => e.organizer_id === p.id && e.status === 'published').length ?? 0}
            rsvps={guests?.filter(g => g.user_id === p.id).length ?? 0}
            isSelf={me?.id === p.id}
          />
        ))}
      </div>
    </div>
  )
}
