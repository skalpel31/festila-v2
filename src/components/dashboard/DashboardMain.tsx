'use client'

import { useState, useEffect } from 'react'

export default function DashboardMain({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <main style={{
      flex: 1,
      padding: isMobile ? '72px 20px 40px' : '40px 48px',
      overflowY: 'auto',
      minWidth: 0,
    }}>
      {children}
    </main>
  )
}
