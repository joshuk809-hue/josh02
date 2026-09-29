/* Contadino Club: mobile app for customers (news, events, invites, messages, card)
 * and for the restaurant (CRM, consumption analytics, inbox, broadcasts).
 * Prototype: one device, a Customer/Staff switch, data in localStorage.
 * Money is integer cents. */
(() => {
  'use strict';

  const KEY = 'hdc-mobile-v1';
  const DAY = 86400000;
  const ART = (document.querySelector('meta[name="art-base"]') || {}).content || '../wallet/art/';

  // ---------------------------------------------------------------- catalogue & rules

  const MENU = [
    { id: 'contadino', name: 'Il Contadino', cat: 'meal', price: 1150 },
    { id: 'doppio', name: 'Doppio Contadino', cat: 'meal', price: 1550 },
    { id: 'boscaiolo', name: 'Il Boscaiolo', cat: 'meal', price: 1250 },
    { id: 'fattoria', name: 'La Fattoria', cat: 'meal', price: 1300 },
    { id: 'pollo', name: 'Pollo Croccante', cat: 'meal', price: 1150 },
    { id: 'orto', name: "L'Orto (veggie)", cat: 'meal', price: 1100 },
    { id: 'patatine', name: 'Patatine rustiche', cat: 'side', price: 400 },
    { id: 'dolci', name: 'Patate dolci', cat: 'side', price: 500 },
    { id: 'anelli', name: 'Anelli di cipolla', cat: 'side', price: 450 },
    { id: 'birra', name: 'Birra artigianale', cat: 'drink', price: 550 },
    { id: 'bibita', name: 'Bibita in lattina', cat: 'drink', price: 300 },
    { id: 'shake', name: 'Milkshake', cat: 'drink', price: 550 },
    { id: 'acqua', name: 'Acqua', cat: 'drink', price: 200 },
    { id: 'vino', name: 'Calice di rosso', cat: 'drink', price: 600 },
    { id: 'tiramisu', name: 'Tiramisù della nonna', cat: 'dessert', price: 550 },
    { id: 'crostata', name: 'Crostata di stagione', cat: 'dessert', price: 450 },
    { id: 'cheesecake', name: 'Cheesecake ai frutti di bosco', cat: 'dessert', price: 550 },
  ];
  const ITEM = Object.fromEntries(MENU.map((m) => [m.id, m]));
  const CATS = ['meal', 'side', 'drink', 'dessert'];
  const CAT_IT = { meal: 'Piatto', side: 'Contorno', drink: 'Bevanda', dessert: 'Dolce' };
  const CAT_EN = { meal: 'Meals', side: 'Sides', drink: 'Drinks', dessert: 'Desserts' };
  const CAT_EN1 = { meal: 'meal', side: 'side', drink: 'drink', dessert: 'dessert' };
  const TIERS = [
    { id: 'germoglio', name: 'Germoglio', min: 0, mult: 1, color: '#2f5a41' },
    { id: 'raccolto', name: 'Raccolto', min: 25000, mult: 1.25, color: '#b0782f' },
    { id: 'riserva', name: 'Riserva', min: 60000, mult: 1.5, color: '#0e0d0b' },
  ];
  const REWARDS = [
    { cost: 80, label: 'Patatine rustiche' },
    { cost: 120, label: 'Tiramisù della nonna' },
    { cost: 200, label: 'Il Contadino' },
  ];
  const tierFor = (spend) => TIERS.reduce((t, x) => (spend >= x.min ? x : t), TIERS[0]);
  const nextTier = (spend) => TIERS.find((t) => t.min > spend) || null;
  const pointsFor = (cents, tier) => Math.floor((cents * tier.mult) / 100);

  // ---------------------------------------------------------------- helpers

  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
  const money = (c) => eur.format(c / 100);
  const moneyShort = (c) => `€${new Intl.NumberFormat('it-IT').format(Math.round(c / 100))}`;
  const dShort = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });
  const dLong = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const dMonth = new Intl.DateTimeFormat('it-IT', { month: 'short' });
  const dTime = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' });
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const first = (n) => n.split(' ')[0];
  const daysAgo = (ts) => Math.floor((Date.now() - ts) / DAY);
  function ago(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return 'ora';
    if (m < 60) return `${m} min fa`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h fa`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ieri' : d < 7 ? `${d} giorni fa` : dShort.format(ts);
  }
  function agoEn(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 60) return `${Math.max(1, m)}m`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.round(h / 24);
    return d < 45 ? `${d}d` : dShort.format(ts);
  }
  function rng(seed) {
    return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function pick(rand, weights) {
    const e = Object.entries(weights);
    let r = rand() * e.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of e) if ((r -= w) < 0) return k;
    return e[e.length - 1][0];
  }
  const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const I = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
    news: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M7 9h10M7 12.5h10M7 16h6"/>',
    chat: '<path d="M4 5.5h16v10H9l-5 4z"/>',
    card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M17.8 8a6 6 0 0 1 0 8"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-4 4-5.8 7.5-5.8s6.3 1.8 7.5 5.8"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    users: '<circle cx="9" cy="8.5" r="3.3"/><path d="M2.8 19.5c.9-3.4 3.2-5 6.2-5s5.3 1.6 6.2 5"/><path d="M15.5 5.5a3.2 3.2 0 0 1 0 6.2M17.5 14.6c2 .6 3.2 2.2 3.7 4.9"/>',
    send: '<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m21 3-11 10"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    back: '<path d="M15 5 8 12l7 7"/>',
    nfc: '<path d="M8.5 8.8a4.6 4.6 0 0 1 0 6.4"/><path d="M11.6 6.2a8.3 8.3 0 0 1 0 11.6"/><path d="M14.7 3.6a12 12 0 0 1 0 16.8"/><path d="M5.4 11.2a1.2 1.2 0 0 1 0 1.6"/>',
  };
  const icon = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${I[n]}</svg>`;

  // ---------------------------------------------------------------- seed

  const PROFILES = [
    ['Giulia Rossi', 5, 178, 1, { boscaiolo: 5, contadino: 2, orto: 1 }, { birra: 3, bibita: 1 }, 0.8, 0.35, { tiramisu: 3, cheesecake: 2 }, [1, 2, 2]],
    ['Marco Bianchi', 7, 176, 0, { doppio: 6, fattoria: 2, contadino: 1 }, { birra: 5, vino: 2 }, 0.9, 0.15, { tiramisu: 2, crostata: 1 }, [1, 1, 2]],
    ['Francesca Esposito', 2.5, 170, 4, { orto: 6, boscaiolo: 1 }, { acqua: 3, shake: 1 }, 0.5, 0.55, { cheesecake: 3, crostata: 1 }, [1, 2]],
    ['Luca Romano', 3, 165, 2, { pollo: 5, contadino: 2, orto: 1 }, { shake: 3, bibita: 2 }, 0.95, 0.4, { tiramisu: 1, cheesecake: 2 }, [2, 3, 4]],
    ['Chiara Colombo', 1.6, 160, 9, { fattoria: 4, contadino: 2 }, { vino: 2, acqua: 2 }, 0.6, 0.25, { crostata: 3 }, [1, 2]],
    ['Alessandro Ricci', 4, 172, 58, { contadino: 4, doppio: 2 }, { birra: 2, bibita: 2 }, 0.85, 0.15, { tiramisu: 1 }, [1, 2]],
    ['Sara Marino', 2, 150, 3, { contadino: 3, pollo: 2 }, { bibita: 2, shake: 1 }, 0.7, 0.6, { tiramisu: 2, cheesecake: 2 }, [1, 2, 3]],
    ['Davide Greco', 1.2, 120, 6, { boscaiolo: 2, fattoria: 2 }, { birra: 3 }, 0.6, 0.1, { crostata: 1 }, [1]],
    ['Elena Bruno', 3.5, 13, 0, { orto: 2, pollo: 1 }, { acqua: 1, shake: 1 }, 0.6, 0.4, { cheesecake: 2 }, [1, 2]],
    ['Paolo Ferrari', 4.5, 168, 2, { doppio: 3, boscaiolo: 3 }, { vino: 3, birra: 2 }, 0.7, 0.5, { tiramisu: 3 }, [2, 2, 3]],
    ['Martina Gallo', 2.2, 140, 12, { pollo: 3, orto: 2 }, { shake: 2, acqua: 1 }, 0.8, 0.65, { cheesecake: 2, tiramisu: 1 }, [1, 2]],
    ['Stefano Conti', 1.5, 175, 71, { fattoria: 3, doppio: 1 }, { birra: 2 }, 0.9, 0.1, { crostata: 1 }, [1, 2]],
  ];

  function seed() {
    const rand = rng(20260929);
    const now = Date.now();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const T = today.getTime();
    const customers = [];
    const visits = [];
    PROFILES.forEach(([name, perMonth, from, to, meals, drinks, side, dessert, desserts, party], i) => {
      const id = `LHC-${10421 + i * 37}`;
      const slug = name.toLowerCase().replace(/[^a-z]+/g, '.');
      customers.push({ id, name, email: `${slug}@example.it`, phone: `+39 3${40 + i} ${String(100 + i * 71).padStart(3, '0')} ${String(1000 + i * 373).slice(0, 4)}`,
        joined: T - (from + 1) * DAY, prefs: { news: true, events: true, messages: true, veg: name === 'Francesca Esposito', allergies: name === 'Martina Gallo' ? 'Frutta a guscio' : '' } });
      let spend = 0, balance = 0;
      for (let d = from; d >= to; d--) {
        if (rand() > perMonth / 30) continue;
        const dinner = rand() < 0.62;
        const ts = T - d * DAY + (dinner ? 19 * 60 + 10 + Math.floor(rand() * 200) : 12 * 60 + 10 + Math.floor(rand() * 140)) * 60000;
        if (ts > now) continue;
        const people = party[Math.floor(rand() * party.length)];
        const cart = {};
        const add = (k) => { cart[k] = (cart[k] || 0) + 1; };
        for (let k = 0; k < people; k++) {
          add(pick(rand, meals));
          if (rand() < side) add(pick(rand, { patatine: 6, dolci: 2, anelli: 2 }));
          if (rand() < 0.88) add(pick(rand, drinks));
          if (rand() < dessert) add(pick(rand, desserts));
        }
        const lines = Object.entries(cart).map(([item, qty]) => ({ item, qty, unit: ITEM[item].price }));
        const r = [...REWARDS].reverse().find((x) => x.cost <= balance);
        let redeemed = 0;
        if (r && rand() < 0.45) { redeemed = r.cost; lines.push({ item: MENU.find((m) => m.name === r.label)?.id || 'patatine', qty: 1, unit: 0, reward: true }); }
        const total = lines.reduce((s, l) => s + l.unit * l.qty, 0);
        const earned = pointsFor(total, tierFor(spend));
        spend += total; balance += earned - redeemed;
        visits.push({ id: `V${visits.length + 1}`, cid: id, ts, lines, total, earned, redeemed });
      }
    });
    visits.sort((a, b) => a.ts - b.ts);

    const H = 3600000;
    const at = (days, hh, mm) => T + days * DAY + (hh * 60 + (mm || 0)) * 60000;
    const posts = [
      { id: 'p1', type: 'news', art: 'raccolto', ts: now - 2 * DAY - 3 * H, audience: 'all', title: "Arriva il Burger d'Autunno",
        body: "Zucca arrosto, speck croccante, crema di castagne e una punta di rosmarino, su pane al farro.\n\nDa questa settimana fino a fine novembre. Chi ha la carta Raccolto o Riserva lo assaggia per primo, con un calice omaggio." },
      { id: 'p2', type: 'event', art: 'germoglio', ts: now - 4 * DAY, audience: 'all', title: 'Country Night · musica dal vivo', date: at(9, 20, 30), place: 'In sala e nel dehors', seats: 60,
        body: "Una serata di chitarre, burger alla griglia e birra alla spina. Menu speciale con il Doppio Contadino affumicato.\n\nPrenota il tuo posto: i tavoli sono limitati." },
      { id: 'p3', type: 'invite', art: 'riserva', ts: now - 1 * DAY - 5 * H, audience: 'tier:riserva', title: 'Degustazione privata del menu invernale', date: at(16, 19, 30), place: 'Sala privata', seats: 12,
        body: "Sei tra i nostri ospiti Riserva: ti invitiamo ad assaggiare in anteprima i piatti del nuovo menu invernale, con lo chef al tavolo e i vini in abbinamento.\n\nSolo dodici posti. Conferma la tua presenza qui sotto." },
      { id: 'p4', type: 'news', art: 'raccolto', ts: now - 5 * DAY, audience: 'fan:birra', title: 'Nuova birra artigianale alla spina',
        body: "Da venerdì alla spina una rossa ambrata, maltata, perfetta con il Doppio Contadino. Visto che la birra è tra le tue preferite, la prima pinta la offriamo noi." },
      { id: 'p5', type: 'invite', art: 'germoglio', ts: now - 20 * H, audience: 'seg:risk', title: 'Ci manchi: il dolce lo offriamo noi',
        body: "È da un po' che non ci vediamo. Alla tua prossima visita il dolce è offerto dalla casa: basta avvicinare la carta al lettore.", offer: 'Dolce omaggio alla prossima visita' },
      { id: 'p6', type: 'event', art: 'raccolto', ts: now - 6 * DAY, audience: 'all', title: 'Burger Lab per bambini', date: at(23, 16, 0), place: 'In cucina', seats: 16,
        body: "Un pomeriggio in cucina con i nostri cuochi: i bambini preparano il loro mini burger, dal pane alla salsa. Merenda inclusa." },
    ];
    posts.forEach((p) => { p.reads = {}; p.rsvp = {}; });
    const cids = customers.map((c) => c.id);
    for (const p of posts) for (const cid of cids) if (rand() < 0.55) p.reads[cid] = p.ts + rand() * 2 * DAY;
    posts[1].rsvp = { 'LHC-10421': 'yes', 'LHC-10532': 'yes', 'LHC-10791': 'maybe', 'LHC-10643': 'yes', 'LHC-10458': 'no' };
    posts[2].rsvp = { 'LHC-10458': 'yes' };
    posts[5].rsvp = { 'LHC-10532': 'yes', 'LHC-10643': 'maybe' };

    const messages = [];
    const msg = (cid, from, text, ts, read) => messages.push({ id: `m${messages.length + 1}`, cid, from, text, ts, read });
    for (const c of customers) msg(c.id, 'staff', `Benvenuto nel Contadino Club, ${first(c.name)}! Da oggi ogni visita ti fa guadagnare punti. Avvicina il telefono al lettore alla cassa, come per pagare.`, c.joined + 11 * H, true);
    msg('LHC-10421', 'staff', "Ciao Giulia! Il tuo Boscaiolo ha un nuovo fratello: il Burger d'Autunno, con zucca e castagne. Te lo teniamo da parte?", now - 2 * DAY, true);
    msg('LHC-10421', 'customer', 'Che bello! Posso prenotare per 4 sabato sera verso le 20?', now - 3 * H, false);
    msg('LHC-10458', 'staff', 'Marco, il tuo tavolo Riserva è sempre pronto. Ti aspettiamo alla degustazione del 16!', now - 1 * DAY, false);
    msg('LHC-10458', 'customer', 'Ci sarò, grazie. Porto anche mia moglie se c’è posto.', now - 20 * H, false);
    msg('LHC-10532', 'customer', 'Il Burger Lab è adatto anche a un bambino di 5 anni?', now - 26 * H, true);
    msg('LHC-10532', 'staff', 'Certo Luca, dai 5 anni in su. Ci pensiamo noi a tutto!', now - 25 * H, true);
    messages.sort((a, b) => a.ts - b.ts);

    return { v: 1, customers, visits, posts, messages, seenAt: {} };
  }

  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) { /* fall through */ }
    return seed();
  }
  let state = load();
  function save() { memo.clear(); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* in-memory */ } }

  // ---------------------------------------------------------------- analytics

  const memo = new Map();
  const cust = (id) => state.customers.find((c) => c.id === id);

  function stats(cid) {
    if (memo.has(cid)) return memo.get(cid);
    const c = cust(cid);
    const vs = state.visits.filter((v) => v.cid === cid).sort((a, b) => b.ts - a.ts);
    const items = {};
    const cat = Object.fromEntries(CATS.map((k) => [k, 0]));
    let spend = 0, earned = 0, redeemed = 0, units = 0;
    const months = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) { const m = new Date(d.getFullYear(), d.getMonth() - i, 1); months.push({ key: `${m.getFullYear()}-${m.getMonth()}`, label: dMonth.format(m), value: 0 }); }
    const mi = Object.fromEntries(months.map((m, i) => [m.key, i]));
    for (const v of vs) {
      spend += v.total; earned += v.earned; redeemed += v.redeemed;
      const dt = new Date(v.ts); const k = mi[`${dt.getFullYear()}-${dt.getMonth()}`];
      if (k !== undefined) months[k].value += v.total;
      for (const l of v.lines) {
        const it = (items[l.item] ||= { id: l.item, qty: 0, rev: 0 });
        it.qty += l.qty; it.rev += l.unit * l.qty; units += l.qty;
        cat[ITEM[l.item].cat] += l.unit * l.qty;
      }
    }
    const ranked = Object.values(items).sort((a, b) => b.qty - a.qty || b.rev - a.rev);
    const fav = Object.fromEntries(CATS.map((k) => [k, ranked.find((r) => ITEM[r.id].cat === k) || null]));
    const tier = tierFor(spend);
    const last = vs[0]?.ts ?? null;
    const memberDays = (Date.now() - c.joined) / DAY;
    const perMonth = vs.length / Math.max(1, memberDays / 30);
    let segment = 'regular';
    if (last && daysAgo(last) > 45) segment = 'risk';
    else if (memberDays <= 30) segment = 'new';
    else if (tier.id === 'riserva' || perMonth >= 4) segment = 'vip';
    const s = { c, vs, spend, earned, redeemed, points: earned - redeemed, units, visits: vs.length, avg: vs.length ? Math.round(spend / vs.length) : 0,
      items, ranked, fav, cat, months, tier, next: nextTier(spend), last, segment, perMonth,
      gap: vs.length > 1 ? (vs[0].ts - vs[vs.length - 1].ts) / DAY / (vs.length - 1) : null };
    memo.set(cid, s);
    return s;
  }
  const SEG = { vip: 'VIP', regular: 'Regular', new: 'New', risk: 'At risk' };

  function matches(aud, cid) {
    if (aud === 'all') return true;
    const [k, v] = aud.split(':');
    const s = stats(cid);
    if (k === 'tier') return s.tier.id === v;
    if (k === 'seg') return s.segment === v;
    if (k === 'cust') return cid === v;
    if (k === 'fan') return (s.items[v]?.qty || 0) >= 3 || s.fav[ITEM[v].cat]?.id === v;
    return false;
  }
  const audience = (aud) => state.customers.filter((c) => matches(aud, c.id)).map((c) => c.id);
  function audienceLabel(aud) {
    if (aud === 'all') return 'All members';
    const [k, v] = aud.split(':');
    if (k === 'tier') return `${TIERS.find((t) => t.id === v).name} card`;
    if (k === 'seg') return `${SEG[v]} customers`;
    if (k === 'cust') return cust(v)?.name || v;
    if (k === 'fan') return `Fans of ${ITEM[v].name}`;
    return aud;
  }

  function postsFor(cid) { return state.posts.filter((p) => matches(p.audience, cid)).sort((a, b) => b.ts - a.ts); }
  const threadOf = (cid) => state.messages.filter((m) => m.cid === cid).sort((a, b) => a.ts - b.ts);
  const unreadPosts = (cid) => postsFor(cid).filter((p) => !p.reads[cid]).length;
  const unreadMsgs = (cid) => state.messages.filter((m) => m.cid === cid && m.from === 'staff' && !m.read).length;
  const staffUnread = () => state.messages.filter((m) => m.from === 'customer' && !m.read).length;

  function consumption(days) {
    const since = days ? Date.now() - days * DAY : 0;
    const by = {};
    let rev = 0, visits = 0, units = 0;
    const active = new Set();
    for (const v of state.visits) {
      if (v.ts < since) continue;
      visits++; rev += v.total; active.add(v.cid);
      for (const l of v.lines) { const it = (by[l.item] ||= { id: l.item, qty: 0, rev: 0 }); it.qty += l.qty; it.rev += l.unit * l.qty; units += l.qty; }
    }
    const favCount = {};
    for (const c of state.customers) for (const k of CATS) { const f = stats(c.id).fav[k]; if (f) favCount[f.id] = (favCount[f.id] || 0) + 1; }
    const byCat = Object.fromEntries(CATS.map((k) => {
      const rows = Object.values(by).filter((r) => ITEM[r.id].cat === k).sort((a, b) => b.qty - a.qty);
      return [k, { rows, total: rows.reduce((s, r) => s + r.qty, 0) }];
    }));
    return { rev, visits, units, active: active.size, avg: visits ? Math.round(rev / visits) : 0, byCat, favCount };
  }

  // ---------------------------------------------------------------- UI state

  const ui = {
    role: 'customer',
    cid: 'LHC-10421',
    tab: { customer: 'home', staff: 'dash' },
    stack: [],
    feed: 'all',
    period: 30,
    crm: 'all',
    q: '',
    compose: { type: 'news', title: '', body: '', date: '', time: '20:00', place: '', seats: '', audience: 'all' },
  };
  try { const saved = JSON.parse(sessionStorage.getItem('hdc-ui')); if (saved) Object.assign(ui, saved, { stack: [] }); } catch (e) { /* ignore */ }
  const saveUi = () => { try { sessionStorage.setItem('hdc-ui', JSON.stringify({ role: ui.role, cid: ui.cid, tab: ui.tab })); } catch (e) { /* ignore */ } };
  if (!cust(ui.cid)) ui.cid = state.customers[0].id;

  const view = () => ui.stack[ui.stack.length - 1] || { v: ui.tab[ui.role] };
  const push = (v, id) => { ui.stack.push({ v, id }); render(true); };
  const pop = () => { ui.stack.pop(); render(true); };

  // ---------------------------------------------------------------- shared renderers

  const artUrl = (tier, file = 'card@3x.jpg') => `${ART}${tier}/${file}`;
  const tierTag = (t) => `<span class="tier-tag ${t.id}">${t.name.toUpperCase()}</span>`;
  const avatar = (c, s) => `<span class="avatar t-${s.tier.id}">${esc(initials(c.name))}</span>`;
  const typeLabel = { news: 'Novità', event: 'Evento', invite: 'Invito', message: 'Messaggio' };
  const typeLabelEn = { news: 'News', event: 'Event', invite: 'Invite', message: 'Message' };

  function floatCard(c, s) {
    return `<div class="fcard-wrap"><div class="fcard ${s.tier.id}" id="fcard" style="--img:url('${artUrl(s.tier.id)}')" role="img" aria-label="Carta ${s.tier.name} di ${esc(c.name)}">
      <div class="fc-in">
        <div class="fc-top"><div><div class="fc-h">HAMBURGHERIA</div><div class="fc-d">del Contadino</div></div><span class="fc-nfc">${icon('nfc')}</span></div>
        <div class="fc-tier">${s.tier.name.toUpperCase()}</div>
        <div class="fc-bot"><div><span class="fc-lbl">Socio</span><span class="fc-name">${esc(c.name)}</span></div><div style="text-align:right"><span class="fc-lbl">Carta</span><span class="fc-num">${esc(c.id.replace('-', ' '))}</span></div></div>
      </div></div></div>`;
  }

  function barChart(months) {
    const W = 320, H = 140, pl = 36, pb = 20, pt = 14, iw = W - pl - 6, ih = H - pt - pb;
    const maxV = Math.max(...months.map((m) => m.value), 1);
    const step = 10 ** Math.floor(Math.log10(maxV));
    const max = [1, 2, 2.5, 5, 10].map((k) => k * step).find((v) => v >= maxV);
    const col = iw / months.length, bw = Math.min(26, col * 0.55);
    let g = '';
    for (const f of [0, 0.5, 1]) { const y = pt + ih - f * ih; g += `<line class="grid" x1="${pl}" x2="${W - 6}" y1="${y}" y2="${y}"/><text x="${pl - 5}" y="${y + 3}" text-anchor="end">${moneyShort(max * f)}</text>`; }
    const peak = months.reduce((b, m, i) => (m.value > months[b].value ? i : b), 0);
    months.forEach((m, i) => {
      const x = pl + i * col + (col - bw) / 2, h = (m.value / max) * ih, y = pt + ih - h, r = Math.min(4, h / 2);
      if (h > 0) g += `<path class="b" d="M${x} ${pt + ih}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + bw - r}Q${x + bw} ${y} ${x + bw} ${y + r}V${pt + ih}Z"><title>${m.label}: ${money(m.value)}</title></path>`;
      if (i === peak && m.value) g += `<text class="v" x="${x + bw / 2}" y="${y - 4}" text-anchor="middle">${moneyShort(m.value)}</text>`;
      g += `<text x="${x + bw / 2}" y="${H - 5}" text-anchor="middle">${m.label}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Spesa mensile">${g}</svg>`;
  }

  function rankList(rows, total, favCount) {
    if (!rows.length) return '<p class="muted small">No data in this period.</p>';
    const max = rows[0].qty;
    return `<ol class="rank">${rows.slice(0, 5).map((r, i) => `<li><span class="pos">${i + 1}</span><span class="nm">${esc(ITEM[r.id].name)}</span>
      <span class="val"><b>${r.qty}</b> <small>· ${pct(r.qty, total)}%${favCount && favCount[r.id] ? ` · fav of ${favCount[r.id]}` : ''}</small></span>
      <span class="track"><i style="width:${Math.max(3, (r.qty / max) * 100)}%"></i></span></li>`).join('')}</ol>`;
  }

  function postArt(p) { return `background-image:url('${artUrl(p.art || 'germoglio')}')`; }

  // ---------------------------------------------------------------- customer screens

  function cTop(title, sub) {
    const c = cust(ui.cid), s = stats(ui.cid);
    const n = unreadPosts(ui.cid) + unreadMsgs(ui.cid);
    return `${ui.stack.length ? `<button class="icon-btn" data-act="back" aria-label="Indietro">${icon('back')}</button>` : avatar(c, s)}
      <h1>${title}${sub ? `<span class="sub">${sub}</span>` : ''}</h1>
      <button class="icon-btn" data-act="goto" data-tab="feed" aria-label="Notifiche">${icon('bell')}${n ? `<span class="badge">${n}</span>` : ''}</button>`;
  }

  function cHome() {
    const c = cust(ui.cid), s = stats(ui.cid);
    const nextR = REWARDS.find((r) => r.cost > s.points);
    const prevCost = [...REWARDS].reverse().find((r) => r.cost <= s.points)?.cost || 0;
    const posts = postsFor(ui.cid);
    const nextEvent = posts.filter((p) => p.date && p.date > Date.now()).sort((a, b) => a.date - b.date)[0];
    const lastMsg = threadOf(ui.cid).filter((m) => m.from === 'staff').pop();
    const news = posts.find((p) => p.type === 'news');
    return {
      top: cTop(`Ciao ${esc(first(c.name))}`, 'Contadino Club'),
      main: `
        ${floatCard(c, s)}
        <div class="panel stack">
          <div class="points"><div><span class="lbl">Punti</span><b class="pts-n num" id="pts">${s.points}</b></div>
            <div style="text-align:right" class="small">${nextR ? `<b>${esc(nextR.label)}</b><br><span class="muted">mancano ${nextR.cost - s.points} punti</span>` : '<b>Tutti i premi sbloccati</b>'}</div></div>
          <div class="bar" role="progressbar" aria-valuenow="${nextR ? pct(s.points - prevCost, nextR.cost - prevCost) : 100}"><i style="width:${nextR ? pct(s.points - prevCost, nextR.cost - prevCost) : 100}%"></i></div>
          <p class="small muted">${s.next ? `${money(s.next.min - s.spend)} di spesa per diventare <b>${s.next.name}</b> (×${String(s.next.mult).replace('.', ',')} punti)` : 'Sei Riserva: ×1,5 punti su ogni euro.'}</p>
        </div>
        ${nextEvent ? `<div class="section-h"><h2>Prossimo appuntamento</h2><button class="link" data-act="goto" data-tab="feed">Tutti</button></div>${postCard(nextEvent)}` : ''}
        ${lastMsg ? `<div class="section-h"><h2>Messaggi</h2></div>
          <button class="thread ${unreadMsgs(ui.cid) ? 'unread' : ''}" data-act="goto" data-tab="chat"><img src="${artUrl('riserva', 'google-logo.png')}" alt="" width="42" height="42" style="border-radius:50%">
          <span class="t-main"><b>Hamburgheria del Contadino <small>${ago(lastMsg.ts)}</small></b><span>${esc(lastMsg.text)}</span></span>${unreadMsgs(ui.cid) ? '<span class="dot"></span>' : ''}</button>` : ''}
        <div class="section-h"><h2>Il tuo solito</h2></div>
        <div class="favs">${CATS.map((k) => { const f = s.fav[k]; return `<div class="fav"><span class="lbl">${CAT_IT[k]}</span><b>${f ? esc(ITEM[f.id].name) : '—'}</b><small>${f ? `ordinato ${f.qty} volte` : 'non ancora provato'}</small></div>`; }).join('')}</div>
        ${news ? `<div class="section-h"><h2>Novità</h2></div>${postCard(news)}` : ''}`,
    };
  }

  function postCard(p) {
    const cid = ui.cid;
    const unread = ui.role === 'customer' && !p.reads[cid];
    const past = p.date && p.date < Date.now();
    const mine = p.rsvp?.[cid];
    return `<article class="post ${p.date ? 'has-date' : ''}" data-act="open-post" data-id="${p.id}" tabindex="0" role="button">
      <div class="post-art" style="${postArt(p)}">${p.date ? `<div class="datebox"><b>${new Date(p.date).getDate()}</b><span>${dMonth.format(p.date)}</span></div>` : ''}</div>
      <div class="post-body">
        <div class="post-meta"><span class="pill ${p.type}">${typeLabel[p.type]}</span>${p.audience.startsWith('tier:riserva') ? '<span class="pill invite">Riserva</span>' : ''}<span>${ago(p.ts)}</span>${unread ? '<span class="dot" aria-label="non letto"></span>' : ''}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.body)}</p>
        ${p.date ? `<div class="post-meta">${past ? 'Evento concluso' : `${dLong.format(p.date)} · ${dTime.format(p.date)}${p.place ? ` · ${esc(p.place)}` : ''}`}</div>` : ''}
        ${(p.type === 'event' || (p.type === 'invite' && p.date)) && !past ? rsvpButtons(p, mine) : ''}
        ${p.type === 'invite' && !p.date ? `<div class="row"><button class="btn sm ${mine === 'yes' ? 'primary' : ''}" data-act="rsvp" data-id="${p.id}" data-val="yes">${mine === 'yes' ? 'Accettato ✓' : 'Accetta'}</button></div>` : ''}
      </div></article>`;
  }
  const rsvpButtons = (p, mine) => `<div class="rsvp" role="group" aria-label="Partecipazione">${[['yes', 'Partecipo'], ['maybe', 'Forse'], ['no', 'Non posso']].map(([v, l]) => `<button type="button" data-act="rsvp" data-id="${p.id}" data-val="${v}" aria-pressed="${mine === v}">${l}</button>`).join('')}</div>`;

  function cFeed() {
    const posts = postsFor(ui.cid).filter((p) => ui.feed === 'all' || p.type === ui.feed);
    const chips = [['all', 'Tutto'], ['news', 'Novità'], ['event', 'Eventi'], ['invite', 'Inviti']];
    return {
      top: cTop('Novità', 'News, eventi e inviti per te'),
      main: `<div class="chips" role="group" aria-label="Filtro">${chips.map(([v, l]) => `<button class="chip" data-act="feed" data-val="${v}" aria-pressed="${ui.feed === v}">${l}</button>`).join('')}</div>
        ${posts.map(postCard).join('') || '<p class="empty">Niente di nuovo qui, per ora.</p>'}`,
    };
  }

  function cPost(id) {
    const p = state.posts.find((x) => x.id === id);
    if (!p.reads[ui.cid]) { p.reads[ui.cid] = Date.now(); save(); }
    const mine = p.rsvp?.[ui.cid];
    const going = Object.values(p.rsvp || {}).filter((v) => v === 'yes').length;
    const past = p.date && p.date < Date.now();
    return {
      top: cTop(typeLabel[p.type]),
      main: `<div class="detail-art" style="${postArt(p)}"></div>
        <div class="detail-body">
          <div class="post-meta"><span class="pill ${p.type}">${typeLabel[p.type]}</span><span>${dShort.format(p.ts)}</span></div>
          <h2>${esc(p.title)}</h2>
          ${p.date ? `<div class="facts"><div><span class="lbl">Quando</span><b>${dLong.format(p.date)}</b></div><div><span class="lbl">Ora</span><b>${dTime.format(p.date)}</b></div>
            <div><span class="lbl">Dove</span><b>${esc(p.place || 'In sala')}</b></div><div><span class="lbl">Posti</span><b>${p.seats ? `${Math.max(0, p.seats - going)} liberi su ${p.seats}` : '—'}</b></div></div>` : ''}
          ${p.offer ? `<div class="panel"><span class="lbl">La tua offerta</span><b>${esc(p.offer)}</b></div>` : ''}
          <p class="text">${esc(p.body)}</p>
          ${(p.type === 'event' || (p.type === 'invite' && p.date)) && !past ? `<span class="lbl">Parteciperai?</span>${rsvpButtons(p, mine)}` : ''}
          ${p.type === 'invite' && !p.date ? `<button class="btn ${mine === 'yes' ? 'primary' : 'gold'} block" data-act="rsvp" data-id="${p.id}" data-val="yes">${mine === 'yes' ? 'Offerta attivata sulla tua carta ✓' : "Attiva l'offerta sulla mia carta"}</button>` : ''}
          <button class="btn block" data-act="goto" data-tab="chat">Scrivici</button>
        </div>`,
    };
  }

  function chatHtml(msgs, meFrom) {
    let out = '', lastDay = '';
    for (const m of msgs) {
      const d = new Date(m.ts).toDateString();
      if (d !== lastDay) { lastDay = d; out += `<div class="day-sep">${daysAgo(m.ts) === 0 ? 'Oggi' : daysAgo(m.ts) === 1 ? 'Ieri' : dShort.format(m.ts)}</div>`; }
      out += `<div class="msg ${m.from === meFrom ? 'me' : 'them'}">${esc(m.text)}<small>${dTime.format(m.ts)}${m.from === meFrom && m.read ? ' · letto' : ''}</small></div>`;
    }
    return `<div class="chat" id="chat">${out || '<p class="empty">Nessun messaggio.</p>'}</div>`;
  }

  function cChat() {
    let changed = false;
    for (const m of state.messages) if (m.cid === ui.cid && m.from === 'staff' && !m.read) { m.read = true; changed = true; }
    if (changed) save();
    return {
      top: cTop('Messaggi', 'Hamburgheria del Contadino'),
      main: chatHtml(threadOf(ui.cid), 'customer'),
      composer: 'Scrivi al ristorante…',
    };
  }

  function cCard() {
    const c = cust(ui.cid), s = stats(ui.cid);
    return {
      top: cTop('La mia carta', `${s.tier.name} · ${s.points} punti`),
      main: `${floatCard(c, s)}
        <div class="panel stack" style="align-items:center;text-align:center">
          <span style="width:56px;height:56px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--line)">${icon('nfc', 'width="26" height="26"')}</span>
          <b>Avvicina il telefono al lettore alla cassa</b>
          <p class="small muted">Come per pagare: i punti si aggiungono da soli. Nessun codice da mostrare.</p>
          <button class="btn primary" data-act="sim-visit">Simula una visita</button>
        </div>
        <div class="section-h"><h2>Premi</h2></div>
        <div class="panel stack">${REWARDS.map((r) => `<div class="row" style="justify-content:space-between"><span>${esc(r.label)}</span>
          <span class="small ${s.points >= r.cost ? '' : 'muted'}" style="font-weight:600;${s.points >= r.cost ? 'color:var(--gold)' : ''}">${s.points >= r.cost ? 'Pronto · alla cassa' : `${r.cost} pt`}</span></div>`).join('')}</div>
        <div class="section-h"><h2>Le tue visite</h2><span class="small muted">${s.visits} · ${money(s.spend)}</span></div>
        <div>${s.vs.slice(0, 10).map((v) => `<details class="receipt"><summary><span>${dShort.format(v.ts)} · ${dTime.format(v.ts)}<small>${esc(v.lines.map((l) => ITEM[l.item].name).join(', '))}</small></span><span style="text-align:right"><b>${money(v.total)}</b><small style="color:var(--good)">+${v.earned} pt${v.redeemed ? ` · −${v.redeemed}` : ''}</small></span></summary>
          <ul>${v.lines.map((l) => `<li><span>${l.qty}× ${esc(ITEM[l.item].name)}${l.reward ? ' (premio)' : ''}</span><span>${money(l.unit * l.qty)}</span></li>`).join('')}</ul></details>`).join('') || '<p class="empty">Ancora nessuna visita.</p>'}</div>`,
    };
  }

  function cProfile() {
    const c = cust(ui.cid), s = stats(ui.cid);
    const p = c.prefs;
    const tg = (key, label, sub) => `<div class="toggle"><div><b>${label}</b><div class="small muted">${sub}</div></div><label class="switch"><input type="checkbox" data-pref="${key}" ${p[key] ? 'checked' : ''} aria-label="${label}"><span></span></label></div>`;
    return {
      top: cTop('Profilo'),
      main: `<div class="panel row" style="gap:14px">${avatar(c, s).replace('class="avatar', 'style="width:56px;height:56px;font-size:1.1rem" class="avatar')}
          <div style="flex:1;min-width:0"><b style="font-size:1.1rem">${esc(c.name)}</b><div class="small muted">${esc(c.email)}</div><div class="small muted">Socio dal ${dShort.format(c.joined)} ${new Date(c.joined).getFullYear()}</div></div>${tierTag(s.tier)}</div>
        <div class="section-h"><h2>Notifiche</h2></div>
        <div class="panel">${tg('news', 'Novità', 'Nuovi piatti e annunci')}${tg('events', 'Eventi e inviti', 'Serate, degustazioni, offerte')}${tg('messages', 'Messaggi', 'Risposte dal ristorante')}
          <div class="toggle"><div><b>Notifiche sul telefono</b><div class="small muted" id="push-state">Avvisi anche ad app chiusa</div></div><button class="btn sm" data-act="push">Attiva</button></div></div>
        <div class="section-h"><h2>Preferenze a tavola</h2></div>
        <div class="panel">${tg('veg', 'Vegetariano', 'Ti proponiamo prima i piatti veggie')}
          <div class="field" style="padding-top:12px"><label for="allergies">Allergie o intolleranze</label><input class="input" id="allergies" value="${esc(p.allergies)}" placeholder="Es. glutine, frutta a guscio"></div></div>
        <div class="section-h"><h2>Installa l'app</h2></div>
        <div class="panel small">
          <p><b>iPhone:</b> in Safari tocca Condividi, poi "Aggiungi alla schermata Home".</p>
          <p style="margin-top:6px"><b>Android:</b> in Chrome apri il menu ⋮, poi "Installa app".</p>
          <button class="btn sm" data-act="install" id="install-btn" hidden style="margin-top:10px">Installa ora</button>
        </div>
        <div class="section-h"><h2>Demo</h2></div>
        <div class="panel stack"><div class="field"><label for="who">Stai vedendo l'app di</label>
          <select class="input" id="who">${state.customers.map((x) => `<option value="${x.id}" ${x.id === ui.cid ? 'selected' : ''}>${esc(x.name)} · ${stats(x.id).tier.name}</option>`).join('')}</select></div>
          <button class="btn sm" data-act="reset" id="reset-btn">Ripristina dati demo</button></div>`,
    };
  }

  // ---------------------------------------------------------------- staff screens

  function sTop(title, sub) {
    return `${ui.stack.length ? `<button class="icon-btn" data-act="back" aria-label="Back">${icon('back')}</button>` : `<img src="${artUrl('riserva', 'google-logo.png')}" alt="" width="38" height="38" style="border-radius:50%">`}
      <h1>${title}${sub ? `<span class="sub">${sub}</span>` : ''}</h1>`;
  }

  function sDash() {
    const g = consumption(ui.period);
    const prev = ui.period ? (() => { const all = state.visits.filter((v) => v.ts >= Date.now() - 2 * ui.period * DAY && v.ts < Date.now() - ui.period * DAY); return all.reduce((s, v) => s + v.total, 0); })() : 0;
    const delta = prev ? Math.round(((g.rev - prev) / prev) * 100) : null;
    const tiers = TIERS.map((t) => ({ t, n: state.customers.filter((c) => stats(c.id).tier.id === t.id).length }));
    const risk = state.customers.filter((c) => stats(c.id).segment === 'risk').length;
    const recent = [...state.posts].sort((a, b) => b.ts - a.ts).slice(0, 4);
    const periods = [[30, '30 days'], [90, '90 days'], [0, 'All time']];
    return {
      top: sTop('Dashboard', 'Hamburgheria del Contadino'),
      main: `<div class="chips">${periods.map(([v, l]) => `<button class="chip" data-act="period" data-val="${v}" aria-pressed="${ui.period === v}">${l}</button>`).join('')}</div>
        <div class="kpis">
          <div class="kpi"><small>Revenue</small><b>${money(g.rev)}</b><small>${delta === null ? '&nbsp;' : `<span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}%</span> vs previous`}</small></div>
          <div class="kpi"><small>Visits</small><b>${g.visits}</b><small>avg ticket ${money(g.avg)}</small></div>
          <div class="kpi"><small>Active members</small><b>${g.active}/${state.customers.length}</b><small>${risk ? `<span class="down">${risk} at risk</span>` : 'none at risk'}</small></div>
          <div class="kpi"><small>Items sold</small><b>${g.units}</b><small>${g.visits ? (g.units / g.visits).toFixed(1) : 0} per visit</small></div>
        </div>
        ${CATS.map((k) => `<div class="panel"><div class="section-h" style="margin-bottom:10px"><h2>Favourite ${CAT_EN[k].toLowerCase()}</h2><span class="small muted">${g.byCat[k].total} sold</span></div>${rankList(g.byCat[k].rows, g.byCat[k].total, g.favCount)}</div>`).join('')}
        <div class="panel stack"><div class="section-h"><h2>Members by card</h2><span class="small muted">${state.customers.length} total</span></div>
          <div class="mix" role="img" aria-label="${tiers.map((x) => `${x.t.name} ${x.n}`).join(', ')}">${tiers.map((x) => `<i style="width:${pct(x.n, state.customers.length)}%;background:${x.t.color}${x.t.id === 'riserva' ? ';box-shadow:inset 0 0 0 1px #b8923f' : ''}"></i>`).join('')}</div>
          <div class="legend">${tiers.map((x) => `<span><i style="background:${x.t.color}${x.t.id === 'riserva' ? ';box-shadow:inset 0 0 0 1px #b8923f' : ''}"></i>${x.t.name} · <b>${x.n}</b></span>`).join('')}</div></div>
        <div class="section-h"><h2>Engagement</h2><button class="link" data-act="goto" data-tab="send">New post</button></div>
        <div>${recent.map(postStatRow).join('')}</div>`,
    };
  }

  function postStats(p) {
    const aud = audience(p.audience);
    const reads = aud.filter((id) => p.reads[id]).length;
    const r = { yes: 0, maybe: 0, no: 0 };
    for (const id of aud) if (p.rsvp[id]) r[p.rsvp[id]]++;
    return { aud, reads, r };
  }
  function postStatRow(p) {
    const st = postStats(p);
    return `<button class="list-row" data-act="s-post" data-id="${p.id}"><span class="pill ${p.type}">${typeLabelEn[p.type]}</span>
      <span class="grow"><b>${esc(p.title)}</b><span>${esc(audienceLabel(p.audience))} · ${agoEn(p.ts)} ago</span></span>
      <span class="end">${pct(st.reads, st.aud.length)}%<small>${p.type === 'news' ? `read by ${st.reads}/${st.aud.length}` : `${st.r.yes} yes · ${st.r.maybe} maybe`}</small></span></button>`;
  }

  function sPost(id) {
    const p = state.posts.find((x) => x.id === id);
    const st = postStats(p);
    const names = (val) => st.aud.filter((c) => p.rsvp[c] === val).map((c) => esc(cust(c).name)).join(', ') || '—';
    return {
      top: sTop(typeLabelEn[p.type], esc(audienceLabel(p.audience))),
      main: `<div class="detail-art" style="${postArt(p)};height:150px"></div>
        <div class="detail-body"><h2>${esc(p.title)}</h2>
          <div class="kpis"><div class="kpi"><small>Reached</small><b>${st.aud.length}</b><small>members</small></div><div class="kpi"><small>Opened</small><b>${pct(st.reads, st.aud.length)}%</b><small>${st.reads} of ${st.aud.length}</small></div></div>
          ${p.type !== 'news' ? `<div class="panel stack small"><div><span class="lbl">Yes (${st.r.yes})</span><div>${names('yes')}</div></div><div><span class="lbl">Maybe (${st.r.maybe})</span><div>${names('maybe')}</div></div><div><span class="lbl">No (${st.r.no})</span><div>${names('no')}</div></div></div>` : ''}
          ${p.date ? `<p class="small muted">${dLong.format(p.date)} · ${dTime.format(p.date)} · ${esc(p.place || '')}${p.seats ? ` · ${p.seats} seats` : ''}</p>` : ''}
          <p class="text">${esc(p.body)}</p></div>`,
    };
  }

  function sCustomers() {
    const q = ui.q.trim().toLowerCase();
    const filters = [['all', 'All'], ['tier:riserva', 'Riserva'], ['tier:raccolto', 'Raccolto'], ['tier:germoglio', 'Germoglio'], ['seg:risk', 'At risk'], ['seg:new', 'New']];
    const list = state.customers.map((c) => stats(c.id))
      .filter((s) => ui.crm === 'all' || matches(ui.crm, s.c.id))
      .filter((s) => !q || s.c.name.toLowerCase().includes(q) || s.c.id.toLowerCase().includes(q))
      .sort((a, b) => b.spend - a.spend);
    return {
      top: sTop('Customers', `${state.customers.length} members`),
      main: `<input class="input" id="crm-q" type="search" placeholder="Search name or card" value="${esc(ui.q)}" aria-label="Search customers">
        <div class="chips">${filters.map(([v, l]) => `<button class="chip" data-act="crm" data-val="${v}" aria-pressed="${ui.crm === v}">${l}</button>`).join('')}</div>
        <div id="crm-list">${list.map((s) => `<button class="list-row" data-act="s-cust" data-id="${s.c.id}">${avatar(s.c, s)}
          <span class="grow"><b>${esc(s.c.name)} ${s.segment === 'risk' ? '<span class="pill risk">At risk</span>' : ''}</b><span>${s.fav.meal ? esc(ITEM[s.fav.meal.id].name) : '—'} · ${s.fav.drink ? esc(ITEM[s.fav.drink.id].name) : '—'}</span></span>
          <span class="end">${money(s.spend)}<small>${s.visits} visits · ${s.last ? agoEn(s.last) : '—'}</small></span></button>`).join('') || '<p class="empty">No customers match.</p>'}</div>`,
    };
  }

  function sCustomer(cid) {
    const s = stats(cid), c = s.c;
    const catTotal = Object.values(s.cat).reduce((a, b) => a + b, 0);
    const catColors = { meal: 'var(--bar)', side: '#b0782f', drink: 'var(--info)', dessert: '#c2a45c' };
    return {
      top: sTop(esc(c.name), `${esc(c.id)} · member since ${dShort.format(c.joined)}`),
      main: `<div class="row">${tierTag(s.tier)} <span class="pill ${s.segment === 'risk' ? 'risk' : s.segment === 'vip' ? 'invite' : s.segment === 'new' ? 'news' : 'event'}">${SEG[s.segment]}</span>
          ${c.prefs.veg ? '<span class="pill event">Vegetarian</span>' : ''}${c.prefs.allergies ? `<span class="pill risk">Allergy: ${esc(c.prefs.allergies)}</span>` : ''}</div>
        <div class="kpis">
          <div class="kpi"><small>Total spent</small><b>${money(s.spend)}</b><small>${s.visits} visits</small></div>
          <div class="kpi"><small>Avg ticket</small><b>${money(s.avg)}</b><small>${s.gap ? `every ${s.gap.toFixed(1)} days` : '—'}</small></div>
          <div class="kpi"><small>Points</small><b>${s.points}</b><small>${s.earned} earned · ${s.redeemed} used</small></div>
          <div class="kpi"><small>Last visit</small><b style="font-size:1.05rem">${s.last ? `${agoEn(s.last)} ago` : '—'}</b><small>${s.units} items bought</small></div>
        </div>
        <div class="section-h"><h2>Favourites</h2></div>
        <div class="favs">${CATS.map((k) => { const f = s.fav[k]; const tot = s.ranked.filter((r) => ITEM[r.id].cat === k).reduce((a, r) => a + r.qty, 0); return `<div class="fav"><span class="lbl">Favourite ${CAT_EN1[k]}</span><b>${f ? esc(ITEM[f.id].name) : '—'}</b><small>${f ? `${f.qty}× · ${pct(f.qty, tot)}% of ${CAT_EN[k].toLowerCase()}` : 'never ordered'}</small></div>`; }).join('')}</div>
        <div class="panel stack"><div class="section-h"><h2>Spend by category</h2></div>
          <div class="mix">${CATS.map((k) => `<i style="width:${pct(s.cat[k], catTotal)}%;background:${catColors[k]}"></i>`).join('')}</div>
          <div class="legend">${CATS.map((k) => `<span><i style="background:${catColors[k]}"></i>${CAT_EN[k]} · <b>${pct(s.cat[k], catTotal)}%</b></span>`).join('')}</div></div>
        <div class="panel"><div class="section-h" style="margin-bottom:6px"><h2>Monthly spend</h2><span class="small muted">last 6 months</span></div>${barChart(s.months)}</div>
        <div class="panel"><div class="section-h" style="margin-bottom:10px"><h2>Everything ordered</h2></div>${rankList(s.ranked, s.units)}</div>
        <div class="two"><button class="btn primary" data-act="s-thread" data-id="${cid}">Message</button><button class="btn gold" data-act="invite-one" data-id="${cid}">Invite</button></div>
        <div class="section-h"><h2>Recent visits</h2></div>
        <div>${s.vs.slice(0, 6).map((v) => `<details class="receipt"><summary><span>${dShort.format(v.ts)} · ${dTime.format(v.ts)}<small>${v.lines.reduce((a, l) => a + l.qty, 0)} items</small></span><b>${money(v.total)}</b></summary>
          <ul>${v.lines.map((l) => `<li><span>${l.qty}× ${esc(ITEM[l.item].name)}${l.reward ? ' (reward)' : ''}</span><span>${money(l.unit * l.qty)}</span></li>`).join('')}</ul></details>`).join('')}</div>`,
    };
  }

  function sInbox() {
    const threads = state.customers.map((c) => ({ c, msgs: threadOf(c.id) })).filter((t) => t.msgs.length)
      .map((t) => ({ ...t, last: t.msgs[t.msgs.length - 1], unread: t.msgs.filter((m) => m.from === 'customer' && !m.read).length }))
      .sort((a, b) => b.last.ts - a.last.ts);
    return {
      top: sTop('Messages', `${staffUnread()} unread`),
      main: `<div>${threads.map((t) => `<button class="thread ${t.unread ? 'unread' : ''}" data-act="s-thread" data-id="${t.c.id}">${avatar(t.c, stats(t.c.id))}
        <span class="t-main"><b>${esc(t.c.name)} <small>${agoEn(t.last.ts)}</small></b><span>${t.last.from === 'staff' ? 'You: ' : ''}${esc(t.last.text)}</span></span>${t.unread ? `<span class="badge" style="position:static">${t.unread}</span>` : ''}</button>`).join('')}</div>`,
    };
  }

  function sThread(cid) {
    let changed = false;
    for (const m of state.messages) if (m.cid === cid && m.from === 'customer' && !m.read) { m.read = true; changed = true; }
    if (changed) save();
    const s = stats(cid);
    return {
      top: sTop(esc(s.c.name), `${s.tier.name} · usual: ${s.fav.meal ? esc(ITEM[s.fav.meal.id].name) : '—'}`),
      main: chatHtml(threadOf(cid), 'staff'),
      composer: `Reply to ${first(s.c.name)}…`,
    };
  }

  function sSend() {
    const f = ui.compose;
    const types = [['news', 'News'], ['event', 'Event'], ['invite', 'Invite'], ['message', 'Message']];
    const aud = audience(f.audience);
    const opt = (v, l) => `<option value="${v}" ${f.audience === v ? 'selected' : ''}>${esc(l)}</option>`;
    return {
      top: sTop('Send', 'News, events, invites and messages'),
      main: `<form id="compose" class="stack" autocomplete="off">
        <div class="chips" role="group" aria-label="Type">${types.map(([v, l]) => `<button type="button" class="chip" data-act="ctype" data-val="${v}" aria-pressed="${f.type === v}">${l}</button>`).join('')}</div>
        <div class="field"><label for="c-aud">Audience</label>
          <select class="input" id="c-aud">
            ${opt('all', 'All members')}
            <optgroup label="By card">${TIERS.map((t) => opt(`tier:${t.id}`, `${t.name} card`)).join('')}</optgroup>
            <optgroup label="By behaviour">${Object.entries(SEG).map(([k, l]) => opt(`seg:${k}`, `${l} customers`)).join('')}</optgroup>
            <optgroup label="Fans of a dish">${MENU.map((m) => opt(`fan:${m.id}`, `Fans of ${m.name}`)).join('')}</optgroup>
            <optgroup label="One customer">${state.customers.map((c) => opt(`cust:${c.id}`, c.name)).join('')}</optgroup>
          </select>
          <span class="small muted">Reaches <b style="color:var(--ink)">${aud.length}</b> ${aud.length === 1 ? 'member' : 'members'}${aud.length && aud.length <= 5 ? `: ${aud.map((id) => esc(first(cust(id).name))).join(', ')}` : ''}</span></div>
        ${f.type !== 'message' ? `<div class="field"><label for="c-title">Title</label><input class="input" id="c-title" data-f="title" value="${esc(f.title)}" placeholder="${f.type === 'event' ? 'Country Night' : f.type === 'invite' ? 'Private tasting' : "New autumn burger"}" required></div>` : ''}
        <div class="field"><label for="c-body">${f.type === 'message' ? 'Message' : 'Text'}</label><textarea class="input" id="c-body" data-f="body" placeholder="Write in Italian for your customers" required>${esc(f.body)}</textarea></div>
        ${f.type === 'event' || f.type === 'invite' ? `<div class="two"><div class="field"><label for="c-date">Date${f.type === 'invite' ? ' (optional)' : ''}</label><input class="input" type="date" id="c-date" data-f="date" value="${esc(f.date)}" ${f.type === 'event' ? 'required' : ''}></div>
          <div class="field"><label for="c-time">Time</label><input class="input" type="time" id="c-time" data-f="time" value="${esc(f.time)}"></div></div>
          <div class="two"><div class="field"><label for="c-place">Place</label><input class="input" id="c-place" data-f="place" value="${esc(f.place)}" placeholder="In sala"></div>
          <div class="field"><label for="c-seats">Seats</label><input class="input" type="number" min="1" id="c-seats" data-f="seats" value="${esc(f.seats)}" placeholder="40"></div></div>` : ''}
        <button class="btn primary block" type="submit" ${aud.length ? '' : 'disabled'}>Send to ${aud.length} ${aud.length === 1 ? 'member' : 'members'}</button>
      </form>
      <div class="section-h"><h2>Sent</h2></div>
      <div>${[...state.posts].sort((a, b) => b.ts - a.ts).map(postStatRow).join('')}</div>`,
    };
  }

  // ---------------------------------------------------------------- render

  const TABS = {
    customer: [['home', 'Home', 'home'], ['feed', 'Novità', 'news'], ['chat', 'Messaggi', 'chat'], ['card', 'Carta', 'card'], ['profile', 'Profilo', 'user']],
    staff: [['dash', 'Dashboard', 'chart'], ['customers', 'Customers', 'users'], ['inbox', 'Messages', 'chat'], ['send', 'Send', 'send']],
  };
  const SCREENS = {
    customer: { home: cHome, feed: cFeed, chat: cChat, card: cCard, profile: cProfile, post: cPost },
    staff: { dash: sDash, customers: sCustomers, inbox: sInbox, send: sSend, cust: sCustomer, thread: sThread, post: sPost },
  };

  function render(resetScroll) {
    const v = view();
    const out = SCREENS[ui.role][v.v](v.id);
    $('#top').innerHTML = out.top;
    const main = $('#main');
    const keep = resetScroll ? 0 : main.scrollTop;
    main.innerHTML = out.main;
    $('#composer-slot').innerHTML = out.composer ? `<form class="composer" id="chat-form"><input class="input" id="chat-input" placeholder="${esc(out.composer)}" aria-label="${esc(out.composer)}" autocomplete="off"><button class="btn primary" type="submit">${icon('send', 'width="18" height="18"')}</button></form>` : '';
    const counts = ui.role === 'customer' ? { feed: unreadPosts(ui.cid), chat: unreadMsgs(ui.cid) } : { inbox: staffUnread() };
    $('#tabbar').innerHTML = TABS[ui.role].map(([id, label, ic]) => `<button data-act="tab" data-tab="${id}" ${ui.tab[ui.role] === id ? 'aria-current="page"' : ''}>${icon(ic)}${label}${counts[id] ? `<span class="badge">${counts[id]}</span>` : ''}</button>`).join('');
    document.querySelectorAll('.role button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.role === ui.role)));
    if (out.composer) main.scrollTop = main.scrollHeight; else main.scrollTop = keep;
    const fc = $('#fcard'); if (fc) bindTilt(fc);
    const ib = $('#install-btn'); if (ib && deferredInstall) ib.hidden = false;
    saveUi();
  }

  function bindTilt(el) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width) - 0.5) * 16}deg`);
      el.style.setProperty('--rx', `${(0.5 - ((e.clientY - r.top) / r.height)) * 12}deg`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  }

  let toastT = 0;
  function toast(text) {
    $('#toast-slot').innerHTML = `<div class="toast">${esc(text)}</div>`;
    clearTimeout(toastT); toastT = setTimeout(() => { $('#toast-slot').innerHTML = ''; }, 3200);
  }

  // Banner for what arrived since the customer last looked (the "push" of this demo).
  let bannerT = 0;
  function arrivals() {
    const cid = ui.cid, c = cust(cid);
    const since = state.seenAt[cid] || 0;
    const items = [
      ...postsFor(cid).filter((p) => p.ts > since && !p.reads[cid] && (p.type === 'news' ? c.prefs.news : c.prefs.events)).map((p) => ({ ts: p.ts, title: typeLabel[p.type], text: p.title, go: ['post', p.id] })),
      ...threadOf(cid).filter((m) => m.from === 'staff' && !m.read && m.ts > since && c.prefs.messages).map((m) => ({ ts: m.ts, title: 'Nuovo messaggio', text: m.text, go: ['chat'] })),
    ].sort((a, b) => b.ts - a.ts);
    state.seenAt[cid] = Date.now(); save();
    if (!items.length) return;
    const n = items[0];
    $('#banner-slot').innerHTML = `<div class="banner" data-act="banner" data-go="${esc(n.go.join('|'))}"><img src="${artUrl(stats(cid).tier.id, 'google-logo.png')}" alt=""><div><b>${esc(n.title)}${items.length > 1 ? ` · +${items.length - 1}` : ''}</b><span>${esc(n.text)}</span></div></div>`;
    clearTimeout(bannerT); bannerT = setTimeout(() => { $('#banner-slot').innerHTML = ''; }, 5000);
  }

  function notifyDevice(title, body) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      navigator.serviceWorker?.getRegistration?.().then((reg) => {
        if (reg) reg.showNotification(title, { body, icon: 'icons/icon-192.png' });
        else new Notification(title, { body }); // eslint-disable-line no-new
      }).catch(() => {});
    } catch (e) { /* not available in this view */ }
  }

  // ---------------------------------------------------------------- actions

  function simulateVisit() {
    const s = stats(ui.cid);
    const lines = [];
    const add = (id) => id && lines.push({ item: id, qty: 1, unit: ITEM[id].price });
    add(s.fav.meal?.id || 'contadino'); add(s.fav.side?.id || 'patatine'); add(s.fav.drink?.id || 'bibita');
    if (Math.random() < 0.5) add(s.fav.dessert?.id || 'tiramisu');
    const total = lines.reduce((a, l) => a + l.unit * l.qty, 0);
    const earned = pointsFor(total, s.tier);
    state.visits.push({ id: uid('V'), cid: ui.cid, ts: Date.now(), lines, total, earned, redeemed: 0 });
    save();
    const card = $('#fcard'); if (card) { card.classList.remove('tap-anim'); void card.offsetWidth; card.classList.add('tap-anim'); }
    setTimeout(() => { render(); toast(`Visita registrata: ${money(total)} · +${earned} punti`); }, 450);
  }

  function sendCompose() {
    const f = ui.compose;
    const ids = audience(f.audience);
    if (!ids.length) return;
    if (!f.body.trim() || (f.type !== 'message' && !f.title.trim())) { toast('Add a title and some text first.'); return; }
    if (f.type === 'message') {
      for (const cid of ids) state.messages.push({ id: uid('m'), cid, from: 'staff', text: f.body.trim(), ts: Date.now(), read: false });
    } else {
      let date = null;
      if (f.date) date = new Date(`${f.date}T${f.time || '20:00'}`).getTime();
      if (f.type === 'event' && !date) { toast('Pick a date for the event.'); return; }
      state.posts.push({ id: uid('p'), type: f.type, art: { news: 'raccolto', event: 'germoglio', invite: f.audience === 'tier:riserva' ? 'riserva' : 'raccolto' }[f.type],
        ts: Date.now(), audience: f.audience, title: f.title.trim(), body: f.body.trim(), ...(date ? { date } : {}), ...(f.place ? { place: f.place.trim() } : {}), ...(f.seats ? { seats: +f.seats } : {}), reads: {}, rsvp: {} });
    }
    save();
    if (ids.includes(ui.cid)) notifyDevice(f.type === 'message' ? 'Hamburgheria del Contadino' : typeLabel[f.type], f.type === 'message' ? f.body.trim() : f.title.trim());
    toast(`Sent to ${ids.length} ${ids.length === 1 ? 'member' : 'members'}. Switch to Cliente to see it arrive.`);
    ui.compose = { type: f.type, title: '', body: '', date: '', time: '20:00', place: '', seats: '', audience: f.audience };
    render(true);
  }

  let resetArmed = false;
  document.addEventListener('click', (e) => {
    const roleBtn = e.target.closest('[data-role]');
    if (roleBtn) {
      if (ui.role === roleBtn.dataset.role) return;
      ui.role = roleBtn.dataset.role; ui.stack = []; render(true);
      if (ui.role === 'customer') arrivals();
      return;
    }
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const a = el.dataset.act, id = el.dataset.id;
    if (a === 'tab' || a === 'goto') { ui.tab[ui.role] = el.dataset.tab; ui.stack = []; render(true); }
    else if (a === 'back') pop();
    else if (a === 'open-post') push('post', id);
    else if (a === 'rsvp') {
      e.stopPropagation();
      const p = state.posts.find((x) => x.id === id);
      p.rsvp[ui.cid] = p.rsvp[ui.cid] === el.dataset.val && p.type === 'invite' && !p.date ? undefined : el.dataset.val;
      if (p.rsvp[ui.cid] === undefined) delete p.rsvp[ui.cid];
      p.reads[ui.cid] ||= Date.now();
      save(); render();
      if (p.rsvp[ui.cid]) toast({ yes: p.date ? 'Ci vediamo! Posto confermato.' : 'Offerta attivata sulla tua carta.', maybe: 'Segnato come "forse".', no: 'Peccato! Sarà per la prossima.' }[p.rsvp[ui.cid]]);
    }
    else if (a === 'feed') { ui.feed = el.dataset.val; render(true); }
    else if (a === 'sim-visit') simulateVisit();
    else if (a === 'period') { ui.period = +el.dataset.val; render(); }
    else if (a === 'crm') { ui.crm = el.dataset.val; render(); }
    else if (a === 's-cust') push('cust', id);
    else if (a === 's-thread') push('thread', id);
    else if (a === 's-post') push('post', id);
    else if (a === 'invite-one') { ui.compose = { ...ui.compose, type: 'invite', audience: `cust:${id}` }; ui.tab.staff = 'send'; ui.stack = []; render(true); }
    else if (a === 'ctype') { ui.compose.type = el.dataset.val; render(); }
    else if (a === 'banner') { const [v, pid] = el.dataset.go.split('|'); $('#banner-slot').innerHTML = ''; if (v === 'chat') { ui.tab.customer = 'chat'; ui.stack = []; render(true); } else { ui.stack = []; push(v, pid); } }
    else if (a === 'push') {
      const st = $('#push-state');
      if (!('Notification' in window)) { st.textContent = 'Questo browser non supporta le notifiche.'; return; }
      Promise.resolve(Notification.requestPermission()).then((p) => { st.textContent = p === 'granted' ? 'Attive su questo dispositivo.' : 'Non attivate: puoi cambiarlo dalle impostazioni del browser.'; }).catch(() => { st.textContent = 'Non disponibili in questa anteprima.'; });
    }
    else if (a === 'install' && deferredInstall) { deferredInstall.prompt(); deferredInstall = null; el.hidden = true; }
    else if (a === 'reset') {
      if (!resetArmed) { resetArmed = true; el.textContent = 'Tocca di nuovo per confermare'; setTimeout(() => { resetArmed = false; if (el.isConnected) el.textContent = 'Ripristina dati demo'; }, 4000); return; }
      resetArmed = false; state = seed(); save(); ui.stack = []; render(true); toast('Dati demo ripristinati.');
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('article[data-act]')) { e.preventDefault(); e.target.click(); }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.pref) { cust(ui.cid).prefs[t.dataset.pref] = t.checked; save(); toast('Preferenza salvata.'); }
    else if (t.id === 'allergies') { cust(ui.cid).prefs.allergies = t.value.trim(); save(); toast('Preferenza salvata.'); }
    else if (t.id === 'who') { ui.cid = t.value; ui.stack = []; render(true); arrivals(); }
    else if (t.id === 'c-aud') { ui.compose.audience = t.value; render(); }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.f) ui.compose[t.dataset.f] = t.value;
    else if (t.id === 'crm-q') {
      ui.q = t.value;
      const pos = t.selectionStart;
      render();
      const q = $('#crm-q'); q.focus(); q.setSelectionRange(pos, pos);
    }
  });

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.id === 'compose') sendCompose();
    if (e.target.id === 'chat-form') {
      const text = $('#chat-input').value.trim();
      if (!text) return;
      const cid = ui.role === 'customer' ? ui.cid : view().id;
      state.messages.push({ id: uid('m'), cid, from: ui.role === 'customer' ? 'customer' : 'staff', text, ts: Date.now(), read: false });
      save(); render();
      $('#chat-input').focus();
    }
  });

  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; const b = $('#install-btn'); if (b) b.hidden = false; });

  render(true);
  if (ui.role === 'customer') setTimeout(arrivals, 700);
})();
