// Self-check for the follow-up rules. Run: node --experimental-strip-types src/studio/store.test.ts
import assert from 'node:assert/strict'
import { dueFollowUps, type State } from './store.ts'

const DAY = 86_400_000
const now = new Date('2026-10-08T12:00:00Z')
const ago = (d: number) => new Date(+now - d * DAY).toISOString()
const client = (id: string, consent = true) => ({ id, name: id, phone: '39333', lang: 'it' as const, gender: 'women' as const, notes: '', consent, createdAt: ago(400) })
const base = (): State => ({ clients: [], appointments: [], stock: [], sent: [] })

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
