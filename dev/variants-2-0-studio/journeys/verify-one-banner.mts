// A document with no version for the chosen variant shows ONE missing-variant banner (C7 A replaces the stock one); Stock keeps the stock banner.
// node journeys/verify-one-banner.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-banner', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
for (const [design, label] of [['show.a,stage.open-beta', 'designed'], ['show.stock,stage.open-beta', 'stock']] as const) {
  const context = await b.newContext({viewport: {width: 1440, height: 900}, colorScheme: 'dark'})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3350/structure/e9Set;e9-set-11?perspective=drafts&variant=aud-lapsed-customers&design=${design}`)
  await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(6000)
  const n = await p.evaluate(() => [...document.querySelectorAll('[data-testid="document-pane"] button')].filter((e) => /Create variant/.test(e.textContent ?? '') && (e as HTMLElement).offsetParent).length)
  log(`${label}: ${label === 'designed' ? 'one' : 'the stock'} Create variant banner`, n === 1, `${n} Create variant buttons`)
  await p.screenshot({path: `journeys-captures/e9-banner/${label}.png`, clip: {x: 0, y: 0, width: 1440, height: 420}})
  await context.close()
}
await b.close()
process.exit(failed ? 1 : 0)
