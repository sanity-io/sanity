// A click on the pill that opened the picker closes it again, like the Drafts pill: dimension chip, pending chip, Add dimension,
// option B's Variants button. Esc and a click outside still close. node journeys/verify-toggle.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 200))
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1400, height: 800}})).newPage()
const picker = () => p.locator('[data-testid=address-picker]')
const open = async () => picker().isVisible().catch(() => false)
try {
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3000)
  await p.goto('http://localhost:3350/structure/book?design=show.a,stage.ga,c1.a')
  await p.locator('[data-ui=ReleasesNav] button').last().waitFor({timeout: 40000})
  await p.waitForTimeout(3500)
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.getByRole('menuitem', {name: /Add a dimension/}).first().click()
  await p.waitForTimeout(700)
  log(await open(), 'Add a dimension opens the pending chip with its picker')
  // pending chip: second click closes
  await p.locator('[data-testid=chip-pending] button').first().click()
  await p.waitForTimeout(500)
  log(!(await open()), 'Pending chip: a second click closes the picker')
  await p.locator('[data-testid=chip-pending] button').first().click()
  await p.waitForTimeout(500)
  log(await open(), 'Pending chip: a click opens it again')
  await p.locator('[data-testid^=picker-dimension-]').first().click()
  await p.locator('[data-testid^=picker-value-]').first().click()
  await p.waitForTimeout(800)
  // dimension chip
  const chip = p.locator('[data-testid^="chip-"]:not([data-testid$="-remove"]):not([data-testid="chip-pending"])').first().locator('button').first()
  await chip.click()
  await p.waitForTimeout(500)
  log(await open(), 'Dimension chip opens the picker')
  await chip.click()
  await p.waitForTimeout(500)
  log(!(await open()), 'Dimension chip: a second click closes it')
  await chip.click()
  await p.waitForTimeout(400)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
  log(!(await open()) && (await chip.evaluate((e) => e === document.activeElement)), 'Esc closes and focus returns to the chip')
  await chip.click()
  await p.waitForTimeout(400)
  await p.mouse.click(700, 700)
  await p.waitForTimeout(400)
  log(!(await open()), 'A click outside closes')
  // Add dimension, then the pending chip it raised
  await p.locator('[data-testid=row-add]').click()
  await p.waitForTimeout(600)
  log(await open(), 'Add dimension opens the pending chip and picker')
  await p.locator('[data-testid=chip-pending] button').first().click()
  await p.waitForTimeout(500)
  log(!(await open()), 'Add dimension then its pending chip: a click closes')
  // option B's Variants button
  await p.goto('http://localhost:3350/structure/book?design=show.a,stage.ga,c1.b')
  await p.locator('[data-testid=variants-button]').waitFor({timeout: 40000})
  await p.waitForTimeout(3000)
  await p.locator('[data-testid=variants-button]').click()
  await p.waitForTimeout(500)
  log(await open(), 'Variants button opens the panel')
  await p.locator('[data-testid=variants-button]').click()
  await p.waitForTimeout(500)
  log(!(await open()), 'Variants button: a second click closes the panel')
} catch (e) {
  log(false, 'script error', String(e).split('\n').slice(0, 4).join(' '))
}
await b.close()
