'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import UnsplashPicker from '@/components/dashboard/UnsplashPicker'

const LABEL: React.CSSProperties = { display: 'block', fontSize: 11, letterSpacing: '0.15em', color: '#6B5E50', textTransform: 'uppercase', marginBottom: 8, fontWeight: 500 }
const INPUT: React.CSSProperties = { width: '100%', background: '#FAF7F3', border: '1px solid #E0D8D0', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#0D1323', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" }

const EVENT_TYPES = ['Mariage', 'Fiançailles', 'Anniversaire', 'Baptême / Baby-shower', 'Communion', 'Crémaillère', 'Soirée / Fête', 'Autre']

const STATUS_OPTIONS = [
  { value: 'draft',     label: 'Brouillon', desc: 'Invisible — vous seul pouvez y accéder' },
  { value: 'published', label: 'Publié',    desc: 'Le lien vitrine est accessible aux invités' },
  { value: 'closed',    label: 'Terminé',   desc: "L'événement est clôturé" },
]

export default function EditEventPage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = params.id as string

  const [loading,     setLoading]     = useState(false)
  const [fetching,    setFetching]    = useState(true)
  const [error,       setError]       = useState('')
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [eventDate,   setEventDate]   = useState('')
  const [eventTime,   setEventTime]   = useState('')
  const [location,    setLocation]    = useState('')
  const [status,      setStatus]      = useState('draft')
    const [eventType,   setEventType]   = useState('')
  const [customType,  setCustomType]  = useState('')
  const [coverImage,  setCoverImage]  = useState<string | null>(null)
  const [uploading,   setUploading]   = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
      if (!event) { router.push('/dashboard'); return }
      setTitle(event.title ?? '')
      setDescription(event.description ?? '')
      setEventDate(event.event_date ?? '')
      setEventTime(event.event_time ? event.event_time.slice(0, 5) : '')
      setLocation(event.location ?? '')
      setStatus(event.status ?? 'draft')
      if (event.event_type && !EVENT_TYPES.includes(event.event_type)) {
        setEventType('Autre'); setCustomType(event.event_type)
      } else {
        setEventType(event.event_type ?? '')
      }
      setCoverImage(event.cover_image ?? null)
      setFetching(false)
    }
    load()
  }, [id, router])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const ext  = file.name.split('.').pop()
    const path = `${id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('event-covers').upload(path, file, { upsert: true })
    if (upErr) { setError("Erreur lors de l'upload. Réessayez."); setUploading(false); return }
    const { data } = supabase.storage.from('event-covers').getPublicUrl(path)
    setCoverImage(data.publicUrl)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError("Le nom de l'événement est obligatoire."); return }
    setLoading(true); setError('')

    const supabase = createClient()
    const { error } = await supabase.from('events').update({
      title:        title.trim(),
      description:  description.trim() || null,
      event_date:   eventDate || null,
      event_time:   eventTime || null,
      location:     location.trim() || null,
      status,
      event_type:   eventType === 'Autre' ? (customType.trim() || 'Autre') : (eventType || null),
      cover_image:  coverImage,
    }).eq('id', id)

    if (error) { setError('Erreur lors de la sauvegarde. Réessayez.'); setLoading(false); return }
    router.push(`/dashboard/events/${id}`)
  }

  if (fetching) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: '#9B8E7E' }}>Chargement…</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
        <Link href={`/dashboard/events/${id}`} style={{ color: '#9B8E7E', textDecoration: 'none', fontSize: 13 }}>← Retour</Link>
        <div style={{ width: 1, height: 16, background: '#E0D8D0' }} />
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: '#0D1323' }}>
          Modifier l'événement
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Photo de couverture */}
        <div style={{ background: '#fff', border: '1px solid #E0D8D0', borderRadius: 14, overflow: 'hidden', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)' }}>
          <label style={{ display: 'block', cursor: 'pointer', position: 'relative' }}>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />

            {coverImage ? (
              <div style={{ position: 'relative', height: 200 }}>
                <img src={coverImage} alt="Couverture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,19,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ color: '#FAF7F3', fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter', system-ui, sans-serif" }}>
                    Changer la photo
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#FAF7F3' }}>
                {uploading ? (
                  <p style={{ fontSize: 13, color: '#9B8E7E' }}>Upload en cours…</p>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4C9BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p style={{ fontSize: 12, color: '#9B8E7E', textAlign: 'center', lineHeight: 1.6 }}>
                      Ajouter une photo de couverture<br />
                      <span style={{ fontSize: 11, color: '#C4B8A8' }}>JPG, PNG — recommandé 1600×900px</span>
                    </p>
                  </>
                )}
              </div>
            )}
          </label>

          {/* Actions photo */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E0D8D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <UnsplashPicker onSelect={url => setCoverImage(url)} />
            {coverImage && (
              <button type="button" onClick={() => setCoverImage(null)} style={{ background: 'none', border: 'none', fontSize: 11, color: '#C0392B', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
                Supprimer la photo
              </button>
            )}
          </div>
        </div>

        {/* Infos + type dans un seul bloc */}
        <div style={{ background: '#fff', border: '1px solid #E0D8D0', borderRadius: 14, padding: '32px', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)', display: 'flex', flexDirection: 'column', gap: 22 }}>

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

          <div>
            <label style={LABEL}>Nom de l'événement *</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={{ ...INPUT, fontSize: 15 }} />
          </div>

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

          <div>
            <label style={LABEL}>Lieu</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Adresse, salle, restaurant…" style={INPUT} />
          </div>

          <div>
            <label style={LABEL}>Message pour les invités</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...INPUT, resize: 'vertical', lineHeight: 1.7 }} />
          </div>
        </div>

        {/* Statut */}
        <div style={{ background: '#fff', border: '1px solid #E0D8D0', borderRadius: 14, padding: '24px 28px', boxShadow: '0px 4px 12px rgba(13,19,35,0.06)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 600, color: '#0D1323', marginBottom: 16 }}>
            Statut
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STATUS_OPTIONS.map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1px solid ${status === opt.value ? '#0D1323' : '#E0D8D0'}`, background: status === opt.value ? '#F5F3F0' : '#FAFAF9', cursor: 'pointer' }}>
                <input type="radio" name="status" value={opt.value} checked={status === opt.value} onChange={() => setStatus(opt.value)} style={{ accentColor: '#0D1323' }} />
                <div>
                  <p style={{ fontSize: 13, color: '#0D1323', fontWeight: status === opt.value ? 600 : 400 }}>{opt.label}</p>
                  <p style={{ fontSize: 11, color: '#9B8E7E', marginTop: 2 }}>{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: '#C0392B', background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Link href={`/dashboard/events/${id}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 24px', borderRadius: 999, border: '1px solid #E0D8D0', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B8E7E', textDecoration: 'none', fontFamily: "'Inter', system-ui, sans-serif" }}>
            Annuler
          </Link>
          <button type="submit" disabled={loading} style={{ background: '#E787B2', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 32px', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 4px 14px rgba(231,135,178,0.35)' }}>
            {loading ? 'Sauvegarde…' : 'Enregistrer →'}
          </button>
        </div>

      </form>
    </div>
  )
}
