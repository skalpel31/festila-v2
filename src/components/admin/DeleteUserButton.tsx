'use client'

import { useState, useTransition } from 'react'
import { deleteUser } from '@/app/admin/users/actions'

export default function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const [step, setStep]       = useState<'idle' | 'confirm'>('idle')
  const [error, setError]     = useState<string | null>(null)
  const [pending, startTrans] = useTransition()

  function handleDelete() {
    setError(null)
    startTrans(async () => {
      try {
        await deleteUser(userId)
      } catch (e: any) {
        setError(e.message ?? 'Une erreur est survenue')
        setStep('idle')
      }
    })
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('confirm')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 22px', borderRadius: 10, border: '1px solid rgba(192,57,43,0.35)',
          background: 'rgba(192,57,43,0.08)', color: '#E05A4B',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        Supprimer le compte
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 20px', background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 12 }}>
      <p style={{ fontSize: 13, color: '#FAF7F3', fontFamily: "'Inter', system-ui, sans-serif" }}>
        Supprimer <strong>{name}</strong> ? Cette action est irréversible — tous ses événements et RSVP seront effacés.
      </p>
      {error && <p style={{ fontSize: 12, color: '#E05A4B' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleDelete}
          disabled={pending}
          style={{
            padding: '8px 16px', borderRadius: 7, border: 'none',
            background: '#C0392B', color: '#fff',
            fontSize: 12, cursor: pending ? 'wait' : 'pointer',
            fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500,
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? 'Suppression…' : 'Oui, supprimer'}
        </button>
        <button
          onClick={() => { setStep('idle'); setError(null) }}
          disabled={pending}
          style={{
            padding: '8px 16px', borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.45)',
            fontSize: 12, cursor: 'pointer',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
