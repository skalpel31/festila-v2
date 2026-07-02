'use client'

import Link from 'next/link'
import { useState } from 'react'

const C = { card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.07)', text: '#FAF7F3', muted: 'rgba(250,247,243,0.4)', or: '#D4A373' }

type Props = { label: string; value: number; sub: string; href?: string }

export default function StatCard({ label, value, sub, href }: Props) {
  const [hovered, setHovered] = useState(false)

  const inner = (
    <div style={{ padding: '24px 20px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.or, marginBottom: 12, fontWeight: 500 }}>
        {label}
      </p>
      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 44, fontWeight: 600, color: C.text, lineHeight: 1, marginBottom: 6 }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: C.muted }}>{sub}</p>
    </div>
  )

  const style = {
    background: C.card,
    border: `1px solid ${hovered && href ? 'rgba(212,163,115,0.3)' : C.border}`,
    borderRadius: 14,
    transition: 'border-color 0.15s',
    display: 'block',
    textDecoration: 'none',
    cursor: href ? 'pointer' : 'default',
  }

  return href ? (
    <Link href={href} style={style} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {inner}
    </Link>
  ) : (
    <div style={style}>{inner}</div>
  )
}
