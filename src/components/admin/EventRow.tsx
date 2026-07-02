'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { deleteEvent } from '@/app/admin/events/actions'

const C = {
  text:   '#FAF7F3',
  muted:  'rgba(250,247,243,0.4)',
  or:     '#D4A373',
  green:  '#2D8653',
  border: 'rgba(255,255,255,0.07)',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Brouillon', color: 'rgba(250,247,243,0.4)',  bg: 'rgba(255,255,255,0.05)' },
  published: { label: 'Publié',    color: '#2D8653',                bg: 'rgba(45,134,83,0.12)'   },
  closed:    { label: 'Terminé',   color: '#C0392B',                bg: 'rgba(192,57,43,0.12)'   },
}

type Props = {
  id: string; title: string; slug: string | null; status: string
  eventDate: string | null; eventType: string | null
  orgName: string; confirmed: number; totalRsvp: number; isLast: boolean
}

export default function EventRow({ id, title, slug, status, eventDate, eventType, orgName, confirmed, totalRsvp, isLast }: Props) {
  const [hovered,  setHovered]  = useState(false)
  const [confirm,  setConfirm]  = useState(false)
  const [pending,  startTrans]  = useTransition()
  const [error,    setError]    = useState<string | null>(null)
  const s = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    setError(null)
    startTrans(async () => {
      try { await deleteEvent(id) }
      catch (err: any) { setError(err.message); setConfirm(false) }
    })
  }

  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
        background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        transition: 'background 0.12s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 130px 100px 110px 80px auto', padding: '14px 24px', alignItems: 'center', gap: 0 }}>

        {/* Titre → vitrine */}
        <Link href={slug ? `/e/${slug}` : '#'} style={{ textDecoration: 'none', paddingRight: 16 }}>
          <p style={{ fontSize: 13, color: C.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </p>
        </Link>

        <p style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orgName || '—'}</p>

        <p style={{ fontSize: 12, color: C.muted }}>
          {eventDate ? new Date(eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </p>

        <p style={{ fontSize: 11, color: C.or, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eventType ?? '—'}</p>

        <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.color, background: s.bg, padding: '3px 10px', borderRadius: 999, width: 'fit-content' }}>
          {s.label}
        </span>

        <div>
          <p style={{ fontSize: 13, color: confirmed > 0 ? C.green : C.muted, fontWeight: confirmed > 0 ? 600 : 400 }}>{confirmed}</p>
          {totalRsvp > 0 && <p style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{totalRsvp} RSVP</p>}
        </div>

        {/* Supprimer discret */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          {error && <span style={{ fontSize: 11, color: '#E05A4B' }}>{error}</span>}
          {!confirm ? (
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
          )}
        </div>
      </div>
    </div>
  )
}
