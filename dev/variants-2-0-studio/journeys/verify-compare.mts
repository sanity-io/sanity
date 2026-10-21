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
const count2 = (p: Page, id: string) => p.getByTestId(id).count()
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
for (const look of ['d', 'e', 'f'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1440, 2200] as const) {
      const {p, context} = await open(pane('aud-members') + D(look), width, theme)
      if (theme === 'light' && width === 1440) {
        log(`${look.toUpperCase()}: the ported composed bar is the compare header (title kept)`, (await text(p, 'compare-title')) === 'Comparing variants' && (await p.locator('[data-testid^="composed-"], [data-testid*="compare-' + look + '"]').count()) > 0, String(await text(p, 'compare-title')))
        if (look === 'e') log('E: a pane bar above each pane', (await count2(p, 'pane-bar')) === 2, String(await count2(p, 'pane-bar')))
      }
      await p.screenshot({path: `journeys-captures/e9-compare/${look.toUpperCase()}-${width}-${theme}.png`, clip: {x: 0, y: 0, width, height: 360}})
      await context.close()
    }
  }
}
{
  // E (decision: each pane carries its own bar, so the global bar keeps ONE row and does not grow when a comparison starts).
  const height = async (p: Page, id: string) => Math.round((await p.getByTestId(id).first().boundingBox())?.height ?? -1)
  const inner = (p: Page, sel: string) => p.locator(sel).first().evaluate((el) => (el as HTMLElement).innerText).catch(() => '')
  const solo = await open('/structure/e9Case;e9-visitors' + D('e'))
  const before = await height(solo.p, 'address-row')
  await solo.context.close()
  const {p, context} = await open(pane('aud-members') + D('e'))
  const after = await height(p, 'address-row')
  log('E: the global bar is the same height before and after the comparison starts', before > 0 && before === after, `${before}px -> ${after}px`)
  const header = await height(p, 'compare-header')
  const headerText = await inner(p, '[data-testid="compare-header"]')
  log('E: the global bar has no Against row (no label, no reserved row)', !/\bAgainst\b/.test(headerText) && (await p.getByTestId('reserved-row').count()) === 0, headerText.replace(/\s+/g, ' ').slice(0, 80))
  const d = await open(pane('aud-members') + D('d'))
  const headerD = await height(d.p, 'compare-header')
  await d.context.close()
  log('E: the compare band is one row (shorter than D, which keeps two)', header > 0 && header < headerD, `E ${header}px, D ${headerD}px`)
  log('E: the compare band no longer carries the base note', (await p.getByTestId('compare-header').getByTestId('base-note').count()) === 0)
  const against = p.locator('[data-testid="pane-bar"][data-side="against"]')
  const showing = p.locator('[data-testid="pane-bar"][data-side="showing"]')
  log('E: the Against pane bar carries the ⇄', (await against.count()) === 1 && (await against.getByTestId('pane-bar-compared').count()) === 1)
  log('E: the Showing pane bar has no ⇄ and no base note', (await showing.getByTestId('pane-bar-compared').count()) === 0 && (await showing.getByTestId('base-note').count()) === 0)
  log('E: the Against pane bar names the base and offers Back to Published', /Comparing against:/.test(await inner(p, '[data-testid="pane-bar"][data-side="against"]')) && (await against.getByTestId('base-reset').count()) === 1)
  const hs = [Math.round((await showing.boundingBox())?.height ?? -1), Math.round((await against.boundingBox())?.height ?? -2)]
  log('E: both pane bars are the same height, so the two forms line up', hs[0] === hs[1] && hs[0] > 0, `${hs[0]}px / ${hs[1]}px`)
  await p.screenshot({path: 'journeys-captures/e9-compare/E-against-bar-1440-light.png', clip: {x: 0, y: 0, width: 1440, height: 420}})
  await against.getByTestId('base-reset').click()
  await p.waitForTimeout(3000)
  log('E: Back to Published in the Against pane bar returns to the default base', (await text(p, 'compare-title')) === 'Seeing what changed since Published' && (await against.getByTestId('base-reset').count()) === 0, String(await text(p, 'compare-title')))
  const hs2 = [Math.round((await showing.boundingBox())?.height ?? -1), Math.round((await against.boundingBox())?.height ?? -2)]
  log('E: the pane bars stay the same height at the default base', hs2[0] === hs2[1] && hs2[0] > 0, `${hs2[0]}px / ${hs2[1]}px`)
  log('E: the global bar is still the same height after the way back', (await height(p, 'address-row')) === before)
  await context.close()
}
await b.close()
process.exit(failed ? 1 : 0)
