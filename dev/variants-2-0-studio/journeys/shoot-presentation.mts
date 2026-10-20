// The Nordic Books site inside Presentation (one frame, with "Documents on this page") and in each Presentation grid preset.
// node journeys/shoot-presentation.mts -> journeys-captures/site/presentation-*.png and grid-<preset>-<theme>.png, plus checks
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/site', {recursive: true})
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 220))
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  const page = await (await b.newContext({viewport: {width: 1500, height: 900}, colorScheme: theme})).newPage()
  await page.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await page.waitForTimeout(3500)
  // Presentation, one frame, the list route and a book route
  for (const route of ['list', 'home']) {
    await page.goto(`http://localhost:3350/presentation?preview=${encodeURIComponent(`/variants-preview.html?route=${route}`)}&perspective=drafts&variant=aud-members`)
    await page.waitForTimeout(12000)
    const rows = await page.locator('[data-testid="documents-on-page"] [data-ui="Card"], [role="listitem"]').count().catch(() => 0)
    await page.screenshot({path: `journeys-captures/site/presentation-${route}-${theme}.png`})
    if (route === 'list') {
      const text = await page.locator('body').innerText()
      const titles = ['A Field Guide to Small Hours', 'Glass Houses', 'Midsummer', 'Salt & Ember', 'Tidewater', 'Winterhold', 'Atlas of Small Islands'].filter((t) => text.includes(t))
      log(titles.length >= 6, `Documents on this page lists the books (${theme})`, `${titles.length} of 7 sample titles found; ${rows} list rows`)
    }
  }
  // Grid presets
  await page.goto('http://localhost:3350/presentation-grid')
  await page.locator('[data-testid^=grid-frame-]').first().waitFor({timeout: 40000})
  for (const preset of ['Compare', 'Device wall', 'Sitemap', 'Matrix']) {
    await page.getByRole('button', {name: preset, exact: true}).click()
    await page.waitForTimeout(14000)
    const report = (await page.evaluate(() => JSON.stringify((window as unknown as {__grid?: Record<string, {status: string; docs: unknown[]}>}).__grid ?? {}))) as string
    const frames = Object.values(JSON.parse(report) as Record<string, {status: string; docs: unknown[]}>)
    const connected = frames.filter((f) => f.status === 'connected').length
    await page.screenshot({path: `journeys-captures/site/grid-${preset.toLowerCase().replace(' ', '-')}-${theme}.png`})
    log(frames.length > 0 && connected === frames.length, `Grid ${preset}: ${connected} of ${frames.length} frames connected (${theme})`, frames.map((f) => `${f.status}/${f.docs.length}`).join(' '))
  }
}
await b.close()
