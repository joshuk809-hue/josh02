import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Camera, CalendarDays, Check, Copy, Download, MessageCircle, Minus, Package, PackageCheck, Plus, ScanLine, Send, Trash2, Undo2, Upload, Users, X } from 'lucide-react'
import { SERVICES } from '../data'
import { DICTS, LANGS, type Lang } from '../i18n'
import { waLink } from '../config'
import { adjustStock, completeAppointment, demoState, dueFollowUps, emptyState, findByBarcode, load, PRESETS, reopenAppointment, restock, save, uid, usageReport, RULES, type Appointment, type Client, type State, type StockItem } from './store'
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
// Clipboard can be refused (old browsers, embedded views); report instead of failing silently.
const copyText = (t: string) => (navigator.clipboard ? navigator.clipboard.writeText(t).then(() => true, () => false) : Promise.resolve(false))
const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
const input = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-[#D4A857]'
const btn = 'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-transform duration-150 active:scale-[0.97]'
const gold = `${btn} bg-[#D4A857] text-[#1A1206] hover:bg-[#E2BC72]`
const ghost = `${btn} border border-white/15 text-[#E9D6B0] hover:bg-white/5`

// Two taps instead of a confirm() dialog: first tap arms, second tap within 3s acts.
function ConfirmButton({ onConfirm, label, children }: { onConfirm: () => void; label: string; children: ReactNode }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      className={armed ? `${btn} bg-[#B4552D] text-white` : ghost}
      aria-label={armed ? `Tap again to ${label.toLowerCase()}` : label}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
    >
      {armed ? `Tap again to ${label.toLowerCase()}` : children}
    </button>
  )
}

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
          <a href="#top" className={ghost}>Website</a>
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
  const days = new Map<string, Appointment[]>() // keyed by local date, so years never merge
  for (const a of upcoming) {
    const k = new Date(a.at).toDateString()
    days.set(k, [...(days.get(k) ?? []), a])
  }
  const today = new Date().toDateString()
  const tomorrow = new Date(Date.now() + 86_400_000).toDateString()
  const dayLabel = (k: string) => {
    const d = new Date(k)
    const sameYear = d.getFullYear() === new Date().getFullYear()
    const base = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
    return k === today ? `Today · ${base}` : k === tomorrow ? `Tomorrow · ${base}` : base
  }
  const isPast = (k: string) => new Date(k) < new Date(today)
  // Another booked appointment starting within an hour of this time
  const clashWith = (iso: string, skipId?: string) =>
    s.appointments.find((a) => a.status === 'booked' && a.id !== skipId && Math.abs(+new Date(a.at) - +new Date(iso)) < 3_600_000)
  const clash = f.at ? clashWith(new Date(f.at).toISOString()) : undefined
  const [moving, setMoving] = useState<{ id: string; at: string } | null>(null)
  const move = () => {
    if (!moving?.at) return
    update((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === moving.id ? { ...a, at: new Date(moving.at).toISOString() } : a)) }))
    setMoving(null)
  }
  const localInput = (iso: string) => {
    const d = new Date(iso)
    return new Date(+d - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
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
  const [doneId, setDoneId] = useState<string | null>(null)
  const markDone = (id: string) => { update((d) => completeAppointment(d, id)); setDoneId(id) }
  const doneAppt = s.appointments.find((a) => a.id === doneId && a.status === 'done')
  const itemName = (id: string) => s.stock.find((i) => i.id === id)

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
          <input className={input} type="datetime-local" aria-label="Date and time" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} />
          {clash && <p role="status" className="text-sm text-[#E2BC72]">Heads up: {clients.get(clash.clientId)?.name ?? 'someone'} is booked at {fmtTime(new Date(clash.at))}.</p>}
          <button className={gold} onClick={add}><Plus size={16} /> Add</button>
        </div>
      </Card>
      <div className="grid content-start gap-4">
        {doneAppt && (
          <Card className="border-[#D4A857]/40">
            <div className="flex flex-wrap items-center gap-3">
              <p role="status" className="flex-1 text-sm">
                <b>{clients.get(doneAppt.clientId)?.name}</b> done.{' '}
                {doneAppt.usedStock?.length
                  ? <>Stock updated: {doneAppt.usedStock.map((u) => `−${u.qty} ${itemName(u.itemId)?.unit ?? ''} ${itemName(u.itemId)?.name ?? ''}`).join(', ')}.</>
                  : <>Nothing taken from stock (set it up in Stock → Used per service).</>}
              </p>
              <button className={ghost} onClick={() => { update((d) => reopenAppointment(d, doneAppt.id)); setDoneId(null) }}><Undo2 size={15} /> Undo</button>
              <button className={ghost} aria-label="Dismiss" onClick={() => setDoneId(null)}><X size={15} /></button>
            </div>
          </Card>
        )}
        {days.size === 0 && (
          <Card>
            <p className="mb-3 text-white/60">No upcoming appointments. Add one on the left, or load example clients to see how everything works.</p>
            {s.clients.length === 0 && <button className={ghost} onClick={() => update(() => demoState())}>Load example data</button>}
          </Card>
        )}
        {[...days].map(([day, list]) => (
          <Card key={day} className={isPast(day) ? 'border-[#B4552D]/50' : ''}>
            <h3 className="mb-3 text-sm uppercase tracking-widest text-[#D4A857]">
              {dayLabel(day)}
              {isPast(day) && <span className="ml-2 rounded-full bg-[#B4552D] px-2 py-0.5 text-[11px] normal-case tracking-normal text-white">Past · mark done or no-show</span>}
            </h3>
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
                    <button className={ghost} onClick={() => setMoving({ id: a.id, at: localInput(a.at) })}>Move</button>
                    <button className={gold} onClick={() => markDone(a.id)}><Check size={15} /> Done</button>
                    <button className={ghost} onClick={() => setStatus(a.id, 'no-show')}>No-show</button>
                    <button className={ghost} aria-label="Cancel" onClick={() => setStatus(a.id, 'cancelled')}><X size={15} /></button>
                    {moving?.id === a.id && (
                      <div className="flex w-full flex-wrap items-center gap-2 pt-1">
                        <input className={`${input.replace('w-full ', '')} flex-1 min-w-[200px]`} type="datetime-local" aria-label="New date and time" value={moving.at} onChange={(e) => setMoving({ ...moving, at: e.target.value })} />
                        <button className={gold} onClick={move}>Save new time</button>
                        <button className={ghost} onClick={() => setMoving(null)}>Keep</button>
                        {moving.at && clashWith(new Date(moving.at).toISOString(), a.id) && <p role="status" className="w-full text-sm text-[#E2BC72]">Heads up: that time overlaps another booking.</p>}
                      </div>
                    )}
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
  const remove = (id: string) =>
    update((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id), appointments: d.appointments.filter((a) => a.clientId !== id), sent: d.sent.filter((x) => x.clientId !== id) }))

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
              <ConfirmButton label="Delete" onConfirm={() => remove(c.id)}><Trash2 size={15} /></ConfirmButton>
            </Card>
          )
        })}
        {list.length === 0 && <Card><p className="text-white/60">No clients yet.</p></Card>}
      </div>
    </div>
  )
}

/* ---------- Stock ---------- */
const num = (v: string) => (v === '' ? 0 : Number(v) || 0)
const blankProduct = { name: '', category: 'Hair', qty: 0, unit: 'pcs', min: 1, barcode: '' }

function Stock({ s, update }: P) {
  const [f, setF] = useState(blankProduct)
  const low = s.stock.filter((i) => i.qty <= i.min)
  const setQty = (id: string, qty: number) => update((d) => adjustStock(d, id, Math.max(0, qty) - (d.stock.find((i) => i.id === id)?.qty ?? 0), 'set'))
  const add = () => {
    const name = f.name.trim()
    if (!name) return
    const category = f.category.trim() || 'Other'
    update((d) => {
      const same = d.stock.find((i) => i.name.toLowerCase() === name.toLowerCase())
      // Re-adding a product you already have tops it up instead of creating a duplicate
      if (same) return adjustStock(f.barcode ? { ...d, stock: d.stock.map((i) => (i === same ? { ...i, barcode: f.barcode } : i)) } : d, same.id, Math.max(0, f.qty), 'restock')
      const item: StockItem = { id: uid(), name, category, unit: f.unit.trim() || 'pcs', qty: Math.max(0, f.qty), min: Math.max(0, f.min), ...(f.barcode ? { barcode: f.barcode } : {}) }
      return { ...d, stock: [...d.stock, item] }
    })
    setF(blankProduct)
  }
  const [copied, setCopied] = useState(false)
  const shopping = low.map((i) => `• ${i.name}: have ${i.qty} ${i.unit}, need ${Math.max(i.min * 2 - i.qty, 1)} more`).join('\n')
  const cats = [...new Set(s.stock.map((i) => i.category))]
  const [panel, setPanel] = useState<'none' | 'delivery' | 'recipes'>('none')

  return (
    <div className="grid gap-5">
      <ScanBar s={s} update={update} onNew={(barcode) => { setF({ ...blankProduct, barcode }); document.getElementById('product-name')?.focus() }} />

      {low.length > 0 && (
        <Card className="border-[#B4552D]/50 bg-[#B4552D]/10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1"><b>{low.length} item{low.length > 1 ? 's' : ''} running low:</b> {low.map((i) => i.name).join(', ')}</p>
            <button className={gold} onClick={() => copyText(shopping).then(setCopied).then(() => setTimeout(() => setCopied(false), 1500))}><Copy size={15} /> {copied ? 'Copied' : 'Copy shopping list'}</button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <button className={panel === 'delivery' ? gold : ghost} onClick={() => setPanel(panel === 'delivery' ? 'none' : 'delivery')}><PackageCheck size={15} /> Delivery arrived</button>
        <button className={panel === 'recipes' ? gold : ghost} onClick={() => setPanel(panel === 'recipes' ? 'none' : 'recipes')}><Package size={15} /> Used per service</button>
      </div>
      {panel === 'delivery' && <Delivery s={s} update={update} onDone={() => setPanel('none')} />}
      {panel === 'recipes' && <Recipes s={s} update={update} />}

      {cats.map((cat) => (
        <Card key={cat}>
          <h3 className="mb-3 text-sm uppercase tracking-widest text-[#D4A857]">{cat}</h3>
          <ul className="grid gap-2">
            {s.stock.filter((i) => i.category === cat).map((i) => (
              <li key={i.id} className={`flex flex-wrap items-center gap-2 rounded-2xl p-3 ${i.qty <= i.min ? 'bg-[#B4552D]/15' : 'bg-white/[0.03]'}`}>
                <span className="flex-1 min-w-[150px]">
                  {i.name} <span className="text-xs text-white/40">min {i.min}</span>
                  {i.barcode && <ScanLine size={13} className="ml-1 inline text-white/40" aria-label="Has barcode" />}
                </span>
                <button className={ghost} aria-label="Use one" onClick={() => update((d) => adjustStock(d, i.id, -1, 'use'))}><Minus size={15} /></button>
                <input className={`${input.replace("w-full ", "")} w-20 text-center tabular-nums`} type="number" min={0} step="any" value={i.qty} onChange={(e) => setQty(i.id, num(e.target.value))} aria-label={`${i.name} quantity`} />
                <span className="w-14 text-sm text-white/50">{i.unit}</span>
                <button className={ghost} aria-label="Add one" onClick={() => update((d) => adjustStock(d, i.id, 1, 'restock'))}><Plus size={15} /></button>
                <ConfirmButton label="Delete" onConfirm={() => update((d) => ({ ...d, stock: d.stock.filter((x) => x.id !== i.id) }))}><Trash2 size={15} /></ConfirmButton>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <Card>
        <h3 className="mb-3 font-semibold">Add product</h3>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {PRESETS.filter((p) => !s.stock.some((i) => i.name === p.name)).map((p) => (
            <button key={p.name} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/75 transition-colors hover:border-[#D4A857] hover:text-[#E9D6B0]" onClick={() => setF({ ...blankProduct, ...p, barcode: f.barcode })}>
              + {p.name}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr_80px_90px_80px_auto]">
          <input id="product-name" className={input} placeholder="Product" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={input} placeholder="Category" list="cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
          <input className={input} type="number" min={0} aria-label="Quantity" value={f.qty} onChange={(e) => setF({ ...f, qty: num(e.target.value) })} />
          <input className={input} placeholder="Unit" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
          <input className={input} type="number" min={0} aria-label="Minimum" title="Warn me at" value={f.min} onChange={(e) => setF({ ...f, min: num(e.target.value) })} />
          <button className={gold} onClick={add}><Plus size={16} /> Add</button>
        </div>
        {f.barcode && <p className="mt-2 text-sm text-white/60">Barcode <span className="tabular-nums">{f.barcode}</span> will be saved with this product.</p>}
      </Card>

      <UsageCard s={s} />
    </div>
  )
}

// Scan with the camera (Android Chrome), a Bluetooth/USB scanner, or type the barcode and press Enter.
function ScanBar({ s, update, onNew }: P & { onNew: (barcode: string) => void }) {
  const [mode, setMode] = useState<'use' | 'restock'>('use')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<{ text: string; unknown?: string } | null>(null)
  const [link, setLink] = useState('')
  const [camera, setCamera] = useState(false)
  const canCamera = typeof window !== 'undefined' && 'BarcodeDetector' in window

  const handle = (raw: string) => {
    const c = raw.trim()
    if (!c) return
    const item = findByBarcode(s, c)
    if (item) {
      const delta = mode === 'use' ? -1 : 1
      update((d) => adjustStock(d, item.id, delta, mode === 'use' ? 'use' : 'restock'))
      setMsg({ text: `${item.name}: ${delta > 0 ? '+1' : '−1'} → ${Math.max(0, item.qty + delta)} ${item.unit}` })
    } else {
      setMsg({ text: `New barcode ${c}. Link it to a product you have, or add it as a new one.`, unknown: c })
    }
    setCode('')
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-white/[0.05] p-1 text-sm">
          {(['use', 'restock'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={`rounded-full px-3 py-1.5 transition-colors ${mode === m ? 'bg-[#D4A857] text-[#1A1206]' : 'text-white/70'}`}>
              {m === 'use' ? 'Scan = used one' : 'Scan = arrived one'}
            </button>
          ))}
        </div>
        <form className="flex flex-1 min-w-[220px] gap-2" onSubmit={(e) => { e.preventDefault(); handle(code) }}>
          <input className={input} inputMode="numeric" placeholder="Scan or type a barcode, then Enter" aria-label="Barcode" value={code} onChange={(e) => setCode(e.target.value)} />
        </form>
        {canCamera && <button className={ghost} onClick={() => setCamera(true)}><Camera size={15} /> Camera</button>}
      </div>
      {msg && (
        <div role="status" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/80">
          <span className="flex-1">{msg.text}</span>
          {msg.unknown && (
            <>
              <select className={`${input.replace('w-full ', '')} w-auto`} aria-label="Link barcode to" value={link} onChange={(e) => setLink(e.target.value)}>
                <option value="">Choose product…</option>
                {s.stock.filter((i) => !i.barcode).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <button className={ghost} disabled={!link} onClick={() => { update((d) => ({ ...d, stock: d.stock.map((i) => (i.id === link ? { ...i, barcode: msg.unknown } : i)) })); setMsg({ text: 'Barcode linked. Scan again to count it.' }); setLink('') }}>Link</button>
              <button className={ghost} onClick={() => { onNew(msg.unknown!); setMsg(null) }}>Add as new</button>
            </>
          )}
        </div>
      )}
      {camera && <CameraScan onCode={(c) => { setCamera(false); handle(c) }} onClose={() => setCamera(false)} />}
    </Card>
  )
}

type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> }

function CameraScan({ onCode, onClose }: { onCode: (c: string) => void; onClose: () => void }) {
  const [err, setErr] = useState('')
  const cb = useRef(onCode) // keep the camera running across parent re-renders
  cb.current = onCode
  useEffect(() => {
    let stream: MediaStream | undefined
    let raf = 0
    const video = document.getElementById('scan-video') as HTMLVideoElement
    const Ctor = (window as unknown as { BarcodeDetector: new (o: object) => Detector }).BarcodeDetector
    const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((st) => {
      stream = st; video.srcObject = st; video.play()
      const tick = async () => {
        const found = await detector.detect(video).catch(() => [])
        if (found[0]) return cb.current(found[0].rawValue)
        raf = requestAnimationFrame(tick)
      }
      tick()
    }, () => setErr('The camera is blocked. Allow camera access for this site, or type the barcode instead.'))
    return () => { cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()) }
  }, [])
  return (
    <div className="mt-3 grid gap-2">
      <video id="scan-video" className="aspect-video w-full rounded-2xl bg-black object-cover" muted playsInline />
      {err && <p className="text-sm text-[#E2BC72]">{err}</p>}
      <button className={ghost} onClick={onClose}>Close camera</button>
    </div>
  )
}

function Delivery({ s, update, onDone }: P & { onDone: () => void }) {
  const [got, setGot] = useState<Record<string, number>>({})
  const items = [...s.stock].sort((a, b) => Number(b.qty <= b.min) - Number(a.qty <= a.min) || a.name.localeCompare(b.name))
  const count = Object.values(got).filter((n) => n > 0).length
  return (
    <Card>
      <h3 className="mb-1 font-semibold">Delivery arrived</h3>
      <p className="mb-3 text-sm text-white/60">Type how much arrived for each product, then save once. Low items are at the top.</p>
      <ul className="grid gap-1.5">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-2">
            <span className={`flex-1 text-sm ${i.qty <= i.min ? 'text-[#E2BC72]' : ''}`}>{i.name} <span className="text-white/40">· have {i.qty}</span></span>
            <span className="text-sm text-white/50">+</span>
            <input className={`${input.replace('w-full ', '')} w-20 text-center tabular-nums`} type="number" min={0} aria-label={`${i.name} arrived`} value={got[i.id] ?? ''} onChange={(e) => setGot({ ...got, [i.id]: num(e.target.value) })} />
            <span className="w-14 text-sm text-white/50">{i.unit}</span>
          </li>
        ))}
      </ul>
      <button className={`${gold} mt-4`} disabled={!count} onClick={() => { update((d) => restock(d, got)); setGot({}); onDone() }}>
        <PackageCheck size={15} /> Add {count || ''} product{count === 1 ? '' : 's'} to stock
      </button>
    </Card>
  )
}

function Recipes({ s, update }: P) {
  const setLines = (svc: string, lines: State['recipes'][string]) => update((d) => ({ ...d, recipes: { ...d.recipes, [svc]: lines } }))
  return (
    <Card>
      <h3 className="mb-1 font-semibold">Used per service</h3>
      <p className="mb-4 text-sm text-white/60">What one appointment uses. When you tap Done in the Agenda, these are taken out of stock automatically.</p>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        {SERVICES.map((svc) => {
          const lines = s.recipes[svc.id] ?? []
          return (
            <div key={svc.id} className="rounded-2xl bg-white/[0.03] p-3">
              <p className="mb-2 text-sm font-medium text-[#E9D6B0]">{svcName(svc.id)}</p>
              {lines.map((l, idx) => (
                <div key={idx} className="mb-1.5 flex items-center gap-1.5">
                  <select className={`${input.replace('w-full ', '')} min-w-0 flex-1 py-1.5 text-sm`} aria-label={`${svcName(svc.id)} product`} value={l.itemId} onChange={(e) => setLines(svc.id, lines.map((x, j) => (j === idx ? { ...x, itemId: e.target.value } : x)))}>
                    {s.stock.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <input className={`${input.replace('w-full ', '')} w-20 py-1.5 text-center text-sm tabular-nums`} type="number" min={0} step="any" aria-label={`${svcName(svc.id)} amount`} value={l.qty} onChange={(e) => setLines(svc.id, lines.map((x, j) => (j === idx ? { ...x, qty: num(e.target.value) } : x)))} />
                  <button className="rounded-full p-1.5 text-white/50 hover:text-white" aria-label="Remove" onClick={() => setLines(svc.id, lines.filter((_, j) => j !== idx))}><X size={14} /></button>
                </div>
              ))}
              {s.stock[0] && <button className="text-xs text-[#D4A857] hover:underline" onClick={() => setLines(svc.id, [...lines, { itemId: s.stock[0].id, qty: 1 }])}>+ Add product</button>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function UsageCard({ s }: { s: State }) {
  const rows = usageReport(s)
  return (
    <Card>
      <h3 className="mb-1 flex items-center gap-2 font-semibold"><BarChart3 size={16} /> Last 30 days</h3>
      <p className="mb-3 text-sm text-white/60">What you used and when it runs out at this pace. Order what runs out within two weeks.</p>
      {rows.length === 0 ? (
        <p className="text-sm text-white/50">Usage appears here as you mark appointments Done or tap −.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-left text-white/50">
              <tr><th className="py-1.5 font-normal">Product</th><th className="py-1.5 text-right font-normal">Used</th><th className="py-1.5 text-right font-normal">Per week</th><th className="py-1.5 text-right font-normal">Runs out</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.item.id} className="border-t border-white/10">
                  <td className="py-2 pr-2">{r.item.name}</td>
                  <td className="py-2 text-right">{r.used} {r.item.unit}</td>
                  <td className="py-2 text-right">{r.perWeek}</td>
                  <td className="py-2 text-right">
                    <span className={`rounded-full px-2 py-0.5 ${r.daysLeft !== null && r.daysLeft <= 14 ? 'bg-[#B4552D] text-white' : 'text-white/70'}`}>
                      {r.daysLeft === 0 ? 'now' : `~${r.daysLeft} days`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
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
  const copy = (t: string, k: string) => copyText(t).then((ok) => { setCopied(ok ? k : `${k}:fail`); setTimeout(() => setCopied(''), 1500) })
  const exportData = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' }))
    a.download = `precious-studio-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const [pending, setPending] = useState<State | null>(null)
  const [error, setError] = useState('')
  const importData = (file?: File) => {
    if (!file) return
    setError('')
    file.text().then((t) => {
      try {
        const d = JSON.parse(t) as State
        if (!Array.isArray(d.clients) || !Array.isArray(d.stock)) throw new Error('bad file')
        setPending(d)
      } catch { setError('That file is not a Precious Studio backup. Choose the .json file you downloaded from this page.') }
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
              <button className={ghost} onClick={() => copy(r.text, r.title)}><Copy size={15} /> {copied === r.title ? 'Copied' : copied === `${r.title}:fail` ? 'Select the text to copy' : 'Copy'}</button>
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
          <ConfirmButton label="Clear all data" onConfirm={() => setS(emptyState())}><Trash2 size={15} /> Clear all data</ConfirmButton>
        </div>
        {pending && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white/[0.04] p-3 text-sm">
            <span className="flex-1">Backup has {pending.clients.length} clients and {pending.appointments.length} appointments. It replaces everything on this device.</span>
            <button className={gold} onClick={() => { setS(pending); setPending(null) }}>Replace data</button>
            <button className={ghost} onClick={() => setPending(null)}>Cancel</button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-[#E2BC72]">{error}</p>}
      </Card>
    </div>
  )
}
