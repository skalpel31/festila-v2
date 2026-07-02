import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('profiles')
    .select('first_name, last_name, is_super_admin')
    .eq('id', user.id)
    .single()

  if (!me?.is_super_admin) redirect('/dashboard')

  return (
    <div style={{ display: 'flex', minHeight: '100svh', background: '#0A0F1C', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <AdminSidebar firstName={me.first_name ?? ''} lastName={me.last_name ?? ''} />
      <main style={{ flex: 1, padding: '48px 40px', overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
