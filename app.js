/* Hamburgheria del Contadino — fidelity card + CRM mock.
 * All money is stored as integer cents so totals never drift.
 * Data lives in localStorage; the first run seeds a deterministic demo dataset. */
(() => {
  'use strict';

  const BASE_URL = 'https://lhamburgerdelcontadino.plateform.app/frontpage/fidelity';
  const STORE_KEY = 'lhc-fidelity-v1';
  const DAY = 86400000;

  const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
  const intFmt = new Intl.NumberFormat('it-IT');
  const money = (c) => eur.format(c / 100);
  const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

  // ---------- Catalogue & programme rules ----------

  const MENU = [
    { id: 'contadino', name: 'Il Contadino', cat: 'Burger', price: 1150 },
    { id: 'doppio', name: 'Doppio Contadino', cat: 'Burger', price: 1550 },
    { id: 'boscaiolo', name: 'Il Boscaiolo', cat: 'Burger', price: 1250 },
    { id: 'fattoria', name: 'La Fattoria', cat: 'Burger', price: 1300 },
    { id: 'pollo', name: 'Pollo Croccante', cat: 'Burger', price: 1150 },
    { id: 'orto', name: "L'Orto (veggie)", cat: 'Burger', price: 1100 },
    { id: 'patatine', name: 'Patatine rustiche', cat: 'Side', price: 400 },
    { id: 'dolci', name: 'Patate dolci', cat: 'Side', price: 500 },
    { id: 'anelli', name: 'Anelli di cipolla', cat: 'Side', price: 450 },
    { id: 'birra', name: 'Birra artigianale 0,4 l', cat: 'Drink', price: 550 },
    { id: 'bibita', name: 'Bibita in lattina', cat: 'Drink', price: 300 },
    { id: 'shake', name: 'Milkshake', cat: 'Drink', price: 550 },
    { id: 'acqua', name: 'Acqua 0,5 l', cat: 'Drink', price: 200 },
    { id: 'tiramisu', name: 'Tiramisù della nonna', cat: 'Dessert', price: 550 },
    { id: 'crostata', name: 'Crostata di stagione', cat: 'Dessert', price: 450 },
  ];
  const ITEM = Object.fromEntries(MENU.map((m) => [m.id, m]));
  const CATS = ['Burger', 'Side', 'Drink', 'Dessert'];

  // Rewards are paid for with points; the item goes on the ticket at €0.
  const REWARDS = [
    { id: 'r-side', item: 'patatine', cost: 80, label: 'Free rustic fries' },
    { id: 'r-dessert', item: 'tiramisu', cost: 120, label: 'Free tiramisù' },
    { id: 'r-burger', item: 'contadino', cost: 200, label: 'Free Il Contadino' },
  ];
  const REWARD = Object.fromEntries(REWARDS.map((r) => [r.id, r]));

  // Tiers by lifetime spend (cents). Points per euro paid = multiplier.
  const TIERS = [
    { id: 'seme', name: 'Seme', min: 0, mult: 1 },
    { id: 'germoglio', name: 'Germoglio', min: 25000, mult: 1.25 },
    { id: 'raccolto', name: 'Raccolto', min: 60000, mult: 1.5 },
  ];
  const tierFor = (spend) => TIERS.reduce((t, x) => (spend >= x.min ? x : t), TIERS[0]);
  const nextTierFor = (spend) => TIERS.find((t) => t.min > spend) || null;
  const pointsFor = (paidCents, tier) => Math.floor((paidCents * tier.mult) / 100);

  // ---------- Helpers ----------

  const $ = (sel) => document.querySelector(sel);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const cardUrl = (id) => `${BASE_URL}?card=${encodeURIComponent(id)}`;
  const daysAgo = (ts) => Math.floor((Date.now() - ts) / DAY);
  const relDay = (ts) => {
    const d = daysAgo(ts);
    if (d <= 0) return 'today';
    if (d === 1) return 'yesterday';
    if (d < 45) return `${d} days ago`;
    return dateFmt.format(ts);
  };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  function mulberry32(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pickWeighted(rand, weights) {
    const entries = Object.entries(weights);
    let r = rand() * entries.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of entries) { if ((r -= w) < 0) return k; }
    return entries[entries.length - 1][0];
  }

  // ---------- Transactions ----------

  // lines: [{ itemId, qty, rewardId? }]; tier = tier the customer held before this sale.
  function buildTxn(id, customerId, ts, lines, tier) {
    const out = lines.map((l) => ({
      itemId: l.itemId,
      qty: l.qty,
      unit: l.rewardId ? 0 : ITEM[l.itemId].price,
      ...(l.rewardId ? { rewardId: l.rewardId } : {}),
    }));
    const total = out.reduce((s, l) => s + l.unit * l.qty, 0);
    const redeemed = out.reduce((s, l) => s + (l.rewardId ? REWARD[l.rewardId].cost * l.qty : 0), 0);
    return { id, customerId, ts, lines: out, total, earned: pointsFor(total, tier), redeemed, tier: tier.id };
  }

  // ---------- Seed data ----------

  const PROFILES = [
    { name: 'Giulia Rossi', phone: '+39 347 218 4410', email: 'giulia.rossi@example.it', perMonth: 5, from: 178, to: 1, burgers: { boscaiolo: 5, contadino: 2, orto: 1 }, drinks: { birra: 3, bibita: 1 }, side: 0.8, dessert: 0.35, party: [1, 2, 2] },
    { name: 'Marco Bianchi', phone: '+39 339 551 0923', email: 'marco.b@example.it', perMonth: 7, from: 176, to: 0, burgers: { doppio: 6, fattoria: 2, contadino: 1 }, drinks: { birra: 5, bibita: 1 }, side: 0.9, dessert: 0.1, party: [1, 1, 2] },
    { name: 'Francesca Esposito', phone: '+39 328 774 1206', email: 'f.esposito@example.it', perMonth: 2.5, from: 170, to: 4, burgers: { orto: 6, boscaiolo: 1 }, drinks: { acqua: 3, shake: 1 }, side: 0.5, dessert: 0.55, party: [1, 2] },
    { name: 'Luca Romano', phone: '+39 346 902 3381', email: 'luca.romano@example.it', perMonth: 3, from: 165, to: 2, burgers: { pollo: 5, contadino: 2, orto: 1 }, drinks: { shake: 3, bibita: 2 }, side: 0.95, dessert: 0.4, party: [2, 3, 4] },
    { name: 'Chiara Colombo', phone: '+39 333 118 7765', email: 'chiara.colombo@example.it', perMonth: 1.6, from: 160, to: 9, burgers: { fattoria: 4, contadino: 2 }, drinks: { birra: 1, acqua: 2 }, side: 0.6, dessert: 0.2, party: [1, 2] },
    { name: 'Alessandro Ricci', phone: '+39 340 667 2094', email: 'a.ricci@example.it', perMonth: 4, from: 172, to: 58, burgers: { contadino: 4, doppio: 2 }, drinks: { birra: 2, bibita: 2 }, side: 0.85, dessert: 0.15, party: [1, 2] },
    { name: 'Sara Marino', phone: '+39 349 410 5538', email: 'sara.marino@example.it', perMonth: 2, from: 150, to: 3, burgers: { contadino: 3, pollo: 2 }, drinks: { bibita: 2, shake: 1 }, side: 0.7, dessert: 0.6, party: [1, 2, 3] },
    { name: 'Davide Greco', phone: '+39 335 209 8817', email: 'davide.greco@example.it', perMonth: 1.2, from: 120, to: 6, burgers: { boscaiolo: 2, fattoria: 2 }, drinks: { birra: 3 }, side: 0.6, dessert: 0.1, party: [1] },
    { name: 'Elena Bruno', phone: '+39 347 385 6620', email: 'elena.bruno@example.it', perMonth: 3.5, from: 13, to: 0, burgers: { orto: 2, pollo: 1 }, drinks: { acqua: 1, shake: 1 }, side: 0.6, dessert: 0.4, party: [1, 2] },
  ];

  function seed() {
    const rand = mulberry32(20250922);
    const now = Date.now();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const customers = [];
    const txns = [];
    let txSeq = 1;

    PROFILES.forEach((p, i) => {
      const id = `LHC-${10421 + i * 37}`;
      customers.push({ id, name: p.name, phone: p.phone, email: p.email, joined: today.getTime() - (p.from + 1) * DAY });
      let spend = 0;
      let balance = 0;
      for (let d = p.from; d >= p.to; d--) {
        if (rand() > p.perMonth / 30) continue;
        const dinner = rand() < 0.62;
        const minutes = dinner ? 19 * 60 + 10 + Math.floor(rand() * 200) : 12 * 60 + 10 + Math.floor(rand() * 140);
        const ts = today.getTime() - d * DAY + minutes * 60000;
        if (ts > now) continue;

        const people = p.party[Math.floor(rand() * p.party.length)];
        const cart = {};
        const add = (itemId) => { cart[itemId] = (cart[itemId] || 0) + 1; };
        for (let k = 0; k < people; k++) {
          add(pickWeighted(rand, p.burgers));
          if (rand() < p.side) add(pickWeighted(rand, { patatine: 6, dolci: 2, anelli: 2 }));
          if (rand() < 0.85) add(pickWeighted(rand, p.drinks));
          if (rand() < p.dessert) add(rand() < 0.65 ? 'tiramisu' : 'crostata');
        }
        const lines = Object.entries(cart).map(([itemId, qty]) => ({ itemId, qty }));

        // Spend points on the best affordable reward about half the time.
        const affordable = REWARDS.filter((r) => r.cost <= balance);
        if (affordable.length && rand() < 0.5) {
          const r = affordable[affordable.length - 1];
          lines.push({ itemId: r.item, qty: 1, rewardId: r.id });
        }

        const tx = buildTxn(`T${String(txSeq++).padStart(5, '0')}`, id, ts, lines, tierFor(spend));
        spend += tx.total;
        balance += tx.earned - tx.redeemed;
        txns.push(tx);
      }
    });

    txns.sort((a, b) => a.ts - b.ts);
    txns.forEach((t, i) => { t.id = `T${String(i + 1).padStart(5, '0')}`; });
    return { v: 1, customers, txns };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.v === 1 && Array.isArray(s.customers) && Array.isArray(s.txns)) return s;
      }
    } catch (e) { /* storage unavailable: fall back to seed */ }
    return seed();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* in-memory only */ }
  }

  let state = load();
  save();

  // ---------- Analytics ----------

  const customerById = (id) => state.customers.find((c) => c.id === id);

  function monthBuckets(n) {
    const out = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push({
        key: `${m.getFullYear()}-${m.getMonth()}`,
        label: m.toLocaleString('en-GB', { month: 'short' }),
        long: m.toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
        value: 0,
        visits: 0,
      });
    }
    return out;
  }
  const monthKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}`; };

  function statsFor(cid) {
    const c = customerById(cid);
    const tx = state.txns.filter((t) => t.customerId === cid).sort((a, b) => b.ts - a.ts);
    const items = {};
    const cats = Object.fromEntries(CATS.map((k) => [k, 0]));
    const months = monthBuckets(6);
    const mIndex = Object.fromEntries(months.map((m, i) => [m.key, i]));
    let spend = 0, earned = 0, redeemed = 0, units = 0, dinners = 0;

    for (const t of tx) {
      spend += t.total; earned += t.earned; redeemed += t.redeemed;
      if (new Date(t.ts).getHours() >= 17) dinners++;
      const mi = mIndex[monthKey(t.ts)];
      if (mi !== undefined) { months[mi].value += t.total; months[mi].visits++; }
      for (const l of t.lines) {
        const it = (items[l.itemId] ||= { id: l.itemId, qty: 0, rev: 0, free: 0 });
        it.qty += l.qty;
        it.rev += l.unit * l.qty;
        if (l.rewardId) it.free += l.qty;
        cats[ITEM[l.itemId].cat] += l.unit * l.qty;
        units += l.qty;
      }
    }
    const best = Object.values(items).sort((a, b) => b.qty - a.qty || b.rev - a.rev);
    const visits = tx.length;
    const last = tx[0]?.ts ?? null;
    const first = tx[visits - 1]?.ts ?? null;
    const gap = visits > 1 ? (last - first) / DAY / (visits - 1) : null;
    const tier = tierFor(spend);
    const s = {
      customer: c, tx, visits, spend, earned, redeemed, points: earned - redeemed, units,
      avg: visits ? Math.round(spend / visits) : 0, last, first, gap, best, cats, months,
      favorite: best.find((b) => ITEM[b.id].cat === 'Burger') || best[0] || null,
      tier, next: nextTierFor(spend), dinners,
      daysSince: last ? daysAgo(last) : null,
    };
    s.segment = segmentOf(s);
    return s;
  }

  function segmentOf(s) {
    const memberDays = (Date.now() - s.customer.joined) / DAY;
    if (s.visits && s.daysSince > 45) return { id: 'risk', label: 'At risk' };
    if (memberDays <= 30 || !s.visits) return { id: 'new', label: 'New' };
    const perMonth = s.visits / Math.max(1, memberDays / 30);
    if (s.spend >= 40000 || perMonth >= 4) return { id: 'vip', label: 'VIP' };
    return { id: 'regular', label: 'Regular' };
  }

  function globalStats() {
    const now = Date.now();
    const items = {};
    let rev30 = 0, revPrev = 0, tx30 = 0, revAll = 0;
    const active = new Set();
    for (const t of state.txns) {
      const age = now - t.ts;
      revAll += t.total;
      if (age <= 30 * DAY) { rev30 += t.total; tx30++; active.add(t.customerId); }
      else if (age <= 60 * DAY) revPrev += t.total;
      for (const l of t.lines) {
        const it = (items[l.itemId] ||= { id: l.itemId, qty: 0, rev: 0 });
        it.qty += l.qty; it.rev += l.unit * l.qty;
      }
    }
    const best = Object.values(items).sort((a, b) => b.qty - a.qty || b.rev - a.rev);
    const unitsAll = best.reduce((s, b) => s + b.qty, 0);
    return { rev30, revPrev, tx30, avg30: tx30 ? Math.round(rev30 / tx30) : 0, active: active.size, revAll, best, unitsAll };
  }

  // ---------- Rendering primitives ----------

  function qrSvg(text) {
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const m = 4; // quiet zone
    let d = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    }
    const size = n + m * 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR code for ${esc(text)}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#ffffff"/><path d="${d}" fill="#15200f"/></svg>`;
  }

  function niceMax(v) {
    if (v <= 0) return 1000;
    const step = 10 ** Math.floor(Math.log10(v));
    for (const k of [1, 2, 2.5, 5, 10]) if (k * step >= v) return k * step;
    return 10 * step;
  }
  const shortEur = (c) => `€${intFmt.format(Math.round(c / 100))}`;

  // Single-series monthly bar chart (values in cents).
  function barChart(data, ariaLabel) {
    const W = 360, H = 170, pl = 44, pr = 8, pt = 18, pb = 24;
    const iw = W - pl - pr, ih = H - pt - pb;
    const max = niceMax(Math.max(...data.map((d) => d.value), 1));
    const col = iw / data.length;
    const bw = Math.min(30, col * 0.56);
    const y = (v) => pt + ih - (v / max) * ih;
    const peak = data.reduce((bi, d, i) => (d.value > data[bi].value ? i : bi), 0);
    let g = '';
    for (const f of [0, 0.5, 1]) {
      const yy = y(max * f);
      g += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}"/><text x="${pl - 6}" y="${yy + 4}" text-anchor="end">${shortEur(max * f)}</text>`;
    }
    data.forEach((d, i) => {
      const x = pl + i * col + (col - bw) / 2;
      const h = (d.value / max) * ih;
      const top = pt + ih - h;
      const r = Math.min(4, h / 2, bw / 2);
      const tip = `${d.long}: ${money(d.value)} · ${d.visits} visit${d.visits === 1 ? '' : 's'}`;
      g += `<rect class="hit" x="${pl + i * col}" y="${pt}" width="${col}" height="${ih}" tabindex="0" data-tip="${esc(tip)}" aria-label="${esc(tip)}"/>`;
      g += h > 0
        ? `<path class="bar" d="M${x} ${pt + ih}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + bw - r}Q${x + bw} ${top} ${x + bw} ${top + r}V${pt + ih}Z"/>`
        : '<g></g>';
      if ((i === peak || i === data.length - 1) && d.value > 0) {
        g += `<text class="val" x="${x + bw / 2}" y="${top - 5}" text-anchor="middle">${shortEur(d.value)}</text>`;
      }
      g += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(d.label)}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ariaLabel)}">${g}</svg>`;
  }

  function rankList(rows, limit) {
    const top = rows.slice(0, limit);
    const max = Math.max(...top.map((r) => r.value), 1);
    return `<ol class="rank">${top.map((r, i) => `
      <li>
        <span class="rank-pos">${i + 1}</span>
        <span class="rank-name">${esc(r.label)}${r.sub ? ` <small>${esc(r.sub)}</small>` : ''}</span>
        <span class="rank-val">${r.display}</span>
        <span class="rank-track" aria-hidden="true"><span class="rank-fill" style="display:block;width:${Math.max(2, (r.value / max) * 100)}%"></span></span>
      </li>`).join('')}</ol>`;
  }

  function itemRows(best, totalUnits) {
    return best.map((b) => ({
      label: ITEM[b.id].name,
      sub: [ITEM[b.id].cat, b.free ? `${b.free} free` : ''].filter(Boolean).join(' · '),
      value: b.qty,
      display: `<b>${b.qty}</b>× · ${money(b.rev)} <small style="color:var(--muted)">(${pct(b.qty, totalUnits)}%)</small>`,
    }));
  }

  function receiptsHtml(tx, limit) {
    if (!tx.length) return '<p class="hint">No visits recorded yet.</p>';
    return `<div class="receipts">${tx.slice(0, limit).map((t) => {
      const summary = t.lines.map((l) => `${l.qty}× ${ITEM[l.itemId].name}`).join(', ');
      const pts = [`+${t.earned} pt`, t.redeemed ? `−${t.redeemed}` : ''].filter(Boolean).join(' ');
      return `<details>
        <summary>
          <span class="when">${dateFmt.format(t.ts)} · ${timeFmt.format(t.ts)}<small>${esc(summary)}</small></span>
          <span class="amt">${money(t.total)}</span>
          <span class="pts">${pts}</span>
        </summary>
        <div class="receipt-lines">
          ${t.lines.map((l) => `<span>${l.qty}×</span><span>${esc(ITEM[l.itemId].name)}${l.rewardId ? ` <span class="free">REWARD −${REWARD[l.rewardId].cost} pt</span>` : ''}</span><span>${money(l.unit * l.qty)}</span>`).join('')}
          <span></span><span>Receipt ${esc(t.id)} · tier ${esc(t.tier)}</span><span><b>${money(t.total)}</b></span>
        </div>
      </details>`;
    }).join('')}</div>`;
  }

  const tierBadge = (t) => `<span class="tier tier-${t.id}">${t.name}</span>`;
  const segPill = (s) => `<span class="pill seg-${s.id}">${s.label}</span>`;

  // ---------- UI state ----------

  const ui = {
    tab: 'card',
    cardCustomer: state.customers[0]?.id,
    tillCustomer: null,
    cart: [],
    crmSelected: state.customers[0]?.id,
    sort: { key: 'spend', dir: -1 },
    query: '',
    filter: '',
  };

  function setTab(tab) {
    ui.tab = tab;
    for (const t of ['card', 'till', 'crm']) {
      $(`#view-${t}`).hidden = t !== tab;
      $(`#tab-${t}`).setAttribute('aria-selected', String(t === tab));
    }
    if (tab !== 'till') stopScan();
    render();
  }

  function render() {
    if (ui.tab === 'card') renderCard();
    if (ui.tab === 'till') renderTill();
    if (ui.tab === 'crm') renderCrm();
  }

  // ---------- Customer card view ----------

  function renderCard() {
    const c = customerById(ui.cardCustomer) || state.customers[0];
    if (!c) { $('#view-card').innerHTML = '<p class="hint">No customers yet.</p>'; return; }
    ui.cardCustomer = c.id;
    const s = statsFor(c.id);
    const url = cardUrl(c.id);
    const nextReward = REWARDS.find((r) => r.cost > s.points);
    const first = c.name.split(' ')[0];
    const tierProgress = s.next
      ? `<p>${money(s.next.min - s.spend)} more to reach <b>${s.next.name}</b> (×${s.next.mult} points)</p>
         <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct(s.spend - s.tier.min, s.next.min - s.tier.min)}"><div style="width:${pct(s.spend - s.tier.min, s.next.min - s.tier.min)}%"></div></div>`
      : '<p>You are at the top tier, <b>Raccolto</b>: ×1.5 points on every euro.</p>';

    $('#view-card').innerHTML = `
      <div class="card-layout">
        <div>
          <label class="field-label" for="card-who">Showing the card of</label>
          <select class="input" id="card-who">
            ${state.customers.map((x) => `<option value="${esc(x.id)}" ${x.id === c.id ? 'selected' : ''}>${esc(x.name)} · ${esc(x.id)}</option>`).join('')}
          </select>
          <div class="wallet">
            <div class="wallet-top">
              <div class="wallet-brand">Hamburgheria<br>del Contadino<small>CARTA FEDELTÀ</small></div>
              <span class="wallet-tier">${s.tier.name}</span>
            </div>
            <div class="wallet-points"><b class="num">${intFmt.format(s.points)}</b><span>points</span></div>
            <div class="wallet-qr">${qrSvg(url)}</div>
            <div class="wallet-foot">
              <div><div class="wallet-name">${esc(c.name)}</div><div class="wallet-id">${esc(c.id)}</div></div>
              <div class="wallet-since">Member since<br>${dateFmt.format(c.joined)}</div>
            </div>
          </div>
          <div class="url-row">
            <code>${esc(url)}</code>
            <button class="btn" data-action="copy" data-text="${esc(url)}" data-what="Card link">Copy</button>
          </div>
          <p class="hint" style="margin-top:8px">Show this code at the till. It holds the fidelity link plus the card number, which staff scan to find you.</p>
        </div>

        <div class="stack">
          <div>
            <h1 class="hello">Ciao ${esc(first)}!</h1>
            <p class="hint" style="margin-top:6px">${s.last ? `Last visit ${relDay(s.last)}.` : 'Welcome! Your first burger is on the way.'} You earn ${s.tier.mult} point${s.tier.mult === 1 ? '' : 's'} per euro.</p>
          </div>
          <div class="stat-grid">
            <div class="stat"><div class="stat-label">Spent with us</div><div class="stat-value">${money(s.spend)}</div></div>
            <div class="stat"><div class="stat-label">Visits</div><div class="stat-value">${s.visits}</div><div class="stat-sub">avg ${money(s.avg)}</div></div>
            <div class="stat"><div class="stat-label">Your usual</div><div class="stat-value" style="font-size:1rem">${s.favorite ? esc(ITEM[s.favorite.id].name) : '—'}</div><div class="stat-sub">${s.favorite ? `ordered ${s.favorite.qty}×` : ''}</div></div>
          </div>

          <div class="panel">
            <h3>Rewards</h3>
            <ul class="rewards">
              ${REWARDS.map((r) => `<li class="${s.points >= r.cost ? 'ready' : ''}"><span>${esc(r.label)}</span><span class="cost">${s.points >= r.cost ? 'Ready · ' : ''}${r.cost} pt</span></li>`).join('')}
            </ul>
            <p class="hint" style="margin-top:10px">${nextReward ? `${nextReward.cost - s.points} points to go for “${esc(nextReward.label)}”.` : 'Every reward is unlocked. Ask at the till to redeem.'}</p>
          </div>

          <div class="panel">
            <h3>Tier · ${s.tier.name}</h3>
            <div class="stack" style="gap:8px">${tierProgress}</div>
          </div>

          <div class="panel">
            <h3>Recent visits</h3>
            ${receiptsHtml(s.tx, 5)}
          </div>
        </div>
      </div>`;
  }

  // ---------- Till view ----------

  function renderTill() {
    const c = ui.tillCustomer && customerById(ui.tillCustomer);
    const s = c ? statsFor(c.id) : null;

    $('#till-ident').innerHTML = c ? `
      <div class="cust-chip">
        <span class="nm">${esc(c.name)}</span>
        <span class="meta">${esc(c.id)} · ${s.tier.name} ×${s.tier.mult}</span>
        <span class="meta">${intFmt.format(s.points)} pt · ${s.visits} visits · ${money(s.spend)}</span>
        <span class="meta">Usual: ${s.favorite ? esc(ITEM[s.favorite.id].name) : '—'}</span>
        <button class="btn" data-action="till-clear">Change customer</button>
      </div>` : `
      <div class="stack" style="gap:10px">
        <button class="btn primary" data-action="scan-start">Scan QR with camera</button>
        <span class="btn file-btn">Upload QR photo<input type="file" id="qr-file" accept="image/*" aria-label="Upload a photo of the QR code"></span>
        <form id="find-form" class="stack" style="gap:6px">
          <label class="field-label" for="find-input">Card number, phone or name</label>
          <div class="row" style="flex-wrap:nowrap"><input class="input" id="find-input" placeholder="LHC-10421"><button class="btn" type="submit">Find</button></div>
        </form>
        <div>
          <span class="field-label">Quick pick</span>
          <div class="row">${state.customers.slice(0, 6).map((x) => `<button class="btn" data-action="till-pick" data-id="${esc(x.id)}">${esc(x.name.split(' ')[0])}</button>`).join('')}</div>
        </div>
      </div>`;

    const g = globalStats();
    const soldQty = Object.fromEntries(g.best.map((b) => [b.id, b.qty]));
    $('#till-menu').innerHTML = CATS.map((cat) => `
      <div class="menu-cat">
        <h3>${cat === 'Burger' ? 'Burgers' : cat + 's'}</h3>
        <div class="menu-grid">
          ${MENU.filter((m) => m.cat === cat).map((m) => `
            <button class="menu-item" data-action="add" data-item="${m.id}">
              <span class="nm">${esc(m.name)}</span>
              <span class="sold">${intFmt.format(soldQty[m.id] || 0)} sold</span>
              <span class="pr">${money(m.price)}</span>
            </button>`).join('')}
        </div>
      </div>`).join('');

    renderTicket(s);
  }

  function cartTotals(s) {
    const paid = ui.cart.reduce((sum, l) => sum + (l.rewardId ? 0 : ITEM[l.itemId].price * l.qty), 0);
    const spent = ui.cart.reduce((sum, l) => sum + (l.rewardId ? REWARD[l.rewardId].cost * l.qty : 0), 0);
    const earn = s ? pointsFor(paid, s.tier) : 0;
    return { paid, spent, earn };
  }

  function renderTicket(s) {
    const t = cartTotals(s);
    const available = s ? s.points - t.spent : 0;
    const lines = ui.cart.length ? `<ul class="ticket-lines">${ui.cart.map((l, i) => `
        <li>
          <span>${esc(ITEM[l.itemId].name)}${l.rewardId ? '<br><span class="free">REWARD</span>' : ''}</span>
          <span class="qty">
            <button data-action="dec" data-idx="${i}" aria-label="Remove one ${esc(ITEM[l.itemId].name)}">−</button>
            <span>${l.qty}</span>
            <button data-action="inc" data-idx="${i}" aria-label="Add one ${esc(ITEM[l.itemId].name)}" ${l.rewardId && available < REWARD[l.rewardId].cost ? 'disabled' : ''}>+</button>
          </span>
          <span class="num">${money(l.rewardId ? 0 : ITEM[l.itemId].price * l.qty)}</span>
        </li>`).join('')}</ul>`
      : '<div class="ticket-empty">Tap menu items to start an order</div>';

    const redeem = s ? `<div class="redeem">
        <span class="field-label">Redeem points · ${intFmt.format(available)} available</span>
        ${REWARDS.map((r) => `<button class="btn" data-action="redeem" data-reward="${r.id}" ${available < r.cost ? 'disabled' : ''}><span>${esc(r.label)}</span><span class="cost">${r.cost} pt</span></button>`).join('')}
      </div>` : '';

    $('#till-ticket').innerHTML = `
      ${lines}
      ${redeem}
      <div class="totals">
        <div class="grand"><span>Total</span><span>${money(t.paid)}</span></div>
        ${s ? `<div class="earn"><span>Points earned (×${s.tier.mult})</span><span>+${t.earn}</span></div>` : ''}
        ${t.spent ? `<div class="spend-pts"><span>Points redeemed</span><span>−${t.spent}</span></div>` : ''}
      </div>
      <button class="btn primary big" data-action="checkout" ${s && ui.cart.length ? '' : 'disabled'}>
        ${s ? `Record sale · ${money(t.paid)}` : 'Identify a customer first'}
      </button>
      ${ui.cart.length ? '<div class="row" style="justify-content:center;margin-top:8px"><button class="linkish" data-action="cart-clear">Clear ticket</button></div>' : ''}`;
  }

  function addToCart(itemId, rewardId) {
    const found = ui.cart.find((l) => l.itemId === itemId && (l.rewardId || null) === (rewardId || null));
    if (found) found.qty++;
    else ui.cart.push(rewardId ? { itemId, qty: 1, rewardId } : { itemId, qty: 1 });
  }

  function checkout() {
    const c = customerById(ui.tillCustomer);
    if (!c || !ui.cart.length) return;
    const s = statsFor(c.id);
    const t = cartTotals(s);
    if (t.spent > s.points) { toast('Not enough points for those rewards.'); return; }
    const id = `T${String(state.txns.length + 1).padStart(5, '0')}`;
    const tx = buildTxn(id, c.id, Date.now(), ui.cart, s.tier);
    state.txns.push(tx);
    save();
    ui.cart = [];
    const after = statsFor(c.id);
    const up = after.tier.id !== s.tier.id ? ` Now ${after.tier.name}!` : '';
    toast(`Recorded ${money(tx.total)} for ${c.name.split(' ')[0]} · +${tx.earned} pt${tx.redeemed ? `, −${tx.redeemed} pt` : ''}.${up}`);
    renderTill();
  }

  // ---------- QR scanning ----------

  let scanStream = null;
  let scanRaf = 0;
  const scanCanvas = document.createElement('canvas');
  const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });

  function scanMsg(text, kind) {
    const el = $('#scan-msg');
    el.hidden = !text;
    el.textContent = text || '';
    el.className = `scan-msg${kind ? ` ${kind}` : ''}`;
  }

  function cardIdFrom(text) {
    const m = /LHC-?(\d{4,6})/i.exec(String(text));
    return m ? `LHC-${m[1]}` : null;
  }

  function identify(text, source) {
    const id = cardIdFrom(text);
    const c = id && customerById(id);
    if (!c) {
      scanMsg(id ? `Card ${id} is not registered. Enrol the customer in the CRM tab.` : `That ${source} holds no Hamburgheria del Contadino card.`, 'err');
      return false;
    }
    ui.tillCustomer = c.id;
    scanMsg(`${c.name} identified from ${source}.`, 'ok');
    renderTill();
    return true;
  }

  function findCustomer(q) {
    q = q.trim().toLowerCase();
    if (!q) return null;
    const id = cardIdFrom(q);
    if (id && customerById(id)) return customerById(id);
    const digits = q.replace(/\D/g, '');
    return state.customers.find((c) =>
      c.name.toLowerCase().includes(q) ||
      (digits.length >= 4 && (c.phone || '').replace(/\D/g, '').includes(digits))) || null;
  }

  async function startScan() {
    if (!window.jsQR) { scanMsg('The QR reader failed to load. Type the card number instead.', 'err'); return; }
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch (e) {
      scanMsg('The camera is not available here. Upload a photo of the QR, or type the card number.', 'err');
      return;
    }
    const video = $('#scan-video');
    video.srcObject = scanStream;
    $('#scanner').hidden = false;
    scanMsg('Point the camera at the customer’s QR code…');
    await video.play().catch(() => {});
    const tick = () => {
      if (!scanStream) return;
      if (video.readyState >= 2 && video.videoWidth) {
        const w = Math.min(640, video.videoWidth);
        const h = Math.round((video.videoHeight / video.videoWidth) * w);
        scanCanvas.width = w; scanCanvas.height = h;
        scanCtx.drawImage(video, 0, 0, w, h);
        const code = window.jsQR(scanCtx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
          stopScan();
          identify(code.data, 'the camera');
          return;
        }
      }
      scanRaf = requestAnimationFrame(tick);
    };
    scanRaf = requestAnimationFrame(tick);
  }

  function stopScan() {
    cancelAnimationFrame(scanRaf);
    if (scanStream) scanStream.getTracks().forEach((t) => t.stop());
    scanStream = null;
    const s = $('#scanner');
    if (s) s.hidden = true;
  }

  function decodeFile(file) {
    if (!file) return;
    if (!window.jsQR) { scanMsg('The QR reader failed to load. Type the card number instead.', 'err'); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      scanCanvas.width = w; scanCanvas.height = h;
      scanCtx.fillStyle = '#fff';
      scanCtx.fillRect(0, 0, w, h);
      scanCtx.drawImage(img, 0, 0, w, h);
      const code = window.jsQR(scanCtx.getImageData(0, 0, w, h).data, w, h);
      if (code?.data) identify(code.data, 'the photo');
      else scanMsg('No QR code found in that image. Try a sharper, closer photo.', 'err');
    };
    img.onerror = () => { URL.revokeObjectURL(url); scanMsg('That file is not an image this browser can read.', 'err'); };
    img.src = url;
  }

  // ---------- CRM view ----------

  const COLUMNS = [
    { key: 'name', label: 'Customer', get: (s) => s.customer.name.toLowerCase() },
    { key: 'tier', label: 'Tier', get: (s) => s.spend },
    { key: 'segment', label: 'Segment', get: (s) => s.segment.label },
    { key: 'visits', label: 'Visits', r: true, get: (s) => s.visits },
    { key: 'spend', label: 'Spent', r: true, get: (s) => s.spend },
    { key: 'avg', label: 'Avg ticket', r: true, get: (s) => s.avg },
    { key: 'points', label: 'Points', r: true, get: (s) => s.points },
    { key: 'fav', label: 'Best item', get: (s) => (s.favorite ? ITEM[s.favorite.id].name : '') },
    { key: 'last', label: 'Last visit', get: (s) => s.last || 0 },
  ];

  function allStats() { return state.customers.map((c) => statsFor(c.id)); }

  function renderCrm() {
    const g = globalStats();
    const all = allStats();
    const delta = g.revPrev ? Math.round(((g.rev30 - g.revPrev) / g.revPrev) * 100) : null;
    const risk = all.filter((s) => s.segment.id === 'risk').length;
    const liability = all.reduce((sum, s) => sum + s.points, 0);
    $('#crm-kpis').innerHTML = `
      <div class="stat"><div class="stat-label">Revenue · last 30 days</div><div class="stat-value">${money(g.rev30)}</div>
        <div class="stat-sub">${delta === null ? 'no prior period' : `<span class="${delta >= 0 ? 'delta-up' : 'delta-down'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}%</span> vs previous 30 days`}</div></div>
      <div class="stat"><div class="stat-label">Visits · 30 days</div><div class="stat-value">${g.tx30}</div><div class="stat-sub">avg ticket ${money(g.avg30)}</div></div>
      <div class="stat"><div class="stat-label">Active card holders</div><div class="stat-value">${g.active} / ${state.customers.length}</div><div class="stat-sub">${risk ? `<span class="delta-down">${risk} at risk</span> (45+ days away)` : 'nobody at risk'}</div></div>
      <div class="stat"><div class="stat-label">Items sold · all time</div><div class="stat-value">${intFmt.format(g.unitsAll)}</div><div class="stat-sub">${money(g.revAll)} revenue</div></div>
      <div class="stat"><div class="stat-label">Points outstanding</div><div class="stat-value">${intFmt.format(liability)}</div><div class="stat-sub">unredeemed across all cards</div></div>`;

    renderCrmTable(all);
    $('#crm-top').innerHTML = rankList(itemRows(g.best, g.unitsAll), 8);
    renderCrmDetail();
  }

  function renderCrmTable(all = allStats()) {
    const q = ui.query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    const col = COLUMNS.find((c) => c.key === ui.sort.key) || COLUMNS[4];
    const rows = all
      .filter((s) => !ui.filter || s.segment.id === ui.filter)
      .filter((s) => !q || s.customer.name.toLowerCase().includes(q) || s.customer.id.toLowerCase().includes(q) ||
        (digits.length >= 3 && (s.customer.phone || '').replace(/\D/g, '').includes(digits)))
      .sort((a, b) => {
        const x = col.get(a), y = col.get(b);
        return (x < y ? -1 : x > y ? 1 : 0) * ui.sort.dir;
      });

    $('#crm-table').innerHTML = `<table>
      <thead><tr>${COLUMNS.map((c) => `<th class="${c.r ? 'r' : ''}" scope="col"><button data-action="sort" data-key="${c.key}" ${c.key === ui.sort.key ? `data-dir="${ui.sort.dir > 0 ? '↑' : '↓'}"` : ''}>${c.label}</button></th>`).join('')}</tr></thead>
      <tbody>${rows.map((s) => `
        <tr data-action="crm-select" data-id="${esc(s.customer.id)}" aria-selected="${s.customer.id === ui.crmSelected}" tabindex="0">
          <td class="name">${esc(s.customer.name)}<span class="cid">${esc(s.customer.id)}</span></td>
          <td>${tierBadge(s.tier)}</td>
          <td>${segPill(s.segment)}</td>
          <td class="r num">${s.visits}</td>
          <td class="r num"><b>${money(s.spend)}</b></td>
          <td class="r num">${money(s.avg)}</td>
          <td class="r num">${intFmt.format(s.points)}</td>
          <td>${s.favorite ? esc(ITEM[s.favorite.id].name) : '—'}</td>
          <td>${s.last ? relDay(s.last) : '—'}</td>
        </tr>`).join('') || `<tr><td colspan="${COLUMNS.length}" class="hint">No customers match.</td></tr>`}
      </tbody></table>`;
  }

  function renderCrmDetail() {
    const c = customerById(ui.crmSelected);
    const el = $('#crm-detail');
    if (!c) { el.innerHTML = '<p class="hint">Select a customer to see their profile.</p>'; return; }
    const s = statsFor(c.id);
    const catTotal = Object.values(s.cats).reduce((a, b) => a + b, 0);
    const catRows = CATS.map((k) => ({ label: k, value: s.cats[k], display: `${money(s.cats[k])} <small style="color:var(--muted)">(${pct(s.cats[k], catTotal)}%)</small>` }))
      .sort((a, b) => b.value - a.value);
    const lunch = s.visits - s.dinners;

    el.innerHTML = `
      <div class="detail-head">
        <div>
          <div class="who">${esc(c.name)}</div>
          <div class="contact"><span class="mono">${esc(c.id)}</span> · ${esc(c.phone || 'no phone')} · ${esc(c.email || 'no email')}</div>
          <div class="contact">Member since ${dateFmt.format(c.joined)}</div>
        </div>
        <div class="row">${tierBadge(s.tier)} ${segPill(s.segment)}</div>
      </div>

      <section style="margin-top:16px">
        <div class="stat-grid">
          <div class="stat"><div class="stat-label">Total spent</div><div class="stat-value">${money(s.spend)}</div></div>
          <div class="stat"><div class="stat-label">Visits</div><div class="stat-value">${s.visits}</div><div class="stat-sub">${s.gap ? `every ${s.gap.toFixed(1)} days` : '—'}</div></div>
          <div class="stat"><div class="stat-label">Avg ticket</div><div class="stat-value">${money(s.avg)}</div></div>
          <div class="stat"><div class="stat-label">Items bought</div><div class="stat-value">${intFmt.format(s.units)}</div><div class="stat-sub">${s.visits ? (s.units / s.visits).toFixed(1) : 0} per visit</div></div>
          <div class="stat"><div class="stat-label">Points</div><div class="stat-value">${intFmt.format(s.points)}</div><div class="stat-sub">${s.earned} earned · ${s.redeemed} used</div></div>
          <div class="stat"><div class="stat-label">Last visit</div><div class="stat-value" style="font-size:1rem">${s.last ? relDay(s.last) : '—'}</div><div class="stat-sub">${s.visits ? `${pct(s.dinners, s.visits)}% dinner · ${pct(lunch, s.visits)}% lunch` : ''}</div></div>
        </div>
      </section>

      <section>
        <h3>Spend per month <span>last 6 months</span></h3>
        ${barChart(s.months, `Monthly spend for ${c.name}`)}
      </section>

      <section>
        <h3>Best items <span>by quantity</span></h3>
        ${s.best.length ? rankList(itemRows(s.best, s.units), 6) : '<p class="hint">Nothing bought yet.</p>'}
      </section>

      <section>
        <h3>Spend by category</h3>
        ${catTotal ? rankList(catRows, 4) : '<p class="hint">Nothing bought yet.</p>'}
      </section>

      <section>
        <h3>Visit history <span>${s.visits} receipts</span></h3>
        ${receiptsHtml(s.tx, 8)}
      </section>

      <section class="row">
        <button class="btn primary" data-action="till-pick" data-id="${esc(c.id)}">Start sale</button>
        <button class="btn" data-action="card-open" data-id="${esc(c.id)}">Open card</button>
        <button class="btn" data-action="csv-history" data-id="${esc(c.id)}">Copy history CSV</button>
      </section>`;
  }

  // ---------- CSV ----------

  const csvCell = (v) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n');
  const euros = (c) => (c / 100).toFixed(2);
  const iso = (ts) => new Date(ts).toISOString();

  function customersCsv() {
    return toCsv([
      ['card', 'name', 'phone', 'email', 'member_since', 'tier', 'segment', 'visits', 'total_spent_eur', 'avg_ticket_eur', 'items_bought', 'points_balance', 'points_earned', 'points_redeemed', 'best_item', 'best_item_qty', 'last_visit'],
      ...allStats().map((s) => [s.customer.id, s.customer.name, s.customer.phone, s.customer.email, iso(s.customer.joined), s.tier.name, s.segment.label, s.visits,
        euros(s.spend), euros(s.avg), s.units, s.points, s.earned, s.redeemed, s.favorite ? ITEM[s.favorite.id].name : '', s.favorite ? s.favorite.qty : '', s.last ? iso(s.last) : '']),
    ]);
  }
  function historyCsv(cid) {
    const rows = [['receipt', 'card', 'datetime', 'item', 'category', 'qty', 'unit_eur', 'line_eur', 'reward', 'points_earned_receipt', 'points_redeemed_receipt']];
    for (const t of statsFor(cid).tx) {
      for (const l of t.lines) {
        rows.push([t.id, t.customerId, iso(t.ts), ITEM[l.itemId].name, ITEM[l.itemId].cat, l.qty, euros(l.unit), euros(l.unit * l.qty), l.rewardId || '', t.earned, t.redeemed]);
      }
    }
    return toCsv(rows);
  }

  // ---------- Feedback ----------

  let toastTimer = 0;
  function toast(text) {
    const el = $('#toast');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3600);
  }

  function copyText(text, what) {
    const fallback = () => {
      $('#modal-text').value = text;
      $('#modal').hidden = false;
      $('#modal-text').select();
    };
    try {
      navigator.clipboard.writeText(text).then(() => toast(`${what} copied.`), fallback);
    } catch (e) { fallback(); }
  }

  // ---------- Events ----------

  let resetArmed = false;

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const a = el.dataset.action;
    const id = el.dataset.id;

    if (a === 'tab') setTab(el.dataset.tab);
    else if (a === 'card-open') { ui.cardCustomer = id; setTab('card'); }
    else if (a === 'till-pick') { ui.tillCustomer = id; scanMsg(''); if (ui.tab !== 'till') setTab('till'); else renderTill(); }
    else if (a === 'till-clear') { ui.tillCustomer = null; ui.cart = ui.cart.filter((l) => !l.rewardId); scanMsg(''); renderTill(); }
    else if (a === 'add') { addToCart(el.dataset.item); renderTicket(ui.tillCustomer ? statsFor(ui.tillCustomer) : null); }
    else if (a === 'redeem') { addToCart(REWARD[el.dataset.reward].item, el.dataset.reward); renderTicket(statsFor(ui.tillCustomer)); }
    else if (a === 'inc' || a === 'dec') {
      const l = ui.cart[Number(el.dataset.idx)];
      if (l) { l.qty += a === 'inc' ? 1 : -1; if (l.qty <= 0) ui.cart.splice(Number(el.dataset.idx), 1); }
      renderTicket(ui.tillCustomer ? statsFor(ui.tillCustomer) : null);
    }
    else if (a === 'cart-clear') { ui.cart = []; renderTicket(ui.tillCustomer ? statsFor(ui.tillCustomer) : null); }
    else if (a === 'checkout') checkout();
    else if (a === 'scan-start') startScan();
    else if (a === 'scan-stop') { stopScan(); scanMsg(''); }
    else if (a === 'crm-select') { ui.crmSelected = id; renderCrmTable(); renderCrmDetail(); }
    else if (a === 'sort') {
      const key = el.dataset.key;
      ui.sort = ui.sort.key === key ? { key, dir: -ui.sort.dir } : { key, dir: ['name', 'segment', 'fav'].includes(key) ? 1 : -1 };
      renderCrmTable();
    }
    else if (a === 'copy') copyText(el.dataset.text, el.dataset.what || 'Text');
    else if (a === 'csv-customers') copyText(customersCsv(), 'Customer CSV');
    else if (a === 'csv-history') copyText(historyCsv(id), 'History CSV');
    else if (a === 'modal-close') $('#modal').hidden = true;
    else if (a === 'reset') {
      if (!resetArmed) {
        resetArmed = true;
        el.textContent = 'Click again to erase recorded sales and restore the demo';
        setTimeout(() => { resetArmed = false; el.textContent = 'Reset demo data'; }, 4000);
        return;
      }
      resetArmed = false;
      el.textContent = 'Reset demo data';
      state = seed();
      save();
      Object.assign(ui, { cardCustomer: state.customers[0].id, crmSelected: state.customers[0].id, tillCustomer: null, cart: [] });
      toast('Demo data restored.');
      render();
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-action]')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'Escape') $('#modal').hidden = true;
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'card-who') { ui.cardCustomer = e.target.value; renderCard(); }
    if (e.target.id === 'qr-file') { decodeFile(e.target.files[0]); e.target.value = ''; }
    if (e.target.id === 'crm-filter') { ui.filter = e.target.value; renderCrmTable(); }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'crm-search') { ui.query = e.target.value; renderCrmTable(); }
  });

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.id === 'find-form') {
      const q = $('#find-input').value;
      const c = findCustomer(q);
      if (c) { ui.tillCustomer = c.id; scanMsg(`${c.name} found.`, 'ok'); renderTill(); }
      else scanMsg(`No card matches “${q}”. Check the number or enrol them in the CRM tab.`, 'err');
    }
    if (e.target.id === 'enroll-form') {
      const name = $('#en-name').value.trim();
      if (!name) return;
      const maxNum = Math.max(10400, ...state.customers.map((c) => Number(c.id.slice(4)) || 0));
      const c = { id: `LHC-${maxNum + 1}`, name, phone: $('#en-phone').value.trim(), email: $('#en-email').value.trim(), joined: Date.now() };
      state.customers.push(c);
      save();
      e.target.reset();
      ui.crmSelected = c.id;
      toast(`Card ${c.id} created for ${name}.`);
      renderCrm();
    }
  });

  // Chart tooltips
  const tip = $('#tip');
  const showTip = (el, x, y) => {
    tip.textContent = el.dataset.tip;
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    tip.style.left = `${Math.max(8, Math.min(window.innerWidth - r.width - 8, x - r.width / 2))}px`;
    tip.style.top = `${Math.max(8, y - r.height - 12)}px`;
  };
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest?.('[data-tip]');
    if (el) showTip(el, e.clientX, e.clientY); else tip.hidden = true;
  });
  document.addEventListener('focusin', (e) => {
    if (e.target.dataset?.tip) { const r = e.target.getBoundingClientRect(); showTip(e.target, r.left + r.width / 2, r.top + 20); }
  });
  document.addEventListener('focusout', () => { tip.hidden = true; });

  // ---------- Boot ----------

  // Deep links: ?card=LHC-10421 (the QR target), or #LHC-10421 / #till / #crm.
  const params = new URLSearchParams(location.search);
  const linked = cardIdFrom(params.get('card') || location.hash);
  const hashTab = location.hash.slice(1);
  if (linked && customerById(linked)) { ui.cardCustomer = linked; ui.crmSelected = linked; setTab('card'); }
  else if (['till', 'crm', 'card'].includes(hashTab)) setTab(hashTab);
  else setTab('card');
})();
