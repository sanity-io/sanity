// The seeded content in use: Presentation (one frame) as Base, Members and German; the grid Compare preset; the real form with
// field marks for lighthouse / Members and lighthouse / German. node journeys/shoot-content.mts -> journeys-captures/content/
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/content', {recursive: true})
const b = await chromium.launch()
const page = await (await b.newContext({viewport: {width: 1500, height: 1000}})).newPage()
await page.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
await page.waitForTimeout(3500)
const preview = encodeURIComponent('/variants-preview.html?route=book:book-lighthouse')
for (const [name, variant] of [['base', ''], ['members', '&variant=aud-members'], ['german', '&variant=loc-de-de']] as const) {
  await page.goto(`http://localhost:3350/presentation?preview=${preview}&perspective=drafts${variant}`)
  await page.waitForTimeout(12000)
  await page.screenshot({path: `journeys-captures/content/presentation-lighthouse-${name}.png`})
}
await page.goto('http://localhost:3350/presentation-grid')
await page.locator('[data-testid^=grid-frame-]').first().waitFor({timeout: 40000})
await page.getByRole('button', {name: 'Compare', exact: true}).click()
await page.waitForTimeout(16000)
await page.screenshot({path: 'journeys-captures/content/grid-compare.png'})
await page.setViewportSize({width: 1500, height: 2000})
for (const [name, variant] of [['members', 'aud-members'], ['german', 'loc-de-de']] as const) {
  await page.goto(`http://localhost:3350/structure/book;book-lighthouse?perspective=drafts&variant=${variant}&preset=open-beta-a`)
  await page.waitForTimeout(12000)
    await page.screenshot({path: `journeys-captures/content/form-lighthouse-${name}.png`})
}
await b.close()
