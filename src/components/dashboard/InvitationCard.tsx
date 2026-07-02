'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type GroupMember = { first_name: string; last_name: string; type: 'adulte' | 'enfant' }

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function CalendarIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function PinIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function PeopleIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

const INPUT = { width: '100%', background: '#FAF7F3', border: '1px solid #D4C9BB', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#0D1323', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" } as const
const LABEL = { display: 'block', fontSize: 10, letterSpacing: '0.2em', color: '#6B5E50', textTransform: 'uppercase' as const, marginBottom: 6, fontWeight: 500 }

export default function InvitationCard({ invitation, organizer }: { invitation: any; organizer: any }) {
  const router = useRouter()
  const event  = invitation.events
  if (!event) return null

  const days        = event.event_date ? daysUntil(event.event_date) : null
  const isConfirmed = invitation.status === 'confirmed'
  const isPast      = days !== null && days < 0

  const [mode,      setMode]      = useState<'view' | 'edit' | 'cancel'>('view')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [members,   setMembers]   = useState<GroupMember[]>(invitation.group_members ?? [])

  const totalPersonnes = 1 + members.length
  const nbAdultes      = 1 + members.filter((m: GroupMember) => m.type === 'adulte').length
  const nbEnfants      = members.filter((m: GroupMember) => m.type === 'enfant').length

  function addMember(type: 'adulte' | 'enfant') {
    setMembers(m => [...m, { first_name: '', last_name: '', type }])
  }
  function removeMember(i: number) {
    setMembers(m => m.filter((_, idx) => idx !== i))
  }
  function updateMember(i: number, field: keyof GroupMember, value: string) {
    setMembers(m => m.map((member, idx) => idx === i ? { ...member, [field]: value } : member))
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.from('event_guests').update({
      group_size:    totalPersonnes,
      group_members: members,
    }).eq('id', invitation.id)
    if (error) { setError('Erreur, réessayez.'); setLoading(false); return }
    setMode('view')
    setLoading(false)
    router.refresh()
  }

  async function handleCancel() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('event_guests').update({ status: 'cancelled' }).eq('id', invitation.id)
    setLoading(false)
    router.refresh()
  }

  const dateFormatted = event.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const organizerName = organizer ? `${organizer.first_name} ${organizer.last_name}` : 'Organisateur'

  return (
    <div style={{ background: '#fff', border: '1px solid #EDE3D5', borderRadius: 16, overflow: 'hidden', boxShadow: '0px 4px 16px rgba(13,19,35,0.06)', opacity: isPast ? 0.7 : 1 }}>

      <div style={{ height: 4, background: isConfirmed ? 'linear-gradient(90deg, #E787B2, #D4A373)' : '#EDE3D5' }} />

      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {event.event_type && (
                <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A373', fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {event.event_type}
                </span>
              )}
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#D4C9BB', display: 'inline-block' }} />
              <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, color: isConfirmed ? '#2D8653' : '#9B8E7E', fontFamily: "'Inter', system-ui, sans-serif" }}>
                {isConfirmed ? 'Présence confirmée' : 'En attente'}
              </span>
            </div>

            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: '#0D1323', marginBottom: 12, lineHeight: 1.2 }}>
              {event.title}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dateFormatted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B5E50' }}>
                  <CalendarIcon />
                  <span style={{ fontSize: 13 }}>{dateFormatted}{event.event_time && ` à ${event.event_time.slice(0, 5)}`}</span>
                </div>
              )}
              {event.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B5E50' }}>
                  <PinIcon />
                  <span style={{ fontSize: 13 }}>{event.location}</span>
                </div>
              )}
              {isConfirmed && invitation.group_size > 1 && mode === 'view' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B5E50' }}>
                  <PeopleIcon />
                  <span style={{ fontSize: 13 }}>{invitation.group_size} personnes</span>
                </div>
              )}
            </div>

            <p style={{ fontSize: 11, color: '#9B8E7E', marginTop: 14 }}>
              Organisé par <span style={{ color: '#6B5E50', fontWeight: 500 }}>{organizerName}</span>
            </p>
          </div>

          {/* Compte à rebours */}
          {days !== null && mode === 'view' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
              <div style={{ textAlign: 'center', background: isPast ? '#F5EFE6' : '#0D1323', borderRadius: 12, padding: '14px 18px', minWidth: 80 }}>
                {isPast ? (
                  <>
                    <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B8E7E', marginBottom: 2 }}>Passé</p>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, color: '#9B8E7E' }}>il y a {Math.abs(days)}j</p>
                  </>
                ) : days === 0 ? (
                  <>
                    <p style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4A373', marginBottom: 2 }}>Aujourd'hui</p>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: '#FAF7F3', fontWeight: 600, lineHeight: 1 }}>!</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(250,247,243,0.5)', marginBottom: 2 }}>Dans</p>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, color: '#D4A373', fontWeight: 600, lineHeight: 1 }}>{days}</p>
                    <p style={{ fontSize: 9, color: 'rgba(250,247,243,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>jour{days > 1 ? 's' : ''}</p>
                  </>
                )}
              </div>
              <Link href={`/e/${event.slug}`} style={{ fontSize: 11, color: '#E787B2', textDecoration: 'none', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                Voir l'événement →
              </Link>
            </div>
          )}
        </div>

        {/* Actions — vue normale */}
        {mode === 'view' && !isPast && isConfirmed && (
          <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #F0EBE4' }}>
            <button onClick={() => setMode('edit')} style={{ background: 'none', border: '1px solid #E0D8D0', borderRadius: 999, padding: '8px 18px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5E50', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
              Modifier ma présence
            </button>
            <button onClick={() => setMode('cancel')} style={{ background: 'none', border: 'none', fontSize: 11, color: '#C0392B', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.05em' }}>
              Annuler ma présence
            </button>
          </div>
        )}

        {/* Mode édition */}
        {mode === 'edit' && (
          <form onSubmit={handleUpdate} style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F0EBE4', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: '#0D1323', fontWeight: 500 }}>Modifier les accompagnants</p>

            {/* Moi */}
            <div style={{ background: '#F5EFE6', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E787B2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                {invitation.first_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 13, color: '#0D1323', fontWeight: 500 }}>{invitation.first_name} {invitation.last_name}</p>
                <p style={{ fontSize: 11, color: '#9B8E7E' }}>Adulte · Vous</p>
              </div>
            </div>

            {/* Accompagnants */}
            {members.map((member, i) => (
              <div key={i} style={{ background: '#FAF7F3', borderRadius: 10, padding: '14px 16px', border: '1px solid #E0D8D0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#0D1323', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Accompagnant {i + 1}</span>
                    <div style={{ display: 'flex', background: '#EDE3D5', borderRadius: 999, padding: 2 }}>
                      {(['adulte', 'enfant'] as const).map(t => (
                        <button key={t} type="button" onClick={() => updateMember(i, 'type', t)} style={{ padding: '3px 10px', borderRadius: 999, border: 'none', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', background: member.type === t ? '#0D1323' : 'transparent', color: member.type === t ? '#FAF7F3' : '#6B5E50', transition: 'all 0.15s' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={() => removeMember(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7E', fontSize: 18, lineHeight: 1 }}>×</button>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button type="button" onClick={() => addMember('adulte')} style={{ background: 'none', border: '1px dashed #C4B8A8', borderRadius: 8, padding: '10px', fontSize: 12, color: '#6B5E50', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>+ Adulte</button>
              <button type="button" onClick={() => addMember('enfant')} style={{ background: 'none', border: '1px dashed #C4B8A8', borderRadius: 8, padding: '10px', fontSize: 12, color: '#6B5E50', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>+ Enfant</button>
            </div>

            {totalPersonnes > 1 && (
              <div style={{ background: '#F5EFE6', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#6B5E50' }}>Total</span>
                <span style={{ fontSize: 12, color: '#0D1323', fontWeight: 600 }}>
                  {totalPersonnes} personne{totalPersonnes > 1 ? 's' : ''}
                  {nbEnfants > 0 && <span style={{ color: '#9B8E7E', fontWeight: 400 }}> ({nbAdultes} adulte{nbAdultes > 1 ? 's' : ''} + {nbEnfants} enfant{nbEnfants > 1 ? 's' : ''})</span>}
                </span>
              </div>
            )}

            {error && <p style={{ fontSize: 12, color: '#C0392B' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => { setMode('view'); setMembers(invitation.group_members ?? []) }} style={{ flex: 1, background: 'none', border: '1px solid #E0D8D0', borderRadius: 999, padding: '11px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B8E7E', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
                Annuler
              </button>
              <button type="submit" disabled={loading} style={{ flex: 2, background: '#E787B2', border: 'none', borderRadius: 999, padding: '11px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
                {loading ? 'Sauvegarde…' : 'Enregistrer →'}
              </button>
            </div>
          </form>
        )}

        {/* Mode confirmation annulation */}
        {mode === 'cancel' && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F0EBE4' }}>
            <p style={{ fontSize: 13, color: '#0D1323', fontWeight: 500, marginBottom: 6 }}>Annuler votre présence ?</p>
            <p style={{ fontSize: 12, color: '#9B8E7E', marginBottom: 16, lineHeight: 1.6 }}>
              L'organisateur sera informé de votre absence. Vous pourrez vous réinscrire depuis la vitrine de l'événement.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setMode('view')} style={{ flex: 1, background: 'none', border: '1px solid #E0D8D0', borderRadius: 999, padding: '11px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B8E7E', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
                Garder ma présence
              </button>
              <button onClick={handleCancel} disabled={loading} style={{ flex: 1, background: '#C0392B', border: 'none', borderRadius: 999, padding: '11px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif" }}>
                {loading ? 'Annulation…' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
