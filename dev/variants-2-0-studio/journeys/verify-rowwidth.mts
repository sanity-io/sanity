// The address row: centred is the default; rowWidth A (full), B (contained 1200, the recommendation), C (compact 880) on a wide screen.
// Screenshots -> journeys-captures/e9-rowwidth/<option>-<width>-<theme>.png.   node journeys/verify-rowwidth.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-rowwidth', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 2560] as const) {
    for (const opt of ['a', 'b', 'c'] as const) {
      const context = await b.newContext({viewport: {width, height: 700}, colorScheme: theme})
      const p = await context.newPage()
      await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
      await p.waitForTimeout(2500)
      await p.goto(`http://localhost:3350/structure/book;book-lighthouse?design=show.a,stage.open-beta,rowWidth.${opt}&perspective=drafts&variant=aud-members`)
      await p.getByTestId('address-row-layout').waitFor({timeout: 60000})
      await p.waitForTimeout(2500)
      const w = await p.getByTestId('address-row-layout').evaluate((e) => Math.round(e.getBoundingClientRect().width))
      const layout = await p.getByTestId('address-row-layout').getAttribute('data-layout')
      if (theme === 'light') {
        const want = opt === 'a' ? width - 32 : opt === 'b' ? 1200 : 880
        log(`${opt} at ${width}: the row content is ${opt === 'a' ? 'full width' : `at most ${want}px`}`, opt === 'a' ? w > width - 80 : w <= want && w > want - 20 || width < want + 40, `${w}px`)
        if (opt === 'a' && width === 1440) log('the default layout is centred', layout === 'centered', String(layout))
      }
      await p.screenshot({path: `journeys-captures/e9-rowwidth/${opt}-${width}-${theme}.png`, clip: {x: 0, y: 0, width, height: 160}})
      await context.close()
    }
  }
}
await b.close()
process.exit(failed ? 1 : 0)
