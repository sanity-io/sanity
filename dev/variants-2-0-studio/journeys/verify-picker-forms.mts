// The picker panel of option B (the Variants control) grows with the number of dimensions: 1 = one flat list, 2 to 4 = one column
// each (256 wide, all lists at once), 5 and more = the rail and definitions. Screenshots panel-1 to panel-5 (light).
// node journeys/verify-picker-forms.mts -> journeys-captures/c1-baseline/panel-<n>.png
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 200))
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1500, height: 700}, colorScheme: 'light'})).newPage()
await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(3000)
for (const n of [1, 2, 3, 4, 5]) {
  try {
    await p.goto(`http://localhost:3350/structure/book;book-lighthouse?design=show.a,stage.ga,dim.${n},c1.b`)
    await p.locator('[data-testid=variants-button]').waitFor({timeout: 40000})
    await p.waitForTimeout(3000)
    // Pick one value in the Variants panel (nothing is chosen yet, so the button opens the panel); the footer shows once something
    // is chosen, so the panel is opened again from the row: the chip (one dimension) or "Add dimension" (more).
    await p.locator('[data-testid=variants-button]').click()
    await p.waitForTimeout(600)
    await p.locator('[data-testid^=picker-value-]').first().click()
    await p.waitForTimeout(900)
    // In option B the Variants button now shows or hides the address row.
    if (!(await p.locator('[data-testid=address-row]').isVisible().catch(() => false))) await p.locator('[data-testid=variants-button]').click()
    await p.waitForTimeout(700)
    if (n === 1) await p.locator('[data-testid^="chip-"]:not([data-testid$="-remove"])').first().locator('button').first().click()
    else await p.locator('[data-testid=row-add]').click()
    await p.waitForTimeout(900)
    if (n > 1) await p.locator('[data-testid=chip-pending]').waitFor({timeout: 5000}).catch(() => undefined)
    const info = await p.evaluate(() => {
      const root = document.querySelector('[data-testid=address-picker]') as HTMLElement
      const cols = [...root.querySelectorAll('[data-testid^="column-"]')].map((c) => Math.round(c.getBoundingClientRect().width))
      return {form: root.dataset.form, width: Math.round(root.getBoundingClientRect().width), columns: cols, rail: !!root.querySelector('[data-testid=picker-rail]'), footer: !!root.querySelector('[data-testid=picker-footer]'), clear: !!root.querySelector('[data-testid=picker-clear]')}
    })
    const want = n === 1 ? 'list' : n <= 4 ? 'columns' : 'rail'
    const ok = info.form === want && (n < 2 || n > 4 || (info.columns.length === n && info.columns.every((w) => w === 256))) && (n !== 5 || info.rail) && info.footer && info.clear
    log(ok, `${n} dimension${n > 1 ? 's' : ''}: ${want}`, JSON.stringify(info))
    await p.screenshot({path: `journeys-captures/c1-baseline/panel-${n}.png`})
  } catch (e) {
    log(false, `${n} dimensions`, String(e).split('\n').slice(0, 8).join(' '))
  }
}
await b.close()
