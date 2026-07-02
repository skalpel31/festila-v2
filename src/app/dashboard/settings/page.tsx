'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const LABEL: React.CSSProperties = { display: 'block', fontSize: 11, letterSpacing: '0.15em', color: '#6B5E50', textTransform: 'uppercase', marginBottom: 8, fontWeight: 500 }
const INPUT: React.CSSProperties = { width: '100%', background: '#FAF7F3', border: '1px solid #E0D8D0', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#0D1323', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" }

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function SettingsPage() {
  const router = useRouter()

  const [loading,      setLoading]      = useState(true)
  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [currentPwd,  setCurrentPwd]  = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [pwdSaved,    setPwdSaved]    = useState(false)
  const [pwdError,    setPwdError]    = useState('')
  const [pwdLoading,  setPwdLoading]  = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
      const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
      if (profile) { setFirstName(profile.first_name ?? ''); setLastName(profile.last_name ?? '') }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaved(false); setProfileError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
    }).eq('id', user!.id)
    if (error) { setProfileError('Erreur lors de la sauvegarde.'); return }
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    setPwdSaved(false); setPwdError('')
    if (newPwd.length < 8) { setPwdError('Le mot de passe doit faire au moins 8 caractères.'); return }
    if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return }
    setPwdLoading(true)

    const supabase = createClient()
    // Vérifier l'ancien mot de passe via re-signin
    const { data: { user } } = await supabase.auth.getUser()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPwd })
    if (signInError) { setPwdError('Mot de passe actuel incorrect.'); setPwdLoading(false); return }

    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) { setPwdError('Erreur lors du changement.'); setPwdLoading(false); return }

    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    setPwdLoading(false)
    setPwdSaved(true)
    setTimeout(() => setPwdSaved(false), 3000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: '#9B8E7E' }}>Chargement…</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>

      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 600, color: '#0D1323' }}>
          Paramètres
        </h1>
        <p style={{ fontSize: 13, color: '#9B8E7E', marginTop: 5 }}>Gérez votre profil et votre sécurité</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profil */}
        <div style={{ background: '#fff', border: '1px solid #E0D8D0', borderRadius: 14, padding: '28px 32px', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 600, color: '#0D1323', marginBottom: 20 }}>
            Informations personnelles
          </h2>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={LABEL}>Prénom</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} style={INPUT} />
              </div>
              <div>
                <label style={LABEL}>Nom</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} style={INPUT} />
              </div>
            </div>
            <div>
              <label style={LABEL}>Email</label>
              <input type="email" value={email} disabled style={{ ...INPUT, color: '#9B8E7E', cursor: 'not-allowed' }} />
              <p style={{ fontSize: 11, color: '#C4B8A8', marginTop: 6 }}>L'email ne peut pas être modifié pour le moment</p>
            </div>

            {profileError && <p style={{ fontSize: 12, color: '#C0392B', background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px' }}>{profileError}</p>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              {profileSaved && <p style={{ fontSize: 12, color: '#2D8653' }}>✓ Sauvegardé</p>}
              <button type="submit" style={{ background: '#E787B2', color: '#fff', border: 'none', borderRadius: 999, padding: '11px 28px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
                Enregistrer
              </button>
            </div>
          </form>
        </div>

        {/* Mot de passe */}
        <div style={{ background: '#fff', border: '1px solid #E0D8D0', borderRadius: 14, padding: '28px 32px', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 600, color: '#0D1323', marginBottom: 20 }}>
            Changer le mot de passe
          </h2>
          <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={LABEL}>Mot de passe actuel</label>
              <div style={{ position: 'relative' }}>
                <input type={showCurrent ? 'text' : 'password'} required value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} style={{ ...INPUT, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowCurrent(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7E', display: 'flex', alignItems: 'center' }}>
                  <EyeIcon open={showCurrent} />
                </button>
              </div>
            </div>

            <div>
              <label style={LABEL}>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? 'text' : 'password'} required value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="8 caractères minimum" style={{ ...INPUT, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowNew(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7E', display: 'flex', alignItems: 'center' }}>
                  <EyeIcon open={showNew} />
                </button>
              </div>
            </div>

            <div>
              <label style={LABEL}>Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                required
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                style={{ ...INPUT, borderColor: confirmPwd.length > 0 ? (confirmPwd === newPwd ? '#2D8653' : '#C0392B') : '#E0D8D0' }}
              />
              {confirmPwd.length > 0 && confirmPwd === newPwd && <p style={{ fontSize: 11, color: '#2D8653', marginTop: 4 }}>✓ Les mots de passe correspondent</p>}
              {confirmPwd.length > 0 && confirmPwd !== newPwd && <p style={{ fontSize: 11, color: '#C0392B', marginTop: 4 }}>✗ Les mots de passe ne correspondent pas</p>}
            </div>

            {pwdError && <p style={{ fontSize: 12, color: '#C0392B', background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px' }}>{pwdError}</p>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              {pwdSaved && <p style={{ fontSize: 12, color: '#2D8653' }}>✓ Mot de passe mis à jour</p>}
              <button type="submit" disabled={pwdLoading} style={{ background: '#E787B2', color: '#fff', border: 'none', borderRadius: 999, padding: '11px 28px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: pwdLoading ? 'not-allowed' : 'pointer', opacity: pwdLoading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
                {pwdLoading ? 'Modification…' : 'Changer →'}
              </button>
            </div>
          </form>
        </div>

        {/* Déconnexion */}
        <div style={{ background: '#fff', border: '1px solid #E0D8D0', borderRadius: 14, padding: '20px 32px', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 14, color: '#0D1323', fontWeight: 500 }}>Se déconnecter</p>
            <p style={{ fontSize: 12, color: '#9B8E7E', marginTop: 2 }}>Vous serez redirigé vers la page de connexion</p>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #E0D8D0', borderRadius: 999, padding: '10px 22px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B8E7E', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
            Se déconnecter
          </button>
        </div>

      </div>
    </div>
  )
}
