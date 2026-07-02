'use client'

import { useState, useRef, useEffect } from 'react'

type UnsplashPhoto = {
  id: string
  urls: { regular: string; small: string }
  alt_description: string | null
  user: { name: string }
  links: { download_location: string }
}

export default function UnsplashPicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [photos,  setPhotos]  = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  async function search(q: string) {
    if (!q.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=16&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}` } }
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPhotos(data.results ?? [])
      if (!data.results?.length) setError('Aucune photo trouvée pour cette recherche.')
    } catch {
      setError('Erreur lors de la recherche. Vérifiez votre clé API.')
    }
    setLoading(false)
  }

  async function handleSelect(photo: UnsplashPhoto) {
    // Obligatoire par les conditions Unsplash : signaler le téléchargement
    fetch(photo.links.download_location, {
      headers: { Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}` }
    }).catch(() => {})
    onSelect(photo.urls.regular)
    setOpen(false)
    setQuery('')
    setPhotos([])
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px dashed #C4B8A8', borderRadius: 8, padding: '9px 16px', fontSize: 12, color: '#6B5E50', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Chercher sur Unsplash
      </button>

      {/* Modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(13,19,35,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{ background: '#FAF7F3', borderRadius: 18, width: '100%', maxWidth: 760, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(13,19,35,0.3)' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDE3D5', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search(query)}
                  placeholder="Rechercher une photo… (mariage, château, fleurs…)"
                  style={{ width: '100%', background: '#fff', border: '1px solid #E0D8D0', borderRadius: 10, padding: '11px 44px 11px 16px', fontSize: 14, color: '#0D1323', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => search(query)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7E', display: 'flex' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </button>
              </div>
              <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7E', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
            </div>

            {/* Suggestions rapides */}
            {!photos.length && !loading && (
              <div style={{ padding: '12px 24px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Mariage', 'Anniversaire', 'Château', 'Fleurs', 'Fête', 'Champagne', 'Baptême'].map(s => (
                  <button key={s} type="button" onClick={() => { setQuery(s); search(s) }} style={{ background: '#fff', border: '1px solid #EDE3D5', borderRadius: 999, padding: '5px 14px', fontSize: 12, color: '#6B5E50', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Contenu */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 24px' }}>
              {loading && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9B8E7E', fontSize: 13 }}>Recherche en cours…</div>
              )}
              {error && !loading && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#C0392B', fontSize: 13 }}>{error}</div>
              )}
              {!loading && photos.length > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                    {photos.map(photo => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => handleSelect(photo)}
                        style={{ padding: 0, border: 'none', cursor: 'pointer', borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', background: '#EDE3D5', display: 'block', width: '100%' }}
                      >
                        <img
                          src={photo.urls.small}
                          alt={photo.alt_description ?? ''}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.2s' }}
                        />
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: '#C4B8A8', textAlign: 'center', marginTop: 16, letterSpacing: '0.05em' }}>
                    Photos par <a href="https://unsplash.com" target="_blank" rel="noreferrer" style={{ color: '#C4B8A8' }}>Unsplash</a>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
