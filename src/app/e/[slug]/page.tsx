import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import VitrineRSVP from '@/components/vitrine/VitrineRSVP'
import { BASE_FONT_SVH, type HeroElementKey } from '@/lib/hero-config'

export default async function VitrinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Essai normal (respecte les RLS — retourne les événements publiés)
  let { data: event } = await supabase
    .from('events')
    .select('*, profiles(first_name, last_name)')
    .eq('slug', slug)
    .single()

  // Si non trouvé via RLS, contourne avec le client admin — mais seulement pour
  // les événements publiés : un brouillon ne doit jamais être visible publiquement.
  if (!event) {
    const admin = createAdminClient()
    const { data: adminEvent } = await admin
      .from('events')
      .select('*, profiles(first_name, last_name)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()
    if (adminEvent) event = adminEvent
  }

  if (!event) notFound()

  const { data: existingRsvp } = user
    ? await supabase.from('event_guests').select('*').eq('event_id', event.id).eq('user_id', user.id).single()
    : { data: null }

  const dateFormatted = event.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  // hero_config : null = layout statique original (backward-compat), objet = éditeur visuel
  const hc = event.hero_config ?? null

  // Helpers pour les éléments positionnés (utilisés uniquement si hc != null)
  function elStyle(key: HeroElementKey) {
    const el  = hc![key]
    const svh = BASE_FONT_SVH[key]
    return {
      position:      'absolute' as const,
      left:          `${el.x}%`,
      top:           `${el.y}%`,
      // calc(scale * Nsvh) — svh est relatif à la hauteur de l'écran,
      // exactement comme le preview portrait 9:16 de l'éditeur → ratio 1:1
      transform:     `translate(-50%, -50%) rotate(${el.rotation}deg)`,
      fontSize:      `calc(${el.scale} * ${svh}svh)`,
      fontFamily:    key === 'title' ? "'Playfair Display', Georgia, serif" : "'Inter', system-ui, sans-serif",
      fontWeight:    key === 'title' ? 700 : 400,
      color:         key === 'eventType' ? '#D4A373' : key === 'title' ? '#FAF7F3' : 'rgba(250,247,243,0.8)',
      textTransform: key !== 'title' ? 'uppercase' as const : 'none' as const,
      letterSpacing: key !== 'title' ? '0.2em' : '0.01em',
      textAlign:     'center' as const,
      whiteSpace:    'nowrap' as const,
      textShadow:    '0 1px 6px rgba(0,0,0,0.5)',
      lineHeight:    1.2,
      pointerEvents: 'none' as const,
      zIndex:        2,
    }
  }

  // Point focal : contrôle objectPosition pour centrer le crop mobile sur le sujet
  const focalPos = hc
    ? `${hc.focalX ?? 50}% ${hc.focalY ?? 50}%`
    : 'center 30%'

  return (
    <div style={{ minHeight: '100svh', background: '#FAF7F3' }}>
      {/*
        Hero :
        - Si photo mobile uploadée → desktop voit cover_image (16:9), mobile voit cover_image_mobile (9:16) via <picture>
        - Si pas de photo mobile → on utilise la photo desktop avec le CSS fallback
      */}
      <style>{`
        .festila-hero { height: 100svh; }
        .festila-hero-img { width: 100%; height: 100%; object-fit: cover; object-position: ${focalPos}; }
        @media (max-width: 640px) {
          ${event.cover_image_mobile
            ? `.festila-hero { height: 100svh; } .festila-hero-img { object-position: center center; }`
            : hc?.nativeW && hc?.nativeH
              ? `.festila-hero { height: auto; aspect-ratio: ${hc.nativeW}/${hc.nativeH}; max-height: 92svh; }`
              : `.festila-hero { height: 75svh; } .festila-hero-img { object-fit: contain; object-position: center center; }`
          }
        }
      `}</style>

      {/* Hero — plein écran */}
      <div className="festila-hero" style={{ position: 'relative', background: '#1A1208', overflow: 'hidden' }}>
        {event.cover_image ? (
          <picture>
            {/* Photo portrait dédiée au mobile — zéro crop */}
            {event.cover_image_mobile && (
              // eslint-disable-next-line @next/next/no-img-element
              <source media="(max-width: 640px)" srcSet={event.cover_image_mobile} />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="festila-hero-img"
              src={event.cover_image}
              alt={event.title}
              style={{}}
            />
          </picture>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1A1208 0%, #2A1E0E 50%, #D4A37322 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 120, color: '#D4A37322', userSelect: 'none' }}>✦</span>
          </div>
        )}

        {/* Dégradé — opacité configurable via hero_config */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to top, rgba(26,18,8,${hc ? hc.gradientOpacity : 0.85}) 0%, rgba(26,18,8,${hc ? hc.gradientOpacity * 0.25 : 0.2}) 55%, transparent 100%)`,
        }} />

        {/* Logo */}
        <div style={{ position: 'absolute', top: 28, left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 300, color: '#FAF7F3', letterSpacing: '0.3em', opacity: 0.8 }}>FESTILA</p>
        </div>

        {hc ? (
          /* ── Layout éditeur visuel — éléments positionnés absolument ── */
          <>
            {hc.title.visible && (
              <h1 style={elStyle('title')}>{event.title}</h1>
            )}
            {hc.eventType.visible && event.event_type && (
              <p style={elStyle('eventType')}>{event.event_type}</p>
            )}
            {hc.date.visible && dateFormatted && (
              <p style={elStyle('date')}>{dateFormatted}</p>
            )}
            {hc.time.visible && event.event_time && (
              <p style={elStyle('time')}>{event.event_time.slice(0, 5)}</p>
            )}
            {hc.location.visible && event.location && (
              <p style={elStyle('location')}>{event.location}</p>
            )}
          </>
        ) : (
          /* ── Layout statique original (backward-compat) ── */
          <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', padding: '0 32px', zIndex: 2 }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(42px, 7vw, 80px)', fontWeight: 700, color: '#FAF7F3', lineHeight: 1.1, marginBottom: 16 }}>
              {event.title}
            </h1>
            {event.event_type && (
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#D4A373', marginBottom: 8 }}>
                {event.event_type}
              </p>
            )}
            {dateFormatted && (
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,247,243,0.65)' }}>
                {dateFormatted}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        {/* Infos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 48 }}>
          {event.event_date && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9B8E7E', marginBottom: 4 }}>Date</p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: '#1A1208' }}>{dateFormatted}</p>
            </div>
          )}
          {event.event_time && (
            <>
              <div style={{ width: 1, background: '#EDE3D5', alignSelf: 'stretch' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9B8E7E', marginBottom: 4 }}>Heure</p>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: '#1A1208' }}>{event.event_time.slice(0, 5)}</p>
              </div>
            </>
          )}
          {event.location && (
            <>
              <div style={{ width: 1, background: '#EDE3D5', alignSelf: 'stretch' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9B8E7E', marginBottom: 4 }}>Lieu</p>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: '#1A1208' }}>{event.location}</p>
              </div>
            </>
          )}
        </div>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{ flex: 1, height: 1, background: '#EDE3D5' }} />
          <span style={{ color: '#D4A373', fontSize: 14 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: '#EDE3D5' }} />
        </div>

        {/* Description */}
        {event.description && (
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: '#1A1208', lineHeight: 1.8, fontStyle: 'italic' }}>
              {event.description}
            </p>
          </div>
        )}

        {/* RSVP */}
        <VitrineRSVP event={event} user={user} existingRsvp={existingRsvp} />

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 64, paddingTop: 32, borderTop: '1px solid #EDE3D5' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, color: '#C4B8A8', letterSpacing: '0.1em' }}>
            Organisé avec <span style={{ color: '#D4A373' }}>Festila</span>
          </p>
        </div>

      </div>
    </div>
  )
}
