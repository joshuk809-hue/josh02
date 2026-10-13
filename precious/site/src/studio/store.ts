// Studio data lives in this browser's localStorage only. Use Backup to move it between devices.
import type { Lang } from '../i18n'

export type Client = { id: string; name: string; phone: string; lang: Lang; gender: 'women' | 'men'; notes: string; consent: boolean; createdAt: string }
export type Usage = { itemId: string; qty: number }
export type Appointment = { id: string; clientId: string; serviceId: string; at: string; status: 'booked' | 'done' | 'cancelled' | 'no-show'; usedStock?: Usage[] }
export type StockItem = { id: string; name: string; category: string; qty: number; unit: string; min: number; barcode?: string }
// reason: 'service' and 'use' count as consumption in reports, 'undo' cancels it; 'restock' and 'set' don't
export type StockMove = { itemId: string; delta: number; at: string; reason: 'service' | 'use' | 'restock' | 'set' | 'undo' }
export type Sent = { clientId: string; kind: FollowKind; at: string; apptId?: string }
export type FollowKind = 'thanks' | 'rebook' | 'winback'
export type State = { clients: Client[]; appointments: Appointment[]; stock: StockItem[]; sent: Sent[]; recipes: Record<string, Usage[]>; moves: StockMove[] }

const KEY = 'precious-studio-v1'
const DAY = 86_400_000

export const uid = () => Math.random().toString(36).slice(2, 10)

// Default stock has fixed ids so the default "used per service" recipes can point at it.
export const emptyState = (): State => ({
  clients: [],
  appointments: [],
  sent: [],
  moves: [],
  stock: [
    { id: 'hair-1b', name: 'Braiding hair (black, 1B)', category: 'Hair', qty: 20, unit: 'packs', min: 8 },
    { id: 'hair-30', name: 'Braiding hair (brown, 30)', category: 'Hair', qty: 10, unit: 'packs', min: 5 },
    { id: 'edge', name: 'Edge control', category: 'Care', qty: 6, unit: 'jars', min: 2 },
    { id: 'mousse', name: 'Mousse', category: 'Care', qty: 4, unit: 'bottles', min: 2 },
    { id: 'shampoo', name: 'Shampoo', category: 'Care', qty: 3, unit: 'bottles', min: 2 },
    { id: 'beads', name: 'Hair beads & cuffs', category: 'Accessories', qty: 200, unit: 'pcs', min: 50 },
    { id: 'lash-trays', name: 'Lash trays', category: 'Lashes', qty: 5, unit: 'trays', min: 2 },
    { id: 'lash-glue', name: 'Lash glue', category: 'Lashes', qty: 2, unit: 'bottles', min: 1 },
    { id: 'razors', name: 'Razor blades', category: 'Barber', qty: 30, unit: 'pcs', min: 10 },
  ],
  // What one appointment of each service uses. Precious adjusts these in Stock → Used per service.
  recipes: {
    braids: [{ itemId: 'hair-1b', qty: 3 }, { itemId: 'edge', qty: 0.1 }, { itemId: 'mousse', qty: 0.25 }, { itemId: 'beads', qty: 10 }],
    lashes: [{ itemId: 'lash-trays', qty: 0.5 }, { itemId: 'lash-glue', qty: 0.1 }],
    shave: [{ itemId: 'razors', qty: 1 }],
    wash: [{ itemId: 'shampoo', qty: 0.05 }],
    retouch: [{ itemId: 'edge', qty: 0.1 }],
  },
})

// Drop recipe lines whose product no longer exists (e.g. older backups, deleted products).
export function normalize(s: State): State {
  const ids = new Set(s.stock.map((i) => i.id))
  const recipes: State['recipes'] = {}
  for (const [svc, lines] of Object.entries(s.recipes ?? {})) recipes[svc] = lines.filter((l) => ids.has(l.itemId))
  return { ...s, recipes, moves: s.moves ?? [] }
}

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return normalize({ ...emptyState(), ...JSON.parse(raw) })
  } catch { /* storage blocked or corrupt: start fresh */ }
  return emptyState()
}

export function save(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage full or blocked */ }
}

// Days after the last visit before suggesting a rebook, per service.
export const REBOOK_DAYS: Record<string, number> = {
  braids: 42, 'colour-cut': 42, haircut: 28, 'kids-haircut': 35, retouch: 28, lashes: 21, shave: 14, wash: 28,
}

// Anti-annoyance rules: consent required, at most one message per client every 14 days,
// review asked at most once every 180 days, win-back at most once every 180 days.
export const RULES = { gapDays: 14, reviewEveryDays: 180, winbackAfterDays: 90 }

export type Due = { client: Client; kind: FollowKind; appt?: Appointment }

export function dueFollowUps(s: State, now = new Date()): Due[] {
  const t = now.getTime()
  const out: Due[] = []
  for (const c of s.clients) {
    if (!c.consent || !c.phone) continue
    const sent = s.sent.filter((x) => x.clientId === c.id)
    const lastSent = Math.max(0, ...sent.map((x) => +new Date(x.at)))
    if (t - lastSent < RULES.gapDays * DAY) continue

    const appts = s.appointments.filter((a) => a.clientId === c.id)
    if (appts.some((a) => a.status === 'booked' && +new Date(a.at) > t)) continue // already coming back
    const done = appts.filter((a) => a.status === 'done').sort((a, b) => +new Date(b.at) - +new Date(a.at))
    const last = done[0]
    if (!last) continue
    const since = t - +new Date(last.at)

    const thanked = sent.some((x) => x.kind === 'thanks' && x.apptId === last.id)
    const lastReview = Math.max(0, ...sent.filter((x) => x.kind === 'thanks').map((x) => +new Date(x.at)))
    if (!thanked && since >= DAY && since < 7 * DAY && t - lastReview >= RULES.reviewEveryDays * DAY) {
      out.push({ client: c, kind: 'thanks', appt: last })
      continue
    }
    const rebookAfter = (REBOOK_DAYS[last.serviceId] ?? 35) * DAY
    const rebooked = sent.some((x) => x.kind === 'rebook' && +new Date(x.at) > +new Date(last.at))
    if (!rebooked && since >= rebookAfter && since < RULES.winbackAfterDays * DAY) {
      out.push({ client: c, kind: 'rebook', appt: last })
      continue
    }
    const lastWinback = Math.max(0, ...sent.filter((x) => x.kind === 'winback').map((x) => +new Date(x.at)))
    if (since >= RULES.winbackAfterDays * DAY && t - lastWinback >= 180 * DAY && lastWinback < +new Date(last.at) + RULES.winbackAfterDays * DAY) {
      out.push({ client: c, kind: 'winback', appt: last })
    }
  }
  return out
}

// Example data for trying the studio. Every client note says "Example" so it's never mistaken for real clients.
export function demoState(now = new Date()): State {
  const s = emptyState()
  const at = (days: number, h: number, m = 0) => {
    const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d.toISOString()
  }
  const people: [string, string, Lang, Client['gender']][] = [
    ['Amara Okafor', '+39 347 000 0001', 'it', 'women'],
    ['Lucas Moreau', '+33 6 00 00 00 02', 'fr', 'men'],
    ['Sofia Rossi', '+39 348 000 0003', 'it', 'women'],
    ['Daniel Weber', '+49 151 0000 0004', 'de', 'men'],
    ['Grace Mensah', '+39 349 000 0005', 'en', 'women'],
    ['Lucía García', '+34 600 000 006', 'es', 'women'],
  ]
  s.clients = people.map(([name, phone, lang, gender], i) => ({
    id: `ex${i}`, name, phone, lang, gender, consent: i !== 5, createdAt: at(-200, 9),
    notes: ['Example · knotless medium, sensitive scalp', 'Example · likes a skin fade', 'Example · lashes every 3 weeks', 'Example · cornrows with beads', 'Example · jumbo braids, brings own hair', 'Example · said STOP to reminders'][i],
  }))
  s.appointments = [
    { id: 'a1', clientId: 'ex0', serviceId: 'braids', at: at(0, 10), status: 'booked' },
    { id: 'a2', clientId: 'ex1', serviceId: 'haircut', at: at(0, 14, 30), status: 'booked' },
    { id: 'a3', clientId: 'ex3', serviceId: 'braids', at: at(1, 11), status: 'booked' },
    { id: 'a4', clientId: 'ex2', serviceId: 'lashes', at: at(-2, 16), status: 'done' },
    { id: 'a5', clientId: 'ex4', serviceId: 'braids', at: at(-45, 10), status: 'done' },
    { id: 'a6', clientId: 'ex5', serviceId: 'haircut', at: at(-40, 12), status: 'done' },
  ]
  s.sent = [{ clientId: 'ex4', kind: 'thanks', apptId: 'a5', at: at(-44, 12) }]
  s.stock = s.stock.map((i) => (i.id === 'edge' ? { ...i, qty: 1, barcode: '8001234567890' } : i.id === 'mousse' ? { ...i, barcode: '8009876543210' } : i))
  s.appointments = s.appointments.map((a) => (a.status === 'done' ? { ...a, usedStock: [] } : a)) // history: don't re-deduct
  // Some past consumption so the usage report has numbers
  for (const [d, id, n] of [[-28, 'hair-1b', 3], [-21, 'hair-1b', 3], [-14, 'hair-1b', 6], [-7, 'hair-1b', 3], [-20, 'beads', 30], [-9, 'razors', 4], [-3, 'lash-trays', 1]] as const)
    s.moves.push({ itemId: id, delta: -n, at: at(d, 12), reason: 'service' })
  return s
}

/* ---------- Inventory ---------- */
const round = (n: number) => Math.round(n * 100) / 100

// Change one product's quantity (never below zero) and log what actually changed.
export function adjustStock(s: State, itemId: string, delta: number, reason: StockMove['reason'], now = new Date()): State {
  const item = s.stock.find((i) => i.id === itemId)
  if (!item || !delta) return s
  const qty = Math.max(0, round(item.qty + delta))
  const applied = round(qty - item.qty)
  if (!applied) return s
  return {
    ...s,
    stock: s.stock.map((i) => (i.id === itemId ? { ...i, qty } : i)),
    moves: [...s.moves, { itemId, delta: applied, at: now.toISOString(), reason }],
  }
}

// Mark an appointment done and take what the service uses out of stock (only once per appointment).
export function completeAppointment(s: State, apptId: string, now = new Date()): State {
  const appt = s.appointments.find((a) => a.id === apptId)
  if (!appt || appt.status === 'done') return s
  let next = s
  const used: Usage[] = []
  for (const line of s.recipes[appt.serviceId] ?? []) {
    const before = next.stock.find((i) => i.id === line.itemId)?.qty ?? 0
    next = adjustStock(next, line.itemId, -line.qty, 'service', now)
    const took = round(before - (next.stock.find((i) => i.id === line.itemId)?.qty ?? 0))
    if (took) used.push({ itemId: line.itemId, qty: took })
  }
  return { ...next, appointments: next.appointments.map((a) => (a.id === apptId ? { ...a, status: 'done', usedStock: used } : a)) }
}

// Undo "Done": the appointment is booked again and the products go back into stock.
export function reopenAppointment(s: State, apptId: string, now = new Date()): State {
  const appt = s.appointments.find((a) => a.id === apptId)
  if (!appt) return s
  let next = s
  for (const u of appt.usedStock ?? []) next = adjustStock(next, u.itemId, u.qty, 'undo', now)
  return { ...next, appointments: next.appointments.map((a) => (a.id === apptId ? { ...a, status: 'booked', usedStock: undefined } : a)) }
}

// A delivery arrived: add every received amount in one go.
export function restock(s: State, received: Record<string, number>, now = new Date()): State {
  let next = s
  for (const [id, n] of Object.entries(received)) if (n > 0) next = adjustStock(next, id, n, 'restock', now)
  return next
}

export const findByBarcode = (s: State, code: string) => s.stock.find((i) => i.barcode && i.barcode === code.trim())

export type UsageRow = { item: StockItem; used: number; perWeek: number; daysLeft: number | null }

// How much of each product was used in the last `days` days, and when it will run out at that pace.
export function usageReport(s: State, now = new Date(), days = 30): UsageRow[] {
  const since = +now - days * DAY
  const used = new Map<string, number>()
  for (const m of s.moves) {
    // undo gives back what a service took, so it cancels that usage
    if ((m.reason === 'service' || m.reason === 'use' || m.reason === 'undo') && +new Date(m.at) >= since) used.set(m.itemId, (used.get(m.itemId) ?? 0) - m.delta)
  }
  const rows: UsageRow[] = []
  for (const item of s.stock) {
    const u = round(used.get(item.id) ?? 0)
    if (u <= 0) continue
    const perDay = u / days
    rows.push({ item, used: u, perWeek: round(perDay * 7), daysLeft: Math.floor(item.qty / perDay) })
  }
  return rows.sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity))
}

// Common salon supplies for one-tap adding.
export const PRESETS: Omit<StockItem, 'id' | 'qty'>[] = [
  { name: 'Pre-stretched braiding hair', category: 'Hair', unit: 'packs', min: 8 },
  { name: 'Kanekalon braiding hair', category: 'Hair', unit: 'packs', min: 8 },
  { name: 'Crochet / curly hair', category: 'Hair', unit: 'packs', min: 4 },
  { name: 'Braid spray', category: 'Care', unit: 'bottles', min: 2 },
  { name: 'Conditioner', category: 'Care', unit: 'bottles', min: 2 },
  { name: 'Leave-in conditioner', category: 'Care', unit: 'bottles', min: 2 },
  { name: 'Hair oil', category: 'Care', unit: 'bottles', min: 2 },
  { name: 'Styling gel', category: 'Care', unit: 'jars', min: 2 },
  { name: 'Hair dye', category: 'Colour', unit: 'tubes', min: 3 },
  { name: 'Developer', category: 'Colour', unit: 'bottles', min: 2 },
  { name: 'Rubber bands', category: 'Accessories', unit: 'packs', min: 2 },
  { name: 'Lash remover', category: 'Lashes', unit: 'bottles', min: 1 },
  { name: 'Clipper oil', category: 'Barber', unit: 'bottles', min: 1 },
  { name: 'Neck strips', category: 'Barber', unit: 'rolls', min: 2 },
  { name: 'Disposable gloves', category: 'Hygiene', unit: 'boxes', min: 1 },
]
