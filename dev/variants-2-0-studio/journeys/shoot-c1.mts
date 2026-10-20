// C1 baseline screenshots: rest, menu open, row with 1 chip, pending chip (picker open), row with 2 chips, light and dark.
// node journeys/shoot-c1.mts <label> -> journeys-captures/c1-baseline/<label>-<state>-<theme>.png
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const label = process.argv[2] ?? 'after'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/c1-baseline', {recursive: true})
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  const p = await (await b.newContext({viewport: {width: 1300, height: 640}, colorScheme: theme})).newPage()
  const shot = (state: string, clip = {x: 0, y: 0, width: 1300, height: 560}) => p.screenshot({path: `journeys-captures/c1-baseline/${label}-${state}-${theme}.png`, clip})
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3000)
  await p.goto('http://localhost:3350/structure/book?preset=ga-many')
  await p.locator('[data-ui=ReleasesNav] button').last().waitFor({timeout: 40000})
  await p.waitForTimeout(3500)
  await shot('rest', {x: 0, y: 0, width: 1300, height: 120})
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.waitForTimeout(700)
  await shot('menu-open', {x: 700, y: 0, width: 600, height: 460})
  await p.getByRole('menuitem', {name: /Add a dimension/}).first().click()
  await p.waitForTimeout(900)
  await shot('pending-picker-open')
  const dim = p.locator('[data-testid^=picker-dimension-]')
  if (await dim.count()) await dim.first().click()
  await p.locator('[data-testid^=picker-value-]').first().click()
  await p.waitForTimeout(900)
  await shot('row-one-chip', {x: 0, y: 0, width: 1300, height: 140})
  await p.locator('[data-testid=row-add]').click()
  await p.waitForTimeout(700)
  await shot('pending-chip', {x: 0, y: 0, width: 1300, height: 560})
  const dims = p.locator('[data-testid^=picker-dimension-]')
  if (await dims.count()) await dims.nth(1).click()
  await p.locator('[data-testid^=picker-value-]').first().click()
  await p.waitForTimeout(900)
  await shot('row-two-chips', {x: 0, y: 0, width: 1300, height: 140})
  await p.locator('[data-testid^=chip-]:not([data-testid$=remove])').first().hover()
  await shot('chip-hover', {x: 0, y: 0, width: 1300, height: 140})
}
await b.close()
