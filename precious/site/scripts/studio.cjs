// Calendar + stock tests for the owner's studio. Needs `npm run preview` on :4173.
// Run: NODE_PATH=$(npm root -g) node scripts/studio.cjs
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const BASE = (process.env.BASE || 'http://localhost:4173/') + '#studio'

const results = []
const check = async (name, fn) => { try { await fn(); results.push(['PASS', name]) } catch (e) { results.push(['FAIL', `${name} — ${e.message.split('\n')[0]}`]) } }
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
  await check('no JS errors', async () => assert.deepEqual(errors, []))

  await b.close()
  for (const [r, n] of results) console.log(`${r}  ${n}`)
  const failed = results.filter(([r]) => r === 'FAIL').length
  console.log(`\n${results.length - failed}/${results.length} passed`)
  process.exit(failed ? 1 : 0)
})()
