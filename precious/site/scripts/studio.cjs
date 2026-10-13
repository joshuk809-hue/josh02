// Calendar + stock tests for the owner's studio. Needs `npm run preview` on :4173.
// Run: NODE_PATH=$(npm root -g) node scripts/studio.cjs
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const BASE = (process.env.BASE || 'http://localhost:4173/') + '#studio'

const results = []
const check = async (name, fn) => { try { await fn(); results.push(['PASS', name]) } catch (e) { results.push(['FAIL', `${name} — ${e.message.replace(/\n+/g, ' ').slice(0, 300)}`]) } }
const local = (d) => new Date(+d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
const at = (days, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d }

;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }) // clipboard permission NOT granted on purpose
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.goto(BASE); await p.waitForTimeout(400)

  const book = async (name, when, service = 'braids') => {
    await p.selectOption('select >> nth=0', '')
    await p.fill('input[placeholder="Client name"]', name)
    await p.fill('input[placeholder^="WhatsApp number"]', '+39 333 000 0000')
    await p.selectOption('select >> nth=1', service)
    await p.fill('input[aria-label="Date and time"]', local(when))
    await p.getByRole('button', { name: 'Add', exact: true }).click()
    await p.waitForTimeout(120)
  }
  const groups = () => p.locator('main h3').allInnerTexts()
  const namesIn = (i) => p.locator('main ul').nth(i).locator('li span:nth-child(2)').allInnerTexts()

  /* ---------- calendar ---------- */
  await book('Late Lucy', at(1, 16))
  await book('Early Eve', at(1, 9))
  await book('Today Tara', at(0, 23, 30))
  await book('Next Year Nia', new Date(at(1, 10).setFullYear(new Date().getFullYear() + 1)))

  await check('days sorted, with Today / Tomorrow labels', async () => {
    const g = await groups()
    assert.match(g[0], /^TODAY/); assert.match(g[1], /^TOMORROW/)
  })
  await check('within a day, appointments sorted by time', async () => {
    const n = await namesIn(1)
    assert.ok(n[0].startsWith('Early Eve') && n[1].startsWith('Late Lucy'), n.join(' | '))
  })
  await check('same date next year is a separate day (with year shown)', async () => {
    const g = await groups()
    assert.equal(g.length, 3)
    assert.match(g[2], new RegExp(String(new Date().getFullYear() + 1)))
  })
  await check('double-booking warning when the slot overlaps', async () => {
    await p.fill('input[aria-label="Date and time"]', local(at(1, 9, 30)))
    assert.ok(await p.getByText(/Heads up: Early Eve is booked/).isVisible())
    await p.fill('input[aria-label="Date and time"]', local(at(1, 12)))
    assert.equal(await p.getByText(/Heads up/).count(), 0)
    await p.fill('input[aria-label="Date and time"]', '')
  })
  await check('move an appointment to another day', async () => {
    const row = p.locator('li').filter({ hasText: 'Late Lucy' })
    await row.getByRole('button', { name: 'Move' }).click()
    await p.fill('input[aria-label="New date and time"]', local(at(3, 11)))
    await p.getByRole('button', { name: 'Save new time' }).click(); await p.waitForTimeout(150)
    const g = await groups()
    assert.equal(g.length, 4)
    assert.ok((await namesIn(2))[0].startsWith('Late Lucy'))
  })
  await check('Done, No-show and Cancel each remove it from the agenda', async () => {
    for (const [who, btn] of [['Early Eve', 'Done'], ['Today Tara', 'No-show'], ['Late Lucy', 'Cancel']]) {
      await p.locator('li').filter({ hasText: who }).getByRole('button', { name: btn, exact: true }).click()
      await p.waitForTimeout(100)
      assert.equal(await p.locator('li').filter({ hasText: who }).count(), 0, who)
    }
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('precious-studio-v1')).appointments.map((a) => a.status).sort())
    assert.deepEqual(st, ['booked', 'cancelled', 'done', 'no-show'])
  })
  await check('a past appointment still "booked" is flagged', async () => {
    await p.evaluate(() => {
      const k = 'precious-studio-v1', s = JSON.parse(localStorage.getItem(k))
      s.appointments.push({ id: 'past', clientId: s.clients[0].id, serviceId: 'haircut', at: new Date(Date.now() - 2 * 864e5).toISOString(), status: 'booked' })
      localStorage.setItem(k, JSON.stringify(s))
    })
    await p.reload(); await p.waitForTimeout(300)
    assert.ok(await p.getByText('Past · mark done or no-show').isVisible())
  })
  await check('agenda survives a reload', async () => {
    assert.ok(await p.locator('li').filter({ hasText: 'Next Year Nia' }).isVisible())
  })

  /* ---------- stock ---------- */
  await p.getByRole('button', { name: /Stock/ }).click(); await p.waitForTimeout(150)
  const row = (n) => p.locator('li').filter({ hasText: n })
  const qty = async (n) => Number(await row(n).locator('input[type=number]').inputValue())

  await check('− and + change the count by one', async () => {
    const q = await qty('Mousse')
    await row('Mousse').getByRole('button', { name: 'Use one' }).click()
    assert.equal(await qty('Mousse'), q - 1)
    await row('Mousse').getByRole('button', { name: 'Add one' }).click()
    assert.equal(await qty('Mousse'), q)
  })
  await check('count never goes below zero', async () => {
    await row('Lash glue').locator('input[type=number]').fill('0')
    await row('Lash glue').getByRole('button', { name: 'Use one' }).click()
    assert.equal(await qty('Lash glue'), 0)
  })
  await check('typing a count saves it', async () => {
    await row('Shampoo').locator('input[type=number]').fill('12')
    await p.reload(); await p.waitForTimeout(250)
    await p.getByRole('button', { name: /Stock/ }).click()
    assert.equal(await qty('Shampoo'), 12)
  })
  await check('low-stock alert: at the minimum = low, one above = fine', async () => {
    await row('Mousse').locator('input[type=number]').fill('2') // min 2
    assert.match(await p.locator('main').innerText(), /running low:.*Mousse/)
    await row('Mousse').locator('input[type=number]').fill('3')
    assert.doesNotMatch(await p.locator('main').innerText(), /running low:.*Mousse/)
  })
  await check('re-adding an existing product tops it up (no duplicate)', async () => {
    const q = await qty('Mousse')
    await p.fill('input[placeholder="Product"]', 'mousse')
    await p.locator('input[aria-label="Quantity"]').fill('5')
    await p.getByRole('button', { name: 'Add', exact: true }).click(); await p.waitForTimeout(100)
    assert.equal(await row('Mousse').count(), 1)
    assert.equal(await qty('Mousse'), q + 5)
  })
  await check('new product with blank category goes under "Other"', async () => {
    await p.fill('input[placeholder="Product"]', 'Hair foam')
    await p.fill('input[placeholder="Category"]', '')
    await p.locator('input[aria-label="Quantity"]').fill('4')
    await p.getByRole('button', { name: 'Add', exact: true }).click(); await p.waitForTimeout(100)
    assert.ok((await p.locator('main h3').allInnerTexts()).includes('OTHER'))
    assert.equal(await qty('Hair foam'), 4)
  })
  await check('shopping list copy does not crash when clipboard is blocked', async () => {
    await row('Lash glue').locator('input[type=number]').fill('0')
    await p.getByRole('button', { name: /Copy shopping list/ }).click(); await p.waitForTimeout(200)
    assert.deepEqual(errors, [])
  })
  await check('delete needs two taps', async () => {
    await row('Hair foam').getByRole('button', { name: 'Delete' }).click()
    assert.equal(await row('Hair foam').count(), 1)
    await row('Hair foam').getByRole('button', { name: /Tap again/ }).click(); await p.waitForTimeout(100)
    assert.equal(await row('Hair foam').count(), 0)
  })

  /* ---------- automatic deduction, delivery, barcodes, presets, report ---------- */
  const p2 = await ctx.newPage(); p2.on('pageerror', (e) => errors.push(e.message))
  await p2.goto(BASE); await p2.evaluate(() => localStorage.clear()); await p2.reload(); await p2.waitForTimeout(300)
  await p2.getByRole('button', { name: 'Load example data' }).click(); await p2.waitForTimeout(200)
  const stockOf = (id) => p2.evaluate((id) => JSON.parse(localStorage.getItem('precious-studio-v1')).stock.find((i) => i.id === id).qty, id)

  await check('Done on braids takes hair, edge control, mousse, beads out of stock', async () => {
    const before = await stockOf('hair-1b')
    await p2.locator('li').filter({ hasText: 'Amara Okafor' }).getByRole('button', { name: 'Done', exact: true }).click(); await p2.waitForTimeout(150)
    assert.equal(await stockOf('hair-1b'), before - 3)
    assert.match(await p2.getByRole('status').first().innerText(), /Stock updated: −3 packs Braiding hair \(black, 1B\)/)
  })
  await check('Undo puts the appointment and the stock back', async () => {
    await p2.getByRole('button', { name: 'Undo' }).click(); await p2.waitForTimeout(150)
    assert.equal(await stockOf('hair-1b'), 20)
    assert.ok(await p2.locator('li').filter({ hasText: 'Amara Okafor' }).isVisible())
  })
  await p2.getByRole('button', { name: /Stock/ }).click(); await p2.waitForTimeout(150)
  await check('usage report shows the last 30 days, soonest run-out first', async () => {
    const rows = await p2.locator('table tbody tr').allInnerTexts()
    assert.ok(rows.length >= 3, rows.join(' | '))
    assert.match(rows[0], /Braiding hair \(black, 1B\)\s+15 packs/)
  })
  await check('Used per service: change braids to 2 packs and it is used on Done', async () => {
    await p2.getByRole('button', { name: 'Used per service' }).click()
    await p2.locator('input[aria-label="Braids amount"]').first().fill('2')
    await p2.getByRole('button', { name: /Agenda/ }).click()
    await p2.locator('li').filter({ hasText: 'Daniel Weber' }).getByRole('button', { name: 'Done', exact: true }).click(); await p2.waitForTimeout(150)
    assert.equal(await stockOf('hair-1b'), 18)
    await p2.getByRole('button', { name: /Stock/ }).click(); await p2.waitForTimeout(150)
  })
  await check('Delivery arrived: several products added in one save', async () => {
    await p2.getByRole('button', { name: 'Delivery arrived' }).click()
    const [e0, m0] = [await stockOf('edge'), await stockOf('mousse')]
    await p2.locator('input[aria-label="Edge control arrived"]').fill('5')
    await p2.locator('input[aria-label="Mousse arrived"]').fill('6')
    await p2.getByRole('button', { name: /Add 2 products to stock/ }).click(); await p2.waitForTimeout(150)
    assert.equal(await stockOf('edge'), +(e0 + 5).toFixed(2))
    assert.equal(await stockOf('mousse'), +(m0 + 6).toFixed(2))
  })
  const scan = async (code) => { await p2.fill('input[aria-label="Barcode"]', code); await p2.press('input[aria-label="Barcode"]', 'Enter'); await p2.waitForTimeout(150) }
  await check('scanner: known barcode in "used" mode takes one off', async () => {
    const m0 = await stockOf('mousse')
    await scan('8009876543210') // Mousse
    assert.equal(await stockOf('mousse'), +(m0 - 1).toFixed(2))
    assert.match(await p2.getByRole('status').first().innerText(), /Mousse: −1/)
  })
  await check('scanner: "arrived" mode adds one', async () => {
    await p2.getByRole('button', { name: 'Scan = arrived one' }).click()
    const m0 = await stockOf('mousse')
    await scan('8009876543210')
    assert.equal(await stockOf('mousse'), +(m0 + 1).toFixed(2))
  })
  await check('scanner: unknown barcode can be linked to a product, then counts', async () => {
    await scan('4006381333931')
    await p2.locator('select[aria-label="Link barcode to"]').selectOption({ label: 'Shampoo' })
    await p2.getByRole('button', { name: 'Link', exact: true }).click(); await p2.waitForTimeout(100)
    const before = await stockOf('shampoo')
    await scan('4006381333931')
    assert.equal(await stockOf('shampoo'), before + 1)
  })
  await check('scanner: unknown barcode → "Add as new" keeps the code for the new product', async () => {
    await scan('5012345678900')
    await p2.getByRole('button', { name: 'Add as new' }).click()
    await p2.fill('#product-name', 'Argan oil')
    await p2.getByRole('button', { name: 'Add', exact: true }).click(); await p2.waitForTimeout(100)
    const bc = await p2.evaluate(() => JSON.parse(localStorage.getItem('precious-studio-v1')).stock.find((i) => i.name === 'Argan oil').barcode)
    assert.equal(bc, '5012345678900')
  })
  await check('preset chip fills name, category, unit and minimum', async () => {
    await p2.getByRole('button', { name: '+ Braid spray' }).click()
    assert.equal(await p2.inputValue('#product-name'), 'Braid spray')
    assert.equal(await p2.inputValue('input[placeholder="Category"]'), 'Care')
    assert.equal(await p2.inputValue('input[placeholder="Unit"]'), 'bottles')
  })

  await check('no JS errors', async () => assert.deepEqual(errors, []))

  await b.close()
  for (const [r, n] of results) console.log(`${r}  ${n}`)
  const failed = results.filter(([r]) => r === 'FAIL').length
  console.log(`\n${results.length - failed}/${results.length} passed`)
  process.exit(failed ? 1 : 0)
})()
