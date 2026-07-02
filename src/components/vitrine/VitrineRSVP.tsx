'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type GroupMember = { first_name: string; last_name: string; type: 'adulte' | 'enfant' }

const INPUT = { width: '100%', background: '#FAF7F3', border: '1px solid #D4C9BB', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#1A1208', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" } as const
const LABEL = { display: 'block', fontSize: 10, letterSpacing: '0.2em', color: '#6B5E50', textTransform: 'uppercase' as const, marginBottom: 7, fontWeight: 500 }

export default function VitrineRSVP({ event, user, existingRsvp }: { event: any; user: User | null; existingRsvp?: any }) {
  const router  = useRouter()
  const [step,    setStep]    = useState<'cta' | 'form' | 'done'>('cta')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [members, setMembers] = useState<GroupMember[]>([])
  const [profile, setProfile] = useState<{ first_name: string; last_name: string } | null>(null)

  async function handleConfirm() {
    if (!user) { router.push(`/signup?redirect=/e/${event.slug}`); return }

    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
    setProfile(data)
    setStep('form')
  }

  function addMember(type: 'adulte' | 'enfant') {
    setMembers(m => [...m, { first_name: '', last_name: '', type }])
  }

  function removeMember(i: number) {
    setMembers(m => m.filter((_, idx) => idx !== i))
  }

  function updateMember(i: number, field: keyof GroupMember, value: string) {
    setMembers(m => m.map((member, idx) => idx === i ? { ...member, [field]: value } : member))
  }

  const totalPersonnes = 1 + members.length
  const nbAdultes      = 1 + members.filter(m => m.type === 'adulte').length
  const nbEnfants      = members.filter(m => m.type === 'enfant').length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = existingRsvp
      ? await supabase.from('event_guests').update({
          group_size:    totalPersonnes,
          group_members: members,
          status:        'confirmed',
        }).eq('id', existingRsvp.id)
      : await supabase.from('event_guests').insert({
          event_id:      event.id,
          user_id:       user!.id,
          first_name:    profile?.first_name ?? '',
          last_name:     profile?.last_name ?? '',
          group_size:    totalPersonnes,
          group_members: members,
          status:        'confirmed',
        })

    if (error) { setError('Une erreur est survenue. Réessayez.'); setLoading(false); return }
    router.push('/dashboard/invitations?confirmed=1')
  }

  async function handleDecline() {
    if (!user) { router.push(`/signup?redirect=/e/${event.slug}`); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = existingRsvp
      ? await supabase.from('event_guests').update({ status: 'declined' }).eq('id', existingRsvp.id)
      : await supabase.from('event_guests').insert({
          event_id:   event.id,
          user_id:    user.id,
          first_name: profile?.first_name ?? '',
          last_name:  profile?.last_name ?? '',
          group_size: 1,
          status:     'declined',
        })
    if (error) { setError('Une erreur est survenue. Réessayez.'); setLoading(false); return }
    router.refresh()
  }

  /* ── DONE ── */
  if (step === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 20, border: '1px solid #EDE3D5', boxShadow: '0 4px 24px rgba(26,18,8,0.06)' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 48, color: '#E787B2', marginBottom: 16 }}>✦</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 400, color: '#1A1208', marginBottom: 10 }}>
          Présence confirmée !
        </h2>
        <p style={{ fontSize: 14, color: '#4A3C2E', lineHeight: 1.7, marginBottom: 28 }}>
          {profile?.first_name}, votre présence a bien été enregistrée.<br />
          {totalPersonnes > 1 && `Vous serez ${totalPersonnes} au total — ${nbAdultes} adulte${nbAdultes > 1 ? 's' : ''}${nbEnfants > 0 ? ` et ${nbEnfants} enfant${nbEnfants > 1 ? 's' : ''}` : ''}.`}
        </p>
        <a href="/dashboard" style={{ display: 'inline-block', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#E787B2', textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif" }}>
          Voir mon espace invité →
        </a>
      </div>
    )
  }

  /* ── FORM ── */
  if (step === 'form') {
    return (
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #EDE3D5', padding: '36px 32px', boxShadow: '0 4px 24px rgba(26,18,8,0.06)' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 400, color: '#1A1208', marginBottom: 6, textAlign: 'center' }}>
          Confirmer ma présence
        </h2>
        <p style={{ fontSize: 13, color: '#4A3C2E', textAlign: 'center', marginBottom: 28 }}>
          Indiquez si vous venez avec des accompagnants
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Moi — déjà compté */}
          <div style={{ background: '#F5EFE6', borderRadius: 12, padding: '14px 18px', border: '1px solid #D4C9BB', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E787B2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 600, flexShrink: 0 }}>
              {profile?.first_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 14, color: '#1A1208', fontWeight: 500 }}>{profile?.first_name} {profile?.last_name}</p>
              <p style={{ fontSize: 11, color: '#6B5E50', marginTop: 1 }}>Adulte · Vous (déjà confirmé)</p>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 16, color: '#27AE60' }}>✓</div>
          </div>

          {/* Accompagnants */}
          {members.map((member, i) => (
            <div key={i} style={{ background: '#FAF7F3', borderRadius: 12, padding: '16px 18px', border: '1px solid #D4C9BB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.1em', color: '#1A1208', textTransform: 'uppercase', fontWeight: 600 }}>
                    Accompagnant {i + 1}
                  </span>
                  {/* Toggle adulte/enfant */}
                  <div style={{ display: 'flex', background: '#EDE3D5', borderRadius: 999, padding: 2 }}>
                    {(['adulte', 'enfant'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateMember(i, 'type', t)}
                        style={{ padding: '3px 10px', borderRadius: 999, border: 'none', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', background: member.type === t ? '#1A1208' : 'transparent', color: member.type === t ? '#FAF7F3' : '#6B5E50', transition: 'all 0.15s' }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => removeMember(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7E', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={LABEL}>Prénom</label>
                  <input type="text" required value={member.first_name} onChange={e => updateMember(i, 'first_name', e.target.value)} placeholder="Marie" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Nom</label>
                  <input type="text" required value={member.last_name} onChange={e => updateMember(i, 'last_name', e.target.value)} placeholder="Dupont" style={INPUT} />
                </div>
              </div>
            </div>
          ))}

          {/* Boutons ajouter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button type="button" onClick={() => addMember('adulte')} style={{ background: 'none', border: '1px dashed #C4B8A8', borderRadius: 10, padding: '11px', fontSize: 12, color: '#4A3C2E', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500 }}>
              + Adulte
            </button>
            <button type="button" onClick={() => addMember('enfant')} style={{ background: 'none', border: '1px dashed #C4B8A8', borderRadius: 10, padding: '11px', fontSize: 12, color: '#4A3C2E', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500 }}>
              + Enfant
            </button>
          </div>

          {/* Récap */}
          {totalPersonnes > 1 && (
            <div style={{ background: '#F5EFE6', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#4A3C2E' }}>Total</span>
              <span style={{ fontSize: 13, color: '#1A1208', fontWeight: 600 }}>
                {totalPersonnes} personne{totalPersonnes > 1 ? 's' : ''}
                {nbEnfants > 0 && <span style={{ color: '#6B5E50', fontWeight: 400 }}> ({nbAdultes} adulte{nbAdultes > 1 ? 's' : ''} + {nbEnfants} enfant{nbEnfants > 1 ? 's' : ''})</span>}
              </span>
            </div>
          )}

          {error && (
            <p style={{ fontSize: 12, color: '#C0392B', background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ background: '#E787B2', color: '#fff', border: 'none', borderRadius: 999, padding: '16px', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif", marginTop: 4, boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}
          >
            {loading ? 'Confirmation...' : `Confirmer ma présence →`}
          </button>

        </form>
      </div>
    )
  }

  /* ── DÉJÀ DÉCLINÉ ── */
  if (existingRsvp && existingRsvp.status === 'declined' && step === 'cta') {
    return (
      <div style={{ textAlign: 'center', padding: '36px 24px', background: '#fff', borderRadius: 20, border: '1px solid #EDE3D5', boxShadow: '0 4px 24px rgba(13,19,35,0.06)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FDF0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: '#0D1323', marginBottom: 8 }}>
          Vous avez décliné l'invitation
        </h3>
        <p style={{ fontSize: 13, color: '#9B8E7E', lineHeight: 1.7, marginBottom: 20 }}>
          Vous avez indiqué ne pas pouvoir venir. Vous pouvez changer d'avis ci-dessous.
        </p>
        <button
          onClick={() => { setProfile({ first_name: existingRsvp.first_name, last_name: existingRsvp.last_name }); setStep('form') }}
          style={{ background: '#E787B2', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 28px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}
        >
          Finalement, je viendrai →
        </button>
      </div>
    )
  }

  /* ── DÉJÀ INSCRIT ── */
  if (existingRsvp && existingRsvp.status === 'confirmed' && step === 'cta') {
    return (
      <div style={{ textAlign: 'center', padding: '36px 24px', background: '#fff', borderRadius: 20, border: '1px solid #EDE3D5', boxShadow: '0 4px 24px rgba(13,19,35,0.06)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EAF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D8653" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: '#0D1323', marginBottom: 8 }}>
          Vous êtes inscrit !
        </h3>
        <p style={{ fontSize: 13, color: '#9B8E7E', lineHeight: 1.7, marginBottom: 20 }}>
          {existingRsvp.first_name}, votre présence est confirmée.
          {existingRsvp.group_size > 1 && ` Vous serez ${existingRsvp.group_size} personnes.`}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setProfile({ first_name: existingRsvp.first_name, last_name: existingRsvp.last_name }); setMembers(existingRsvp.group_members ?? []); setStep('form') }}
            style={{ background: 'none', border: '1px solid #E0D8D0', borderRadius: 999, padding: '10px 22px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5E50', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            Modifier ma présence
          </button>
          <a href="/dashboard/invitations" style={{ display: 'inline-flex', alignItems: 'center', background: '#E787B2', color: '#fff', borderRadius: 999, padding: '10px 22px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
            Voir mes invitations →
          </a>
        </div>
      </div>
    )
  }

  /* ── CTA ── */
  return (
    <div style={{ textAlign: 'center' }}>
      <button
        onClick={handleConfirm}
        disabled={loading}
        style={{ background: '#E787B2', color: '#fff', border: 'none', borderRadius: 999, padding: '18px 52px', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 20px rgba(231,135,178,0.4)' }}
      >
        {user ? 'Confirmer ma présence →' : 'Je serai présent(e) →'}
      </button>
      {!user && (
        <p style={{ marginTop: 14, fontSize: 12, color: '#4A3C2E' }}>
          Une inscription rapide sera nécessaire pour confirmer
        </p>
      )}
      <button
        onClick={handleDecline}
        disabled={loading}
        style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', fontSize: 12, color: '#9B8E7E', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Inter', system-ui, sans-serif", textDecoration: 'underline', textUnderlineOffset: 3 }}
      >
        Je ne pourrai pas venir
      </button>
      {error && (
        <p style={{ fontSize: 12, color: '#C0392B', marginTop: 12 }}>{error}</p>
      )}
    </div>
  )
}
