// Studio data lives in this browser's localStorage only. Use Backup to move it between devices.
import type { Lang } from '../i18n'

export type Client = { id: string; name: string; phone: string; lang: Lang; gender: 'women' | 'men'; notes: string; consent: boolean; createdAt: string }
export type Appointment = { id: string; clientId: string; serviceId: string; at: string; status: 'booked' | 'done' | 'cancelled' | 'no-show' }
export type StockItem = { id: string; name: string; category: string; qty: number; unit: string; min: number }
export type Sent = { clientId: string; kind: FollowKind; at: string; apptId?: string }
export type FollowKind = 'thanks' | 'rebook' | 'winback'
export type State = { clients: Client[]; appointments: Appointment[]; stock: StockItem[]; sent: Sent[] }

const KEY = 'precious-studio-v1'
const DAY = 86_400_000

export const uid = () => Math.random().toString(36).slice(2, 10)

export const emptyState = (): State => ({
  clients: [],
  appointments: [],
  sent: [],
  stock: [
    { id: uid(), name: 'Braiding hair (black, 1B)', category: 'Hair', qty: 20, unit: 'packs', min: 8 },
    { id: uid(), name: 'Braiding hair (brown, 30)', category: 'Hair', qty: 10, unit: 'packs', min: 5 },
    { id: uid(), name: 'Edge control', category: 'Care', qty: 6, unit: 'jars', min: 2 },
    { id: uid(), name: 'Mousse', category: 'Care', qty: 4, unit: 'bottles', min: 2 },
    { id: uid(), name: 'Shampoo', category: 'Care', qty: 3, unit: 'bottles', min: 2 },
    { id: uid(), name: 'Hair beads & cuffs', category: 'Accessories', qty: 200, unit: 'pcs', min: 50 },
    { id: uid(), name: 'Lash trays', category: 'Lashes', qty: 5, unit: 'trays', min: 2 },
    { id: uid(), name: 'Lash glue', category: 'Lashes', qty: 2, unit: 'bottles', min: 1 },
    { id: uid(), name: 'Razor blades', category: 'Barber', qty: 30, unit: 'pcs', min: 10 },
  ],
})

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...emptyState(), ...JSON.parse(raw) }
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
  s.stock = s.stock.map((i) => (i.name.startsWith('Edge') ? { ...i, qty: 1 } : i))
  return s
}
