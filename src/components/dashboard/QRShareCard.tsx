'use client'

import Link from 'next/link'
import { useState } from 'react'

const C = { navy: '#0D1323', or: '#D4A373', cream: '#FAF7F3', sand: '#9B8E7E', white: '#fff' }

type Props = {
  title:   string
  slug:    string
  status:  string
  eventId: string
}

export default function QRShareCard({ title, slug, status }: Props) {
  const [copied, setCopied] = useState(false)

  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://festila.com'
  const vitrineUrl = `${siteUrl}/e/${slug}`
  const qrBase     = `https://api.qrserver.com/v1/create-qr-code/?bgcolor=FAF5EE&color=0D1323&margin=10`
  const qrDisplay  = `${qrBase}&size=400x400&data=${encodeURIComponent(vitrineUrl)}&format=svg`
  const qrPng      = `${qrBase}&size=600x600&data=${encodeURIComponent(vitrineUrl)}&format=png`
  const qrSvg      = `${qrBase}&size=600x600&data=${encodeURIComponent(vitrineUrl)}&format=svg`
  const isOnline   = status === 'published'
  const shareText  = encodeURIComponent(`Tu es invité(e) à ${title} ! Réponds ici : ${vitrineUrl}`)

  async function copyLink() {
    try { await navigator.clipboard.writeText(vitrineUrl) }
    catch {
      const i = document.createElement('input'); i.value = vitrineUrl
      document.body.appendChild(i); i.select(); document.execCommand('copy'); document.body.removeChild(i)
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background: C.white, borderRadius: 14, overflow: 'hidden', border: '1px solid #EDE3D5', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: C.navy, padding: '14px 18px 12px' }}>
        <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.or, marginBottom: 4, fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif" }}>QR Code & Partage</p>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 500, color: C.cream, lineHeight: 1.2 }}>{title}</p>
      </div>

      <div style={{ padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* QR + boutons principaux */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ background: '#FAF5EE', borderRadius: 8, padding: 7, border: '1px solid #EDE3D5', display: 'inline-block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDisplay} alt="QR" width={110} height={110} style={{ display: 'block', borderRadius: 3 }} />
            </div>
            <p style={{ fontSize: 9, color: C.sand, textAlign: 'center', marginTop: 4 }}>Scan → invités</p>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <Link href={`/e/${slug}`} target="_blank"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.navy, color: C.cream, padding: '9px 11px', borderRadius: 8, textDecoration: 'none', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', system-ui, sans-serif" }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                Voir site invités
              </span>
              <span style={{ opacity: 0.4 }}>→</span>
            </Link>

            <button onClick={copyLink}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'transparent', border: '1px solid #EDE3D5', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: copied ? '#2D8653' : C.navy, cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", transition: 'color 0.15s' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 2px' }}>
              <span style={{ fontSize: 10, color: C.sand }}>Statut</span>
              <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, padding: '2px 8px', borderRadius: 999, color: isOnline ? '#2D8653' : C.sand, background: isOnline ? 'rgba(45,134,83,0.1)' : 'rgba(155,142,126,0.1)', border: `1px solid ${isOnline ? 'rgba(45,134,83,0.2)' : 'rgba(155,142,126,0.15)'}` }}>
                {isOnline ? 'En ligne' : 'Brouillon'}
              </span>
            </div>
          </div>
        </div>

        {/* Partager */}
        <div>
          <p style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.sand, marginBottom: 7, fontWeight: 500 }}>Partager</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'WhatsApp', href: `https://wa.me/?text=${shareText}`, color: '#128C7E', bg: 'rgba(37,211,102,0.08)', border: 'rgba(37,211,102,0.2)', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
              { label: 'Email',    href: `mailto:?subject=${encodeURIComponent(`Invitation — ${title}`)}&body=${shareText}`, color: '#B84A80', bg: 'rgba(231,135,178,0.08)', border: 'rgba(231,135,178,0.2)', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#E787B2" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg> },
              { label: 'SMS',     href: `sms:?body=${shareText}`,             color: '#4A90E2', bg: 'rgba(74,144,226,0.08)', border: 'rgba(74,144,226,0.2)', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 4px', borderRadius: 8, background: s.bg, border: `1px solid ${s.border}`, fontSize: 10, color: s.color, textDecoration: 'none', fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif" }}>
                {s.icon}{s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Télécharger */}
        <div>
          <p style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.sand, marginBottom: 7, fontWeight: 500 }}>Télécharger QR</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <a href={qrPng} download={`qr-${slug}.png`} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', background: C.navy, borderRadius: 8, fontSize: 10, color: C.cream, textDecoration: 'none', fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              PNG — Tables
            </a>
            <a href={qrSvg} download={`qr-${slug}.svg`} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', background: 'transparent', border: '1px solid #EDE3D5', borderRadius: 8, fontSize: 10, color: C.navy, textDecoration: 'none', fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              SVG — Imprim.
            </a>
          </div>
          <p style={{ fontSize: 9, color: C.sand, marginTop: 6, textAlign: 'center', lineHeight: 1.4 }}>
            PNG tables · SVG imprimeur & faire-part
          </p>
        </div>
      </div>
    </div>
  )
}
