// "Open beta (locked)": no perspective row, the global perspective is two chips in the navbar (layer + the one address), a document follows global
// and shows only a Published | Draft toggle and a Versions button (the inventory side panel), a pane can be unlocked and followed back.
// Screenshots -> journeys-captures/e9-openbeta/<state>.png.   node journeys/verify-openbeta.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-openbeta', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
async function open(path: string, width = 1440) {
  const context = await b.newContext({viewport: {width, height: 900}})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3350${path}`)
  await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(6500)
  return {p, context}
}
const G = 'perspective=drafts&variant=aud-returning-visitors'
const LOCKED = 'show.a,stage.open-beta,navLayout.d,c2.c,c4.a,paneControl.c'
const DOC = `/structure/e9Case;e9-visitors?design=${LOCKED}&${G}`
const REF = `/structure/book;book-lighthouse;author-maren-halvorsen,type=author,parentRefPath=author?design=${LOCKED}&${G}`
const count = (p: Page, id: string) => p.getByTestId(id).count()
const text = (p: Page, id: string) => p.getByTestId(id).first().textContent().then((t) => t ?? '').catch(() => '')
const x = (p: Page, id: string) => p.getByTestId(id).first().boundingBox().then((r) => r?.x ?? -1)
const visible = (p: Page, id: string) => p.getByTestId(id).first().isVisible().catch(() => false)

// The default: a fresh browser with no link and no saved choice starts from the preset.
{
  const {p, context} = await open(`/structure/e9Case;e9-visitors?${G}`)
  log('default: a fresh browser starts from Open beta (locked)', (await count(p, 'doc-pills-c')) === 1 && (await count(p, 'address-row')) === 0, `doc-pills-c ${await count(p, 'doc-pills-c')}`)
  await context.close()
}

for (const width of [1440, 1280]) {
  const {p, context} = await open(DOC, width)
  log(`${width}: no perspective row under the navbar`, (await count(p, 'address-row')) === 0)
  log(`${width}: the layer chip and the address chip are in the navbar`, (await visible(p, 'row-version')) && (await visible(p, 'chip-audience')))
  log(`${width}: exactly two chips (the shipped pill and its menu are hidden)`, !(await visible(p, 'perspective-label-toggle')) && !(await visible(p, 'global-perspective-menu-button')))
  log(`${width}: the address chip carries the value and a cross`, /Returning visitors/.test(await text(p, 'chip-audience')) && (await visible(p, 'chip-audience-remove')))
  log(`${width}: the chips sit left of search and Create`, (await x(p, 'chip-audience')) < (await x(p, 'studio-search')) && (await x(p, 'studio-search')) < (await x(p, 'new-document-button')))
  await p.screenshot({path: `journeys-captures/e9-openbeta/nav-${width}.png`, clip: {x: 0, y: 0, width, height: 140}})
  await context.close()
}

{
  const {p, context} = await open(DOC)
  // The address chip opens the flat list of the one dimension, with a Default row.
  await p.getByTestId('chip-audience').getByRole('button').first().click()
  await p.waitForTimeout(1200)
  log('the address chip opens one flat list with a Default row', (await p.locator('[data-testid^="picker-value-audience-"]').count()) >= 3 && (await count(p, 'picker-default')) + (await p.getByText('Default', {exact: true}).count()) > 0, `${await p.locator('[data-testid^="picker-value-audience-"]').count()} values`)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(600)

  // Local: the document follows global and says nothing.
  log('document: follows global, no pane control', (await count(p, 'pane-control')) === 0)
  log('document: no grouped pills, no variant chip, no versions popover', (await count(p, 'pills-variants')) === 0 && (await count(p, 'pills-releases')) === 0 && (await count(p, 'variant-chip')) === 0 && (await count(p, 'other-versions')) === 0)
  log('document: only the Published | Draft toggle', (await count(p, 'published-toggle')) === 1 && (await count(p, 'toggle-published')) === 1 && (await count(p, 'toggle-drafts')) === 1)

  // The toggle flips Published / Draft (the global layer, which the navbar chip shows).
  await p.getByTestId('toggle-published').click()
  await p.waitForTimeout(2000)
  log('toggle: Published is chosen and the navbar layer chip follows', (await p.getByTestId('toggle-published').getAttribute('aria-checked')) === 'true' && /Published/.test(await text(p, 'row-version')), await text(p, 'row-version'))
  await p.getByTestId('toggle-drafts').click()
  await p.waitForTimeout(2000)
  log('toggle: Draft is chosen again and the navbar layer chip follows', (await p.getByTestId('toggle-drafts').getAttribute('aria-checked')) === 'true' && /Draft/.test(await text(p, 'row-version')), await text(p, 'row-version'))

  // Versions opens the inventory side panel.
  await p.getByRole('button', {name: /^versions$/i}).first().click()
  await p.waitForTimeout(2500)
  log('Versions: opens the inventory side panel', await visible(p, 'version-inventory-panel'))
  await p.screenshot({path: 'journeys-captures/e9-openbeta/versions-panel.png'})
  await context.close()
}

{
  // Persistent across tools: the same chips and the same address in the Releases tool.
  const {p, context} = await open(DOC)
  await p.getByTestId('releases-tool-link').click()
  await p.waitForTimeout(5000)
  log('tools: the chips stay in the navbar in the Releases tool', (await visible(p, 'row-version')) && (await visible(p, 'chip-audience')) && (await count(p, 'address-row')) === 0)
  log('tools: the address is the same (global, not per tool)', /Returning visitors/.test(await text(p, 'chip-audience')), await text(p, 'chip-audience'))
  await p.screenshot({path: 'journeys-captures/e9-openbeta/releases-tool.png', clip: {x: 0, y: 0, width: 1440, height: 300}})
  await context.close()
}

{
  // A reference pane opens following global, and can be unlocked and followed back.
  const {p, context} = await open(REF)
  const chip = p.getByTestId('pane-control')
  log('reference: only the reference pane offers the control (the book says nothing)', (await chip.count()) === 1, String(await chip.count()))
  log('reference: it reads Follows global', /Follows global/.test(await text(p, 'pane-control')))
  await p.screenshot({path: 'journeys-captures/e9-openbeta/reference-follows.png'})
  await chip.first().click()
  await p.waitForTimeout(1200)
  log('reference: the chip unlocks the same picker, scoped to the pane', (await count(p, 'pane-control-picker')) > 0)
  await p.getByTestId('picker-value-layer-published').first().click()
  await p.waitForTimeout(1800)
  const held = decodeURIComponent(p.url())
  log('reference: changing the address gives the pane its own (the URL holds it)', held.includes('localPerspective=published'), held.split('/structure/')[1]?.slice(0, 110))
  log('reference: the cue appears (Local, tinted, differs)', /Local · Published/.test(await text(p, 'pane-control')) && (await chip.first().getAttribute('data-differs')) !== null)
  log('reference: the global perspective did not move', /Returning visitors/.test(await text(p, 'chip-audience')) && /Draft/.test(await text(p, 'row-version')))
  await p.screenshot({path: 'journeys-captures/e9-openbeta/reference-local.png'})
  if ((await count(p, 'picker-clear')) === 0) await chip.first().click()
  await p.getByTestId('picker-clear').first().click()
  await p.waitForTimeout(1800)
  log('reference: Follow global perspective returns it to global', !decodeURIComponent(p.url()).includes('localPerspective') && /Follows global/.test(await text(p, 'pane-control')))
  await context.close()
}

await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
