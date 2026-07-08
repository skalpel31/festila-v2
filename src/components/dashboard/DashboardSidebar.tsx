'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useMemo } from 'react'

const C = { navy: '#0D1323', rose: '#E787B2', or: '#D4A373', cream: '#FAF7F3', sand: '#9B8E7E' }

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ICONS: Record<string, string> = {
  home:     'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  mail:     'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
  grid:     'M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13 13h8v8h-8z',
  euro:     'M17 5a6.5 6.5 0 100 14 M4 10h9 M4 14h7',
  table:    'M3 8h18M3 8v10M21 8v10M7 8v10M17 8v10 M3 8a2 2 0 012-2h14a2 2 0 012 2',
}

const NAV = [
  { href: '/dashboard',             label: 'Accueil',         icon: 'home' },
  { href: '/dashboard/events',      label: 'Mes événements',  icon: 'calendar' },
  { href: '/dashboard/invitations', label: 'Mes invitations', icon: 'mail' },
  { href: '/dashboard/settings',    label: 'Paramètres',      icon: 'settings' },
]

// Sous-navigation propre à l'événement actif — s'affiche quand on est sur
// /dashboard/events/[id] ou une de ses sous-pages (hors /new).
const EVENT_NAV = [
  { suffix: '',        label: 'Tableau de bord', icon: 'grid' },
  { suffix: '/budget', label: 'Budget',          icon: 'euro' },
  { suffix: '/plan',   label: 'Plan de table',   icon: 'table' },
]

export default function DashboardSidebar({
  firstName, lastName, isSuperAdmin, role,
}: {
  firstName: string
  lastName: string
  isSuperAdmin: boolean
  role: string
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen,   setIsOpen]   = useState(false)
  const [eventTitle, setEventTitle] = useState('')

  const activeEventId = useMemo(() => {
    const m = pathname.match(/^\/dashboard\/events\/([^/]+)/)
    return m && m[1] !== 'new' ? m[1] : null
  }, [pathname])

  useEffect(() => {
    if (!activeEventId) { setEventTitle(''); return }
    let cancelled = false
    const supabase = createClient()
    supabase.from('events').select('title').eq('id', activeEventId).single().then(({ data }) => {
      if (!cancelled) setEventTitle(data?.title ?? '')
    })
    return () => { cancelled = true }
  }, [activeEventId])

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

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const sidebarContent = (
    <aside style={{
      width: 240,
      background: C.navy,
      display: 'flex',
      flexDirection: 'column',
      ...(isMobile ? {
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        minHeight: '100svh',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '4px 0 24px rgba(13,19,35,0.35)',
      } : {
        position: 'sticky',
        top: 0,
        minHeight: '100svh',
      }),
    }}>

      {/* Bouton fermer (mobile) */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(false)}
          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, lineHeight: 1 }}
        >
          ×
        </button>
      )}

      {/* Logo */}
      <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.cream, letterSpacing: '0.1em' }}>
            FESTILA
          </p>
          <div style={{ width: 28, height: 2, background: C.or, borderRadius: 999, marginTop: 6, marginBottom: 6 }} />
        </Link>
        <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.or, fontWeight: 500 }}>
          {role}
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ href, label, icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, textDecoration: 'none',
              background: active ? 'rgba(212,163,115,0.15)' : 'transparent',
              color: active ? C.or : 'rgba(255,255,255,0.55)',
              fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: active ? 500 : 400, transition: 'all 0.2s',
            }}>
              <Icon d={ICONS[icon]} size={16} />
              {label}
              {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: C.or }} />}
            </Link>
          )
        })}

        {activeEventId && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0 8px' }} />
            <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '0 14px', marginBottom: 8 }}>
              Événement actif
            </p>
            {eventTitle && (
              <p style={{ fontSize: 13, color: C.cream, padding: '0 14px', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                {eventTitle}
              </p>
            )}
            {EVENT_NAV.map(({ suffix, label, icon }) => {
              const href = `/dashboard/events/${activeEventId}${suffix}`
              const active = pathname === href
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10, textDecoration: 'none',
                  background: active ? 'rgba(212,163,115,0.15)' : 'transparent',
                  color: active ? C.or : 'rgba(255,255,255,0.55)',
                  fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: active ? 500 : 400, transition: 'all 0.2s',
                }}>
                  <Icon d={ICONS[icon]} size={16} />
                  {label}
                  {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: C.or }} />}
                </Link>
              )
            })}
          </>
        )}

        {isSuperAdmin && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />
            <Link href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, textDecoration: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.55)',
              fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 400,
            }}>
              <Icon d={ICONS.shield} size={16} />
              Super Admin
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', opacity: 0.4 }}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
            </Link>
          </>
        )}
      </nav>

      {/* Profil + déconnexion */}
      <div style={{ padding: '16px 12px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 8, borderRadius: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.rose, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
            {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
          </div>
          <p style={{ fontSize: 13, color: C.cream, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {firstName} {lastName}
          </p>
        </div>
        <button onClick={logout} style={{
          width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '9px', fontSize: 11, letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          fontFamily: "'Inter', system-ui, sans-serif", textTransform: 'uppercase',
        }}>
          Se déconnecter
        </button>
      </div>

    </aside>
  )

  return (
    <>
      {/* Hamburger (mobile, sidebar fermée) */}
      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', top: 16, left: 16, zIndex: 100,
            width: 44, height: 44, borderRadius: 10,
            background: C.navy, border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: '0 4px 12px rgba(13,19,35,0.25)',
          }}
          aria-label="Ouvrir le menu"
        >
          <div style={{ width: 18, height: 2, background: C.cream, borderRadius: 1 }} />
          <div style={{ width: 18, height: 2, background: C.cream, borderRadius: 1 }} />
          <div style={{ width: 12, height: 2, background: C.or, borderRadius: 1 }} />
        </button>
      )}

      {/* Backdrop (mobile, sidebar ouverte) */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(13,19,35,0.5)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {sidebarContent}
    </>
  )
}
