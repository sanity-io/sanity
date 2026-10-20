// The GA lenses and the Open beta lens switch, light and dark -> journeys-captures/ga-lenses/. node journeys/shoot-ga.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const out = join(import.meta.dirname, '..', 'journeys-captures', 'ga-lenses')
mkdirSync(out, {recursive: true})
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  const p = await (await b.newContext({viewport: {width: 1456, height: 900}, colorScheme: theme})).newPage()
  const shot = (name: string) => p.screenshot({path: join(out, `${name}-${theme}.png`)})
  const lens = (name: string) => p.locator('[data-testid=c5-a] button[role=radio]', {hasText: new RegExp(`^${name}$`)})
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3500)
  await p.goto('http://localhost:3350/inventory?preset=open-beta-a')
  await p.waitForTimeout(9000)
  await shot('open-beta-two-lenses')
  await p.goto('http://localhost:3350/inventory?preset=ga-many')
  await p.waitForTimeout(9000)
  await lens('Dimension').click()
  await p.waitForTimeout(1500)
  await shot('ga-dimension-matrix')
  await lens('Visitor').click()
  await p.waitForTimeout(1000)
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.getByRole('menuitem', {name: /View as|Add a dimension/}).first().click()
  await p.waitForTimeout(800)
  const dim = p.locator('[data-testid^=picker-dimension-]').first()
  if (!(await p.locator('[data-testid^=picker-value-]').first().isVisible().catch(() => false)) && (await dim.isVisible().catch(() => false))) await dim.click()
  await p.locator('[data-testid^=picker-value-]').nth(2).click()
  await p.waitForTimeout(1500)
  await shot('ga-visitor-lens')
}
await b.close()
