'use client'

import Link from 'next/link'
import { useRef, useState, useTransition, useLayoutEffect } from 'react'
import { saveHeroConfig } from '@/app/dashboard/events/[id]/cover/actions'
import {
  DEFAULT_HERO_CONFIG, ELEMENT_LABELS, BASE_FONT_SVH, previewFontPx,
  type HeroConfig, type HeroElement, type HeroElementKey,
} from '@/lib/hero-config'

// En mode mobile : svh = % de la hauteur du viewport navigateur (~900px),
// très proche du vrai téléphone (~844px) → le preview mobile est fidèle au site
function elementFontSize(key: HeroElementKey, el: HeroElement, previewH: number, isMobile: boolean): string | number {
  if (isMobile) return `calc(${el.scale} * ${BASE_FONT_SVH[key]}svh)`
  return previewFontPx(key, el.scale, previewH)
}

const C = { navy: '#0D1323', or: '#D4A373', cream: '#FAF7F3', sand: '#9B8E7E', white: '#fff', border: '#EDE3D5' }
const ELEMENT_KEYS: HeroElementKey[] = ['title', 'eventType', 'date', 'time', 'location']

function elementText(key: HeroElementKey, event: any, dateStr: string | null) {
  switch (key) {
    case 'title':     return event.title
    case 'eventType': return event.event_type ?? 'Type d\'événement'
    case 'date':      return dateStr ?? 'Date de l\'événement'
    case 'time':      return event.event_time ? event.event_time.slice(0, 5) : '20:00'
    case 'location':  return event.location ?? 'Lieu de l\'événement'
  }
}

function elementCSS(key: HeroElementKey, el: HeroElement, h: number, isMobile = false): React.CSSProperties {
  return {
    fontSize:      elementFontSize(key, el, h, isMobile),
    fontFamily:    key === 'title' ? "'Playfair Display', Georgia, serif" : "'Inter', system-ui, sans-serif",
    fontWeight:    key === 'title' ? 700 : 400,
    color:         key === 'eventType' ? C.or : key === 'title' ? '#FAF7F3' : 'rgba(250,247,243,0.8)',
    textTransform: key !== 'title' ? 'uppercase' as const : 'none' as const,
    letterSpacing: key !== 'title' ? '0.2em' : '0.01em',
    textAlign:     'center' as const,
    whiteSpace:    'nowrap' as const,
    lineHeight:    1.2,
    textShadow:    '0 1px 6px rgba(0,0,0,0.5)',
    userSelect:    'none',
    pointerEvents: 'none',
  }
}

export default function HeroEditor({ event }: { event: any }) {
  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  // Merge avec les défauts pour les anciennes configs sans focalX/focalY
  const [config,   setConfig]   = useState<HeroConfig>(() => ({ ...DEFAULT_HERO_CONFIG, ...(event.hero_config ?? {}) }))
  const [selected, setSelected] = useState<HeroElementKey>('title')
  const [saved,    setSaved]    = useState(false)
  const [saveErr,  setSaveErr]  = useState<string | null>(null)
  const [pending,  startTrans]  = useTransition()
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

  // Preview container — dimensions selon le mode
  const previewRef    = useRef<HTMLDivElement>(null)
  const [previewH, setPreviewH] = useState(450)
  useLayoutEffect(() => {
    if (!previewRef.current) return
    const update = () => setPreviewH(previewRef.current!.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(previewRef.current)
    return () => ro.disconnect()
  }, [])

  // Drag — ref pour éviter les closures périmées
  const dragRef    = useRef<{ key: HeroElementKey; sx: number; sy: number; ex: number; ey: number } | null>(null)
  const didDragRef = useRef(false) // évite de déclencher le focal point après un drag

  function updateEl(key: HeroElementKey, patch: Partial<HeroElement>) {
    setConfig(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  function handleSave() {
    setSaveErr(null)
    startTrans(async () => {
      try { await saveHeroConfig(event.id, config); setSaved(true); setTimeout(() => setSaved(false), 2500) }
      catch (e: any) { setSaveErr(e.message) }
    })
  }

  const sel = config[selected] as HeroElement

  return (
    <div style={{ minHeight: '100svh', background: '#F5F0EA', display: 'flex', flexDirection: 'column' }}>

      {/* Barre du haut */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href={`/dashboard/events/${event.id}`} style={{ fontSize: 12, color: C.sand, textDecoration: 'none' }}>← Retour</Link>
          <div style={{ width: 1, height: 14, background: C.border }} />
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: C.navy, fontWeight: 500 }}>{event.title}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saveErr && <p style={{ fontSize: 11, color: '#C0392B', maxWidth: 200 }}>{saveErr}</p>}
          <Link href={`/e/${event.slug}`} target="_blank"
            style={{ padding: '7px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.sand, textDecoration: 'none' }}>
            Voir le site ↗
          </Link>
          <button onClick={handleSave} disabled={pending}
            style={{ padding: '7px 16px', background: saved ? '#2D8653' : C.navy, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, color: C.cream, cursor: pending ? 'wait' : 'pointer', transition: 'background 0.2s', letterSpacing: '0.06em' }}>
            {saved ? '✓ Enregistré' : pending ? 'En cours…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Corps — preview gauche + contrôles droite */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ── Preview portrait 9:16 (simulation mobile) ── */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 10, overflowY: 'auto' }}>

          {/* Toggle Desktop / Mobile */}
          <div style={{ display: 'flex', background: '#F0EBE4', borderRadius: 10, padding: 3, gap: 2 }}>
            {(['desktop', 'mobile'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif",
                  background: viewMode === mode ? C.white : 'transparent',
                  color:      viewMode === mode ? C.navy  : C.sand,
                  boxShadow:  viewMode === mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {mode === 'desktop'
                  ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Desktop</>
                  : <><svg width="11" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>Mobile</>
                }
              </button>
            ))}
          </div>

          <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.sand, textAlign: 'center' }}>
            {viewMode === 'desktop' ? 'Aperçu desktop — photo recadrée plein-écran' : `Aperçu mobile — ratio réel de la photo${config.nativeW && config.nativeH ? ` (${config.nativeW}×${config.nativeH})` : ''}`} · Glissez les éléments
          </p>

          {/* Conteneur : desktop = 16:9, mobile = ratio réel de la photo (ou 9:16 fallback) */}
          <div style={(() => {
            if (viewMode === 'desktop') return { width: '100%', maxWidth: 720, aspectRatio: '16/9', position: 'relative' as const }
            const nW = config.nativeW, nH = config.nativeH
            if (nW && nH) {
              // Photo paysage : preview en ratio réel (montre exactement ce que voit le mobile)
              // Photo portrait : limité en hauteur pour garder l'éditeur utilisable
              return nW > nH
                ? { width: '100%', maxWidth: 480, aspectRatio: `${nW}/${nH}`, position: 'relative' as const }
                : { height: 'min(70vh, 560px)', aspectRatio: `${nW}/${nH}`, position: 'relative' as const }
            }
            return { height: 'min(76vh, 580px)', aspectRatio: '9/16', position: 'relative' as const }
          })()}>
            <div
              ref={previewRef}
              style={{
                width: '100%', height: '100%',
                position: 'relative', overflow: 'hidden',
                borderRadius: 20,
                background: '#1A1208',
                boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
                touchAction: 'none',
                cursor: 'crosshair',
              }}
              onClick={(e) => {
                if (didDragRef.current) { didDragRef.current = false; return }
                const rect = previewRef.current!.getBoundingClientRect()
                setConfig(p => ({
                  ...p,
                  focalX: Math.round((e.clientX - rect.left) / rect.width * 100),
                  focalY: Math.round((e.clientY - rect.top)  / rect.height * 100),
                }))
              }}
            >
              {/* Photo — objectFit:cover IDENTIQUE à la vitrine */}
              {event.cover_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.cover_image}
                  alt=""
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget
                    if (img.naturalWidth && img.naturalHeight) {
                      setConfig(p => ({ ...p, nativeW: img.naturalWidth, nativeH: img.naturalHeight }))
                    }
                  }}
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${config.focalX ?? 50}% ${config.focalY ?? 50}%`,
                  }}
                />
              )}

              {/* Crosshair point focal */}
              <div style={{
                position: 'absolute',
                left: `${config.focalX ?? 50}%`,
                top: `${config.focalY ?? 50}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 15,
              }}>
                <div style={{ position: 'absolute', top: '50%', left: -10, right: -10, height: 1, background: '#D4A373', transform: 'translateY(-50%)', opacity: 0.85 }} />
                <div style={{ position: 'absolute', left: '50%', top: -10, bottom: -10, width: 1, background: '#D4A373', transform: 'translateX(-50%)', opacity: 0.85 }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #D4A373', background: 'rgba(212,163,115,0.3)' }} />
              </div>

              {/* Dégradé configurable */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to top, rgba(26,18,8,${config.gradientOpacity}) 0%, rgba(26,18,8,${config.gradientOpacity * 0.25}) 55%, transparent 100%)`,
              }} />

              {/* Logo fixe */}
              <p style={{ position: 'absolute', top: '3%', left: 0, right: 0, textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: previewFontPx('eventType', 1, previewH) * 0.9, color: 'rgba(250,247,243,0.7)', letterSpacing: '0.3em', pointerEvents: 'none', zIndex: 2 }}>
                FESTILA
              </p>

              {/* Éléments draggables */}
              {ELEMENT_KEYS.filter(k => (config[k] as HeroElement).visible).map(key => {
                const el = config[key] as HeroElement
                const isSelected = selected === key
                return (
                  <div
                    key={key}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top:  `${el.y}%`,
                      transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                      cursor: 'grab',
                      outline: isSelected ? '1.5px dashed rgba(212,163,115,0.9)' : 'none',
                      outlineOffset: 5,
                      borderRadius: 3,
                      padding: '1px 3px',
                      zIndex: isSelected ? 10 : 5,
                      touchAction: 'none',
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      e.currentTarget.setPointerCapture(e.pointerId)
                      e.currentTarget.style.cursor = 'grabbing'
                      setSelected(key)
                      dragRef.current = { key, sx: e.clientX, sy: e.clientY, ex: el.x, ey: el.y }
                    }}
                    onPointerMove={(e) => {
                      if (!dragRef.current || dragRef.current.key !== key) return
                      didDragRef.current = true
                      const rect = previewRef.current?.getBoundingClientRect()
                      if (!rect) return
                      const d = dragRef.current
                      updateEl(key, {
                        x: Math.max(2, Math.min(98, d.ex + ((e.clientX - d.sx) / rect.width)  * 100)),
                        y: Math.max(2, Math.min(98, d.ey + ((e.clientY - d.sy) / rect.height) * 100)),
                      })
                    }}
                    onPointerUp={(e) => {
                      dragRef.current = null
                      e.currentTarget.releasePointerCapture(e.pointerId)
                      e.currentTarget.style.cursor = 'grab'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <span style={elementCSS(key, el, previewH, viewMode === 'mobile')}>
                      {elementText(key, event, dateStr)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <p style={{ fontSize: 9, color: 'rgba(155,142,126,0.7)', textAlign: 'center', lineHeight: 1.6 }}>
            Cliquez sur la photo pour déplacer le point focal (croix dorée) · Il centre le cadrage mobile sur ce point
          </p>
        </div>

        {/* ── Panneau de contrôles ── */}
        <div style={{ width: 268, flexShrink: 0, background: C.white, borderLeft: `1px solid ${C.border}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Liste des éléments */}
          <section style={{ padding: '16px 16px 12px', borderBottom: `1px solid #F0EBE4` }}>
            <p style={{ fontSize: 9, letterSpacing: '0.17em', textTransform: 'uppercase', color: C.sand, marginBottom: 10, fontWeight: 500 }}>Éléments</p>
            {ELEMENT_KEYS.map(key => {
              const el = config[key] as HeroElement
              return (
                <div key={key} onClick={() => setSelected(key)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 9px', borderRadius: 8, marginBottom: 3, cursor: 'pointer', background: selected === key ? 'rgba(212,163,115,0.08)' : 'transparent', border: `1px solid ${selected === key ? 'rgba(212,163,115,0.2)' : 'transparent'}`, transition: 'all 0.12s' }}>
                  <span style={{ fontSize: 12, color: el.visible ? C.navy : C.sand }}>{ELEMENT_LABELS[key]}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateEl(key, { visible: !el.visible }) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }} title={el.visible ? 'Masquer' : 'Afficher'}>
                    {el.visible
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.or} strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.sand} strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                    }
                  </button>
                </div>
              )
            })}
          </section>

          {/* Propriétés de l'élément sélectionné */}
          <section style={{ padding: '16px 16px 12px', borderBottom: `1px solid #F0EBE4` }}>
            <p style={{ fontSize: 9, letterSpacing: '0.17em', textTransform: 'uppercase', color: C.sand, marginBottom: 10, fontWeight: 500 }}>
              {ELEMENT_LABELS[selected]}
            </p>

            <label style={{ display: 'block', fontSize: 11, color: C.navy, marginBottom: 5 }}>
              Taille <span style={{ color: C.sand, fontWeight: 400 }}>× {sel.scale.toFixed(1)}</span>
            </label>
            <input type="range" min={0.4} max={3.0} step={0.05}
              value={sel.scale}
              onChange={e => updateEl(selected, { scale: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: C.or, marginBottom: 14 }}
            />

            <label style={{ display: 'block', fontSize: 11, color: C.navy, marginBottom: 5 }}>
              Inclinaison <span style={{ color: C.sand, fontWeight: 400 }}>{sel.rotation > 0 ? '+' : ''}{sel.rotation}°</span>
            </label>
            <input type="range" min={-45} max={45} step={1}
              value={sel.rotation}
              onChange={e => updateEl(selected, { rotation: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: C.or, marginBottom: 14 }}
            />

            <button onClick={() => updateEl(selected, { x: 50, y: DEFAULT_HERO_CONFIG[selected].y, scale: 1, rotation: 0 })}
              style={{ width: '100%', padding: '7px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.sand, cursor: 'pointer' }}>
              Réinitialiser cet élément
            </button>
          </section>

          {/* Dégradé */}
          <section style={{ padding: '16px 16px 12px', borderBottom: `1px solid #F0EBE4` }}>
            <p style={{ fontSize: 9, letterSpacing: '0.17em', textTransform: 'uppercase', color: C.sand, marginBottom: 10, fontWeight: 500 }}>Dégradé</p>
            <label style={{ display: 'block', fontSize: 11, color: C.navy, marginBottom: 5 }}>
              Intensité <span style={{ color: C.sand, fontWeight: 400 }}>{Math.round(config.gradientOpacity * 100)}%</span>
            </label>
            <input type="range" min={0} max={1} step={0.05}
              value={config.gradientOpacity}
              onChange={e => setConfig(p => ({ ...p, gradientOpacity: parseFloat(e.target.value) }))}
              style={{ width: '100%', accentColor: C.or }}
            />
            <p style={{ fontSize: 10, color: C.sand, marginTop: 8, lineHeight: 1.5 }}>
              Le dégradé assombrit le bas de la photo pour rendre le texte lisible.
            </p>
          </section>

          {/* Point focal */}
          <section style={{ padding: '16px 16px 12px', borderBottom: `1px solid #F0EBE4` }}>
            <p style={{ fontSize: 9, letterSpacing: '0.17em', textTransform: 'uppercase', color: C.sand, marginBottom: 8, fontWeight: 500 }}>Point focal (cadrage mobile)</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 10, color: C.sand, marginBottom: 3 }}>Horizontal {config.focalX ?? 50}%</label>
                <input type="range" min={0} max={100} step={1} value={config.focalX ?? 50}
                  onChange={e => setConfig(p => ({ ...p, focalX: parseInt(e.target.value) }))}
                  style={{ width: '100%', accentColor: C.or }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 10, color: C.sand, marginBottom: 3 }}>Vertical {config.focalY ?? 50}%</label>
                <input type="range" min={0} max={100} step={1} value={config.focalY ?? 50}
                  onChange={e => setConfig(p => ({ ...p, focalY: parseInt(e.target.value) }))}
                  style={{ width: '100%', accentColor: C.or }} />
              </div>
            </div>
            <p style={{ fontSize: 10, color: C.sand, lineHeight: 1.5 }}>
              Cliquez sur la photo ou utilisez les curseurs. Sur mobile, seul X compte (recadrage horizontal).
            </p>
          </section>

          {/* Reset global */}
          <section style={{ padding: '14px 16px' }}>
            <button onClick={() => setConfig(DEFAULT_HERO_CONFIG)}
              style={{ width: '100%', padding: '8px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: '#C0392B', cursor: 'pointer' }}>
              Tout réinitialiser
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
