'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

const INPUT_BASE = { width: '100%', background: '#FAF7F3', border: '1px solid #EDE3D5', borderRadius: 10, padding: '12px 44px 12px 16px', fontSize: 14, color: '#1A1208', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" } as const
const LABEL = { display: 'block', fontSize: 10, letterSpacing: '0.2em', color: '#9B8E7E', textTransform: 'uppercase' as const, marginBottom: 8 }

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirect') ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }
    router.push(redirectTo)
  }

  return (
    <main style={{ minHeight: '100svh', background: '#FAF7F3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      <Link href="/" style={{ textDecoration: 'none', marginBottom: 48, textAlign: 'center' }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 600, color: '#0D1323', letterSpacing: '0.1em' }}>FESTILA</p>
        <div style={{ width: 30, height: 2, background: '#D4A373', margin: '10px auto 0', borderRadius: 999 }} />
      </Link>

      <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #EDE3D5', borderRadius: 16, padding: '40px 36px', boxShadow: '0px 10px 25px rgba(13,19,35,0.08)' }}>

        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 600, color: '#0D1323', marginBottom: 6 }}>
          Bon retour
        </h1>
        <p style={{ fontSize: 13, color: '#9B8E7E', marginBottom: 32 }}>
          Connectez-vous à votre espace Festila
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={LABEL}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" style={{ ...INPUT_BASE, padding: '12px 16px' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...LABEL, marginBottom: 0 }}>Mot de passe</label>
              <Link href="/forgot-password" style={{ fontSize: 11, color: '#E787B2', textDecoration: 'none', letterSpacing: '0.05em' }}>
                Mot de passe oublié ?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={INPUT_BASE} />
              <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7E', display: 'flex', alignItems: 'center', padding: 0 }}>
                <EyeIcon open={showPwd} />
              </button>
            </div>
          </div>

          {error && <p style={{ fontSize: 12, color: '#C0392B', background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px' }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ marginTop: 8, background: '#E787B2', color: '#fff', border: 'none', borderRadius: 999, padding: '14px', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
            {loading ? 'Connexion…' : 'Se connecter →'}
          </button>

        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: '#9B8E7E' }}>
        Pas encore de compte ?{' '}
        <Link href={`/signup${redirectTo !== '/dashboard' ? `?redirect=${redirectTo}` : ''}`} style={{ color: '#E787B2', textDecoration: 'none', fontWeight: 500 }}>Créer un compte →</Link>
      </p>

    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
