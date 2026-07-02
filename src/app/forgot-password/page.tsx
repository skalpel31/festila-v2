'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) { setError('Une erreur est survenue. Vérifiez l\'adresse email.'); setLoading(false); return }
    setSent(true)
  }

  return (
    <main style={{ minHeight: '100svh', background: '#FAF7F3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      <Link href="/" style={{ textDecoration: 'none', marginBottom: 48, textAlign: 'center' }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 600, color: '#0D1323', letterSpacing: '0.1em' }}>FESTILA</p>
        <div style={{ width: 30, height: 1, background: '#E787B2', margin: '10px auto 0' }} />
      </Link>

      <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #EDE3D5', borderRadius: 20, padding: '40px 36px', boxShadow: '0 8px 40px rgba(26, 18, 8, 0.08)' }}>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✉️</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 400, color: '#1A1208', marginBottom: 12 }}>
              Email envoyé
            </h1>
            <p style={{ fontSize: 13, color: '#9B8E7E', lineHeight: 1.7 }}>
              Un lien de réinitialisation a été envoyé à <strong style={{ color: '#1A1208' }}>{email}</strong>.<br />
              Vérifiez votre boîte mail (et vos spams).
            </p>
            <Link href="/login" style={{ display: 'inline-block', marginTop: 28, fontSize: 11, letterSpacing: '0.15em', color: '#E787B2', textDecoration: 'none', textTransform: 'uppercase' }}>
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 400, color: '#1A1208', marginBottom: 6 }}>
              Mot de passe oublié
            </h1>
            <p style={{ fontSize: 13, color: '#9B8E7E', marginBottom: 32 }}>
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.2em', color: '#9B8E7E', textTransform: 'uppercase', marginBottom: 8 }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  style={{ width: '100%', background: '#FAF7F3', border: '1px solid #EDE3D5', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#1A1208', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" }}
                />
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
                {loading ? 'Envoi...' : 'Envoyer le lien →'}
              </button>
            </form>
          </>
        )}
      </div>

      {!sent && (
        <p style={{ marginTop: 24, fontSize: 12, color: '#9B8E7E' }}>
          <Link href="/login" style={{ color: '#E787B2', textDecoration: 'none' }}>← Retour à la connexion</Link>
        </p>
      )}

    </main>
  )
}
