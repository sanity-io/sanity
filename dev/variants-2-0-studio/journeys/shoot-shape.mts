// Round and Box, light and dark: the C1 row with chips, the version pill and the C2 pills. -> journeys-captures/shape/<shape>-<theme>.png
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  for (const shape of ['round', 'box'] as const) {
    const p = await (await b.newContext({viewport: {width: 1300, height: 420}, colorScheme: theme})).newPage()
    await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
    await p.waitForTimeout(3000)
    await p.goto(`http://localhost:3350/structure/book;book-lighthouse?design=show.a,stage.ga${shape === 'box' ? ',shape.box' : ''}`)
    await p.locator('[data-ui=ReleasesNav] button').last().waitFor({timeout: 40000})
    await p.waitForTimeout(3500)
    await p.locator('[data-ui=ReleasesNav] button').last().click()
    await p.getByRole('menuitem', {name: /Add a dimension/}).first().click()
    await p.waitForTimeout(600)
    await p.locator('[data-testid^=picker-dimension-]').first().click()
    await p.locator('[data-testid^=picker-value-]').first().click()
    await p.waitForTimeout(800)
    await p.locator('[data-testid=row-add]').click()
    await p.waitForTimeout(500)
    await p.screenshot({path: `journeys-captures/shape/${shape}-${theme}.png`})
    await p.context().close()
  }
}
await b.close()
