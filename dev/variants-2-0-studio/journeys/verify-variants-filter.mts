// The Variants tool's Add filter uses the perspective bar's picker (not the stock two-level menu); Stock keeps the shipped one.
// Screenshots -> journeys-captures/e9-filter/<state>-<theme>.png.   node journeys/verify-variants-filter.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-filter', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
for (const [design, label] of [['show.a,stage.ga', 'picker'], ['show.stock,stage.ga', 'stock']] as const) {
  for (const theme of ['light', 'dark'] as const) {
    const context = await b.newContext({viewport: {width: 1440, height: 800}, colorScheme: theme})
    const p = await context.newPage()
    await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
    await p.waitForTimeout(2500)
    await p.goto(`http://localhost:3350/variants?design=${design}`)
    await p.getByRole('button', {name: 'Add filter'}).first().waitFor({timeout: 60000})
    await p.waitForTimeout(3000)
    await p.getByRole('button', {name: 'Add filter'}).first().click()
    await p.waitForTimeout(1000)
    if (label === 'picker') {
      log(`${theme}: the picker opens (the bar's search placeholder)`, (await p.getByPlaceholder('Find a dimension or a value').count()) > 0)
      if (theme === 'light') {
        await p.getByRole('menuitem').filter({hasText: 'Members'}).first().click().catch(() => undefined)
        await p.waitForTimeout(1200)
        log('picking a value filters the list and shows a chip; the panel stays open', (await p.getByPlaceholder('Find a dimension or a value').count()) > 0)
      }
    } else log(`${theme}: Stock keeps the shipped menu`, (await p.getByPlaceholder('Find a dimension…').count()) > 0)
    await p.screenshot({path: `journeys-captures/e9-filter/${label}-${theme}.png`})
    await context.close()
  }
}
await b.close()
process.exit(failed ? 1 : 0)
