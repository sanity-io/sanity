// Iconography (options/iconography.ts): the version mark on a selected list row, one screenshot per value -> journeys-captures/e9-icons/mark-<value>.png.
// node journeys/verify-icons.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'

import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8'))
  .authToken as string
mkdirSync('journeys-captures/e9-icons', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`)
  if (!pass) failed++
}
const b = await chromium.launch()
const LOCKED = 'show.a,stage.open-beta,navLayout.b,c1.b,c2.c,c4.a'
for (const value of ['a', 'b', 'c', 'd']) {
  const context = await b.newContext({viewport: {width: 1440, height: 900}})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(
    `http://localhost:3350/structure/book;book-lighthouse?design=${LOCKED},markSelected.${value}&perspective=drafts`,
  )
  await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(7000)
  const info = await p.evaluate(() => {
    const row = document.querySelector('[data-ui="PreviewCard"][data-selected]')
    const badge = row?.querySelector('[data-testid="state-badge"]') as HTMLElement | null
    const mark = row?.querySelector('[data-testid^="version-mark-"]') as HTMLElement | null
    return {
      selected: Boolean(row),
      badge: badge ? Math.round(badge.getBoundingClientRect().width) : 0,
      markBg: mark ? getComputedStyle(mark).backgroundColor : '',
      box: row
        ? (({x, y, width, height}) => ({x, y, width, height}))(row.getBoundingClientRect())
        : null,
    }
  })
  log(
    `mark ${value}: a selected row exists with a mark`,
    info.selected && info.markBg !== '',
    JSON.stringify(info),
  )
  if (value !== 'a')
    log(
      `mark ${value}: the dot's disc is larger than today's 12 px`,
      info.badge > 12,
      `${info.badge}px`,
    )
  if (info.box)
    await p.screenshot({
      path: `journeys-captures/e9-icons/mark-${value}.png`,
      clip: {
        x: Math.max(0, info.box.x - 4),
        y: info.box.y - 70,
        width: info.box.width + 8,
        height: 190,
      },
    })
  await context.close()
}
await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
