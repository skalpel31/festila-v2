'use client'

import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { uploadCoverImage, uploadMobileCoverImage } from '@/app/dashboard/events/[id]/cover/actions'

const C = { navy: '#0D1323', or: '#D4A373', cream: '#FAF7F3', sand: '#9B8E7E', white: '#fff' }

type Props = {
  eventId:           string
  eventTitle:        string
  coverImage:        string | null
  coverImageMobile:  string | null
  slug:              string
}

function UploadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
    </svg>
  )
}

function PhotoZone({
  label, hint, aspectRatio, preview, pending, success, error,
  onUpload, inputRef,
}: {
  label: string; hint: string; aspectRatio: string
  preview: string | null; pending: boolean; success: boolean; error: string | null
  onUpload: () => void; inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const isPortrait = aspectRatio === '9/16'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Label */}
      <p style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.sand, fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif" }}>
        {label}
      </p>

      {/* Preview */}
      <div style={{
        aspectRatio,
        width: isPortrait ? '100%' : '100%',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#1A1208',
        border: `1px solid ${preview ? '#EDE3D5' : 'rgba(212,163,115,0.2)'}`,
        position: 'relative',
        flexShrink: 0,
      }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: 'rgba(212,163,115,0.2)' }}>✦</span>
            <p style={{ fontSize: 8, color: 'rgba(212,163,115,0.4)', fontFamily: "'Inter', sans-serif", textAlign: 'center', letterSpacing: '0.08em' }}>
              {hint}
            </p>
          </div>
        )}
        {pending && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,19,35,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 10, color: C.cream, fontFamily: "'Inter', sans-serif" }}>Upload…</p>
          </div>
        )}
      </div>

      {/* Bouton upload */}
      <button
        onClick={onUpload}
        disabled={pending}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          width: '100%', padding: '7px 6px',
          background: success ? 'rgba(45,134,83,0.08)' : 'transparent',
          border: `1px solid ${success ? 'rgba(45,134,83,0.3)' : '#EDE3D5'}`,
          borderRadius: 8, fontSize: 10,
          color: success ? '#2D8653' : C.navy,
          cursor: pending ? 'wait' : 'pointer',
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: 'all 0.15s',
          opacity: pending ? 0.7 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {success ? '✓ OK' : pending ? '…' : <><UploadIcon />{preview ? 'Changer' : 'Ajouter'}</>}
      </button>

      {error && <p style={{ fontSize: 10, color: '#C0392B', textAlign: 'center', lineHeight: 1.4 }}>{error}</p>}
    </div>
  )
}

export default function CoverAndHeroCard({ eventId, eventTitle, coverImage, coverImageMobile, slug }: Props) {
  const [previewDesktop, setPreviewDesktop] = useState<string | null>(coverImage)
  const [previewMobile,  setPreviewMobile]  = useState<string | null>(coverImageMobile)
  const [errDesktop, setErrDesktop] = useState<string | null>(null)
  const [errMobile,  setErrMobile]  = useState<string | null>(null)
  const [okDesktop,  setOkDesktop]  = useState(false)
  const [okMobile,   setOkMobile]   = useState(false)
  const [pendingD, startD] = useTransition()
  const [pendingM, startM] = useTransition()
  const refDesktop = useRef<HTMLInputElement>(null)
  const refMobile  = useRef<HTMLInputElement>(null)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'desktop' | 'mobile',
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const setErr  = type === 'desktop' ? setErrDesktop : setErrMobile
    const setOk   = type === 'desktop' ? setOkDesktop  : setOkMobile
    const setPrev = type === 'desktop' ? setPreviewDesktop : setPreviewMobile
    const fallback = type === 'desktop' ? coverImage : coverImageMobile

    setErr(null); setOk(false)
    if (file.size > 10 * 1024 * 1024) { setErr('Max 10 MB'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setErr('JPG, PNG ou WEBP'); return }

    setPrev(URL.createObjectURL(file))

    const fd = new FormData()
    fd.append('file', file)
    fd.append('eventId', eventId)

    const start = type === 'desktop' ? startD : startM
    const action = type === 'desktop' ? uploadCoverImage : uploadMobileCoverImage

    start(async () => {
      try {
        await action(fd)
        setOk(true)
        setTimeout(() => setOk(false), 3000)
      } catch (err: any) {
        setErr(err.message)
        setPrev(fallback)
      }
    })

    // Reset input pour pouvoir re-sélectionner le même fichier
    e.target.value = ''
  }

  return (
    <div style={{ background: C.white, borderRadius: 14, overflow: 'hidden', border: '1px solid #EDE3D5', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: C.navy, padding: '14px 18px 12px' }}>
        <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.or, marginBottom: 4, fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif" }}>
          Photo de couverture
        </p>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 500, color: C.cream, lineHeight: 1.2 }}>
          {eventTitle}
        </p>
      </div>

      {/* Corps */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Deux zones photos */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

          {/* Desktop — prend tout l'espace restant */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <PhotoZone
              label="PC · 16:9 paysage"
              hint="Recommandé"
              aspectRatio="16/9"
              preview={previewDesktop}
              pending={pendingD}
              success={okDesktop}
              error={errDesktop}
              onUpload={() => refDesktop.current?.click()}
              inputRef={refDesktop}
            />
          </div>

          {/* Mobile — largeur fixe compacte */}
          <div style={{ width: 115, flexShrink: 0 }}>
            <PhotoZone
              label="Mobile · 9:16 portrait"
              hint="Optionnel"
              aspectRatio="9/16"
              preview={previewMobile}
              pending={pendingM}
              success={okMobile}
              error={errMobile}
              onUpload={() => refMobile.current?.click()}
              inputRef={refMobile}
            />
          </div>
        </div>

        {/* Inputs cachés */}
        <input ref={refDesktop} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
          onChange={e => handleChange(e, 'desktop')} disabled={pendingD} />
        <input ref={refMobile}  type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
          onChange={e => handleChange(e, 'mobile')} disabled={pendingM} />

        <p style={{ fontSize: 10, color: C.sand, lineHeight: 1.5 }}>
          {previewMobile
            ? '✓ Photo mobile active — les invités voient une image portrait adaptée à leur écran.'
            : 'Photo mobile vide → la photo PC est utilisée (avec recadrage automatique).'}
        </p>

        {/* Séparateur */}
        <div style={{ height: 1, background: '#F0EBE4' }} />

        {/* Éditeur visuel */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/dashboard/events/${eventId}/hero`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 12px', background: C.navy, borderRadius: 10, fontSize: 11, color: C.cream, textDecoration: 'none', fontWeight: 600, letterSpacing: '0.06em', fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
            Éditeur visuel
          </Link>
          <Link
            href={`/e/${slug}`}
            target="_blank"
            style={{ padding: '9px 12px', background: 'transparent', border: '1px solid #EDE3D5', borderRadius: 10, fontSize: 11, color: C.or, textDecoration: 'none', fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap' }}
          >
            Voir le site ↗
          </Link>
        </div>
      </div>
    </div>
  )
}
