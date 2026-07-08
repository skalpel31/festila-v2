'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  createTable,
  updateTable,
  deleteTable,
  assignGuestSeat,
  type TableShape as Shape,
} from '@/app/dashboard/events/[id]/plan/actions'

type EventTable = { id: string; event_id: string; name: string; shape: Shape; seats: number; pos_x: number; pos_y: number; rotation: number }
type Guest = { id: string; first_name: string; last_name: string; group_size: number; status: string; table_id: string | null; seat_index: number | null }

const C = { navy: '#0D1323', rose: '#E787B2', or: '#D4A373', sand: '#9B8E7E', border: '#E0D8D0' }
const AVATAR = 30
const SLOT = 34

function dragData(e: React.DragEvent): { kind: 'guest' | 'table'; id: string } | null {
  try { return JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return null }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

// Positions fixes des N sièges d'une table (repère local, non tourné — la
// rotation de la table s'applique visuellement via le transform CSS du parent).
function seatOffsets(shape: Shape, count: number, w: number, h: number) {
  const OUT = 24
  const offsets: { x: number; y: number }[] = []
  if (count === 0) return offsets
  if (shape === 'round') {
    const r = w / 2 + OUT
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2
      offsets.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) })
    }
  } else {
    // Table rectangulaire : les places vont sur les deux grands côtés
    // (comme une vraie table de banquet), pas sur tout le pourtour.
    const hw = w / 2, hy = h / 2 + OUT
    const topCount = Math.ceil(count / 2)
    const bottomCount = count - topCount
    const spread = (n: number, y: number) => {
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : (i + 0.5) / n
        offsets.push({ x: -hw + t * (2 * hw), y })
      }
    }
    spread(topCount, -hy)
    spread(bottomCount, hy)
  }
  return offsets
}

function initialsOf(g: Guest) {
  return `${g.first_name?.[0] ?? ''}${g.last_name?.[0] ?? ''}`.toUpperCase() || '?'
}

function GuestAvatar({ guest, selected, onClick }: { guest: Guest; selected?: boolean; onClick?: () => void }) {
  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'guest', id: guest.id }))}
      onClick={e => { e.stopPropagation(); onClick?.() }}
      title={`${guest.first_name} ${guest.last_name}`}
      style={{
        width: AVATAR, height: AVATAR, borderRadius: '50%',
        background: C.rose, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: selected ? `0 0 0 3px ${C.navy}` : '0 2px 6px rgba(13,19,35,0.25)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {initialsOf(guest)}
    </div>
  )
}

function GuestChip({ guest, selected, onClick }: { guest: Guest; selected?: boolean; onClick?: () => void }) {
  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'guest', id: guest.id }))}
      onClick={onClick}
      style={{ padding: '8px 12px', background: selected ? '#FDEEF5' : '#FAF7F3', border: `1px solid ${selected ? C.rose : C.border}`, borderRadius: 8, fontSize: 12.5, color: C.navy, cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}
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
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => setLocalTables(tables), [tables])
  useEffect(() => setLocalGuests(guests), [guests])

  const seatMap = useMemo(() => {
    // (tableId, seatIndex) -> invité
    const map = new Map<string, Guest>()
    localGuests.forEach(g => {
      if (g.table_id !== null && g.seat_index !== null) map.set(`${g.table_id}:${g.seat_index}`, g)
    })
    return map
  }, [localGuests])

  const unassigned = localGuests.filter(g => g.table_id === null)
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
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 6, 94)
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 10, 90)
    setLocalTables(prev => prev.map(t => t.id === data.id ? { ...t, pos_x: x, pos_y: y } : t))
    updateTable(eventId, data.id, { pos_x: x, pos_y: y }).then(() => router.refresh())
  }

  function seatGuest(guestId: string, tableId: string, seatIndex: number) {
    const incoming = localGuests.find(g => g.id === guestId)
    if (!incoming) return
    const occupant = seatMap.get(`${tableId}:${seatIndex}`)

    if (occupant && occupant.id !== guestId) {
      const prevTable = incoming.table_id, prevSeat = incoming.seat_index
      setLocalGuests(prev => prev.map(g => {
        if (g.id === incoming.id) return { ...g, table_id: tableId, seat_index: seatIndex }
        if (g.id === occupant.id) return { ...g, table_id: prevTable, seat_index: prevSeat }
        return g
      }))
      assignGuestSeat(eventId, incoming.id, tableId, seatIndex)
        .then(() => assignGuestSeat(eventId, occupant.id, prevTable, prevSeat))
        .then(() => router.refresh())
    } else {
      setLocalGuests(prev => prev.map(g => g.id === incoming.id ? { ...g, table_id: tableId, seat_index: seatIndex } : g))
      assignGuestSeat(eventId, incoming.id, tableId, seatIndex).then(() => router.refresh())
    }
  }

  function unassignGuest(guestId: string) {
    setLocalGuests(prev => prev.map(g => g.id === guestId ? { ...g, table_id: null, seat_index: null } : g))
    assignGuestSeat(eventId, guestId, null, null).then(() => router.refresh())
  }

  function toggleSelectGuest(guestId: string) {
    setSelectedGuestId(prev => prev === guestId ? null : guestId)
  }

  function handleSeatClick(tableId: string, seatIndex: number) {
    if (selectedGuestId) {
      seatGuest(selectedGuestId, tableId, seatIndex)
      setSelectedGuestId(null)
    } else {
      const occupant = seatMap.get(`${tableId}:${seatIndex}`)
      if (occupant) setSelectedGuestId(occupant.id)
    }
  }

  function handleUnassignedPanelClick() {
    if (selectedGuestId) {
      unassignGuest(selectedGuestId)
      setSelectedGuestId(null)
    }
  }

  async function handleDeleteTable(tableId: string, name: string) {
    if (!window.confirm(`Supprimer "${name}" ? Les invités qui y sont assignés repasseront en "non assignés".`)) return
    setSelectedId(null)
    setLocalTables(prev => prev.filter(t => t.id !== tableId))
    await deleteTable(eventId, tableId)
    router.refresh()
  }

  function rotateTable(table: EventTable) {
    const rotation = (table.rotation + 90) % 360
    setLocalTables(prev => prev.map(t => t.id === table.id ? { ...t, rotation } : t))
    updateTable(eventId, table.id, { rotation }).then(() => router.refresh())
  }

  return (
    <div className="seating-grid">
      <style>{`
        .seating-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; align-items: start; }
        .seating-canvas { height: 560px; }
        @media (max-width: 768px) {
          .seating-grid { grid-template-columns: 1fr; }
          .seating-canvas { height: 380px; }
        }
      `}</style>

      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <button disabled={creating} onClick={() => handleAddTable('round')} style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
            + Table ronde
          </button>
          <button disabled={creating} onClick={() => handleAddTable('rect')} style={{ background: 'none', color: C.navy, border: `1px solid ${C.border}`, borderRadius: 999, padding: '9px 18px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }}>
            + Table rectangulaire
          </button>
          <p style={{ fontSize: 11, color: C.sand, alignSelf: 'center', marginLeft: 'auto' }}>
            Glisse une table pour la déplacer · double-clic pour la pivoter
          </p>
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
          className="seating-canvas"
          style={{ position: 'relative', width: '100%', background: '#FAF7F3', border: `1px dashed ${C.border}`, borderRadius: 14, overflow: 'hidden' }}
        >
          {localTables.length === 0 && (
            <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sand, fontSize: 13, textAlign: 'center', padding: 24 }}>
              Ajoute une table pour commencer le plan de salle.
            </p>
          )}
          {localTables.map(table => {
            const isRound = table.shape === 'round'
            const w = isRound ? 96 : 140
            const h = isRound ? 96 : 68
            const offsets = seatOffsets(table.shape, table.seats, w, h)
            const filled = offsets.reduce((n, _, i) => n + (seatMap.has(`${table.id}:${i}`) ? 1 : 0), 0)
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
                  onClick={() => setSelectedId(table.id)}
                  onDoubleClick={() => rotateTable(table)}
                  title="Glisser pour déplacer · double-clic pour pivoter"
                  style={{
                    width: w, height: h,
                    borderRadius: isRound ? '50%' : 12,
                    background: selected ? '#FDEEF5' : '#fff',
                    border: `2px solid ${selected ? C.rose : C.border}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'grab', boxShadow: '0 2px 10px rgba(13,19,35,0.08)', padding: 8,
                    userSelect: 'none', textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: '#1A1208', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{table.name}</p>
                  <p style={{ fontSize: 10, color: C.sand, marginTop: 2 }}>{filled}/{table.seats}</p>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); handleDeleteTable(table.id, table.name) }}
                  title="Supprimer la table"
                  style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', background: '#C0392B', color: '#fff', border: '2px solid #fff', fontSize: 12, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 2 }}
                >
                  ×
                </button>

                {/* Sièges — toujours affichés selon la capacité, vides ou occupés */}
                {offsets.map((off, i) => {
                  const occupant = seatMap.get(`${table.id}:${i}`)
                  return (
                    <div
                      key={i}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.stopPropagation(); const d = dragData(e); if (d?.kind === 'guest') seatGuest(d.id, table.id, i) }}
                      onClick={e => { e.stopPropagation(); handleSeatClick(table.id, i) }}
                      style={{
                        position: 'absolute',
                        left: w / 2 + off.x, top: h / 2 + off.y,
                        transform: `translate(-50%, -50%) rotate(${-table.rotation}deg)`,
                      }}
                    >
                      {occupant ? (
                        <GuestAvatar guest={occupant} selected={selectedGuestId === occupant.id} onClick={() => toggleSelectGuest(occupant.id)} />
                      ) : (
                        <div style={{
                          width: SLOT, height: SLOT, borderRadius: '50%', cursor: 'pointer',
                          border: `1.5px dashed ${selectedGuestId ? C.rose : C.border}`,
                          background: selectedGuestId ? '#FDEEF5' : 'rgba(255,255,255,0.6)',
                        }} />
                      )}
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
        onClick={handleUnassignedPanelClick}
        style={{ background: '#fff', border: `1px solid ${selectedGuestId ? C.rose : C.border}`, borderRadius: 16, padding: 20 }}
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
            {unassigned.map(g => (
              <GuestChip key={g.id} guest={g} selected={selectedGuestId === g.id} onClick={() => toggleSelectGuest(g.id)} />
            ))}
          </div>
        )}
        <p style={{ fontSize: 11, color: C.sand, marginTop: 16, lineHeight: 1.6 }}>
          Glisse (ou touche puis touche une place) un invité pour l'assigner. Sur une place occupée : échange. Ici : retire.
        </p>
      </div>

    </div>
  )
}
