'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [step,    setStep]    = useState<'idle' | 'confirm'>('idle')
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('event_guests').delete().eq('event_id', eventId)
    await supabase.from('events').delete().eq('id', eventId).eq('organizer_id', user?.id ?? '')
    router.push('/dashboard/events')
  }

  if (step === 'confirm') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#9B8E7E' }}>Confirmer la suppression ?</span>
        <button
          onClick={() => setStep('idle')}
          style={{ background: 'none', border: '1px solid #E0D8D0', borderRadius: 999, padding: '8px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B8E7E', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          Annuler
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{ background: '#C0392B', border: 'none', borderRadius: 999, padding: '8px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          {loading ? 'Suppression…' : 'Oui, supprimer'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setStep('confirm')}
      style={{ background: 'none', border: 'none', fontSize: 12, color: '#C0392B', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.05em', textDecoration: 'underline', textDecorationColor: 'rgba(192,57,43,0.3)' }}
    >
      Supprimer l'événement
    </button>
  )
}
