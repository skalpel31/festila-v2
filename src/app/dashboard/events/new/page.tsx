'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).slice(2, 7)
}

const LABEL: React.CSSProperties = { display: 'block', fontSize: 11, letterSpacing: '0.15em', color: '#6B5E50', textTransform: 'uppercase', marginBottom: 8, fontWeight: 500 }
const INPUT: React.CSSProperties = { width: '100%', background: '#FAF7F3', border: '1px solid #E0D8D0', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#0D1323', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" }

const EVENT_TYPES = ['Mariage', 'Fiançailles', 'Anniversaire', 'Baptême / Baby-shower', 'Communion', 'Crémaillère', 'Soirée / Fête', 'Autre']

const DEFAULT_COVERS: Record<string, string> = {
  'Mariage':               'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1920&h=1080&fit=crop&q=85',
  'Fiançailles':           'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1920&h=1080&fit=crop&q=85',
  'Anniversaire':          'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1920&h=1080&fit=crop&q=85',
  'Baptême / Baby-shower': 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1920&h=1080&fit=crop&q=85',
  'Communion':             'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&h=1080&fit=crop&q=85',
  'Crémaillère':           'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&h=1080&fit=crop&q=85',
  'Soirée / Fête':         'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=1080&fit=crop&q=85',
}

export default function NewEventPage() {
  const router = useRouter()
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [title,       setTitle]       = useState('')
  const [eventDate,   setEventDate]   = useState('')
  const [eventTime,   setEventTime]   = useState('')
  const [location,    setLocation]    = useState('')
  const [description, setDescription] = useState('')
  const [eventType,   setEventType]   = useState('')
  const [customType,  setCustomType]  = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Le nom de l\'événement est obligatoire.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const slug = slugify(title)
    const finalType = eventType === 'Autre' ? (customType.trim() || 'Autre') : (eventType || null)
    const cover_image = finalType ? (DEFAULT_COVERS[finalType] ?? DEFAULT_COVERS['Soirée / Fête']) : DEFAULT_COVERS['Soirée / Fête']

    const { data, error } = await supabase.from('events').insert({
      organizer_id: user.id,
      title:        title.trim(),
      slug,
      event_date:   eventDate || null,
      event_time:   eventTime || null,
      location:     location.trim() || null,
      description:  description.trim() || null,
      event_type:   finalType,
      cover_image,
      status:       'draft',
    }).select().single()

    if (error) { setError('Erreur lors de la création. Réessayez.'); setLoading(false); return }
    router.push(`/dashboard/events/${data.id}`)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
        <Link href="/dashboard" style={{ color: '#9B8E7E', textDecoration: 'none', fontSize: 13 }}>← Retour</Link>
        <div style={{ width: 1, height: 16, background: '#E0D8D0' }} />
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: '#0D1323' }}>
          Nouvel événement
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', border: '1px solid #E0D8D0', borderRadius: 14, padding: '32px', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Type */}
          <div>
            <label style={LABEL}>Type d'événement</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)} style={{ ...INPUT, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239B8E7E' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 40, cursor: 'pointer' }}>
              <option value="">Sélectionner un type…</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {eventType === 'Autre' && (
              <input type="text" value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Ex : Pot de départ, Remise de diplôme…" style={{ ...INPUT, marginTop: 10 }} />
            )}
          </div>

          {/* Nom */}
          <div>
            <label style={LABEL}>Nom de l'événement *</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex : Mariage de Julie & Thomas" style={{ ...INPUT, fontSize: 15 }} />
          </div>

          {/* Date & heure */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={LABEL}>Date</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Heure</label>
              <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} style={INPUT} />
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label style={LABEL}>Lieu</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Adresse, salle, restaurant…" style={INPUT} />
          </div>

          {/* Description */}
          <div>
            <label style={LABEL}>Message pour les invités</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Quelques mots qui s'afficheront sur votre page d'invitation…" rows={3} style={{ ...INPUT, resize: 'vertical', lineHeight: 1.7 }} />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: '#C0392B', background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </p>
          )}

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4 }}>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 24px', borderRadius: 999, border: '1px solid #E0D8D0', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B8E7E', textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif" }}>
              Annuler
            </Link>
            <button type="submit" disabled={loading} style={{ background: '#E787B2', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 32px', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
              {loading ? 'Création…' : 'Créer l\'événement →'}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}
