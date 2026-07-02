import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import DashboardMain from '@/components/dashboard/DashboardMain'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: eventCount }] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name, is_super_admin').eq('id', user.id).single(),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('organizer_id', user.id),
  ])

  const role = (eventCount ?? 0) > 0 ? 'Organisateur' : 'Invité'

  return (
    <div style={{ display: 'flex', minHeight: '100svh', background: '#FAF7F3' }}>
      <DashboardSidebar
        firstName={profile?.first_name ?? ''}
        lastName={profile?.last_name ?? ''}
        isSuperAdmin={profile?.is_super_admin ?? false}
        role={role}
      />
      <DashboardMain>{children}</DashboardMain>
    </div>
  )
}
