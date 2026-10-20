// The perspective bar keeps its context between tools, with the same UI, and Presentation has no extra variant control.
// Not covered (known): a full reload keeps the variant in the URL but the studio does not read it back on load, so the bar starts empty.
// node journeys/verify-context.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 200))
const base = 'http://localhost:3350'
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1500, height: 900}})).newPage()
try {
  await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3000)
  await p.goto(`${base}/structure/book?preset=open-beta-a`)
  await p.locator('[data-ui=ReleasesNav] button').last().waitFor({timeout: 40000})
  await p.waitForTimeout(3000)
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.getByRole('menuitem', {name: /View as|Add a dimension/}).first().waitFor()
  await p.waitForTimeout(600)
  await p.getByRole('menuitem', {name: /View as|Add a dimension/}).first().click()
  await p.waitForTimeout(600)
  const dim = p.locator('[data-testid^=picker-dimension-]').first()
  if (!(await p.locator('[data-testid^=picker-value-]').first().isVisible().catch(() => false)) && (await dim.isVisible().catch(() => false))) await dim.click()
  await p.locator('[data-testid^=picker-value-]', {hasText: 'Members'}).first().click()
  await p.waitForTimeout(1200)
  const row = (await p.locator('[data-testid=address-row]').innerText()).replace(/\s+/g, ' ')
  log(/Members/.test(row), 'The bar is set in Structure', row)
  // Move to Presentation through the tool menu (no reload): same bar, same row, same value.
  await p.getByText('Presentation', {exact: true}).first().click()
  await p.waitForTimeout(6000)
  const row2 = (await p.locator('[data-testid=address-row]').innerText().catch(() => '')).replace(/\s+/g, ' ')
  log(/Members/.test(row2), 'Presentation shows the same bar with the same context', row2)
  log((await p.locator('[data-testid=presentation-variants-button]').count()) === 0, 'No extra variant control in the preview header')
  const frame = p.frames().find((f) => f.url().includes(':3334'))
  await frame?.locator('[data-testid=preview-state]').waitFor({timeout: 20000})
  await p.waitForTimeout(3000)
  log(/variant aud-members/.test((await frame?.locator('[data-testid=preview-state]').innerText()) ?? ''), 'The preview receives the bar\'s variant', (await frame?.locator('[data-testid=preview-state]').innerText()) ?? '')
  await p.getByText('Structure', {exact: true}).first().click()
  await p.waitForTimeout(4000)
  log(/Members/.test((await p.locator('[data-testid=address-row]').innerText().catch(() => '')).replace(/\s+/g, ' ')), 'Back in Structure the bar is the same')
} catch (e) {
  log(false, 'script error', String(e).split('\n').slice(0, 12).join(' '))
}
await b.close()
