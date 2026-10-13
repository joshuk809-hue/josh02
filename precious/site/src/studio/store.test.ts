// Self-check for the follow-up rules. Run: node --experimental-strip-types src/studio/store.test.ts
import assert from 'node:assert/strict'
import { adjustStock, completeAppointment, dueFollowUps, emptyState, findByBarcode, normalize, reopenAppointment, restock, usageReport, type State } from './store.ts'

const DAY = 86_400_000
const now = new Date('2026-10-08T12:00:00Z')
const ago = (d: number) => new Date(+now - d * DAY).toISOString()
const client = (id: string, consent = true) => ({ id, name: id, phone: '39333', lang: 'it' as const, gender: 'women' as const, notes: '', consent, createdAt: ago(400) })
const base = (): State => ({ clients: [], appointments: [], stock: [], sent: [], recipes: {}, moves: [] })

// Thanks + review the day after a visit
let s = base(); s.clients = [client('a')]; s.appointments = [{ id: 'x', clientId: 'a', serviceId: 'braids', at: ago(1), status: 'done' }]
assert.deepEqual(dueFollowUps(s, now).map((d) => d.kind), ['thanks'])

// No consent → nothing
s.clients = [client('a', false)]
assert.equal(dueFollowUps(s, now).length, 0)

// Already thanked for this visit → nothing until rebook time
s.clients = [client('a')]; s.sent = [{ clientId: 'a', kind: 'thanks', apptId: 'x', at: ago(0.5) }]
assert.equal(dueFollowUps(s, now).length, 0)

// Braids rebook after 42 days
s.appointments[0].at = ago(43); s.sent = [{ clientId: 'a', kind: 'thanks', apptId: 'x', at: ago(42) }]
assert.deepEqual(dueFollowUps(s, now).map((d) => d.kind), ['rebook'])

// A future booking suppresses reminders
s.appointments.push({ id: 'y', clientId: 'a', serviceId: 'braids', at: new Date(+now + 3 * DAY).toISOString(), status: 'booked' })
assert.equal(dueFollowUps(s, now).length, 0)

// 14-day gap between any two messages
s.appointments.pop(); s.sent.push({ clientId: 'a', kind: 'rebook', apptId: 'x', at: ago(3) })
assert.equal(dueFollowUps(s, now).length, 0)

// Win-back after 90 days, once
s.appointments[0].at = ago(100); s.sent = [{ clientId: 'a', kind: 'rebook', at: ago(55) }]
assert.deepEqual(dueFollowUps(s, now).map((d) => d.kind), ['winback'])
s.sent.push({ clientId: 'a', kind: 'winback', at: ago(1) })
assert.equal(dueFollowUps(s, new Date(+now + 30 * DAY)).length, 0)

console.log('follow-up rules: all checks passed')

/* ---------- inventory ---------- */
const qty = (st: State, id: string) => st.stock.find((i) => i.id === id)!.qty
let inv = emptyState()
inv.appointments = [{ id: 'b1', clientId: 'c', serviceId: 'braids', at: ago(0), status: 'booked' }]

// Done takes the braids recipe out of stock, exactly once
inv = completeAppointment(inv, 'b1', now)
assert.equal(qty(inv, 'hair-1b'), 17); assert.equal(qty(inv, 'mousse'), 3.75); assert.equal(qty(inv, 'beads'), 190)
assert.equal(inv.appointments[0].status, 'done')
assert.equal(qty(completeAppointment(inv, 'b1', now), 'hair-1b'), 17, 'second Done must not deduct again')

// Undo puts it all back and re-books
inv = reopenAppointment(inv, 'b1', now)
assert.equal(qty(inv, 'hair-1b'), 20); assert.equal(qty(inv, 'mousse'), 4); assert.equal(inv.appointments[0].status, 'booked')

// Never below zero, and the log records what was really taken
let z = adjustStock(emptyState(), 'lash-glue', -5, 'use', now)
assert.equal(qty(z, 'lash-glue'), 0); assert.equal(z.moves.at(-1)!.delta, -2)
// A recipe bigger than the stock only records what was there
z.appointments = [{ id: 'l1', clientId: 'c', serviceId: 'lashes', at: ago(0), status: 'booked' }]
z = completeAppointment(z, 'l1', now)
assert.deepEqual(z.appointments[0].usedStock, [{ itemId: 'lash-trays', qty: 0.5 }])
assert.equal(qty(reopenAppointment(z, 'l1', now), 'lash-glue'), 0, 'undo returns only what was taken')

// Delivery: several products at once, zeros ignored
const r = restock(emptyState(), { 'hair-1b': 10, mousse: 6, shampoo: 0 }, now)
assert.equal(qty(r, 'hair-1b'), 30); assert.equal(qty(r, 'mousse'), 10); assert.equal(r.moves.length, 2)

// Barcode lookup
const bc = { ...emptyState(), stock: emptyState().stock.map((i) => (i.id === 'mousse' ? { ...i, barcode: '800123' } : i)) }
assert.equal(findByBarcode(bc, ' 800123 ')!.id, 'mousse'); assert.equal(findByBarcode(bc, '999'), undefined)

// Usage report: 30-day window, only real consumption, sorted by soonest run-out
let u = emptyState()
u.moves = [
  { itemId: 'hair-1b', delta: -15, at: ago(10), reason: 'service' },
  { itemId: 'hair-1b', delta: -50, at: ago(40), reason: 'service' }, // outside window
  { itemId: 'hair-1b', delta: 30, at: ago(5), reason: 'restock' },   // not consumption
  { itemId: 'razors', delta: -3, at: ago(2), reason: 'use' },
  { itemId: 'mousse', delta: -2, at: ago(2), reason: 'set' },        // typed correction, not usage
]
const rep = usageReport(u, now)
assert.deepEqual(rep.map((x) => [x.item.id, x.used, x.daysLeft]), [['hair-1b', 15, 40], ['razors', 3, 300]])
assert.equal(rep[0].perWeek, 3.5)

// Old backups: recipes pointing at deleted products are dropped, missing fields filled
const old = normalize({ ...emptyState(), stock: emptyState().stock.filter((i) => i.id !== 'mousse'), moves: undefined as never })
assert.ok(!old.recipes.braids.some((l) => l.itemId === 'mousse')); assert.deepEqual(old.moves, [])

// Done then Undo leaves no usage in the report
let du = emptyState(); du.appointments = [{ id: 'd1', clientId: 'c', serviceId: 'braids', at: ago(0), status: 'booked' }]
du = reopenAppointment(completeAppointment(du, 'd1', now), 'd1', now)
assert.deepEqual(usageReport(du, now), [])

console.log('inventory: all checks passed')
