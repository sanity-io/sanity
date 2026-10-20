// C4 screenshots: the document inspector with option A at a normal and a narrow pane width, option B (popover) open, and Expand,
// light and dark. node journeys/shoot-c4.mts <label> -> journeys-captures/c4/<label>-<state>-<theme>.png
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const label = process.argv[2] ?? 'after'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  for (const [state, width, option] of [['a-normal', 1456, 'a'], ['a-narrow', 820, 'a'], ['b-popover', 1456, 'b']] as const) {
    const p = await (await b.newContext({viewport: {width, height: 900}, colorScheme: theme})).newPage()
    await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
    await p.waitForTimeout(3000)
    const inspect = option === 'a' ? '%2Cinspect%3Dvariants-inventory' : ''
    await p.goto(`http://localhost:3350/structure/book;book-lighthouse${inspect}?design=show.a,stage.open-beta,c4.${option}`)
    await p.waitForTimeout(12000)
    if (option === 'b') {
      await p.locator('[data-testid=manage-versions] button').first().click().catch(() => p.getByRole('button', {name: /Manage versions/}).first().click())
      await p.waitForTimeout(2500)
    }
    await p.screenshot({path: `journeys-captures/c4/${label}-${state}-${theme}.png`})
    if (option === 'a' && width > 1000) {
      const expand = p.locator('[data-testid=inventory-expand]').first()
      if (await expand.isVisible().catch(() => false)) {
        await expand.click()
        await p.waitForTimeout(2500)
        await p.screenshot({path: `journeys-captures/c4/${label}-expand-${theme}.png`})
      }
    }
    await p.context().close()
  }
}
await b.close()
