// The one review base (default Published, user-chosen otherwise), the review sets (reviewSet B: release against the base, C: changed since) and
// Compare F geometry (aligned to the compared chip; L2 fold).   Screenshots -> journeys-captures/e9-base/.   node journeys/verify-base.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-base', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
async function open(path: string, width = 1440, theme: 'light' | 'dark' = 'light', wait = 'a[href*="e9-set-"]') {
  const context = await b.newContext({viewport: {width, height: 1000}, colorScheme: theme})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3350${path}`)
  await p.locator(wait).first().waitFor({timeout: 90000})
  await p.waitForTimeout(6000)
  return {p, context}
}
const text = async (p: Page, id: string) => ((await p.getByTestId(id).first().textContent().catch(() => '')) ?? '').trim()
const D = 'design=show.a,stage.open-beta'

// 1. The list pass count reads the base. Default: Published of the same variant. Pick Published · Base: the M1 count (7 of 10).
{
  const {p, context} = await open(`/structure/e9Set?perspective=drafts&variant=aud-returning-visitors&${D},c3.d,reviewPass.b`)
  log('list: the base is stated', (await text(p, 'base-text')).startsWith('Comparing against: Published'), await text(p, 'base-text'))
  log('list: the first view says what is compared', /differ from Published · /.test(await text(p, 'review-summary')), await text(p, 'review-summary'))
  log('list: at the default there is no way-back button', (await p.getByTestId('base-reset').count()) === 0)
  await p.getByTestId('base-pick').click()
  await p.getByRole('menuitem', {name: 'Published · Base'}).click()
  await p.waitForTimeout(5000)
  log('list: with Published · Base as the base, 7 of 10 differ', (await text(p, 'review-summary')).includes('7 of 10 differ'), await text(p, 'review-summary'))
  log('list: documents that differ are listed first', (await p.locator('a[href*="e9-set-"]').first().getByTestId('row-differs').count()) === 1)
  log('list: a chosen base shows the way back', (await p.getByTestId('base-reset').count()) === 1)
  await p.screenshot({path: 'journeys-captures/e9-base/list-chosen.png'})
  await p.getByTestId('base-reset').click()
  await p.waitForTimeout(5000)
  log('list: back to Published returns to the default count', (await p.getByTestId('base-reset').count()) === 0 && !(await text(p, 'review-summary')).includes('7 of 10'), await text(p, 'review-summary'))
  await context.close()
}
// 2. The review panel, the compare header and the list read the same base.
{
  const {p, context} = await open(`/structure/e9Set;e9-set-01?perspective=drafts&variant=aud-returning-visitors&${D},c3.d,reviewPass.b,reviewPanel.b`, 1440, 'light', '[data-testid="document-pane"]')
  const panelBase = await text(p, 'base-text')
  log('panel or header states the base', panelBase.startsWith('Comparing against:'), panelBase)
  await context.close()
}
// 3. M3, M4.
{
  const {p, context} = await open(`/structure/e9Set?perspective=rE9m3&${D},reviewSet.b`)
  const line = await text(p, 'review-set-release')
  log('M3: the release set is counted (4 documents, 2 differ, 1 new)', /4 documents/.test(line) && /2 differ/.test(line) && /1 new/.test(line), line)
  log('M3: the base is stated', (await text(p, 'base-text')).startsWith('Comparing against: Published'))
  await p.screenshot({path: 'journeys-captures/e9-base/m3.png'})
  await context.close()
}
{
  const {p, context} = await open(`/structure/e9Set?${D},reviewSet.c`)
  const line = await text(p, 'review-set-since')
  log('M4: Changed since 7 days ago, with a count', /Changed since 7 days ago · \d+ documents/.test(line), line)
  await p.getByTestId('since-1').click()
  await p.waitForTimeout(2500)
  log('M4: 1 day recounts', (await text(p, 'review-set-since')).startsWith('Changed since 1 day ago'), await text(p, 'review-set-since'))
  await p.screenshot({path: 'journeys-captures/e9-base/m4.png'})
  await context.close()
}
{
  const {p, context} = await open(`/structure/e9Set?${D},reviewSet.a`)
  log('reviewSet A: no line', (await p.getByTestId('review-set').count()) === 0)
  await context.close()
}
// 4. Compare F: aligned, and the L2 fold.
for (const [width, fold] of [[1760, 'false'], [1280, 'true']] as const) {
  const {p, context} = await open(`/structure/e9Case;e9-visitors;e9-visitors,localPerspective=published,localVariant=none?${D},compare.f`, width, 'light', '[data-testid="document-pane"]')
  const f = p.getByTestId('compare-f')
  log(`F at ${width}: the band is there`, (await f.count()) === 1)
  log(`F at ${width}: fold = ${fold}`, (await f.getAttribute('data-fold')) === fold, String(await f.getAttribute('data-fold')))
  await p.screenshot({path: `journeys-captures/e9-base/f-${width}.png`})
  await context.close()
}
// 5. Narrow pane: the mark keeps a letter in the bar, so the kind is not lost.
{
  const {p, context} = await open(`/structure/fieldMarksTest;fm-2?perspective=drafts&variant=aud-returning-visitors&${D},fieldMarks.b`, 700, 'light', '[data-testid="document-pane"]')
  const glyphs = await p.locator('[data-e9-glyph]').count()
  const words = await p.locator('[data-e9-word]').count()
  log('narrow pane: marks without room show a letter in the bar', glyphs > 0 && glyphs >= words, `glyphs ${glyphs}, words ${words}`)
  await p.screenshot({path: 'journeys-captures/e9-base/marks-narrow.png'})
  await context.close()
}
await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
