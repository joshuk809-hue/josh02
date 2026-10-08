import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Check, Copy, Download, MessageCircle, Minus, Package, Plus, Send, Trash2, Upload, Users, X } from 'lucide-react'
import { SERVICES } from '../data'
import { DICTS, LANGS, type Lang } from '../i18n'
import { waLink } from '../config'
import { dueFollowUps, load, save, uid, RULES, type Appointment, type Client, type State, type StockItem } from './store'
import { AUTO_REPLIES, CONFIRM, FOLLOW } from './templates'

const TABS = [
  ['agenda', 'Agenda', CalendarDays],
  ['clients', 'Clients', Users],
  ['stock', 'Stock', Package],
  ['follow', 'Follow-ups', Send],
  ['settings', 'Replies & backup', MessageCircle],
] as const
type Tab = (typeof TABS)[number][0]

const svcName = (id: string, lang: Lang = 'en') => DICTS[lang].services[id] ?? id
const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
const input = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-[#D4A857]'
const btn = 'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-transform duration-150 active:scale-[0.97]'
const gold = `${btn} bg-[#D4A857] text-[#1A1206] hover:bg-[#E2BC72]`
const ghost = `${btn} border border-white/15 text-[#E9D6B0] hover:bg-white/5`

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 ${className}`}>{children}</div>
}

export default function Studio() {
  const [s, setS] = useState<State>(load)
  const [tab, setTab] = useState<Tab>('agenda')
  useEffect(() => save(s), [s])
  const update = (fn: (d: State) => State) => setS((d) => fn(d))
  const due = useMemo(() => dueFollowUps(s), [s])

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#F3EBDD]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0C0C0C]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <img src="brand/logo-disc.webp" alt="" className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#D4A857]">Precious Studio</p>
            <p className="text-xs text-white/50">Saved on this device</p>
          </div>
          <a href="#/" className={ghost}>Website</a>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-3">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className="relative shrink-0 rounded-full px-4 py-2 text-sm">
              {tab === id && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-[#D4A857]" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />}
              <span className={`relative inline-flex items-center gap-1.5 ${tab === id ? 'text-[#1A1206]' : 'text-white/70'}`}>
                <Icon size={15} aria-hidden /> {label}
                {id === 'follow' && due.length > 0 && <span className="rounded-full bg-[#B4552D] px-1.5 text-[11px] text-white">{due.length}</span>}
              </span>
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === 'agenda' && <Agenda s={s} update={update} />}
        {tab === 'clients' && <Clients s={s} update={update} />}
        {tab === 'stock' && <Stock s={s} update={update} />}
        {tab === 'follow' && <FollowUps s={s} update={update} />}
        {tab === 'settings' && <Settings s={s} setS={setS} />}
      </main>
    </div>
  )
}

type P = { s: State; update: (fn: (d: State) => State) => void }

/* ---------- Agenda ---------- */
function Agenda({ s, update }: P) {
  const [f, setF] = useState({ clientId: '', name: '', phone: '', consent: true, serviceId: 'braids', at: '' })
  const clients = new Map(s.clients.map((c) => [c.id, c]))
  const upcoming = s.appointments
    .filter((a) => a.status === 'booked')
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))
  const days = new Map<string, Appointment[]>()
  for (const a of upcoming) {
    const k = fmtDay(new Date(a.at))
    days.set(k, [...(days.get(k) ?? []), a])
  }

  const add = () => {
    if (!f.at || (!f.clientId && !f.name.trim())) return
    update((d) => {
      let clientId = f.clientId
      let clientsNext = d.clients
      if (!clientId) {
        clientId = uid()
        clientsNext = [...d.clients, { id: clientId, name: f.name.trim(), phone: f.phone.trim(), lang: 'it', gender: 'women', notes: '', consent: f.consent, createdAt: new Date().toISOString() }]
      }
      return { ...d, clients: clientsNext, appointments: [...d.appointments, { id: uid(), clientId, serviceId: f.serviceId, at: new Date(f.at).toISOString(), status: 'booked' }] }
    })
    setF({ ...f, clientId: '', name: '', phone: '', at: '' })
  }
  const setStatus = (id: string, status: Appointment['status']) =>
    update((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? { ...a, status } : a)) }))

  return (
    <div className="grid gap-5 md:grid-cols-[340px_1fr]">
      <Card>
        <h2 className="mb-3 font-semibold">New appointment</h2>
        <div className="grid gap-2.5">
          <select className={input} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
            <option value="">+ New client</option>
            {[...s.clients].sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {!f.clientId && (
            <>
              <input className={input} placeholder="Client name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input className={input} placeholder="WhatsApp number (+39…)" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" className="accent-[#D4A857]" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
                OK to send WhatsApp follow-ups
              </label>
            </>
          )}
          <select className={input} value={f.serviceId} onChange={(e) => setF({ ...f, serviceId: e.target.value })}>
            {SERVICES.map((x) => <option key={x.id} value={x.id}>{svcName(x.id)} · {x.from ? 'from ' : ''}{x.price}€</option>)}
          </select>
          <input className={input} type="datetime-local" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} />
          <button className={gold} onClick={add}><Plus size={16} /> Add</button>
        </div>
      </Card>
      <div className="grid gap-4">
        {days.size === 0 && <Card><p className="text-white/60">No upcoming appointments. Add one on the left.</p></Card>}
        {[...days].map(([day, list]) => (
          <Card key={day}>
            <h3 className="mb-3 text-sm uppercase tracking-widest text-[#D4A857]">{day}</h3>
            <ul className="grid gap-2">
              {list.map((a) => {
                const c = clients.get(a.clientId)
                const d = new Date(a.at)
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/[0.03] p-3">
                    <span className="min-w-14 whitespace-nowrap font-semibold tabular-nums">{fmtTime(d)}</span>
                    <span className="flex-1 min-w-[140px]">{c?.name ?? 'Unknown'} <span className="text-white/50">· {svcName(a.serviceId)}</span></span>
                    {c?.phone && (
                      <a className={ghost} target="_blank" rel="noopener noreferrer" href={waLink(CONFIRM[c.lang](c.name.split(' ')[0], d.toLocaleString(c.lang, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }), svcName(a.serviceId, c.lang).toLowerCase()), c.phone)}>
                        <MessageCircle size={15} /> Confirm
                      </a>
                    )}
                    <button className={gold} onClick={() => setStatus(a.id, 'done')}><Check size={15} /> Done</button>
                    <button className={ghost} onClick={() => setStatus(a.id, 'no-show')}>No-show</button>
                    <button className={ghost} aria-label="Cancel" onClick={() => setStatus(a.id, 'cancelled')}><X size={15} /></button>
                  </li>
                )
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ---------- Clients ---------- */
const blankClient = (): Client => ({ id: '', name: '', phone: '', lang: 'it', gender: 'women', notes: '', consent: true, createdAt: '' })

function Clients({ s, update }: P) {
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<Client>(blankClient)
  const lastVisit = (id: string) =>
    s.appointments.filter((a) => a.clientId === id && a.status === 'done').map((a) => new Date(a.at)).sort((a, b) => +b - +a)[0]
  const list = s.clients.filter((c) => (c.name + c.phone).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name))

  const saveClient = () => {
    if (!edit.name.trim()) return
    update((d) =>
      edit.id
        ? { ...d, clients: d.clients.map((c) => (c.id === edit.id ? edit : c)) }
        : { ...d, clients: [...d.clients, { ...edit, id: uid(), createdAt: new Date().toISOString() }] },
    )
    setEdit(blankClient())
  }
  const remove = (id: string) => {
    if (!confirm('Delete this client and their appointments?')) return
    update((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id), appointments: d.appointments.filter((a) => a.clientId !== id), sent: d.sent.filter((x) => x.clientId !== id) }))
  }

  return (
    <div className="grid gap-5 md:grid-cols-[340px_1fr]">
      <Card>
        <h2 className="mb-3 font-semibold">{edit.id ? 'Edit client' : 'New client'}</h2>
        <div className="grid gap-2.5">
          <input className={input} placeholder="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
          <input className={input} placeholder="WhatsApp number (+39…)" inputMode="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <select className={input} value={edit.lang} onChange={(e) => setEdit({ ...edit, lang: e.target.value as Lang })}>
              {LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <select className={input} value={edit.gender} onChange={(e) => setEdit({ ...edit, gender: e.target.value as Client['gender'] })}>
              <option value="women">Woman</option><option value="men">Man</option>
            </select>
          </div>
          <textarea className={input} rows={3} placeholder="Notes (hair type, allergies, favourite style…)" value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
          <label className="flex items-start gap-2 text-sm text-white/80">
            <input type="checkbox" className="mt-1 accent-[#D4A857]" checked={edit.consent} onChange={(e) => setEdit({ ...edit, consent: e.target.checked })} />
            Agreed to receive WhatsApp follow-ups (untick if they replied STOP)
          </label>
          <div className="flex gap-2">
            <button className={gold} onClick={saveClient}><Check size={16} /> Save</button>
            {edit.id && <button className={ghost} onClick={() => setEdit(blankClient())}>Cancel</button>}
          </div>
        </div>
      </Card>
      <div className="grid content-start gap-3">
        <input className={input} placeholder={`Search ${s.clients.length} clients…`} value={q} onChange={(e) => setQ(e.target.value)} />
        {list.map((c) => {
          const lv = lastVisit(c.id)
          return (
            <Card key={c.id} className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[160px]">
                <p className="font-medium">{c.name} <span className="text-xs text-white/40">{c.lang.toUpperCase()}</span></p>
                <p className="text-sm text-white/50">{c.phone || 'No number'} · {lv ? `last visit ${fmtDay(lv)}` : 'no visits yet'}{!c.consent && ' · no follow-ups'}</p>
                {c.notes && <p className="mt-1 text-sm text-white/70">{c.notes}</p>}
              </div>
              {c.phone && <a className={ghost} target="_blank" rel="noopener noreferrer" href={waLink('', c.phone)}><MessageCircle size={15} /> Chat</a>}
              <button className={ghost} onClick={() => setEdit(c)}>Edit</button>
              <button className={ghost} aria-label="Delete" onClick={() => remove(c.id)}><Trash2 size={15} /></button>
            </Card>
          )
        })}
        {list.length === 0 && <Card><p className="text-white/60">No clients yet.</p></Card>}
      </div>
    </div>
  )
}

/* ---------- Stock ---------- */
function Stock({ s, update }: P) {
  const [f, setF] = useState({ name: '', category: 'Hair', qty: 0, unit: 'pcs', min: 1 })
  const low = s.stock.filter((i) => i.qty <= i.min)
  const setQty = (id: string, qty: number) => update((d) => ({ ...d, stock: d.stock.map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i)) }))
  const add = () => {
    if (!f.name.trim()) return
    update((d) => ({ ...d, stock: [...d.stock, { ...f, id: uid(), name: f.name.trim() } as StockItem] }))
    setF({ ...f, name: '', qty: 0 })
  }
  const shopping = low.map((i) => `• ${i.name}: have ${i.qty} ${i.unit}, need ${Math.max(i.min * 2 - i.qty, 1)} more`).join('\n')
  const cats = [...new Set(s.stock.map((i) => i.category))]

  return (
    <div className="grid gap-5">
      {low.length > 0 && (
        <Card className="border-[#B4552D]/50 bg-[#B4552D]/10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1"><b>{low.length} item{low.length > 1 ? 's' : ''} running low:</b> {low.map((i) => i.name).join(', ')}</p>
            <button className={gold} onClick={() => navigator.clipboard?.writeText(shopping)}><Copy size={15} /> Copy shopping list</button>
          </div>
        </Card>
      )}
      {cats.map((cat) => (
        <Card key={cat}>
          <h3 className="mb-3 text-sm uppercase tracking-widest text-[#D4A857]">{cat}</h3>
          <ul className="grid gap-2">
            {s.stock.filter((i) => i.category === cat).map((i) => (
              <li key={i.id} className={`flex flex-wrap items-center gap-2 rounded-2xl p-3 ${i.qty <= i.min ? 'bg-[#B4552D]/15' : 'bg-white/[0.03]'}`}>
                <span className="flex-1 min-w-[150px]">{i.name} <span className="text-xs text-white/40">min {i.min}</span></span>
                <button className={ghost} aria-label="Use one" onClick={() => setQty(i.id, i.qty - 1)}><Minus size={15} /></button>
                <input className={`${input.replace("w-full ", "")} w-20 text-center tabular-nums`} type="number" min={0} value={i.qty} onChange={(e) => setQty(i.id, Number(e.target.value))} aria-label={`${i.name} quantity`} />
                <span className="w-14 text-sm text-white/50">{i.unit}</span>
                <button className={ghost} aria-label="Add one" onClick={() => setQty(i.id, i.qty + 1)}><Plus size={15} /></button>
                <button className={ghost} aria-label="Delete" onClick={() => confirm(`Delete ${i.name}?`) && update((d) => ({ ...d, stock: d.stock.filter((x) => x.id !== i.id) }))}><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        </Card>
      ))}
      <Card>
        <h3 className="mb-3 font-semibold">Add product</h3>
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr_80px_90px_80px_auto]">
          <input className={input} placeholder="Product" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={input} placeholder="Category" list="cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
          <input className={input} type="number" min={0} aria-label="Quantity" value={f.qty} onChange={(e) => setF({ ...f, qty: Number(e.target.value) })} />
          <input className={input} placeholder="Unit" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
          <input className={input} type="number" min={0} aria-label="Minimum" title="Warn me at" value={f.min} onChange={(e) => setF({ ...f, min: Number(e.target.value) })} />
          <button className={gold} onClick={add}><Plus size={16} /> Add</button>
        </div>
      </Card>
    </div>
  )
}

/* ---------- Follow-ups ---------- */
function FollowUps({ s, update }: P) {
  const due = dueFollowUps(s)
  const hour = new Date().getHours()
  const record = (clientId: string, kind: 'thanks' | 'rebook' | 'winback', apptId?: string) =>
    update((d) => ({ ...d, sent: [...d.sent, { clientId, kind, apptId, at: new Date().toISOString() }] }))
  const labels = { thanks: 'Thank you + review', rebook: 'Time to rebook', winback: 'We miss you' }

  return (
    <div className="grid gap-4">
      <Card>
        <p className="text-sm leading-relaxed text-white/70">
          Gentle by design: only clients who agreed, never more than one message every {RULES.gapDays} days, a review is asked
          at most twice a year, nobody with an upcoming booking gets a reminder, and every reminder offers STOP.
          Messages are written in each client's language.
        </p>
        {(hour < 9 || hour >= 20) && <p className="mt-2 text-sm text-[#E2BC72]">It's outside 9:00–20:00. Better to send these tomorrow.</p>}
      </Card>
      {due.length === 0 && <Card><p className="text-white/60">Nothing to send today. Mark appointments as Done and follow-ups appear here at the right time.</p></Card>}
      {due.map(({ client: c, kind, appt }) => {
        const text = FOLLOW[c.lang][kind](c.name.split(' ')[0], svcName(appt?.serviceId ?? '', c.lang).toLowerCase())
        return (
          <Card key={c.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-medium">{c.name}</span>
              <span className="rounded-full bg-[#D4A857]/15 px-2.5 py-0.5 text-xs text-[#E2BC72]">{labels[kind]}</span>
            </div>
            <p className="mb-3 whitespace-pre-line rounded-2xl bg-white/[0.04] p-3 text-sm text-white/80">{text}</p>
            <div className="flex flex-wrap gap-2">
              <a className={gold} target="_blank" rel="noopener noreferrer" href={waLink(text, c.phone)} onClick={() => record(c.id, kind, appt?.id)}>
                <Send size={15} /> Send on WhatsApp
              </a>
              <button className={ghost} onClick={() => record(c.id, kind, appt?.id)}>Skip</button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

/* ---------- Replies & backup ---------- */
function Settings({ s, setS }: { s: State; setS: (s: State) => void }) {
  const [copied, setCopied] = useState('')
  const copy = (t: string, k: string) => { navigator.clipboard?.writeText(t); setCopied(k); setTimeout(() => setCopied(''), 1500) }
  const exportData = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' }))
    a.download = `precious-studio-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const importData = (file?: File) => {
    if (!file) return
    file.text().then((t) => {
      try {
        const d = JSON.parse(t) as State
        if (!Array.isArray(d.clients) || !Array.isArray(d.stock)) throw new Error('bad file')
        if (confirm('Replace all studio data on this device with this backup?')) setS(d)
      } catch { alert('That file is not a Precious Studio backup.') }
    })
  }
  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="mb-1 font-semibold">Automatic replies when you can't answer</h2>
        <p className="mb-4 text-sm text-white/60">
          In WhatsApp Business: Settings → Business tools → Away message / Greeting message. Paste these texts, set the away
          message to "Outside of business hours" or "Always send", and WhatsApp answers new messages for you.
        </p>
        {AUTO_REPLIES.map((r) => (
          <div key={r.title} className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="flex-1 text-sm uppercase tracking-widest text-[#D4A857]">{r.title}</h3>
              <button className={ghost} onClick={() => copy(r.text, r.title)}><Copy size={15} /> {copied === r.title ? 'Copied' : 'Copy'}</button>
            </div>
            <p className="whitespace-pre-line rounded-2xl bg-white/[0.04] p-3 text-sm text-white/80">{r.text}</p>
          </div>
        ))}
      </Card>
      <Card>
        <h2 className="mb-1 font-semibold">Backup</h2>
        <p className="mb-4 text-sm text-white/60">Everything is saved only on this device. Download a backup every week, and use it to move to a new phone.</p>
        <div className="flex flex-wrap gap-2">
          <button className={gold} onClick={exportData}><Download size={15} /> Download backup</button>
          <label className={`${ghost} cursor-pointer`}>
            <Upload size={15} /> Restore backup
            <input type="file" accept="application/json" className="hidden" onChange={(e) => importData(e.target.files?.[0])} />
          </label>
        </div>
      </Card>
    </div>
  )
}
