// The whole change-surface loop, as one journey: open a document, a mark shows Changed, open the panel, pick a change and land on its field,
// open the comparison in the lane, revert one change, the counts follow everywhere (marks, panel, compare header), close the comparison.
// Preset: E9 · Data's recommendation + compare F + navLayout C. Screenshots -> journeys-captures/e9-loop/<step>-<theme>.png at 1440.
// node journeys/verify-loop.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-loop', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const DESIGN = 'show.a,stage.open-beta,c2.b,c3.d,paneAddress.c,compare.f,reviewPanel.c,listMark.b,listFlyout.b,reviewPass.b,fieldMarks.b,navLayout.c'
const b = await chromium.launch()
const num = (s: string | null) => Number(/(\d+)/.exec(s ?? '')?.[1] ?? NaN)
const headerCount = async (p: Page) => num(await p.getByTestId('compare-count').first().textContent().catch(() => null))
const panelTotal = async (p: Page) => num(await p.getByTestId('review-total').textContent().catch(() => null))

for (const theme of ['light', 'dark'] as const) {
  const context = await b.newContext({viewport: {width: 1440, height: 1000}, colorScheme: theme})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  const shot = (name: string) => p.screenshot({path: `journeys-captures/e9-loop/${name}-${theme}.png`})
  // 1 open the document
  await p.goto(`http://localhost:3350/structure/fieldMarksTest;fm-2?perspective=drafts&variant=aud-returning-visitors&design=${DESIGN}`)
  await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(7000)
  log(`${theme} 1: the perspective sits in the navbar (Nav C), no row under it`, (await p.getByTestId('address-row-inline').count()) === 1 && (await p.getByTestId('address-row').count()) === 0)
  // 2 a mark shows Changed
  const titleMark = p.locator('[data-testid="e9-mark"][data-kind="changed"]').first()
  log(`${theme} 2: a mark shows Changed on the edited title`, /^Changed/.test((await titleMark.getAttribute('aria-label')) ?? ''))
  await shot('1-marks')
  // 3 open the panel
  await p.getByTestId('pane-context-menu-button').last().click()
  await p.getByTestId('action-history').click()
  await p.getByTestId('e9-review').waitFor({timeout: 20000})
  await p.waitForTimeout(2500)
  const total0 = await panelTotal(p)
  log(`${theme} 3: the panel lists the changes and states the total`, total0 > 0 && (await p.getByTestId('review-card').count()) === total0, `total ${total0}`)
  // 4 pick a change: land on the field and thicken its mark
  await p.getByTestId('review-card').filter({hasText: 'Title'}).first().click()
  await p.waitForTimeout(1200)
  log(`${theme} 4: the picked change thickens its field mark`, (await p.locator('[data-e9-mark][data-selected]').count()) > 0)
  await shot('2-panel-selected')
  // 5 open the comparison in the lane
  await p.getByTestId('review-full-view').click()
  await p.waitForTimeout(6000)
  log(`${theme} 5: the full view lands in the lane compare (one header, two panes)`, (await p.getByTestId('compare-header').count()) === 1 && (await p.locator('[data-testid="document-pane"]').count()) >= 2)
  const h0 = await headerCount(p)
  log(`${theme} 5: the compare header counts the same changes as the panel`, h0 === total0, `header ${h0}, panel ${total0}`)
  await shot('3-lane-compare')
  // 6 revert one change from the compare's change list (the panel handed over to the lane at this width); the counts follow everywhere
  const marksBefore = await p.locator('[data-testid="e9-mark"][data-kind="changed"]').count()
  await p.getByTestId('compare-count').click()
  await p.waitForTimeout(800)
  const rows = await p.getByTestId('compare-revert').count()
  log(`${theme} 6: the compare's change list has a Revert per change`, rows === total0, `${rows} rows, panel had ${total0}`)
  await p.getByTestId('compare-revert').first().click()
  await p.waitForTimeout(7000)
  const h1 = await headerCount(p)
  log(`${theme} 6: the compare header count drops by one`, h1 === total0 - 1 || (await p.getByTestId('compare-count').textContent()) === 'No changes', `header ${h1}, was ${total0}`)
  const marksAfter = await p.locator('[data-testid="e9-mark"][data-kind="changed"]').count()
  log(`${theme} 6: the field marks follow (one Changed mark fewer: the reverted field falls back to Differs from base)`, marksAfter < marksBefore, `${marksBefore} -> ${marksAfter}`)
  await shot('4-after-revert')
  await p.getByTestId('undo-revert').click().catch(() => undefined)
  await p.waitForTimeout(4000)
  // 7 close the comparison
  await p.keyboard.press('Escape')
  await p.getByTestId('compare-close').click()
  await p.waitForTimeout(2500)
  log(`${theme} 7: closing the comparison closes the Against pane and keeps the global perspective`, (await p.getByTestId('compare-header').count()) === 0 && decodeURIComponent(p.url()).includes('variant=aud-returning-visitors'))
  await shot('5-closed')
  await context.close()
}
await b.close()
process.exit(failed ? 1 : 0)
