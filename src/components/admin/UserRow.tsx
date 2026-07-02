'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { deleteUser } from '@/app/admin/users/actions'

const C = {
  card:   'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  text:   '#FAF7F3',
  muted:  'rgba(250,247,243,0.4)',
  or:     '#D4A373',
  green:  '#2D8653',
}

type Props = {
  id: string; firstName: string; lastName: string; createdAt: string
  isAdmin: boolean; evTotal: number; evPublished: number; rsvps: number; isSelf: boolean
}

export default function UserRow({ id, firstName, lastName, createdAt, isAdmin, evTotal, evPublished, rsvps, isSelf }: Props) {
  const [hovered, setHovered]  = useState(false)
  const [confirm, setConfirm]  = useState(false)
  const [pending, startTrans]  = useTransition()
  const [error,   setError]    = useState<string | null>(null)

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
      style={{
        display: 'flex', alignItems: 'center', padding: '18px 24px',
        background: hovered ? 'rgba(255,255,255,0.06)' : C.card,
        border: `1px solid ${hovered ? 'rgba(212,163,115,0.15)' : C.border}`,
        borderRadius: 12, transition: 'all 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar + Nom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: isAdmin ? C.or : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: isAdmin ? '#0A0F1C' : C.muted }}>
          {initials || '?'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 14, color: C.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName || '—'}</p>
            {isAdmin && (
              <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.or, background: 'rgba(212,163,115,0.1)', border: '1px solid rgba(212,163,115,0.18)', padding: '2px 6px', borderRadius: 999, flexShrink: 0 }}>
                Admin
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
            Inscrit le {new Date(createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ width: 110, textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: evTotal > 0 ? C.text : C.muted, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{evTotal}</p>
        <p style={{ fontSize: 10, color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>événements</p>
      </div>
      <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: evPublished > 0 ? C.green : C.muted, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{evPublished}</p>
        <p style={{ fontSize: 10, color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>publiés</p>
      </div>
      <div style={{ width: 80, textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: rsvps > 0 ? C.text : C.muted, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{rsvps}</p>
        <p style={{ fontSize: 10, color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>rsvp</p>
      </div>

      {/* Actions — texte discret */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 24, flexShrink: 0 }}>
        <Link
          href={`/dashboard?viewAs=${id}`}
          style={{ fontSize: 11, color: hovered ? C.or : 'rgba(212,163,115,0.4)', textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", transition: 'color 0.15s', whiteSpace: 'nowrap' }}
        >
          Dashboard
        </Link>

        {!isSelf && (
          error ? (
            <span style={{ fontSize: 11, color: '#E05A4B' }}>{error}</span>
          ) : !confirm ? (
            <button onClick={() => setConfirm(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: hovered ? 'rgba(192,57,43,0.65)' : 'transparent', fontFamily: "'Inter', system-ui, sans-serif", transition: 'color 0.15s', whiteSpace: 'nowrap' }}>
              Supprimer
            </button>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={handleDelete} disabled={pending} style={{ background: 'none', border: 'none', cursor: pending ? 'wait' : 'pointer', fontSize: 11, color: '#E05A4B', fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif", opacity: pending ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                {pending ? 'Suppression…' : 'Confirmer'}
              </button>
              <span style={{ fontSize: 11, color: C.muted }}>·</span>
              <button onClick={() => setConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.muted, fontFamily: "'Inter', system-ui, sans-serif" }}>
                Annuler
              </button>
            </span>
          )
        )}
      </div>
    </div>
  )
}
