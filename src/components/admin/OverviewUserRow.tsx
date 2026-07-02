'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { deleteUser } from '@/app/admin/actions'

const C = { text: '#FAF7F3', muted: 'rgba(250,247,243,0.35)', or: '#D4A373' }

type Props = {
  id: string; firstName: string; lastName: string
  createdAt: string; isAdmin: boolean; isSelf: boolean
}

export default function OverviewUserRow({ id, firstName, lastName, createdAt, isAdmin, isSelf }: Props) {
  const [hovered,  setHovered]  = useState(false)
  const [confirm,  setConfirm]  = useState(false)
  const [pending,  startTrans]  = useTransition()
  const [error,    setError]    = useState<string | null>(null)

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim()

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    setError(null)
    startTrans(async () => {
      try { await deleteUser(id) }
      catch (err: any) { setError(err.message); setConfirm(false) }
    })
  }

  return (
    <div
      style={{ borderRadius: 10, background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.12s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        {/* Avatar */}
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: isAdmin ? C.or : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: isAdmin ? '#0A0F1C' : C.muted, flexShrink: 0 }}>
          {initials || '?'}
        </div>

        {/* Nom cliquable → dashboard */}
        <Link href={`/dashboard?viewAs=${id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
          <p style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
            {fullName}
            {isAdmin && <span style={{ marginLeft: 8, fontSize: 9, letterSpacing: '0.1em', color: C.or, textTransform: 'uppercase' }}>Admin</span>}
          </p>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
            Inscrit le {new Date(createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </Link>

        {/* Action supprimer — texte discret, caché si c'est soi-même */}
        {!isSelf && (
          !confirm ? (
            <button
              onClick={() => setConfirm(true)}
              style={{
                background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer',
                fontSize: 11, color: hovered ? 'rgba(192,57,43,0.7)' : 'transparent',
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: 'color 0.15s', flexShrink: 0,
              }}
            >
              Supprimer
            </button>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {error && <span style={{ fontSize: 11, color: '#E05A4B' }}>{error}</span>}
              <button
                onClick={handleDelete}
                disabled={pending}
                style={{ background: 'none', border: 'none', cursor: pending ? 'wait' : 'pointer', fontSize: 11, color: '#E05A4B', fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif", opacity: pending ? 0.6 : 1 }}
              >
                {pending ? 'Suppression…' : 'Confirmer'}
              </button>
              <span style={{ fontSize: 11, color: C.muted }}>·</span>
              <button
                onClick={() => setConfirm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.muted, fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Annuler
              </button>
            </span>
          )
        )}
      </div>
    </div>
  )
}
