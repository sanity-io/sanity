// "Open beta (locked)" = C1 option B: two controls in the navbar (the stock state control and one Variants control), no row and no bar. A document follows
// global and shows only a Published | Draft toggle and a Versions button; a pane can be unlocked and followed back.
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
const LOCKED = 'show.a,stage.open-beta,navLayout.b,c1.b,c2.c,c4.a,paneControl.c'
const DOC = `/structure/e9Case;e9-visitors?design=${LOCKED}&${G}`
const REF = `/structure/book;book-lighthouse;author-maren-halvorsen,type=author,parentRefPath=author?design=${LOCKED}&${G}`
const count = (p: Page, id: string) => p.getByTestId(id).count()
const text = (p: Page, id: string) => p.getByTestId(id).first().textContent().then((t) => t ?? '').catch(() => '')
const visible = (p: Page, id: string) => p.getByTestId(id).first().isVisible().catch(() => false)
const x = (p: Page, sel: string) => p.locator(sel).first().boundingBox().then((r) => r?.x ?? -1)
// The stock state control is Studio's own (the releases group in the navbar); its text is the layer.
const STATE = '[data-ui="ReleasesNav"]'
const stateText = (p: Page) => p.locator(STATE).first().evaluate((el) => (el as HTMLElement).innerText).catch(() => '')
const variantParam = (p: Page) => new URL(p.url()).searchParams.get('variant')
const strip = (p: Page) => p.evaluate(() => [...document.querySelectorAll('[data-testid="document-pane"] *')].filter((e) => e.children.length < 4 && /^Showing/.test((e.textContent ?? '').trim()) && (e.textContent ?? '').trim().length < 80).length)
const visibleItems = (p: Page) => p.locator('[data-testid="address-picker"] [data-testid^="picker-value-"], [data-testid="address-picker"] [data-testid^="picker-default-"]').evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => e.getAttribute('data-testid')))

// Fresh start (no link, no saved choice) starts from the preset; adding a value opens nothing else.
{
  const {p, context} = await open('/structure/e9Case;e9-visitors')
  log('default: a fresh browser starts from Open beta (locked)', (await count(p, 'doc-pills-c')) === 1 && (await count(p, 'address-row')) === 0, `doc-pills-c ${await count(p, 'doc-pills-c')}`)
  log('fresh: the Variants control reads "Default" (nothing picked)', (await text(p, 'variants-button')) === 'Default', await text(p, 'variants-button'))
  await p.getByTestId('variants-button').click()
  await p.waitForTimeout(900)
  await p.locator('[data-testid^="picker-value-audience-"]').first().click()
  await p.waitForTimeout(3000)
  log('fresh, add a value: no perspective row opens, nothing else appears', (await count(p, 'address-row')) === 0 && (await count(p, 'local-row')) === 0 && (await count(p, 'pane-bar')) === 0 && (await strip(p)) === 0, `${await strip(p)} strips`)
  log('fresh, add a value: the Variants control shows ONE value', (await count(p, 'variants-chip')) === 1 && (await text(p, 'variants-chip')).length > 0, await text(p, 'variants-chip'))
  await p.screenshot({path: 'journeys-captures/e9-openbeta/fresh-add.png', clip: {x: 0, y: 0, width: 1440, height: 260}})
  await context.close()
}

for (const width of [1440, 1280]) {
  const {p, context} = await open(DOC, width)
  log(`${width}: no perspective row or bar`, (await count(p, 'address-row')) === 0)
  log(`${width}: two controls: the stock state control and the Variants control`, /Drafts|Published/.test(await stateText(p)) && (await visible(p, 'variants-chip')))
  log(`${width}: no second layer chip and no address chip (nothing of ours but Variants)`, (await count(p, 'row-version')) === 0 && (await count(p, 'chip-audience')) === 0)
  log(`${width}: the Variants control shows one value and a cross`, /Returning visitors/.test(await text(p, 'variants-chip')) && (await visible(p, 'variants-chip-remove')))
  log(`${width}: the Variants control sits right after the state control`, (await x(p, '[data-testid="open-beta-variants"]')) > (await x(p, STATE)))
  await p.screenshot({path: `journeys-captures/e9-openbeta/nav-${width}.png`, clip: {x: 0, y: 0, width, height: 140}})
  await context.close()
}

{
  const {p, context} = await open(DOC)
  // The Variants control: the same single dropdown on every click, no row, and every pick moves the global variant (the URL).
  const openControl = async () => { await p.getByTestId('variants-chip').getByRole('button').first().click(); await p.waitForTimeout(900) }
  let first: string[] | null = null
  const picks = ['lapsed-customers', 'loyal-customers', 'members']
  for (let i = 0; i < 3; i++) {
    await openControl()
    const items = await visibleItems(p)
    first ??= items
    log(`Variants, click ${i + 1}: the same single dropdown opens (flat list, Default row)`, items.length >= 4 && items.includes('picker-default-audience') && JSON.stringify(items) === JSON.stringify(first) && (await p.locator('[data-testid="address-picker"]:visible').count()) === 1, `${items.length} items`)
    log(`Variants, click ${i + 1}: no row or bar appears, and nothing under the list`, (await count(p, 'address-row')) === 0 && (await count(p, 'picker-footer')) === 0)
    await p.getByTestId(`picker-value-audience-${picks[i]}`).click()
    await p.waitForTimeout(2000)
    log(`Variants, pick ${i + 1}: the control updates and the global variant moves`, variantParam(p) === `aud-${picks[i]}` && (await text(p, 'variants-chip')).length > 0 && (await visibleItems(p)).length === 0, `variant=${variantParam(p)}, "${await text(p, 'variants-chip')}"`)
  }
  await p.screenshot({path: 'journeys-captures/e9-openbeta/variants-control.png', clip: {x: 0, y: 0, width: 1440, height: 140}})
  await p.getByTestId('variants-chip-remove').click()
  await p.waitForTimeout(2000)
  log('Variants: the cross clears to Default (no variant in the URL)', variantParam(p) === null && (await count(p, 'variants-chip')) === 0 && (await visible(p, 'variants-button')), `variant=${variantParam(p)}`)
  await p.getByTestId('variants-button').click()
  await p.waitForTimeout(900)
  const again = await visibleItems(p)
  log('Variants: after Default it opens the same list again', again.length === first!.length && again.includes('picker-default-audience'), `${again.length} items`)
  await p.getByTestId('picker-default-audience').click()
  await p.waitForTimeout(1500)
  log('Variants: the Default row keeps it cleared', variantParam(p) === null && (await visibleItems(p)).length === 0)
  await p.getByTestId('variants-button').click()
  await p.waitForTimeout(900)
  await p.getByTestId('picker-value-audience-members').click()
  await p.waitForTimeout(2000)
  log('Variants: a pick after Default moves the global variant again', variantParam(p) === 'aud-members', `variant=${variantParam(p)}`)

  // The state control is the stock one: its own menu, every time, with no extra row of ours.
  const menuItems = () => p.locator('[role="menuitem"]:visible').count()
  let menu = -1
  for (let i = 0; i < 3; i++) {
    await p.getByTestId('global-perspective-menu-button').click()
    await p.waitForTimeout(900)
    const n = await menuItems()
    if (menu < 0) menu = n
    log(`state control, click ${i + 1}: the same menu opens, no "Add a dimension" or "View as" row`, n > 0 && n === menu && (await p.getByTestId('add-dimension').locator('visible=true').count()) === 0, `${n} items`)
    await p.keyboard.press('Escape')
    await p.waitForTimeout(500)
  }

  // The state menu has a search once it holds more than 7 entries (Published, Drafts and releases; not the footer actions).
  const entries = () => p.locator('[data-testid="release-menu"] [role="menuitem"]:visible').allInnerTexts()
  await p.getByTestId('global-perspective-menu-button').click()
  await p.waitForTimeout(900)
  const all = await entries()
  log('state control: a menu of more than 7 entries shows a search field', (await visible(p, 'release-menu-search')) && all.length > 7, `${all.length} items`)
  await p.getByTestId('release-menu-search').fill('e9')
  await p.waitForTimeout(600)
  const found = (await entries()).join('|')
  log('state control, search: it filters the entries and keeps the footer actions', /E9 review release/.test(found) && /E9 base release/.test(found) && !/Halloween/.test(found) && /New release/.test(found), found.replace(/\s+/g, ' ').slice(0, 120))
  await p.getByTestId('release-menu-search').fill('zzzz')
  await p.waitForTimeout(600)
  log('state control, search: nothing matches says so', await visible(p, 'release-menu-search-empty'))
  await p.getByTestId('release-menu-search').fill('')
  await p.waitForTimeout(600)
  log('state control, search: clearing restores every entry', (await entries()).length === all.length)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(500)

  // Local: the document follows global and says nothing.
  log('document: follows global, no pane control', (await count(p, 'pane-control')) === 0)
  log('document: no grouped pills, no variant chip, no versions popover', (await count(p, 'pills-variants')) === 0 && (await count(p, 'pills-releases')) === 0 && (await count(p, 'variant-chip')) === 0 && (await count(p, 'other-versions')) === 0)
  log('document: only the Published | Draft toggle', (await count(p, 'published-toggle')) === 1 && (await count(p, 'toggle-published')) === 1 && (await count(p, 'toggle-drafts')) === 1)

  // The toggle drives the global layer: the stock state control shows it.
  await p.getByTestId('toggle-published').click()
  await p.waitForTimeout(2000)
  log('toggle: Published is chosen and the state control follows', (await p.getByTestId('toggle-published').getAttribute('aria-checked')) === 'true' && /Published/.test(await stateText(p)), (await stateText(p)).replace(/\s+/g, ' '))
  await p.getByTestId('toggle-drafts').click()
  await p.waitForTimeout(2000)
  log('toggle: Draft is chosen again and the state control follows', (await p.getByTestId('toggle-drafts').getAttribute('aria-checked')) === 'true' && /Draft/.test(await stateText(p)), (await stateText(p)).replace(/\s+/g, ' '))

  // Versions opens the inventory side panel.
  await p.getByRole('button', {name: /^versions$/i}).first().click()
  await p.waitForTimeout(2500)
  log('Versions: opens the inventory side panel', await visible(p, 'version-inventory-panel'))
  await p.screenshot({path: 'journeys-captures/e9-openbeta/versions-panel.png'})
  await context.close()
}

{
  // Persistent across tools: the same two controls and the same variant in the Releases tool.
  const {p, context} = await open(DOC)
  await p.getByTestId('releases-tool-link').click()
  await p.waitForTimeout(5000)
  log('tools: both controls stay in the navbar in the Releases tool', /Drafts|Published/.test(await stateText(p)) && (await visible(p, 'variants-chip')) && (await count(p, 'address-row')) === 0)
  log('tools: the variant is the same (global, not per tool)', /Returning visitors/.test(await text(p, 'variants-chip')), await text(p, 'variants-chip'))
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
  log('reference: the global perspective did not move', /Returning visitors/.test(await text(p, 'variants-chip')) && /Draft/.test(await stateText(p)))
  // The toggle drives the GLOBAL layer, also in a pane that holds its own address.
  await p.getByTestId('toggle-published').nth(1).click()
  await p.waitForTimeout(2000)
  log('reference: the toggle in a pane drives the global layer (the state control follows)', /Published/.test(await stateText(p)) && decodeURIComponent(p.url()).includes('localPerspective=published'), (await stateText(p)).replace(/\s+/g, ' '))
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
