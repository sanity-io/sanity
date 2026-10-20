// E9 compare A, B, C: Open beside, the compare header (D12 titles, Showing / Against, counts, Copy link, Close), C4 (no version) and C6 (two dimensions refused).
// Screenshots -> journeys-captures/e9-compare/<state>-<width>-<theme>.png.   node journeys/verify-compare.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-compare', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
async function open(path: string, width = 1440, theme: 'light' | 'dark' = 'light') {
  const context = await b.newContext({viewport: {width, height: 900}, colorScheme: theme})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3350${path}`)
  await p.locator('[data-testid="document-pane"], [data-testid="compare-header"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(6500)
  return {p, context}
}
const G = '&perspective=drafts&variant=aud-returning-visitors'
const pane = (v: string, l = 'drafts') => `/structure/e9Case;e9-visitors;e9-visitors,localPerspective=${l},localVariant=${v}`
const D = (c: string) => `?design=show.a,stage.open-beta,compare.${c}${G}`
const text = (p: Page, id: string) => p.getByTestId(id).first().textContent().catch(() => null)

{
  const {p, context} = await open(pane('aud-members') + D('a'))
  log('A: no compare surface (no header, no local row)', (await p.getByTestId('compare-header').count()) === 0 && (await p.getByTestId('local-row').count()) === 0)
  await context.close()
}
{
  const {p, context} = await open(pane('aud-members') + D('b'))
  log('B: the second pane shows its local row', (await p.getByTestId('local-row').count()) === 1)
  log('B: no compare header', (await p.getByTestId('compare-header').count()) === 0)
  await p.screenshot({path: 'journeys-captures/e9-compare/B-1440-light.png'})
  await context.close()
}
for (const theme of ['light', 'dark'] as const) {
  const {p, context} = await open(pane('aud-members') + D('c'), 1440, theme)
  log(`C ${theme}: one header, titled by what differs`, (await text(p, 'compare-title')) === 'Comparing variants', String(await text(p, 'compare-title')))
  log(`C ${theme}: Showing and Against are named`, ((await text(p, 'compare-showing')) ?? '').includes('Returning visitors') && ((await text(p, 'compare-against')) ?? '').includes('Members'))
  await p.waitForTimeout(1500)
  log(`C ${theme}: the header counts changes and fields`, /\d+ changes? in \d+ fields?/.test((await text(p, 'compare-count')) ?? ''), String(await text(p, 'compare-count')))
  await p.screenshot({path: `journeys-captures/e9-compare/C-1440-${theme}.png`})
  if (theme === 'light') {
    await p.getByTestId('compare-count').click()
    await p.waitForTimeout(600)
    log('C: the count opens the change list (C5)', (await p.getByTestId('compare-list').count()) === 1)
    await p.screenshot({path: 'journeys-captures/e9-compare/C-list-1440-light.png'})
    await p.keyboard.press('Escape')
    await p.getByTestId('compare-close').click()
    await p.waitForTimeout(2500)
    console.log('URL', decodeURIComponent(p.url()))
    log('C: Close comparison closes the Against pane and keeps the global perspective', (await p.getByTestId('compare-header').count()) === 0 && (await p.locator('[data-testid="document-pane"]').count()) === 1 && p.url().includes('variant=aud-returning-visitors'))
  }
  await context.close()
}
{
  // C2: the same variant, Published against Drafts.
  const {p, context} = await open(pane('aud-returning-visitors', 'published') + D('c'))
  log('C2: "Seeing what changed since Published"', (await text(p, 'compare-title')) === 'Seeing what changed since Published', String(await text(p, 'compare-title')))
  await context.close()
}
{
  // C3: translations (a locale variant against the base).
  const {p, context} = await open(`/structure/e9Case;e9-danish;e9-danish,localPerspective=published,localVariant=loc-da-dk?design=show.a,stage.open-beta,compare.c&perspective=published`)
  log('C3: "Comparing translations"', (await text(p, 'compare-title')) === 'Comparing translations', String(await text(p, 'compare-title')))
  await p.screenshot({path: 'journeys-captures/e9-compare/C3-1440-light.png'})
  await context.close()
}
{
  // C4: no version at the Against address: the fallback, and Create (nothing is written until then).
  const {p, context} = await open(`/structure/e9Case;e9-danish;e9-danish,localPerspective=drafts,localVariant=loc-da-dk?design=show.a,stage.open-beta,compare.c&perspective=drafts`)
  log('C4: no version: says so and offers Create Danish', (await p.getByTestId('compare-missing').count()) === 1 && /Create Danish/.test((await text(p, 'compare-create')) ?? ''))
  await p.screenshot({path: 'journeys-captures/e9-compare/C4-1440-light.png'})
  await context.close()
}
{
  // C6: two dimensions differ: refused, with the way back.
  const {p, context} = await open(pane('aud-members', 'published') + D('c'))
  log('C6: two dimensions are refused', (await p.getByTestId('compare-refused').count()) === 1 && (await p.getByTestId('compare-header').getAttribute('data-kind')) === 'refused')
  await p.screenshot({path: 'journeys-captures/e9-compare/C6-1440-light.png'})
  await p.getByTestId('compare-way-back').click()
  await p.waitForTimeout(2500)
  console.log('URL', decodeURIComponent(p.url()))
  log('C6: one click returns to a comparison the open beta can show', (await p.getByTestId('compare-refused').count()) === 0 && (await text(p, 'compare-title')) === 'Comparing variants', String(await text(p, 'compare-title')))
  await context.close()
}
await b.close()
process.exit(failed ? 1 : 0)
