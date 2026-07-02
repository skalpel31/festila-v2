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

function PasswordInput({ value, onChange, placeholder, borderColor }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  borderColor?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', background: '#FAF7F3', border: `1px solid ${borderColor ?? '#EDE3D5'}`, borderRadius: 10, padding: '12px 44px 12px 16px', fontSize: 14, color: '#1A1208', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7E', display: 'flex', alignItems: 'center', padding: 0 }}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

function getStrength(p: string): { score: number; label: string; color: string } {
  if (p.length === 0) return { score: 0, label: '', color: '#EDE3D5' }
  let score = 0
  if (p.length >= 8)           score++
  if (p.length >= 12)          score++
  if (/[A-Z]/.test(p))        score++
  if (/[0-9]/.test(p))        score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  if (score <= 1) return { score, label: 'Faible', color: '#C0392B' }
  if (score <= 3) return { score, label: 'Moyen',  color: '#E67E22' }
  return                 { score, label: 'Fort',   color: '#27AE60' }
}

const LABEL = { display: 'block', fontSize: 10, letterSpacing: '0.2em', color: '#9B8E7E', textTransform: 'uppercase' as const, marginBottom: 8 }
const INPUT  = { width: '100%', background: '#FAF7F3', border: '1px solid #EDE3D5', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#1A1208', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" } as const

function SignupForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirect') ?? '/dashboard'
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const strength   = getStrength(password)
  const matchOk    = confirm.length > 0 && confirm === password
  const matchWrong = confirm.length > 0 && confirm !== password

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } }
    })

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setError('Un compte existe déjà avec cet email. Connectez-vous à la place.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }
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
          Créer mon compte
        </h1>
        <p style={{ fontSize: 13, color: '#9B8E7E', marginBottom: 32 }}>
          Rejoignez Festila et organisez votre premier événement
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Prénom</label>
              <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Marie" style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Nom</label>
              <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" style={INPUT} />
            </div>
          </div>

          <div>
            <label style={LABEL}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" style={INPUT} />
          </div>

          <div>
            <label style={LABEL}>Mot de passe</label>
            <PasswordInput value={password} onChange={setPassword} placeholder="8 caractères minimum" />
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: strength.score >= i * 1.5 ? strength.color : '#EDE3D5', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label style={LABEL}>Confirmer le mot de passe</label>
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
              borderColor={matchWrong ? '#C0392B' : matchOk ? '#27AE60' : '#EDE3D5'}
            />
            {matchOk    && <p style={{ fontSize: 11, color: '#27AE60', marginTop: 4 }}>✓ Les mots de passe correspondent</p>}
            {matchWrong && <p style={{ fontSize: 11, color: '#C0392B', marginTop: 4 }}>✗ Les mots de passe ne correspondent pas</p>}
          </div>

          {error && (
            <p style={{ fontSize: 12, color: '#C0392B', background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 8, background: '#E787B2', color: '#fff', border: 'none', borderRadius: 999, padding: '14px', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}
          >
            {loading ? 'Création...' : 'Créer mon compte →'}
          </button>

        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: '#9B8E7E' }}>
        Déjà un compte ?{' '}
        <Link href={`/login${redirectTo !== '/dashboard' ? `?redirect=${redirectTo}` : ''}`} style={{ color: '#E787B2', textDecoration: 'none', fontWeight: 500 }}>Se connecter →</Link>
      </p>

    </main>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
