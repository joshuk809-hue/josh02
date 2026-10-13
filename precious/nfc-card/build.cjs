// Builds the NFC business card: print PDF (front + back, with 2mm bleed), PNG proofs and a mockup.
// Run from repo root: NODE_PATH=$(npm root -g) node precious/nfc-card/build.cjs
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')
const qrcode = require('../../vendor/qrcode.js')

const PHONE = '+39 371 578 0893'
const WA = 'https://wa.me/393715780893?text=' + encodeURIComponent('Ciao Precious! Vorrei più informazioni.')
const here = __dirname
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, '../brand', f)).toString('base64')

// QR as crisp SVG rects in gold
const q = qrcode(0, 'M'); q.addData(WA); q.make()
const n = q.getModuleCount()
let rects = ''
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) rects += `<rect x="${c}" y="${r}" width="1.02" height="1.02"/>`
const qr = `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" class="qr"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" rx="2" fill="#F2DBA6"/><g fill="#0A0806">${rects}</g></svg>`

// Contactless mark (same as the payment symbol family, drawn as arcs)
const nfc = `<svg viewBox="0 0 24 24" class="nfc" fill="none" stroke="url(#g)" stroke-width="1.6" stroke-linecap="round">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2DBA6"/><stop offset="1" stop-color="#A9772E"/></linearGradient></defs>
  <path d="M6.5 8.5a6 6 0 0 1 0 7"/><path d="M10 6a10 10 0 0 1 0 12"/><path d="M13.5 3.5a14 14 0 0 1 0 17"/></svg>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Kanit:wght@300;400&display=swap" rel="stylesheet">
<style>
  @page { size: 89.6mm 58mm; margin: 0 }
  * { margin: 0; padding: 0; box-sizing: border-box }
  body { background: #030203 }
  .face { width: 89.6mm; height: 58mm; position: relative; overflow: hidden; background: #030203; page-break-after: always;
          font-family: Kanit, sans-serif; color: #E9D6B0 }
  /* faint warm glow so the black reads as soft-touch, not flat */
  .face::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 70% 80% at 50% 45%, rgba(212,168,87,.10), transparent 70%) }
  .front img { position: absolute; left: 50%; top: 50%; width: 56mm; transform: translate(-50%, -50%);
               -webkit-mask: radial-gradient(circle at 50% 50%, #000 58%, transparent 71%); mask: radial-gradient(circle at 50% 50%, #000 58%, transparent 71%) }
  .gold { background: linear-gradient(180deg, #F2DBA6 0%, #C99A4E 55%, #8A6224 100%); -webkit-background-clip: text; background-clip: text; color: transparent }
  .back .inner { position: absolute; inset: 5mm; display: flex; align-items: center; gap: 5mm } /* 2mm bleed + 3mm safe zone */
  .back .left { flex: 1; display: flex; flex-direction: column; gap: 1.8mm }
  .back .disc { width: 13mm; height: 13mm; border-radius: 50%; box-shadow: 0 0 0 .25mm rgba(242,219,166,.45) }
  .back h1 { font-family: Cinzel, serif; font-weight: 600; font-size: 13pt; letter-spacing: .6pt; line-height: 1 }
  .back .role { font-size: 5.6pt; letter-spacing: 1.6pt; text-transform: uppercase; color: rgba(233,214,176,.75) }
  .back .rule { width: 18mm; height: .25mm; background: linear-gradient(90deg, #C99A4E, transparent) }
  .back .phone { font-size: 9pt; letter-spacing: .6pt; font-weight: 400 }
  .back .addr { font-size: 5.6pt; letter-spacing: .5pt; color: rgba(233,214,176,.8) }
  .back .svc { font-size: 5pt; letter-spacing: .8pt; white-space: nowrap; text-transform: uppercase; color: rgba(233,214,176,.6) }
  .back .right { width: 24mm; display: flex; flex-direction: column; align-items: center; gap: 1.6mm }
  .qr { width: 21mm; height: 21mm }
  .tap { display: flex; align-items: center; gap: 1.2mm; font-size: 5.2pt; letter-spacing: 1.1pt; text-transform: uppercase; color: rgba(233,214,176,.85); white-space: nowrap }
  .nfc { width: 4.2mm; height: 4.2mm }
  .guides .face::after { content: ''; position: absolute; inset: 2mm; outline: .2mm dashed rgba(255,80,80,.8); z-index: 9 } /* trim line */
</style></head><body>
<section class="face front"><img src="${img('logo-extended-original.jpg')}" alt=""></section>
<section class="face back"><div class="inner">
  <div class="left">
    <img class="disc" src="${img('logo-compact-original.jpg')}" alt="">
    <h1 class="gold">PRECIOUS BEAUTY</h1>
    <p class="role">Hair Salon · African Braider</p>
    <div class="rule"></div>
    <p class="phone gold">${PHONE}</p>
    <p class="addr">Via Paleocapa 8/B · 24122 Bergamo</p>
    <p class="svc">Braids · Cornrows · Locs · Cuts · Lashes</p>
  </div>
  <div class="right">${qr}<p class="tap">${nfc} Tap or scan</p></div>
</div></section>
</body></html>`

;(async () => {
  fs.writeFileSync(path.join(here, 'card.html'), html)
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
  const p = await b.newPage()
  await p.goto('file://' + path.join(here, 'card.html')); await p.waitForTimeout(1500)
  await p.pdf({ path: path.join(here, 'precious-nfc-card-print.pdf'), width: '89.6mm', height: '58mm', printBackground: true, preferCSSPageSize: true })

  // 600 dpi proofs, with trim guides
  const scale = 600 / 96
  const proof = await b.newPage({ deviceScaleFactor: scale, viewport: { width: 339, height: 220 } })
  await proof.goto('file://' + path.join(here, 'card.html')); await proof.waitForTimeout(1500)
  for (const [i, name] of [[0, 'front'], [1, 'back']]) await proof.locator('.face').nth(i).screenshot({ path: path.join(here, `card-${name}.png`) })

  // Mockup: both sides as real cards (trimmed, rounded corners) floating with a light sweep
  const fr = fs.readFileSync(path.join(here, 'card-front.png')).toString('base64')
  const bk = fs.readFileSync(path.join(here, 'card-back.png')).toString('base64')
  const mock = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 })
  await mock.setContent(`<style>
    body{margin:0;height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#2a2218,#0b0907 70%);perspective:1600px}
    .wrap{display:flex;gap:90px}
    .c{width:540px;height:340px;border-radius:22px;overflow:hidden;position:relative;box-shadow:0 40px 80px rgba(0,0,0,.6),0 0 0 1px rgba(242,219,166,.12)}
    .c img{position:absolute;width:565px;left:-12.5px;top:-12.5px}
    .c:nth-child(1){transform:rotateY(14deg) rotateX(6deg) rotateZ(-3deg)}
    .c:nth-child(2){transform:rotateY(-14deg) rotateX(6deg) rotateZ(3deg)}
    .c::after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,240,210,.16) 48%,transparent 60%)}
  </style><div class="wrap"><div class="c"><img src="data:image/png;base64,${fr}"></div><div class="c"><img src="data:image/png;base64,${bk}"></div></div>`)
  await mock.waitForTimeout(500)
  await mock.screenshot({ path: path.join(here, 'card-mockup.png') })
  await b.close()
  console.log('built: precious-nfc-card-print.pdf, card-front.png, card-back.png, card-mockup.png')
})()
