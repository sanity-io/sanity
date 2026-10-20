// The global Shape setting: Round (default, shipped) and Box (3px) change the Variants 2.0 pills and chips together, survive a preset,
// reach the options remote, and are appended to Storybook links with the theme. node journeys/verify-shape.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 200))
const b = await chromium.launch()
const context = await b.newContext({viewport: {width: 1400, height: 800}, colorScheme: 'dark'})
const p = await context.newPage()
const radius = (sel: string) => p.locator(sel).first().evaluate((e) => getComputedStyle(e).borderTopLeftRadius)
try {
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3000)
  await p.goto('http://localhost:3350/structure/book?preset=ga-many')
  await p.locator('[data-ui=ReleasesNav] button').last().waitFor({timeout: 40000})
  await p.waitForTimeout(3500)
  // a chip in the row
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.getByRole('menuitem', {name: /Add a dimension/}).first().click()
  await p.waitForTimeout(600)
  await p.locator('[data-testid^=picker-dimension-]').first().click()
  await p.locator('[data-testid^=picker-value-]').first().click()
  await p.waitForTimeout(800)
  const chipSel = '[data-testid^="chip-"]:not([data-testid$="-remove"])'
  const round = {pill: await radius('[data-ui=ReleasesNav]'), chip: await radius(chipSel)}
  log(parseFloat(round.pill) >= 100 && parseFloat(round.chip) >= 100, 'Round (default): pill and chip are full radius', JSON.stringify(round))
  await p.getByRole('button', {name: 'Design options'}).click()
  const dialog = p.getByRole('dialog', {name: 'Design options'})
  await dialog.getByRole('radio', {name: 'Box', exact: true}).click()
  await p.waitForTimeout(500)
  await p.keyboard.press('Escape')
  const box = {pill: await radius('[data-ui=ReleasesNav]'), chip: await radius(chipSel)}
  log(box.pill === '3px' && box.chip === '3px', 'Box: pill and chip are 3px', JSON.stringify(box))
  // a preset keeps the shape
  await p.getByRole('button', {name: 'Design options'}).click()
  await dialog.getByText('No preset').first().click().catch(() => undefined)
  const link = await dialog.locator('[data-testid=story-link]').first().getAttribute('href')
  log(/globals=theme:dark;shape:box/.test(link ?? ''), 'Storybook links carry the theme and the shape', link?.split('&globals=')[1] ?? '')
  await p.keyboard.press('Escape')
  // the options remote shows and drives it
  const remote = await context.newPage()
  await remote.goto('http://localhost:3350/static/options-remote.html')
  await remote.waitForFunction(() => document.getElementById('conn')?.textContent === 'Connected', null, {timeout: 20000})
  await remote.waitForSelector('button[data-shape="box"].on', {timeout: 8000}).catch(() => undefined)
  log(await remote.locator('button[data-shape="box"].on').isVisible(), 'The options remote shows Box')
  await remote.locator('button[data-shape="round"]').click()
  await remote.waitForTimeout(1500)
  log(parseFloat(await radius('[data-ui=ReleasesNav]')) >= 100, 'Round again from the options remote', await radius('[data-ui=ReleasesNav]'))
  await remote.locator('button[data-preset="open-beta-b"]').click()
  await remote.locator('button[data-shape="box"]').click()
  await remote.locator('button[data-preset="open-beta-a"]').click()
  await remote.waitForTimeout(1500)
  log((await radius('[data-ui=ReleasesNav]')) === '3px', 'Applying a preset keeps the shape', await radius('[data-ui=ReleasesNav]'))
  await remote.locator('button[data-shape="round"]').click()
} catch (e) {
  log(false, 'script error', String(e).split('\n').slice(0, 3).join(' '))
}
await b.close()
