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
type Guest = { id: string; first_name: string; last_name: string; group_size: number; status: string; table_id: string | null; seat_x: number | null; seat_y: number | null }

const C = { navy: '#0D1323', rose: '#E787B2', or: '#D4A373', sand: '#9B8E7E', border: '#E0D8D0' }
const AVATAR = 30
const DROP_THRESHOLD = 140 // px — distance max au centre d'une table pour qu'un dépose d'invité compte comme "sur cette table"

function dragData(e: React.DragEvent): { kind: 'guest' | 'table'; id: string } | null {
  try { return JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return null }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

// Convertit un delta écran (par rapport au centre de la table) en repère local
// non tourné — nécessaire car la table peut être pivotée.
function toLocal(dx: number, dy: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return {
    x: dx * Math.cos(rad) + dy * Math.sin(rad),
    y: -dx * Math.sin(rad) + dy * Math.cos(rad),
  }
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

  function tableCenterScreen(table: EventTable, rect: DOMRect) {
    return { x: rect.left + (table.pos_x / 100) * rect.width, y: rect.top + (table.pos_y / 100) * rect.height }
  }

  function handleCanvasDrop(e: React.DragEvent) {
    const data = dragData(e)
    if (!data || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()

    if (data.kind === 'table') {
      const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 6, 94)
      const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 10, 90)
      setLocalTables(prev => prev.map(t => t.id === data.id ? { ...t, pos_x: x, pos_y: y } : t))
      updateTable(eventId, data.id, { pos_x: x, pos_y: y }).then(() => router.refresh())
      return
    }

    // Invité déposé : on cherche la table la plus proche du point de dépose.
    let nearest: EventTable | null = null
    let nearestDist = Infinity
    for (const t of localTables) {
      const c = tableCenterScreen(t, rect)
      const d = Math.hypot(e.clientX - c.x, e.clientY - c.y)
      if (d < nearestDist) { nearestDist = d; nearest = t }
    }
    if (!nearest || nearestDist > DROP_THRESHOLD) return

    const c = tableCenterScreen(nearest, rect)
    const local = toLocal(e.clientX - c.x, e.clientY - c.y, nearest.rotation)
    const tableId = nearest.id
    setLocalGuests(prev => prev.map(g => g.id === data.id ? { ...g, table_id: tableId, seat_x: local.x, seat_y: local.y } : g))
    assignGuestToTable(eventId, data.id, tableId, local.x, local.y).then(() => router.refresh())
  }

  function unassignGuest(guestId: string) {
    setLocalGuests(prev => prev.map(g => g.id === guestId ? { ...g, table_id: null, seat_x: null, seat_y: null } : g))
    assignGuestToTable(eventId, guestId, null).then(() => router.refresh())
  }

  async function handleDeleteTable(tableId: string, name: string) {
    if (!window.confirm(`Supprimer "${name}" ? Les invités qui y sont assignés repasseront en "non assignés".`)) return
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
                  onClick={() => setSelectedId(table.id)}
                  style={{
                    width: w, height: h,
                    borderRadius: isRound ? '50%' : 12,
                    background: selected ? '#FDEEF5' : '#fff',
                    border: `2px solid ${over ? '#C0392B' : selected ? C.rose : C.border}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 10px rgba(13,19,35,0.08)', padding: 8,
                    userSelect: 'none', textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: '#1A1208', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{table.name}</p>
                  <p style={{ fontSize: 10, color: over ? '#C0392B' : C.sand, marginTop: 2 }}>{used}/{table.seats}</p>
                </div>

                {/* Supprimer — directement sur la table */}
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteTable(table.id, table.name) }}
                  title="Supprimer la table"
                  style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', background: '#C0392B', color: '#fff', border: '2px solid #fff', fontSize: 12, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 2 }}
                >
                  ×
                </button>

                {/* Poignée de rotation */}
                <div
                  onPointerDown={e => startRotate(e, table)}
                  title="Faire pivoter"
                  style={{ position: 'absolute', top: -26, left: '50%', transform: 'translate(-50%, 0)', width: 14, height: 14, borderRadius: '50%', background: '#fff', border: `2px solid ${C.navy}`, cursor: 'grab' }}
                />

                {/* Poignée de déplacement */}
                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'table', id: table.id }))}
                  title="Déplacer la table"
                  style={{ position: 'absolute', bottom: -26, left: '50%', transform: 'translate(-50%, 0)', width: 22, height: 22, borderRadius: '50%', background: '#fff', border: `2px solid ${C.navy}`, cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
                  </svg>
                </div>

                {/* Vignettes des invités — position libre, mémorisée par invité */}
                {assigned.map(g => {
                  const lx = g.seat_x ?? 0
                  const ly = g.seat_y ?? -(h / 2 + 24)
                  return (
                    <div
                      key={g.id}
                      style={{
                        position: 'absolute',
                        left: w / 2 + lx, top: h / 2 + ly,
                        transform: `translate(-50%, -50%) rotate(${-table.rotation}deg)`,
                      }}
                    >
                      <GuestAvatar guest={g} onRemove={() => unassignGuest(g.id)} />
                    </div>
                  )
                })}
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
          Glisse un invité où tu veux sur ou autour d'une table pour l'assigner, ou une vignette jusqu'ici pour le retirer.
        </p>
      </div>

    </div>
  )
}
