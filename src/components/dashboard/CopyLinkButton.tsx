'use client'

import { useState } from 'react'

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '10px 20px', borderRadius: 999,
        border: '1px solid #EDE3D5',
        background: copied ? '#EAF4EE' : '#fff',
        fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: copied ? '#2D8653' : '#9B8E7E',
        cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif",
        transition: 'all 0.2s'
      }}
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Lien copié !
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copier le lien
        </>
      )}
    </button>
  )
}
