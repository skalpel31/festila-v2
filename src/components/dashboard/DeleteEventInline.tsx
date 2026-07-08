'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteEventInline({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Supprimer "${eventTitle}" ? Cette action est irréversible.`)) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('event_guests').delete().eq('event_id', eventId)
    await supabase.from('events').delete().eq('id', eventId).eq('organizer_id', user?.id ?? '')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Supprimer l'événement"
      style={{ background: 'none', border: 'none', color: '#C0392B', cursor: loading ? 'wait' : 'pointer', fontSize: 11, letterSpacing: '0.05em', textDecoration: 'underline', textDecorationColor: 'rgba(192,57,43,0.3)', fontFamily: "'Inter', system-ui, sans-serif", padding: 0 }}
    >
      {loading ? '…' : 'Supprimer'}
    </button>
  )
}
