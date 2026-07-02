'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { deleteEvent } from '@/app/admin/actions'

const C = { text: '#FAF7F3', muted: 'rgba(250,247,243,0.35)', or: '#D4A373' }

const STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Brouillon', color: 'rgba(250,247,243,0.35)' },
  published: { label: 'Publié',    color: '#2D8653'                },
  closed:    { label: 'Terminé',   color: '#C0392B'                },
}

type Props = {
  id: string; title: string; slug: string | null; status: string
  organizer: string; eventDate: string | null
}

export default function OverviewEventRow({ id, title, slug, status, organizer, eventDate }: Props) {
  const [hovered,  setHovered]  = useState(false)
  const [confirm,  setConfirm]  = useState(false)
  const [pending,  startTrans]  = useTransition()
  const [error,    setError]    = useState<string | null>(null)
  const s = STATUS[status] ?? STATUS.draft

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
      style={{ borderRadius: 10, background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.12s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (!confirm) setConfirm(false) }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        {/* Titre cliquable */}
        <Link href={slug ? `/e/${slug}` : '#'} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
          <p style={{ fontSize: 13, color: C.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </p>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {organizer}
            {eventDate && ` · ${new Date(eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
        </Link>

        {/* Statut */}
        <span style={{ fontSize: 10, letterSpacing: '0.1em', color: s.color, flexShrink: 0, textTransform: 'uppercase' }}>
          {s.label}
        </span>

        {/* Action supprimer — texte discret */}
        {!confirm ? (
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
        )}
      </div>
    </div>
  )
}
