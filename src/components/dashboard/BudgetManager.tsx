'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  upsertBudgetTotal,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  type BudgetItemInput,
} from '@/app/dashboard/events/[id]/budget/actions'

type BudgetItem = BudgetItemInput & { id: string; event_id: string; created_at: string }

const CATEGORIES = [
  'Lieu', 'Traiteur', 'Décoration', 'Photographe / Vidéaste',
  'Tenue', 'Fleurs', 'Musique / Animation', 'Papeterie', 'Transport', 'Autre',
]

const C = { navy: '#0D1323', rose: '#E787B2', or: '#D4A373', cream: '#FAF7F3', sand: '#9B8E7E', border: '#E0D8D0' }
const LABEL: React.CSSProperties = { display: 'block', fontSize: 10, letterSpacing: '0.15em', color: '#6B5E50', textTransform: 'uppercase', marginBottom: 6, fontWeight: 500 }
const INPUT: React.CSSProperties = { width: '100%', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: C.navy, outline: 'none', fontFamily: "'Inter', system-ui, sans-serif", boxSizing: 'border-box' }
const money = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const emptyDraft: BudgetItemInput = {
  category: CATEGORIES[0], name: '', vendor: null,
  estimated_amount: 0, actual_amount: null, paid_amount: 0,
  due_date: null, notes: null,
}

function num(v: string): number {
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function itemStatus(item: BudgetItemInput) {
  const owed = item.actual_amount ?? item.estimated_amount
  if (owed > 0 && item.paid_amount >= owed) return { label: 'Payé', color: '#27AE60', bg: '#EAF7EE' }
  if (item.paid_amount > 0) return { label: 'Acompte versé', color: '#D68910', bg: '#FDF3E3' }
  return { label: 'À payer', color: C.sand, bg: '#F5EFE6' }
}

function ItemForm({
  initial, onCancel, onSubmit, submitLabel,
}: {
  initial: BudgetItemInput
  onCancel: () => void
  onSubmit: (input: BudgetItemInput) => Promise<void>
  submitLabel: string
}) {
  const [draft, setDraft] = useState(initial)
  const [customCategory, setCustomCategory] = useState(CATEGORIES.includes(initial.category) ? '' : initial.category)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim()) return
    setSaving(true)
    const category = draft.category === 'Autre' ? (customCategory.trim() || 'Autre') : draft.category
    await onSubmit({ ...draft, category, name: draft.name.trim(), vendor: draft.vendor?.trim() || null, notes: draft.notes?.trim() || null })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <div>
          <label style={LABEL}>Catégorie</label>
          <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} style={{ ...INPUT, cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {draft.category === 'Autre' && (
            <input type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Préciser…" style={{ ...INPUT, marginTop: 8 }} />
          )}
        </div>
        <div>
          <label style={LABEL}>Nom du poste *</label>
          <input type="text" required value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Ex : Salle de réception" style={INPUT} />
        </div>
      </div>

      <div>
        <label style={LABEL}>Prestataire</label>
        <input type="text" value={draft.vendor ?? ''} onChange={e => setDraft(d => ({ ...d, vendor: e.target.value }))} placeholder="Nom du prestataire (optionnel)" style={INPUT} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div>
          <label style={LABEL}>Estimé (€)</label>
          <input type="number" step="0.01" min="0" value={draft.estimated_amount} onChange={e => setDraft(d => ({ ...d, estimated_amount: num(e.target.value) }))} style={INPUT} />
        </div>
        <div>
          <label style={LABEL}>Coût réel (€)</label>
          <input type="number" step="0.01" min="0" value={draft.actual_amount ?? ''} onChange={e => setDraft(d => ({ ...d, actual_amount: e.target.value === '' ? null : num(e.target.value) }))} placeholder="Si connu" style={INPUT} />
        </div>
        <div>
          <label style={LABEL}>Déjà payé (€)</label>
          <input type="number" step="0.01" min="0" value={draft.paid_amount} onChange={e => setDraft(d => ({ ...d, paid_amount: num(e.target.value) }))} style={INPUT} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <div>
          <label style={LABEL}>Échéance</label>
          <input type="date" value={draft.due_date ?? ''} onChange={e => setDraft(d => ({ ...d, due_date: e.target.value || null }))} style={INPUT} />
        </div>
        <div>
          <label style={LABEL}>Notes</label>
          <input type="text" value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Optionnel" style={INPUT} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 999, padding: '10px 20px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.sand, cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
          Annuler
        </button>
        <button type="submit" disabled={saving} style={{ background: C.rose, color: '#fff', border: 'none', borderRadius: 999, padding: '10px 24px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600 }}>
          {saving ? 'Sauvegarde…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default function BudgetManager({
  eventId, budgetTotal, items,
}: {
  eventId: string
  budgetTotal: number | null
  items: BudgetItem[]
}) {
  const router = useRouter()
  const [budgetInput, setBudgetInput] = useState(budgetTotal?.toString() ?? '')
  const [savingBudget, setSavingBudget] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalEstimated = items.reduce((s, i) => s + i.estimated_amount, 0)
  const totalReal       = items.reduce((s, i) => s + (i.actual_amount ?? i.estimated_amount), 0)
  const totalPaid        = items.reduce((s, i) => s + i.paid_amount, 0)
  const remaining        = totalReal - totalPaid
  const diffVsBudget     = budgetTotal != null ? budgetTotal - totalReal : null

  async function saveBudgetTotal() {
    setSavingBudget(true)
    const value = budgetInput.trim() === '' ? null : num(budgetInput)
    await upsertBudgetTotal(eventId, value)
    setSavingBudget(false)
    router.refresh()
  }

  async function handleCreate(input: BudgetItemInput) {
    await createBudgetItem(eventId, input)
    setAdding(false)
    router.refresh()
  }

  async function handleUpdate(itemId: string, input: BudgetItemInput) {
    await updateBudgetItem(eventId, itemId, input)
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId)
    await deleteBudgetItem(eventId, itemId)
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Enveloppe budget + résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.sand, marginBottom: 10 }}>Budget prévu</p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="number" step="0.01" min="0" value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              onBlur={saveBudgetTotal}
              placeholder="—"
              style={{ ...INPUT, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, border: 'none', padding: 0, background: 'transparent' }}
            />
            <span style={{ fontSize: 14, color: C.sand }}>{savingBudget ? '…' : '€'}</span>
          </div>
        </div>

        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.sand, marginBottom: 10 }}>Total estimé</p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: C.navy }}>{money(totalReal)}</p>
        </div>

        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.sand, marginBottom: 10 }}>Déjà payé</p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: '#27AE60' }}>{money(totalPaid)}</p>
        </div>

        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.sand, marginBottom: 10 }}>
            {diffVsBudget != null ? (diffVsBudget < 0 ? 'Dépassement' : 'Marge restante') : 'Reste à payer'}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: diffVsBudget != null ? (diffVsBudget < 0 ? '#C0392B' : '#27AE60') : C.navy }}>
            {diffVsBudget != null ? money(Math.abs(diffVsBudget)) : money(remaining)}
          </p>
        </div>
      </div>

      {/* Liste des postes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 400, color: C.navy }}>
            Postes de dépense
          </h2>
          {!adding && (
            <button onClick={() => setAdding(true)} style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 20px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
              + Ajouter un poste
            </button>
          )}
        </div>

        {adding && (
          <ItemForm initial={emptyDraft} submitLabel="Ajouter" onCancel={() => setAdding(false)} onSubmit={handleCreate} />
        )}

        {items.length === 0 && !adding ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.sand, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14 }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, marginBottom: 8 }}>Aucun poste de dépense</p>
            <p style={{ fontSize: 12 }}>Ajoute ton premier poste (lieu, traiteur, décoration…) pour suivre ton budget.</p>
          </div>
        ) : (
          items.map(item => {
            if (editingId === item.id) {
              return (
                <ItemForm
                  key={item.id}
                  initial={item}
                  submitLabel="Enregistrer"
                  onCancel={() => setEditingId(null)}
                  onSubmit={input => handleUpdate(item.id, input)}
                />
              )
            }
            const status = itemStatus(item)
            const owed = item.actual_amount ?? item.estimated_amount
            return (
              <div key={item.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.rose, background: '#FDEEF5', padding: '2px 9px', borderRadius: 999 }}>{item.category}</span>
                    <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: status.color, background: status.bg, padding: '2px 9px', borderRadius: 999 }}>{status.label}</span>
                  </div>
                  <p style={{ fontSize: 14, color: C.navy, fontWeight: 500 }}>{item.name}</p>
                  {(item.vendor || item.due_date) && (
                    <p style={{ fontSize: 12, color: C.sand, marginTop: 2 }}>
                      {item.vendor}{item.vendor && item.due_date && ' · '}
                      {item.due_date && `échéance ${new Date(item.due_date).toLocaleDateString('fr-FR')}`}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: C.navy }}>{money(owed)}</p>
                  <p style={{ fontSize: 11, color: C.sand }}>{money(item.paid_amount)} payé</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setEditingId(item.id)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 11, color: C.sand, cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    style={{ background: 'none', border: 'none', fontSize: 11, color: '#C0392B', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", textDecoration: 'underline', textDecorationColor: 'rgba(192,57,43,0.3)' }}
                  >
                    {deletingId === item.id ? '…' : 'Supprimer'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
