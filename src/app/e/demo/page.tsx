export default function DemoVitrinePage() {
  const dateFormatted = new Date('2026-09-20').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div style={{ minHeight: '100svh', background: '#FAF7F3' }}>

      {/* Bandeau démo */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100, background: '#0D1323', color: '#D4A373', padding: '8px 16px', borderRadius: 999, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 12px rgba(13,19,35,0.3)' }}>
        ◈ Démonstration
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', height: '100svh', background: '#1A1208', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85"
          alt="Mariage de Julie & Thomas"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', opacity: 0.85 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,18,8,0.85) 0%, rgba(26,18,8,0.2) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 28, left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 300, color: '#FAF7F3', letterSpacing: '0.3em', opacity: 0.8 }}>FESTILA</p>
        </div>
        <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', padding: '0 32px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(42px, 7vw, 80px)', fontWeight: 700, color: '#FAF7F3', lineHeight: 1.1, marginBottom: 16 }}>
            Mariage de Julie & Thomas
          </h1>
          <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#D4A373', marginBottom: 8 }}>
            Mariage
          </p>
          <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,247,243,0.65)' }}>
            {dateFormatted}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        {/* Infos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 48 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9B8E7E', marginBottom: 4 }}>Date</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: '#1A1208' }}>{dateFormatted}</p>
          </div>
          <div style={{ width: 1, background: '#EDE3D5', alignSelf: 'stretch' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9B8E7E', marginBottom: 4 }}>Heure</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: '#1A1208' }}>15h00</p>
          </div>
          <div style={{ width: 1, background: '#EDE3D5', alignSelf: 'stretch' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9B8E7E', marginBottom: 4 }}>Lieu</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: '#1A1208' }}>Château de Vaux-le-Vicomte</p>
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{ flex: 1, height: 1, background: '#EDE3D5' }} />
          <span style={{ color: '#D4A373', fontSize: 14 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: '#EDE3D5' }} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: '#1A1208', lineHeight: 1.8, fontStyle: 'italic' }}>
            Nous sommes heureux de vous convier à la célébration de notre union. Ce jour tant attendu sera l'occasion de partager avec vous notre bonheur et de créer ensemble des souvenirs inoubliables.
          </p>
        </div>

        {/* RSVP demo */}
        <div style={{ textAlign: 'center', padding: '40px 32px', background: '#fff', borderRadius: 20, border: '1px solid #EDE3D5', boxShadow: '0 4px 24px rgba(13,19,35,0.06)' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, color: '#E787B2', marginBottom: 16 }}>✦</div>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: '#0D1323', marginBottom: 8 }}>
            Confirmez votre présence
          </p>
          <p style={{ fontSize: 13, color: '#9B8E7E', marginBottom: 28, lineHeight: 1.7 }}>
            C'est une page de démonstration.<br />Créez votre compte pour organiser votre propre événement.
          </p>
          <a href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E787B2', color: '#fff', padding: '15px 36px', borderRadius: 999, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
            Créer mon compte gratuitement →
          </a>
          <p style={{ marginTop: 16, fontSize: 12, color: '#C4B8A8' }}>
            Déjà un compte ?{' '}
            <a href="/login" style={{ color: '#E787B2', textDecoration: 'none' }}>Se connecter</a>
          </p>
        </div>

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
