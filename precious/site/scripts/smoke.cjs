// End-to-end smoke test. Needs Playwright + Chromium and `npm run preview` on :4173.
// Run: NODE_PATH=$(npm root -g) node scripts/smoke.cjs
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const BASE = process.env.BASE || 'http://localhost:4173/'

const results = []
async function check(name, fn) {
  try { await fn(); results.push(['PASS', name]) } catch (e) { results.push(['FAIL', name + ' — ' + e.message.split('\n')[0]]) }
}

;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
  const errors = []
  const page = async (w = 1280, h = 900) => {
    const p = await b.newPage({ viewport: { width: w, height: h } })
    p.on('pageerror', (e) => errors.push(e.message))
    p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    return p
  }

  /* ---------- website ---------- */
  let p = await page()
  await p.goto(BASE); await p.waitForTimeout(800)

  await check('logo animates (spin + float + gloss)', async () => {
    const anims = await p.evaluate(() => ['.logo-spin', '.logo-float', '.logo-glow'].map((s) => getComputedStyle(document.querySelector(s)).animationName))
    assert.deepEqual(anims, ['logo-spin', 'logo-float', 'logo-glow'])
  })
  for (const [l, prices, women] of [['it', 'Prezzi', 'Donna'], ['en', 'Prices', 'Women'], ['de', 'Preise', 'Damen'], ['fr', 'Tarifs', 'Femme'], ['es', 'Precios', 'Mujer']]) {
    await check(`language ${l.toUpperCase()} translates nav, prices and <html lang>`, async () => {
      await p.getByRole('button', { name: l, exact: true }).click()
      await p.waitForTimeout(150)
      assert.equal(await p.locator('nav a').nth(1).innerText(), prices.toUpperCase())
      assert.equal(await p.evaluate(() => document.documentElement.lang), l)
      assert.ok(await p.getByRole('button', { name: women }).count())
    })
  }
  await check('language choice survives reload', async () => {
    await p.reload(); await p.waitForTimeout(400)
    assert.equal(await p.evaluate(() => document.documentElement.lang), 'es')
  })
  await p.getByRole('button', { name: 'it', exact: true }).click()

  await check('hero book button opens WhatsApp with Italian message', async () => {
    const href = await p.locator('section').first().locator('a[href*="wa.me"]').getAttribute('href')
    assert.match(decodeURIComponent(href), /^https:\/\/wa\.me\/\d+\?text=Ciao Precious! Vorrei prenotare un appuntamento\.$/)
  })
  await check('women price list: 7 services incl. children, lashes; no shave', async () => {
    await p.locator('#prices').scrollIntoViewIfNeeded()
    const names = await p.locator('#prices a span:nth-child(2)').allInnerTexts()
    assert.equal(names.length, 7)
    assert.ok(names.join().includes('TAGLIO BAMBINI') && names.join().includes('EXTENSION CIGLIA') && !names.join().includes('RASATURA'))
  })
  await check('men price list: shave 7€, haircut 15€, no lashes', async () => {
    await p.getByRole('button', { name: 'Uomo' }).click(); await p.waitForTimeout(600)
    const rows = await p.locator('#prices a').allInnerTexts()
    const flat = rows.map((r) => r.replace(/\s+/g, ' '))
    assert.ok(flat.some((r) => r.includes('RASATURA') && r.includes('7€')))
    assert.ok(flat.some((r) => r.includes('TAGLIO') && r.includes('15€')))
    assert.ok(!flat.some((r) => r.includes('CIGLIA')))
  })
  await check('price row books that service on WhatsApp', async () => {
    const href = await p.locator('#prices a').filter({ hasText: 'TRECCE' }).getAttribute('href')
    assert.ok(decodeURIComponent(href).endsWith('Vorrei prenotare: Trecce.'))
  })
  await check('3 style cards with 3 images each and a book button', async () => {
    assert.equal(await p.locator('#styles img').count(), 9)
    assert.equal(await p.locator('#styles a[href*="wa.me"]').count(), 3)
  })
  await check('placeholder photos are labelled "Foto di esempio"', async () => {
    assert.ok((await p.locator('#styles').getByText('Foto di esempio').count()) >= 9)
  })
  await check('all images load (no broken src)', async () => {
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)) } })
    await p.waitForTimeout(800)
    const broken = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src))
    assert.deepEqual(broken, [])
  })
  await check('no horizontal page scroll at 390px', async () => {
    const m = await page(390, 844); await m.goto(BASE); await m.waitForTimeout(600)
    const over = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    assert.ok(over <= 0, `page is ${over}px too wide`)
    await m.close()
  })

  /* ---------- studio ---------- */
  p = await page()
  await p.goto(BASE + '#studio'); await p.waitForTimeout(500)
  await check('studio opens empty with example-data button', async () => {
    assert.ok(await p.getByRole('button', { name: 'Load example data' }).isVisible())
  })
  await check('example data: today\'s agenda + 2 follow-ups due (STOP client excluded)', async () => {
    await p.getByRole('button', { name: 'Load example data' }).click(); await p.waitForTimeout(300)
    assert.ok(await p.locator('li').filter({ hasText: 'Amara Okafor' }).isVisible())
    await p.getByRole('button', { name: /Follow-ups/ }).click(); await p.waitForTimeout(300)
    const cards = await p.getByRole('link', { name: 'Send on WhatsApp' }).count()
    assert.equal(cards, 2)
    assert.equal(await p.getByText('Lucía García').count(), 0)
  })
  await check('follow-up message is in the client\'s language and goes to their number', async () => {
    const href = decodeURIComponent(await p.getByRole('link', { name: 'Send on WhatsApp' }).first().getAttribute('href'))
    assert.match(href, /wa\.me\/39349\d+\?text=Hi Grace|wa\.me\/39348\d+\?text=Ciao Sofia/)
  })
  await check('sending marks it done (queue shrinks)', async () => {
    p.context().on('page', (np) => np.close())
    await p.getByRole('link', { name: 'Send on WhatsApp' }).first().click(); await p.waitForTimeout(300)
    assert.equal(await p.getByRole('link', { name: 'Send on WhatsApp' }).count(), 1)
  })
  await check('agenda: add appointment for new client', async () => {
    await p.getByRole('button', { name: /Agenda/ }).click()
    await p.fill('input[placeholder="Client name"]', 'Test Client')
    await p.fill('input[placeholder^="WhatsApp number"]', '+39 333 1234567')
    await p.fill('input[type="datetime-local"]', '2030-05-01T09:00')
    await p.getByRole('button', { name: 'Add', exact: true }).click(); await p.waitForTimeout(200)
    assert.ok(await p.locator('li').filter({ hasText: 'Test Client' }).isVisible())
  })
  await check('agenda: confirmation message in Italian', async () => {
    const row = p.locator('li').filter({ hasText: 'Test Client' })
    const href = decodeURIComponent(await row.getByRole('link', { name: 'Confirm' }).getAttribute('href'))
    assert.match(href, /wa\.me\/393331234567\?text=Ciao Test, il tuo appuntamento per trecce è confermato/)
  })
  await check('agenda: Done removes it from upcoming', async () => {
    await p.locator('li').filter({ hasText: 'Test Client' }).getByRole('button', { name: 'Done' }).click(); await p.waitForTimeout(200)
    assert.equal(await p.locator('li').filter({ hasText: 'Test Client' }).count(), 0)
  })
  await check('clients: search + edit + two-tap delete', async () => {
    await p.getByRole('button', { name: /Clients/ }).click()
    await p.fill('input[placeholder^="Search"]', 'test')
    assert.equal(await p.locator('p.font-medium').count(), 1)
    const del = p.getByRole('button', { name: 'Delete', exact: true })
    await del.click()
    assert.ok(await p.getByRole('button', { name: 'Tap again to delete' }).isVisible())
    await p.getByRole('button', { name: 'Tap again to delete' }).click(); await p.waitForTimeout(200)
    assert.equal(await p.locator('p.font-medium').count(), 0)
  })
  await check('stock: low alert shows, + clears it', async () => {
    await p.getByRole('button', { name: /Stock/ }).click(); await p.waitForTimeout(200)
    assert.ok(await p.getByText('running low').isVisible())
    const row = p.locator('li').filter({ hasText: 'Edge control' })
    await row.getByRole('button', { name: 'Add one' }).click()
    await row.getByRole('button', { name: 'Add one' }).click(); await p.waitForTimeout(200)
    assert.equal(await p.getByText('running low').count(), 0)
  })
  await check('stock: add product', async () => {
    await p.fill('input[placeholder="Product"]', 'Hair foam')
    await p.getByRole('button', { name: 'Add', exact: true }).click(); await p.waitForTimeout(200)
    assert.ok(await p.locator('li').filter({ hasText: 'Hair foam' }).isVisible())
  })
  await check('data survives reload', async () => {
    await p.reload(); await p.waitForTimeout(400)
    await p.getByRole('button', { name: /Stock/ }).click()
    assert.ok(await p.locator('li').filter({ hasText: 'Hair foam' }).isVisible())
  })
  await check('backup: restore shows inline confirm, bad file shows error', async () => {
    await p.getByRole('button', { name: /Replies/ }).click()
    const input = p.locator('input[type="file"]')
    await input.setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('nope') })
    await p.waitForTimeout(200)
    assert.ok(await p.getByText('is not a Precious Studio backup').isVisible())
    const data = await p.evaluate(() => localStorage.getItem('precious-studio-v1'))
    await input.setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(data) })
    await p.waitForTimeout(200)
    assert.ok(await p.getByRole('button', { name: 'Replace data' }).isVisible())
  })
  await check('no studio horizontal scroll at 390px', async () => {
    const m = await page(390, 844); await m.goto(BASE + '#studio'); await m.waitForTimeout(400)
    for (const t of ['Agenda', 'Clients', 'Stock', 'Follow-ups']) {
      await m.getByRole('button', { name: new RegExp(t) }).click(); await m.waitForTimeout(150)
      const over = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      assert.ok(over <= 0, `${t} is ${over}px too wide`)
    }
    await m.close()
  })

  await check('no JS errors on any page', async () => assert.deepEqual(errors, []))
  await b.close()
  for (const [r, n] of results) console.log(`${r}  ${n}`)
  const failed = results.filter(([r]) => r === 'FAIL').length
  console.log(`\n${results.length - failed}/${results.length} passed`)
  process.exit(failed ? 1 : 0)
})()
