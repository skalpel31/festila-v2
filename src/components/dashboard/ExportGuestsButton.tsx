'use client'

type Guest = {
  first_name: string
  last_name: string
  status: string
  group_size: number | null
  group_members: Array<{ first_name: string; last_name: string; type: string }> | null
  created_at: string
}

function toCSV(guests: Guest[]): string {
  const rows = [
    ['Prénom', 'Nom', 'Statut', 'Groupe total', 'Adultes', 'Enfants', "Date d'inscription"],
  ]
  for (const g of guests) {
    const nbEnfants = g.group_members?.filter(m => m.type === 'enfant').length ?? 0
    const nbAdultes = (g.group_size ?? 1) - nbEnfants
    const status =
      g.status === 'confirmed' ? 'Confirmé'
      : g.status === 'declined' ? 'Refusé'
      : g.status === 'cancelled' ? 'Annulé'
      : 'En attente'
    rows.push([
      g.first_name,
      g.last_name,
      status,
      String(g.group_size ?? 1),
      String(nbAdultes),
      String(nbEnfants),
      new Date(g.created_at).toLocaleDateString('fr-FR'),
    ])
  }
  return rows.map(row => row.map(v => `"${v}"`).join(',')).join('\n')
}

export default function ExportGuestsButton({ guests, eventTitle }: { guests: Guest[]; eventTitle: string }) {
  if (!guests.length) return null

  function handleExport() {
    const csv = toCSV(guests)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invités-${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '10px 20px', borderRadius: 999,
        border: '1px solid #EDE3D5', background: '#fff',
        fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: '#9B8E7E', cursor: 'pointer',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Exporter CSV
    </button>
  )
}
