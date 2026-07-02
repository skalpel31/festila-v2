'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV = [
  {
    href:  '/admin',
    label: 'Vue d\'ensemble',
    icon:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href:  '/admin/users',
    label: 'Utilisateurs',
    icon:  'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75 M9 7a4 4 0 100 8 4 4 0 000-8z',
  },
  {
    href:  '/admin/events',
    label: 'Événements',
    icon:  'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  },
]

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function AdminSidebar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const pathname  = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen,   setIsOpen]   = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      if (!e.matches) setIsOpen(false)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => { setIsOpen(false) }, [pathname])

  const isActive = (href: string) => href === '/admin' ? pathname === href : pathname.startsWith(href)

  const sidebar = (
    <aside style={{
      width: 220,
      background: '#0D1220',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      ...(isMobile ? {
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        minHeight: '100svh',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      } : {
        position: 'sticky',
        top: 0,
        minHeight: '100svh',
      }),
    }}>

      {/* Fermer (mobile) */}
      {isMobile && (
        <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, lineHeight: 1 }}>
          ×
        </button>
      )}

      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 600, color: '#FAF7F3', letterSpacing: '0.12em', marginBottom: 4 }}>
          FESTILA
        </p>
        <span style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#D4A373', fontWeight: 500 }}>
          Super Admin
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ href, label, icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
              background: active ? 'rgba(212,163,115,0.12)' : 'transparent',
              color: active ? '#D4A373' : 'rgba(255,255,255,0.45)',
              fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: active ? 500 : 400,
              transition: 'all 0.15s',
              borderLeft: active ? '2px solid #D4A373' : '2px solid transparent',
            }}>
              <Icon d={icon} size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bas — profil + retour dashboard */}
      <div style={{ padding: '12px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#D4A373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0A0F1C', flexShrink: 0 }}>
            {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {firstName} {lastName}
          </p>
        </div>
        <Link href="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.35)',
          fontSize: 11, letterSpacing: '0.08em',
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: 'all 0.15s',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Retour au dashboard
        </Link>
      </div>

    </aside>
  )

  return (
    <>
      {/* Hamburger mobile */}
      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ position: 'fixed', top: 14, left: 14, zIndex: 100, width: 40, height: 40, borderRadius: 8, background: '#0D1220', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
        >
          <div style={{ width: 16, height: 1.5, background: '#FAF7F3', borderRadius: 1 }} />
          <div style={{ width: 16, height: 1.5, background: '#FAF7F3', borderRadius: 1 }} />
          <div style={{ width: 10, height: 1.5, background: '#D4A373', borderRadius: 1 }} />
        </button>
      )}

      {/* Backdrop mobile */}
      {isMobile && isOpen && (
        <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      )}

      {sidebar}
    </>
  )
}
