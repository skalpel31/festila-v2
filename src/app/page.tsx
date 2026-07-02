import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const C = { navy: '#0D1323', rose: '#E787B2', or: '#D4A373', cream: '#FAF7F3', blush: '#F7D9D2', sand: '#9B8E7E', white: '#fff' }

const EVENT_TYPES = ['Mariage', 'Fiançailles', 'Anniversaire', 'Baptême & Baby-shower', 'Communion', 'Crémaillère', 'Soirée & Fête']

const STEPS = [
  {
    n: '01',
    title: 'Créez votre vitrine',
    desc: 'Renseignez les infos de votre événement, ajoutez une photo, rédigez votre message pour les invités.',
  },
  {
    n: '02',
    title: 'Partagez le lien',
    desc: 'Copiez votre lien vitrine en un clic et envoyez-le à vos invités par SMS, email ou WhatsApp.',
  },
  {
    n: '03',
    title: 'Gérez les réponses',
    desc: 'Suivez en temps réel qui sera présent, combien de personnes, et exportez votre liste.',
  },
]

const FEATURES = [
  {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    title: 'RSVP intelligent',
    desc: 'Vos invités confirment leur présence avec le détail adultes / enfants. Vous savez exactement combien vous serez.',
  },
  {
    icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
    title: 'Compte à rebours',
    desc: "Vos invités voient le nombre de jours restants avant l'événement depuis leur espace personnel.",
  },
  {
    icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
    title: 'Espace invité',
    desc: "Chaque invité dispose d'un dashboard personnel pour gérer sa présence et modifier son groupe.",
  },
  {
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    title: 'Données sécurisées',
    desc: 'Vos données et celles de vos invités sont protégées. Aucune revente, aucune publicité.',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main style={{ background: C.cream, minHeight: '100svh', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,247,243,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(13,19,35,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: '0.08em' }}>FESTILA</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user ? (
              <Link href="/dashboard" style={{ display: 'inline-flex', background: C.navy, color: C.cream, padding: '9px 22px', borderRadius: 999, fontSize: 12, letterSpacing: '0.08em', fontWeight: 500, textDecoration: 'none' }}>
                Mon espace →
              </Link>
            ) : (
              <>
                <Link href="/login" style={{ fontSize: 13, color: C.sand, textDecoration: 'none' }}>Se connecter</Link>
                <Link href="/signup" style={{ display: 'inline-flex', background: C.navy, color: C.cream, padding: '9px 22px', borderRadius: 999, fontSize: 12, letterSpacing: '0.08em', fontWeight: 500, textDecoration: 'none' }}>
                  Commencer →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.or }} />
          <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A373', fontWeight: 500 }}>La plateforme des événements qui comptent</span>
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 700, color: C.navy, lineHeight: 1.1, marginBottom: 24, maxWidth: 820, margin: '0 auto 24px' }}>
          Organisez vos événements<br />
          <span style={{ color: C.or }}>avec élégance</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.sand, lineHeight: 1.8, maxWidth: 540, margin: '0 auto 48px' }}>
          Créez une vitrine personnalisée pour vos mariages, anniversaires, baptêmes et bien plus. Gérez les RSVP et suivez les réponses en temps réel.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.rose, color: '#fff', padding: '16px 36px', borderRadius: 999, fontSize: 13, letterSpacing: '0.08em', fontWeight: 500, textDecoration: 'none', boxShadow: '0 8px 32px rgba(231,135,178,0.4)' }}>
            Créer mon événement gratuitement →
          </Link>
          <Link href="/e/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.white, color: C.navy, padding: '16px 36px', borderRadius: 999, fontSize: 13, letterSpacing: '0.08em', fontWeight: 500, textDecoration: 'none', border: '1px solid #E0D8D0' }}>
            Voir un exemple
          </Link>
        </div>
      </section>

      {/* Galerie photo par type d'événement */}
      <section style={{ background: C.white, borderTop: '1px solid #EDE3D5', borderBottom: '1px solid #EDE3D5', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.or, marginBottom: 12, fontWeight: 500 }}>Pour tous vos moments</p>
          <h2 style={{ textAlign: 'center', fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: C.navy, marginBottom: 40 }}>
            Chaque événement mérite sa vitrine
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { label: 'Mariage',          photo: 'photo-1519741497674-611481863552' },
              { label: 'Fiançailles',      photo: 'photo-1522673607200-164d1b6ce486' },
              { label: 'Anniversaire',     photo: 'photo-1464349095431-e9a21285b5f3' },
              { label: 'Baby-shower',      photo: 'photo-1555252333-9f8e92e65df9' },
              { label: 'Crémaillère',      photo: 'photo-1513694203232-719a280e022f' },
              { label: 'Soirée & Fête',    photo: 'photo-1530103862676-de8c9debad1d' },
            ].map(item => (
              <div key={item.label} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '4/3' }}>
                <img
                  src={`https://images.unsplash.com/${item.photo}?w=600&q=80`}
                  alt={item.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,19,35,0.7) 0%, transparent 60%)' }} />
                <p style={{ position: 'absolute', bottom: 14, left: 16, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 600, color: '#FAF7F3' }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.or, marginBottom: 12, fontWeight: 500 }}>Simple & rapide</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: C.navy }}>
            Prêt en 3 minutes
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          {STEPS.map(step => (
            <div key={step.n} style={{ position: 'relative' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 64, fontWeight: 700, color: 'rgba(212,163,115,0.15)', lineHeight: 1, marginBottom: -16 }}>
                {step.n}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 12 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: C.sand, lineHeight: 1.8 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ background: C.navy, padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.or, marginBottom: 12, fontWeight: 500 }}>Fonctionnalités</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: C.cream }}>
              Tout ce qu'il vous faut
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,163,115,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.or} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 600, color: C.cream, marginBottom: 10 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(250,247,243,0.55)', lineHeight: 1.8 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: C.navy, marginBottom: 16, lineHeight: 1.2 }}>
          Votre prochain événement mérite le meilleur
        </h2>
        <p style={{ fontSize: 15, color: C.sand, lineHeight: 1.8, marginBottom: 40 }}>
          Rejoignez Festila et créez votre première vitrine en quelques minutes. Gratuit, sans carte bancaire.
        </p>
        <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.rose, color: '#fff', padding: '18px 48px', borderRadius: 999, fontSize: 13, letterSpacing: '0.08em', fontWeight: 600, textDecoration: 'none', boxShadow: '0 8px 32px rgba(231,135,178,0.4)' }}>
          Commencer gratuitement →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #EDE3D5', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: C.navy, letterSpacing: '0.08em' }}>FESTILA</span>
          <p style={{ fontSize: 12, color: C.sand }}>© 2026 Festila — Des événements inoubliables</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/login"  style={{ fontSize: 12, color: C.sand, textDecoration: 'none' }}>Se connecter</Link>
            <Link href="/signup" style={{ fontSize: 12, color: C.sand, textDecoration: 'none' }}>Créer un compte</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}
