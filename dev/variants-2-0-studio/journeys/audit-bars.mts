import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken
const b = await chromium.launch()
for (const theme of ['light', 'dark']) {
  const c = await b.newContext({viewport: {width: 1440, height: 1900}, colorScheme: theme})
  const p = await c.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`); await p.waitForTimeout(2500)
  await p.goto('http://localhost:3350/structure/fieldMarksTest;fm-1?perspective=published&variant=aud-members&design=show.a,stage.open-beta')
  await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000}); await p.waitForTimeout(5000)
  console.log(theme, JSON.stringify(await p.evaluate(() => {
    const out = []
    for (const e of document.querySelectorAll('[data-testid^="change-bar"]')) {
      const s = getComputedStyle(e); const r = e.getBoundingClientRect()
      out.push({id: e.getAttribute('data-testid'), bg: s.backgroundColor, bl: s.borderLeftColor, bw: s.borderLeftWidth, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x)})
    }
    const d = document.querySelector('[data-testid="base-variant-diff-indicator"] svg')
    return {n: out.length, sample: out.slice(0, 6), diamond: d ? getComputedStyle(d).color : null}
  })))
  await c.close()
}
await b.close()
