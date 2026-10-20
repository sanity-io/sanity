// E9 list: listMark A/B/C, listFlyout A/B/C, reviewPass A/B/C on the E9 review set (10 documents with a Returning visitors variant, 7 differ, 3 are the same; 3 without one).
// Screenshots -> journeys-captures/e9-list/<state>-<width>-<theme>.png.   node journeys/verify-list.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-list', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
async function open(design: string, width = 1440, theme: 'light' | 'dark' = 'light') {
  const context = await b.newContext({viewport: {width, height: 1000}, colorScheme: theme})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3350/structure/e9Set?perspective=drafts&variant=aud-returning-visitors&design=show.a,stage.open-beta,c3.d${design}`)
  await p.locator('a[href*="e9-set-"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(6000)
  return {p, context}
}
const count = (p: Page, id: string) => p.getByTestId(id).count()
const decoded = (p: Page) => decodeURIComponent(p.url())

for (const theme of ['light', 'dark'] as const) {
  for (const opt of ['a', 'b', 'c'] as const) {
    const {p, context} = await open(`,listMark.${opt}`, 1440, theme)
    if (theme === 'light') {
      if (opt === 'a') log('listMark A: no diamond on the stack, no side rule', (await count(p, 'list-diamond')) === 0 && (await count(p, 'list-mark-styles')) === 0)
      if (opt === 'b') log('listMark B: one purple diamond on the "Has variant" stack', (await count(p, 'list-diamond')) === 1)
      if (opt === 'c') {
        const shadow = await p.locator('a[href*="e9-set-"]').first().evaluate((e) => getComputedStyle(e).boxShadow)
        log('listMark C: the whole "Has variant" side carries a purple side rule', /inset/.test(shadow) && (await count(p, 'list-mark-styles')) === 1, shadow.slice(0, 60))
      }
    }
    await p.screenshot({path: `journeys-captures/e9-list/mark-${opt}-1440-${theme}.png`})
    await context.close()
  }
}
{
  const {p, context} = await open(',listFlyout.a')
  log('listFlyout A: no chevron', (await count(p, 'row-flyout')) === 0)
  await context.close()
}
{
  const {p, context} = await open(',listFlyout.b')
  log('listFlyout B: a chevron on every row', (await count(p, 'row-flyout')) >= 10)
  await p.getByTestId('row-flyout').first().click()
  await p.waitForTimeout(800)
  log('listFlyout B: the flyout lists the versions with Open beside', (await count(p, 'row-flyout-content')) === 1 && (await count(p, 'open-beside')) >= 2)
  await p.screenshot({path: 'journeys-captures/e9-list/flyout-b-1440-light.png'})
  await p.getByTestId('open-beside').first().click()
  await p.waitForTimeout(4000)
  log('listFlyout B: Open beside adds a pane at that version (a local perspective in the URL)', /localPerspective=/.test(decoded(p)), decoded(p).split('/structure/')[1]?.split('?')[0] ?? '')
  await context.close()
}
{
  const {p, context} = await open(',listFlyout.c')
  await p.locator('a[href*="e9-set-"]').nth(2).click({modifiers: ['Meta']})
  await p.waitForTimeout(4000)
  log('listFlyout C: Cmd-click anywhere on a row opens it beside', /localPerspective=/.test(decoded(p)) && /e9-set-/.test(decoded(p)), decoded(p).split('/structure/')[1]?.split('?')[0] ?? '')
  await p.screenshot({path: 'journeys-captures/e9-list/cmdclick-c-1440-light.png'})
  await context.close()
}
{
  const {p, context} = await open(',reviewPass.a')
  log('reviewPass A: no header, no Differs word', (await count(p, 'review-header')) === 0 && (await count(p, 'row-differs')) === 0)
  await context.close()
}
for (const theme of ['light', 'dark'] as const) {
  const {p, context} = await open(',reviewPass.b', 1440, theme)
  if (theme === 'light') {
    log('reviewPass B: the header counts "7 of 10 differ"', /Returning visitors against Base · 7 of 10 differ/.test((await p.getByTestId('review-summary').textContent()) ?? ''), String(await p.getByTestId('review-summary').textContent()))
    log('reviewPass B: a Differs word on each of the 7 rows', (await count(p, 'row-differs')) === 7, String(await count(p, 'row-differs')))
    log('reviewPass B: Review Returning visitors is offered', (await count(p, 'review-start')) === 1)
  }
  await p.screenshot({path: `journeys-captures/e9-list/review-b-1440-${theme}.png`})
  await context.close()
}
{
  const {p, context} = await open(',reviewPass.c,compare.c', 2200)
  await p.getByTestId('review-start').click()
  await p.waitForTimeout(5000)
  log('reviewPass C: the pass is held in the list: "Document 1 of 7 that differ"', /Document 1 of 7 that differ/.test((await p.getByTestId('review-pass-position').first().textContent()) ?? ''))
  log('reviewPass C: the open document is a comparison against the base', (await count(p, 'compare-header')) === 1 && /Comparing variants/.test((await p.getByTestId('compare-title').textContent()) ?? ''))
  await p.screenshot({path: 'journeys-captures/e9-list/pass-c-1440-light.png'})
  await p.getByTestId('review-next').first().click()
  await p.waitForTimeout(4000)
  log('reviewPass C: Next changed document moves to 2 of 7', /Document 2 of 7/.test((await p.getByTestId('review-pass-position').first().textContent()) ?? ''))
  log('reviewPass C: "Looked at" marks the documents seen', (await count(p, 'row-looked')) >= 2, String(await count(p, 'row-looked')))
  await p.keyboard.press('Escape')
  await p.waitForTimeout(800)
  log('reviewPass C: Esc ends the review', (await count(p, 'review-pass-position')) === 0)
  await context.close()
}
await b.close()
process.exit(failed ? 1 : 0)
