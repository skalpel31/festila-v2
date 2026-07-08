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

type EventTable = { id: string; event_id: string; name: string; shape: Shape; seats: number; pos_x: number; pos_y: number; rotation: number }
type Guest = { id: string; first_name: string; last_name: string; group_size: number; status: string; table_id: string | null }

const C = { navy: '#0D1323', rose: '#E787B2', or: '#D4A373', sand: '#9B8E7E', border: '#E0D8D0' }
const AVATAR = 30

function dragData(e: React.DragEvent): { kind: 'guest' | 'table'; id: string } | null {
  try { return JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return null }
}

// Positions des vignettes invités autour du pourtour de la table (repère local, non tourné —
// la rotation de la table s'applique via le transform CSS du conteneur parent).
function seatOffsets(shape: Shape, count: number, w: number, h: number) {
  const OUT = 20
  const offsets: { x: number; y: number }[] = []
  if (count === 0) return offsets
  if (shape === 'round') {
    const r = w / 2 + OUT
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2
      offsets.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) })
    }
  } else {
    const hw = w / 2 + OUT, hh = h / 2 + OUT
    const segLens = [2 * hw, 2 * hh, 2 * hw, 2 * hh]
    const total = segLens.reduce((a, b) => a + b, 0)
    for (let i = 0; i < count; i++) {
      let d = (total / count) * i
      let seg = 0
      while (d > segLens[seg]) { d -= segLens[seg]; seg++ }
      let x = 0, y = 0
      if (seg === 0)      { x = -hw + d; y = -hh }
      else if (seg === 1) { x = hw;      y = -hh + d }
      else if (seg === 2) { x = hw - d;  y = hh }
      else                { x = -hw;     y = hh - d }
      offsets.push({ x, y })
    }
  }
  return offsets
}

function initialsOf(g: Guest) {
  return `${g.first_name?.[0] ?? ''}${g.last_name?.[0] ?? ''}`.toUpperCase() || '?'
}

function GuestAvatar({ guest, onRemove }: { guest: Guest; onRemove: () => void }) {
  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'guest', id: guest.id }))}
      title={`${guest.first_name} ${guest.last_name}`}
      style={{
        position: 'relative', width: AVATAR, height: AVATAR, borderRadius: '50%',
        background: C.rose, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, cursor: 'grab', boxShadow: '0 2px 6px rgba(13,19,35,0.25)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {initialsOf(guest)}
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        style={{ position: 'absolute', top: -4, right: -4, width: 15, height: 15, borderRadius: '50%', background: '#C0392B', color: '#fff', border: '2px solid #fff', fontSize: 9, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
      >
        ×
      </button>
    </div>
  )
}

function GuestChip({ guest }: { guest: Guest }) {
  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'guest', id: guest.id }))}
      style={{ padding: '8px 12px', background: '#FAF7F3', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, color: C.navy, cursor: 'grab', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {guest.first_name} {guest.last_name}{guest.group_size > 1 ? ` (+${guest.group_size - 1})` : ''}
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

  const rotatingRef = useRef<{ tableId: string; centerX: number; centerY: number } | null>(null)
  const lastRotationRef = useRef(0)

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
    if (created) setLocalTables(prev => [...prev, { ...created, rotation: created.rotation ?? 0 }])
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

  function handleRotateMove(e: PointerEvent) {
    const r = rotatingRef.current
    if (!r) return
    const angle = (Math.atan2(e.clientY - r.centerY, e.clientX - r.centerX) * 180) / Math.PI + 90
    lastRotationRef.current = angle
    setLocalTables(prev => prev.map(t => t.id === r.tableId ? { ...t, rotation: angle } : t))
  }

  function handleRotateUp() {
    const r = rotatingRef.current
    rotatingRef.current = null
    window.removeEventListener('pointermove', handleRotateMove)
    window.removeEventListener('pointerup', handleRotateUp)
    if (r) updateTable(eventId, r.tableId, { rotation: lastRotationRef.current }).then(() => router.refresh())
  }

  function startRotate(e: React.PointerEvent, table: EventTable) {
    e.stopPropagation()
    e.preventDefault()
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    rotatingRef.current = {
      tableId: table.id,
      centerX: rect.left + (table.pos_x / 100) * rect.width,
      centerY: rect.top + (table.pos_y / 100) * rect.height,
    }
    window.addEventListener('pointermove', handleRotateMove)
    window.addEventListener('pointerup', handleRotateUp)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, alignItems: 'start' }}>

      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <button disabled={creating} onClick={() => handleAddTable('round')} style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
            + Table ronde
          </button>
          <button disabled={creating} onClick={() => handleAddTable('rect')} style={{ background: 'none', color: C.navy, border: `1px solid ${C.border}`, borderRadius: 999, padding: '9px 18px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
            + Table rectangulaire
          </button>
        </div>

        {selectedTable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#FAF7F3', border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <input
              defaultValue={selectedTable.name}
              onBlur={e => updateTable(eventId, selectedTable.id, { name: e.target.value }).then(() => router.refresh())}
              style={{ fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif", border: 'none', borderBottom: `1px solid ${C.border}`, padding: '4px 2px', outline: 'none', background: 'transparent', minWidth: 100 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              {(['round', 'rect'] as Shape[]).map(sh => (
                <button
                  key={sh}
                  onClick={() => updateTable(eventId, selectedTable.id, { shape: sh }).then(() => router.refresh())}
                  style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${selectedTable.shape === sh ? C.navy : C.border}`, background: selectedTable.shape === sh ? C.navy : 'none', color: selectedTable.shape === sh ? '#fff' : C.sand, fontSize: 10.5, cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  {sh === 'round' ? 'Ronde' : 'Rectangulaire'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 10, letterSpacing: '0.1em', color: '#6B5E50', textTransform: 'uppercase' }}>Places</label>
              <input
                type="number" min="1" defaultValue={selectedTable.seats}
                onBlur={e => updateTable(eventId, selectedTable.id, { seats: parseInt(e.target.value) || 1 }).then(() => router.refresh())}
                style={{ width: 50, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif" }}
              />
            </div>
            <button onClick={() => handleDeleteTable(selectedTable.id)} style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline', fontFamily: "'Inter', system-ui, sans-serif" }}>
              Supprimer
            </button>
            <button onClick={() => setSelectedId(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.sand, fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>
              ×
            </button>
          </div>
        )}

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
            const w = isRound ? 96 : 140
            const h = isRound ? 96 : 68
            const offsets = seatOffsets(table.shape, assigned.length, w, h)
            const selected = selectedId === table.id
            return (
              <div
                key={table.id}
                style={{
                  position: 'absolute',
                  left: `${table.pos_x}%`, top: `${table.pos_y}%`,
                  transform: `translate(-50%, -50%) rotate(${table.rotation}deg)`,
                }}
              >
                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'table', id: table.id }))}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDropOnTable(e, table.id)}
                  onClick={() => setSelectedId(table.id)}
                  style={{
                    width: w, height: h,
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

                {/* Poignée de rotation */}
                <div
                  onPointerDown={e => startRotate(e, table)}
                  title="Faire pivoter"
                  style={{ position: 'absolute', top: -26, left: '50%', transform: 'translate(-50%, 0)', width: 14, height: 14, borderRadius: '50%', background: '#fff', border: `2px solid ${C.navy}`, cursor: 'grab' }}
                />

                {/* Vignettes des invités assignés, réparties autour de la table */}
                {assigned.map((g, i) => (
                  <div
                    key={g.id}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDropOnTable(e, table.id)}
                    style={{
                      position: 'absolute',
                      left: w / 2 + offsets[i].x, top: h / 2 + offsets[i].y,
                      transform: `translate(-50%, -50%) rotate(${-table.rotation}deg)`,
                    }}
                  >
                    <GuestAvatar guest={g} onRemove={() => unassignGuest(g.id)} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { const d = dragData(e); if (d?.kind === 'guest') unassignGuest(d.id) }}
        style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}
      >
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
          Glisse un invité sur une table pour l'assigner, ou une vignette de la table jusqu'ici pour le retirer.
        </p>
      </div>

    </div>
  )
}
