// "Open beta (locked)" = C1 option B: two controls in the navbar (the stock state control and one Variants control), no row and no bar. A document follows
// global and shows only the collapsed state pill and a Versions pill; the pill opens a local row, a change collapses it to a "Local" cue.
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
const LOCKED = 'show.a,stage.open-beta,navLayout.b,c1.b,c2.c,c4.a'
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

  // Local, following global (H1): the collapsed state pill and the Versions pill; nothing else, and no footer "Manage versions".
  log('document: follows global, no pane control, no toggle', (await count(p, 'pane-control')) === 0 && (await count(p, 'published-toggle')) === 0)
  log('document: no grouped pills, no variant chip, no versions popover', (await count(p, 'pills-variants')) === 0 && (await count(p, 'pills-releases')) === 0 && (await count(p, 'variant-chip')) === 0 && (await count(p, 'other-versions')) === 0)
  log('document: the state pill reads the global layer, and a "N Versions" pill beside it', /Draft/.test(await text(p, 'header-state')) && /^\d+ Versions$/.test(await text(p, 'header-versions')), `${await text(p, 'header-state')} | ${await text(p, 'header-versions')}`)
  log('document: no "Manage versions" in the footer, no Versions button in the header actions', !(await visible(p, 'action-document-group-inventory')) && (await p.getByRole('button', {name: /^versions$/i}).count()) === 0)
  await p.screenshot({path: 'journeys-captures/e9-openbeta/header-h1.png', clip: {x: 640, y: 55, width: 800, height: 120}})

  // Local view (H2): the pill opens a row, and steps aside while it is open.
  await p.getByTestId('header-state').click()
  await p.waitForTimeout(900)
  log('local row: the pill opens a "Local perspective" row, and the header pill steps aside', (await visible(p, 'local-perspective-row')) && (await count(p, 'header-state')) === 0 && /Local perspective/.test(await text(p, 'local-perspective-row')))
  log('local row: it has the state control, the variant control and Follow global perspective', (await visible(p, 'local-state')) && (await visible(p, 'local-variants')) && (await visible(p, 'local-follow-global')))
  await p.screenshot({path: 'journeys-captures/e9-openbeta/header-h2.png', clip: {x: 640, y: 55, width: 800, height: 160}})
  // Diverged (H3): a change makes the pane differ, the row collapses, the header says Local.
  await p.getByTestId('local-state').click()
  await p.waitForTimeout(700)
  await p.getByRole('menuitem', {name: 'Published'}).first().click()
  await p.waitForTimeout(1500)
  log('diverged: the row collapses and the header shows a Local cue before the state pill', (await count(p, 'local-perspective-row')) === 0 && (await visible(p, 'local-cue')) && /Published/.test(await text(p, 'header-state')))
  log('diverged: the pane holds its own address (the URL) and the global perspective did not move', decodeURIComponent(p.url()).includes('localPerspective=published') && /Draft/.test(await stateText(p)) && variantParam(p) === 'aud-members')
  await p.screenshot({path: 'journeys-captures/e9-openbeta/header-h3.png', clip: {x: 640, y: 55, width: 800, height: 120}})
  await p.getByTestId('header-state').click()
  await p.waitForTimeout(900)
  await p.getByTestId('local-follow-global').click()
  await p.waitForTimeout(1500)
  log('Follow global perspective: the pane follows again (no params, no cue, no row)', !decodeURIComponent(p.url()).includes('localPerspective') && (await count(p, 'local-cue')) === 0 && (await count(p, 'local-perspective-row')) === 0 && /Draft/.test(await text(p, 'header-state')))

  // Versions (H4): the pill opens the inventory side panel.
  await p.getByTestId('header-versions').click()
  await p.waitForTimeout(2500)
  log('Versions: the pill opens the inventory side panel', await visible(p, 'version-inventory-panel'))
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
  // A reference pane opens following global, and the same state pill unlocks it and follows back.
  const {p, context} = await open(REF)
  const pill = p.getByTestId('header-state')
  log('reference: it follows global and says nothing beyond the state pill', (await pill.count()) === 2 && (await count(p, 'local-cue')) === 0 && (await count(p, 'local-perspective-row')) === 0, `${await pill.count()} state pills`)
  await pill.nth(1).click()
  await p.waitForTimeout(900)
  log('reference: its state pill opens the local row for that pane only', (await count(p, 'local-perspective-row')) === 1 && (await count(p, 'header-state')) === 1)
  await p.getByTestId('local-state').click()
  await p.waitForTimeout(700)
  await p.getByRole('menuitem', {name: 'Published'}).first().click()
  await p.waitForTimeout(1800)
  const held = decodeURIComponent(p.url())
  log('reference: changing the address gives the pane its own (the URL holds it) and the Local cue appears', held.includes('localPerspective=published') && (await count(p, 'local-cue')) === 1, held.split('/structure/')[1]?.slice(0, 110))
  log('reference: the global perspective did not move', /Returning visitors/.test(await text(p, 'variants-chip')) && /Draft/.test(await stateText(p)))
  await p.screenshot({path: 'journeys-captures/e9-openbeta/reference-local.png'})
  await pill.nth(1).click()
  await p.waitForTimeout(900)
  await p.getByTestId('local-follow-global').click()
  await p.waitForTimeout(1800)
  log('reference: Follow global perspective returns it to global', !decodeURIComponent(p.url()).includes('localPerspective') && (await count(p, 'local-cue')) === 0)
  await context.close()
}

await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
