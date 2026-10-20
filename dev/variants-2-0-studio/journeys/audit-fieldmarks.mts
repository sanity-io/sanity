// E9 step 0a: the shipped field marks (C9 A/B/C) on the Field marks test document as the Members variant.
// node journeys/audit-fieldmarks.mts  -> journeys-captures/e9-audit/fm-<option>-<width>-<theme>.png and a JSON of what the DOM holds
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const dir = 'journeys-captures/e9-audit'
mkdirSync(dir, {recursive: true})
const base = 'http://localhost:3350'
const b = await chromium.launch()
const report: Record<string, unknown> = {}
for (const width of [1440, 1280] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const opt of ['a', 'c'] as const) {
      if (width === 1280 && opt === 'c') continue
      const context = await b.newContext({viewport: {width, height: 1900}, colorScheme: theme})
      const p = await context.newPage()
      await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
      await p.waitForTimeout(2500)
      await p.goto(`${base}/structure/fieldMarksTest;fm-1?perspective=published&variant=aud-members&design=show.a,stage.open-beta,c9.${opt}`)
      await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
      await p.waitForTimeout(5000)
      await p.screenshot({path: `${dir}/fm-${opt}-${width}-${theme}.png`})
      if (width === 1440 && theme === 'light') {
        report[opt] = await p.evaluate(() => {
          const q = (s: string) => [...document.querySelectorAll(s)].map((e) => {
            const r = e.getBoundingClientRect()
            return {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)}
          })
          return {
            diamonds: q('[data-testid="base-variant-diff-indicator"]'),
            changeBars: q('[data-testid="change-bar__wrapper"], [data-testid="change-bar"]'),
            blockMarks: q('[data-testid="block-mark"]'),
            removedNotes: q('[data-testid="removed-note"]'),
            words: [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /^Changed$/.test(e.textContent?.trim() ?? '')).length,
          }
        })
      }
      await context.close()
    }
  }
}
writeFileSync(`${dir}/fm-dom.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report))
await b.close()
