'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [showCfm,   setShowCfm]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [ready,     setReady]     = useState(false)
  const [linkError, setLinkError] = useState(false)

  useEffect(() => {
    // Le lien de reset Supabase (flux PKCE) redirige vers /reset-password?code=...
    const code = searchParams.get('code')
    if (!code) { setLinkError(true); return }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) { setLinkError(true); return }
      setReady(true)
    })
  }, [searchParams])

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor = ['', '#C0392B', '#E67E22', '#27AE60'][strength]
  const strengthLabel = ['', 'Faible', 'Moyen', 'Fort'][strength]
  const match = confirm.length > 0 && password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 6)  { setError('Le mot de passe doit faire au moins 6 caractères.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  const INPUT: React.CSSProperties = { width: '100%', background: '#FAF7F3', border: '1px solid #EDE3D5', borderRadius: 10, padding: '12px 44px 12px 16px', fontSize: 14, color: '#1A1208', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif", boxSizing: 'border-box' }
  const LABEL: React.CSSProperties = { display: 'block', fontSize: 10, letterSpacing: '0.2em', color: '#6B5E50', textTransform: 'uppercase', marginBottom: 8, fontWeight: 500 }

  return (
    <div style={{ minHeight: '100svh', background: '#FAF7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 600, color: '#0D1323', letterSpacing: '0.1em' }}>FESTILA</h1>
          <div style={{ width: 32, height: 2, background: '#D4A373', margin: '12px auto 0', borderRadius: 999 }} />
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', border: '1px solid #EDE3D5', boxShadow: '0 8px 40px rgba(26,18,8,0.08)' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 400, color: '#1A1208', marginBottom: 6, textAlign: 'center' }}>
            Nouveau mot de passe
          </h2>
          <p style={{ fontSize: 13, color: '#6B5E50', textAlign: 'center', marginBottom: 28 }}>
            Choisissez un nouveau mot de passe sécurisé
          </p>

          {linkError ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 13, color: '#C0392B', marginBottom: 16 }}>
                Ce lien de réinitialisation est invalide ou a expiré.
              </p>
              <a href="/forgot-password" style={{ fontSize: 12, color: '#E787B2', textDecoration: 'none' }}>
                Demander un nouveau lien →
              </a>
            </div>
          ) : !ready ? (
            <p style={{ fontSize: 13, color: '#9B8E7E', textAlign: 'center', padding: '20px 0' }}>
              Vérification du lien en cours…
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Nouveau mot de passe */}
              <div>
                <label style={LABEL}>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={INPUT}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7E', display: 'flex' }}>
                    <EyeIcon open={showPwd} />
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                      {[1,2,3].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= strength ? strengthColor : '#EDE3D5', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 10, color: strengthColor, letterSpacing: '0.05em' }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {/* Confirmer */}
              <div>
                <label style={LABEL}>Confirmer le mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCfm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    style={{ ...INPUT, borderColor: confirm.length > 0 ? (match ? '#27AE60' : '#C0392B') : '#EDE3D5' }}
                  />
                  <button type="button" onClick={() => setShowCfm(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7E', display: 'flex' }}>
                    <EyeIcon open={showCfm} />
                  </button>
                </div>
              </div>

              {error && (
                <p style={{ fontSize: 12, color: '#C0392B', background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ background: '#E787B2', color: '#fff', border: 'none', borderRadius: 999, padding: '15px', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif", marginTop: 4, boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}
              >
                {loading ? 'Mise à jour...' : 'Enregistrer le mot de passe →'}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
