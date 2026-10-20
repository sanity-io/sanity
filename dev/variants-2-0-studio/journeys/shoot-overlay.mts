// The C4 shared lens overlay (Expand) and the C5 full-width lens at 390, 768 and 1440 px, light and dark.
// node journeys/shoot-overlay.mts <label> -> journeys-captures/token-fix/overlay/<label>-<surface>-<width>-<theme>.png
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const label = process.argv[2] ?? 'shot'
const out = join(import.meta.dirname, '..', 'journeys-captures', 'token-fix', 'overlay')
mkdirSync(out, {recursive: true})
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]] as const) {
    const p = await (await b.newContext({viewport: {width, height}, colorScheme: theme})).newPage()
    await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
    await p.waitForTimeout(3000)
    await p.goto('http://localhost:3350/inventory?preset=open-beta-a')
    await p.waitForTimeout(9000)
    await p.screenshot({path: join(out, `${label}-c5-lens-${width}-${theme}.png`)})
    await p.goto('http://localhost:3350/structure/book;book-lighthouse%2Cinspect%3Dvariants-inventory?design=show.a,stage.open-beta,c4.a')
    await p.waitForTimeout(11000)
    const expand = p.getByRole('button', {name: 'Expand'}).first()
    const ok = await expand.isVisible().catch(() => false)
    if (ok) {
      await expand.click()
      await p.waitForTimeout(1500)
    }
    const box = await p.locator('[data-testid=wide-overlay]').first().boundingBox().catch(() => null)
    console.log(theme, width, 'expand', ok, 'overlay box', box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'none')
    await p.screenshot({path: join(out, `${label}-c4-overlay-${width}-${theme}.png`)})
  }
}
await b.close()
