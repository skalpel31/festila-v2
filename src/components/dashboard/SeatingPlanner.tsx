'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  createTable,
  updateTable,
  deleteTable,
  assignGuestToTable,
  type TableShape as Shape,
} from '@/app/dashboard/events/[id]/plan/actions'

type EventTable = { id: string; event_id: string; name: string; shape: Shape; seats: number; pos_x: number; pos_y: number }
type Guest = { id: string; first_name: string; last_name: string; group_size: number; status: string; table_id: string | null }

const C = { navy: '#0D1323', rose: '#E787B2', or: '#D4A373', sand: '#9B8E7E', border: '#E0D8D0' }

function dragData(e: React.DragEvent): { kind: 'guest' | 'table'; id: string } | null {
  try { return JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return null }
}

function GuestChip({ guest, onRemove }: { guest: Guest; onRemove?: () => void }) {
  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'guest', id: guest.id }))}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: '8px 12px', background: '#FAF7F3', border: `1px solid ${C.border}`, borderRadius: 8,
        fontSize: 12.5, color: C.navy, cursor: 'grab', fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <span>{guest.first_name} {guest.last_name}{guest.group_size > 1 ? ` (+${guest.group_size - 1})` : ''}</span>
      {onRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
      )}
    </div>
  )
}

export default function SeatingPlanner({
  eventId, tables, guests,
}: {
  eventId: string
  tables: EventTable[]
  guests: Guest[]
}) {
  const router = useRouter()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [localTables, setLocalTables] = useState(tables)
  const [localGuests, setLocalGuests] = useState(guests)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => setLocalTables(tables), [tables])
  useEffect(() => setLocalGuests(guests), [guests])

  const guestsByTable = useMemo(() => {
    const map = new Map<string, Guest[]>()
    localGuests.forEach(g => {
      if (!g.table_id) return
      const arr = map.get(g.table_id) ?? []
      arr.push(g)
      map.set(g.table_id, arr)
    })
    return map
  }, [localGuests])

  const unassigned = localGuests.filter(g => !g.table_id)
  const selectedTable = localTables.find(t => t.id === selectedId) ?? null

  async function handleAddTable(shape: Shape) {
    setCreating(true)
    const n = localTables.length
    const pos_x = 18 + (n % 4) * 22
    const pos_y = 22 + Math.floor(n / 4) * 30
    const created = await createTable(eventId, { name: `Table ${n + 1}`, shape, seats: shape === 'round' ? 8 : 6, pos_x, pos_y })
    setCreating(false)
    if (created) setLocalTables(prev => [...prev, created])
    router.refresh()
  }

  function handleCanvasDrop(e: React.DragEvent) {
    const data = dragData(e)
    if (!data || data.kind !== 'table' || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.min(94, Math.max(6, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(90, Math.max(10, ((e.clientY - rect.top) / rect.height) * 100))
    setLocalTables(prev => prev.map(t => t.id === data.id ? { ...t, pos_x: x, pos_y: y } : t))
    updateTable(eventId, data.id, { pos_x: x, pos_y: y }).then(() => router.refresh())
  }

  function handleDropOnTable(e: React.DragEvent, tableId: string) {
    e.stopPropagation()
    const data = dragData(e)
    if (!data || data.kind !== 'guest') return
    setLocalGuests(prev => prev.map(g => g.id === data.id ? { ...g, table_id: tableId } : g))
    assignGuestToTable(eventId, data.id, tableId).then(() => router.refresh())
  }

  function unassignGuest(guestId: string) {
    setLocalGuests(prev => prev.map(g => g.id === guestId ? { ...g, table_id: null } : g))
    assignGuestToTable(eventId, guestId, null).then(() => router.refresh())
  }

  async function handleDeleteTable(tableId: string) {
    setSelectedId(null)
    setLocalTables(prev => prev.filter(t => t.id !== tableId))
    await deleteTable(eventId, tableId)
    router.refresh()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, alignItems: 'start' }}>

      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button disabled={creating} onClick={() => handleAddTable('round')} style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
            + Table ronde
          </button>
          <button disabled={creating} onClick={() => handleAddTable('rect')} style={{ background: 'none', color: C.navy, border: `1px solid ${C.border}`, borderRadius: 999, padding: '9px 18px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
            + Table rectangulaire
          </button>
        </div>

        <div
          ref={canvasRef}
          onDragOver={e => e.preventDefault()}
          onDrop={handleCanvasDrop}
          style={{ position: 'relative', width: '100%', height: 540, background: '#FAF7F3', border: `1px dashed ${C.border}`, borderRadius: 14, overflow: 'hidden' }}
        >
          {localTables.length === 0 && (
            <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sand, fontSize: 13, textAlign: 'center', padding: 24 }}>
              Ajoute une table pour commencer le plan de salle.
            </p>
          )}
          {localTables.map(table => {
            const assigned = guestsByTable.get(table.id) ?? []
            const used = assigned.reduce((s, g) => s + g.group_size, 0)
            const over = used > table.seats
            const isRound = table.shape === 'round'
            const selected = selectedId === table.id
            return (
              <div
                key={table.id}
                draggable
                onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'table', id: table.id }))}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDropOnTable(e, table.id)}
                onClick={() => setSelectedId(table.id)}
                style={{
                  position: 'absolute',
                  left: `${table.pos_x}%`, top: `${table.pos_y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isRound ? 96 : 140, height: isRound ? 96 : 68,
                  borderRadius: isRound ? '50%' : 12,
                  background: selected ? '#FDEEF5' : '#fff',
                  border: `2px solid ${over ? '#C0392B' : selected ? C.rose : C.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'grab', boxShadow: '0 2px 10px rgba(13,19,35,0.08)', padding: 8,
                  userSelect: 'none', textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 11.5, fontWeight: 600, color: '#1A1208', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{table.name}</p>
                <p style={{ fontSize: 10, color: over ? '#C0392B' : C.sand, marginTop: 2 }}>{used}/{table.seats}</p>
              </div>
            )
          })}
        </div>
      </div>

      {selectedTable ? (
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', color: C.sand, fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>← Retour</button>
            <button onClick={() => handleDeleteTable(selectedTable.id)} style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: "'Inter', system-ui, sans-serif" }}>Supprimer</button>
          </div>

          <input
            defaultValue={selectedTable.name}
            onBlur={e => updateTable(eventId, selectedTable.id, { name: e.target.value }).then(() => router.refresh())}
            style={{ width: '100%', fontSize: 16, fontFamily: "'Cormorant Garamond', Georgia, serif", border: 'none', borderBottom: `1px solid ${C.border}`, padding: '4px 0', marginBottom: 14, outline: 'none' }}
          />

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['round', 'rect'] as Shape[]).map(sh => (
              <button
                key={sh}
                onClick={() => updateTable(eventId, selectedTable.id, { shape: sh }).then(() => router.refresh())}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${selectedTable.shape === sh ? C.navy : C.border}`, background: selectedTable.shape === sh ? C.navy : 'none', color: selectedTable.shape === sh ? '#fff' : C.sand, fontSize: 11, cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                {sh === 'round' ? 'Ronde' : 'Rectangulaire'}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.15em', color: '#6B5E50', textTransform: 'uppercase', marginBottom: 6 }}>Places</label>
          <input
            type="number" min="1" defaultValue={selectedTable.seats}
            onBlur={e => updateTable(eventId, selectedTable.id, { seats: parseInt(e.target.value) || 1 }).then(() => router.refresh())}
            style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 18, fontFamily: "'Inter', system-ui, sans-serif" }}
          />

          <p style={{ fontSize: 10, letterSpacing: '0.15em', color: '#6B5E50', textTransform: 'uppercase', marginBottom: 8 }}>Invités assignés</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(guestsByTable.get(selectedTable.id) ?? []).length === 0 ? (
              <p style={{ fontSize: 12, color: C.sand }}>Glisse un invité ici depuis la liste.</p>
            ) : (
              guestsByTable.get(selectedTable.id)!.map(g => (
                <GuestChip key={g.id} guest={g} onRemove={() => unassignGuest(g.id)} />
              ))
            )}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 400, color: '#1A1208', marginBottom: 14 }}>
            Invités non assignés
          </h2>
          {unassigned.length === 0 ? (
            <p style={{ fontSize: 12, color: C.sand }}>
              {localGuests.length === 0 ? "Aucun invité pour le moment." : "Tous les invités sont assignés à une table."}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {unassigned.map(g => <GuestChip key={g.id} guest={g} />)}
            </div>
          )}
          <p style={{ fontSize: 11, color: C.sand, marginTop: 16, lineHeight: 1.6 }}>
            Glisse un invité sur une table pour l'assigner. Clique sur une table pour la modifier.
          </p>
        </div>
      )}

    </div>
  )
}
