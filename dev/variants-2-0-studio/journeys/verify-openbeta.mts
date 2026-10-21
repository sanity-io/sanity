// "Open beta (locked)" = C1 option B: two controls in the navbar (the stock state control and one Variants control), no row and no bar. A document follows
// global and shows only the collapsed state pill and a Versions pill; the pill opens a local row, a change collapses it to a "Local" cue.
// Screenshots -> journeys-captures/e9-openbeta/<state>.png.   node journeys/verify-openbeta.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'

import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8'))
  .authToken as string
mkdirSync('journeys-captures/e9-openbeta', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`)
  if (!pass) failed++
}
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
const text = (p: Page, id: string) =>
  p
    .getByTestId(id)
    .first()
    .textContent()
    .then((t) => t ?? '')
    .catch(() => '')
const visible = (p: Page, id: string) =>
  p
    .getByTestId(id)
    .first()
    .isVisible()
    .catch(() => false)
const x = (p: Page, sel: string) =>
  p
    .locator(sel)
    .first()
    .boundingBox()
    .then((r) => r?.x ?? -1)
// The stock state control is Studio's own (the releases group in the navbar); its text is the layer.
const STATE = '[data-ui="ReleasesNav"]'
const stateText = (p: Page) =>
  p
    .locator(STATE)
    .first()
    .evaluate((el) => (el as HTMLElement).innerText)
    .catch(() => '')
const variantParam = (p: Page) => new URL(p.url()).searchParams.get('variant')
const strip = (p: Page) =>
  p.evaluate(
    () =>
      [...document.querySelectorAll('[data-testid="document-pane"] *')].filter(
        (e) =>
          e.children.length < 4 &&
          /^Showing/.test((e.textContent ?? '').trim()) &&
          (e.textContent ?? '').trim().length < 80,
      ).length,
  )
const visibleItems = (p: Page) =>
  p
    .locator(
      '[data-testid="address-picker"] [data-testid^="picker-value-"], [data-testid="address-picker"] [data-testid^="picker-default-"]',
    )
    .evaluateAll((els) =>
      els
        .filter((e) => (e as HTMLElement).offsetParent !== null)
        .map((e) => e.getAttribute('data-testid')),
    )

// Fresh start (no link, no saved choice) starts from the preset; adding a value opens nothing else.
{
  const {p, context} = await open('/structure/e9Case;e9-visitors')
  log(
    'default: a fresh browser starts from Open beta (locked)',
    (await count(p, 'doc-pills-c')) === 1 && (await count(p, 'address-row')) === 0,
    `doc-pills-c ${await count(p, 'doc-pills-c')}`,
  )
  log(
    'fresh: the Variants control reads "Default" (nothing picked)',
    (await text(p, 'variants-button')) === 'Default',
    await text(p, 'variants-button'),
  )
  await p.getByTestId('variants-button').click()
  await p.waitForTimeout(900)
  await p.locator('[data-testid^="picker-value-audience-"]').first().click()
  await p.waitForTimeout(3000)
  log(
    'fresh, add a value: no perspective row opens, nothing else appears',
    (await count(p, 'address-row')) === 0 &&
      (await count(p, 'local-row')) === 0 &&
      (await count(p, 'pane-bar')) === 0 &&
      (await strip(p)) === 0,
    `${await strip(p)} strips`,
  )
  log(
    'fresh, add a value: the Variants control shows ONE value',
    (await count(p, 'variants-chip')) === 1 && (await text(p, 'variants-chip')).length > 0,
    await text(p, 'variants-chip'),
  )
  await p.screenshot({
    path: 'journeys-captures/e9-openbeta/fresh-add.png',
    clip: {x: 0, y: 0, width: 1440, height: 260},
  })
  await context.close()
}

// The navbar keeps the default tone whatever the perspective: no green for Published, no release colour; the state is said by the pill, and the
// dropdowns opened from it are neutral too (the stock studio colours both).
{
  const bgOf = (p: Page, sel: string) =>
    p
      .locator(sel)
      .first()
      .evaluate((el) => getComputedStyle(el as HTMLElement).backgroundColor)
  for (const [name, perspective] of [
    ['Published', 'published'],
    ['a release', 'rE9m3'],
    ['Drafts', 'drafts'],
  ] as const) {
    const {p, context} = await open(
      `/structure/e9Case;e9-visitors?design=${LOCKED}&perspective=${perspective}`,
    )
    log(
      `neutral navbar: ${name} does not colour the navbar`,
      (await bgOf(p, '[data-testid="studio-navbar"]')) === 'rgb(255, 255, 255)',
      await bgOf(p, '[data-testid="studio-navbar"]'),
    )
    if (perspective === 'published') {
      await p.getByTestId('variants-button').click()
      await p.waitForTimeout(1200)
      log(
        'neutral navbar: the Variants dropdown is neutral too',
        (await bgOf(p, '[data-testid="address-picker"]')) !== 'rgb(231, 254, 245)' &&
          (await p.getByTestId('address-picker').evaluate((el) => {
            let e: HTMLElement | null = el as HTMLElement
            while (e) {
              const c = getComputedStyle(e).backgroundColor
              if (c !== 'rgba(0, 0, 0, 0)') return c
              e = e.parentElement
            }
            return ''
          })) === 'rgb(255, 255, 255)',
      )
    }
    await context.close()
  }
}

for (const width of [1440, 1280]) {
  const {p, context} = await open(DOC, width)
  log(`${width}: no perspective row or bar`, (await count(p, 'address-row')) === 0)
  log(
    `${width}: two controls: the stock state control and the Variants control`,
    /Drafts|Published/.test(await stateText(p)) && (await visible(p, 'variants-chip')),
  )
  log(
    `${width}: no second layer chip and no address chip (nothing of ours but Variants)`,
    (await count(p, 'row-version')) === 0 && (await count(p, 'chip-audience')) === 0,
  )
  log(
    `${width}: the Variants control shows one value and a cross`,
    /Returning visitors/.test(await text(p, 'variants-chip')) &&
      (await visible(p, 'variants-chip-remove')),
  )
  log(
    `${width}: the Variants control sits right after the state control`,
    (await x(p, '[data-testid="open-beta-variants"]')) > (await x(p, STATE)),
  )
  await p.screenshot({
    path: `journeys-captures/e9-openbeta/nav-${width}.png`,
    clip: {x: 0, y: 0, width, height: 140},
  })
  await context.close()
}

{
  const {p, context} = await open(DOC)
  // The Variants control: the same single dropdown on every click, no row, and every pick moves the global variant (the URL).
  const openControl = async () => {
    await p.getByTestId('variants-chip').getByRole('button').first().click()
    await p.waitForTimeout(900)
  }
  let first: string[] | null = null
  const picks = ['lapsed-customers', 'loyal-customers', 'members']
  for (let i = 0; i < 3; i++) {
    await openControl()
    const items = await visibleItems(p)
    first ??= items
    log(
      `Variants, click ${i + 1}: the same single dropdown opens (flat list, Default row)`,
      items.length >= 4 &&
        items.includes('picker-default-audience') &&
        JSON.stringify(items) === JSON.stringify(first) &&
        (await p.locator('[data-testid="address-picker"]:visible').count()) === 1,
      `${items.length} items`,
    )
    log(
      `Variants, click ${i + 1}: no row or bar appears, and nothing under the list`,
      (await count(p, 'address-row')) === 0 && (await count(p, 'picker-footer')) === 0,
    )
    await p.getByTestId(`picker-value-audience-${picks[i]}`).click()
    await p.waitForTimeout(2000)
    log(
      `Variants, pick ${i + 1}: the control updates and the global variant moves`,
      variantParam(p) === `aud-${picks[i]}` &&
        (await text(p, 'variants-chip')).length > 0 &&
        (await visibleItems(p)).length === 0,
      `variant=${variantParam(p)}, "${await text(p, 'variants-chip')}"`,
    )
  }
  await p.screenshot({
    path: 'journeys-captures/e9-openbeta/variants-control.png',
    clip: {x: 0, y: 0, width: 1440, height: 140},
  })
  await p.getByTestId('variants-chip-remove').click()
  await p.waitForTimeout(2000)
  log(
    'Variants: the cross clears to Default (no variant in the URL)',
    variantParam(p) === null &&
      (await count(p, 'variants-chip')) === 0 &&
      (await visible(p, 'variants-button')),
    `variant=${variantParam(p)}`,
  )
  await p.getByTestId('variants-button').click()
  await p.waitForTimeout(900)
  const again = await visibleItems(p)
  log(
    'Variants: after Default it opens the same list again',
    again.length === first!.length && again.includes('picker-default-audience'),
    `${again.length} items`,
  )
  await p.getByTestId('picker-default-audience').click()
  await p.waitForTimeout(1500)
  log(
    'Variants: the Default row keeps it cleared',
    variantParam(p) === null && (await visibleItems(p)).length === 0,
  )
  await p.getByTestId('variants-button').click()
  await p.waitForTimeout(900)
  await p.getByTestId('picker-value-audience-members').click()
  await p.waitForTimeout(2000)
  log(
    'Variants: a pick after Default moves the global variant again',
    variantParam(p) === 'aud-members',
    `variant=${variantParam(p)}`,
  )

  // The state control is the stock one: its own menu, every time, with no extra row of ours.
  const menuItems = () => p.locator('[role="menuitem"]:visible').count()
  let menu = -1
  for (let i = 0; i < 3; i++) {
    await p.getByTestId('global-perspective-menu-button').click()
    await p.waitForTimeout(900)
    const n = await menuItems()
    if (menu < 0) menu = n
    log(
      `state control, click ${i + 1}: the same menu opens, no "Add a dimension" or "View as" row`,
      n > 0 &&
        n === menu &&
        (await p.getByTestId('add-dimension').locator('visible=true').count()) === 0,
      `${n} items`,
    )
    await p.keyboard.press('Escape')
    await p.waitForTimeout(500)
  }

  // The state menu has a search once it holds more than 7 entries (Published, Drafts and releases; not the footer actions).
  const entries = () =>
    p.locator('[data-testid="release-menu"] [role="menuitem"]:visible').allInnerTexts()
  await p.getByTestId('global-perspective-menu-button').click()
  await p.waitForTimeout(900)
  const all = await entries()
  log(
    'state control: a menu of more than 7 entries shows a search field',
    (await visible(p, 'release-menu-search')) && all.length > 7,
    `${all.length} items`,
  )
  const menuSize = () =>
    p.getByTestId('release-menu').evaluate((el) => {
      const r = el.getBoundingClientRect()
      return `${Math.round(r.width)}x${Math.round(r.height)}`
    })
  const before = await menuSize()
  await p.getByTestId('release-menu-search').fill('e9')
  await p.waitForTimeout(600)
  const found = (await entries()).join('|')
  log(
    'state control, search: it filters the entries and hides the footer actions',
    /E9 review release/.test(found) &&
      /E9 base release/.test(found) &&
      !/Halloween/.test(found) &&
      !/New release|View Scheduled Drafts|View Content Releases/.test(found),
    found.replace(/\s+/g, ' ').slice(0, 120),
  )
  log(
    'state control, search: the menu keeps its size while filtering',
    (await menuSize()) === before,
    `${before} -> ${await menuSize()}`,
  )
  await p.getByTestId('release-menu-search').fill('zzzz')
  await p.waitForTimeout(600)
  log(
    'state control, search: nothing matches says so, at the same size',
    (await visible(p, 'release-menu-search-empty')) && (await menuSize()) === before,
  )
  await p.getByTestId('release-menu-search').fill('')
  await p.waitForTimeout(600)
  log(
    'state control, search: clearing restores every entry and the footer actions',
    (await entries()).length === all.length && /New release/.test((await entries()).join('|')),
  )
  await p.keyboard.press('Escape')
  await p.waitForTimeout(500)

  // The document header (Figma C2): the perspective circle and "<title> · N versions"; nothing else of the old header, no footer "Manage versions".
  // The per-spec-ID checks live in verify-header.mts.
  log(
    'document: follows global, no pane control, no toggle, no grouped pills, no variant chip',
    (await count(p, 'pane-control')) === 0 &&
      (await count(p, 'published-toggle')) === 0 &&
      (await count(p, 'pills-variants')) === 0 &&
      (await count(p, 'pills-releases')) === 0 &&
      (await count(p, 'variant-chip')) === 0 &&
      (await count(p, 'other-versions')) === 0,
  )
  log(
    'document: the circle (following global) and "<title> · N versions" sit in the header',
    (await visible(p, 'perspective-circle')) &&
      (await p.locator('[data-testid="perspective-circle"][data-local]').count()) === 0 &&
      /· \d+ versions?$/.test(await text(p, 'header-versions')),
    await text(p, 'header-versions'),
  )
  log(
    'document: no "Manage versions" in the footer, no Versions button in the header actions',
    !(await visible(p, 'action-document-group-inventory')) &&
      (await p.getByRole('button', {name: /^versions$/i}).count()) === 0,
  )
  await p.screenshot({
    path: 'journeys-captures/e9-openbeta/header-h1.png',
    clip: {x: 640, y: 55, width: 800, height: 120},
  })

  // The circle opens the bar (state, variant, Follow global perspective); a change makes the pane local; Follow global returns it.
  await p.getByTestId('perspective-circle').click()
  await p.waitForTimeout(900)
  log(
    'bar: the circle opens it with the state control, the variant control and Follow global perspective',
    (await visible(p, 'local-perspective-row')) &&
      (await visible(p, 'local-state')) &&
      (await visible(p, 'local-variants')) &&
      (await visible(p, 'local-follow-global')),
  )
  await p.getByTestId('local-state').click()
  await p.waitForTimeout(700)
  await p.getByRole('menuitem', {name: 'Published'}).first().click()
  await p.waitForTimeout(1500)
  log(
    'diverged: the pane holds its own address (the URL), the circle turns local, the global perspective did not move',
    decodeURIComponent(p.url()).includes('localPerspective=published') &&
      (await p.locator('[data-testid="perspective-circle"][data-local]').count()) === 1 &&
      /Draft/.test(await stateText(p)) &&
      variantParam(p) === 'aud-members',
  )
  await p.getByTestId('local-follow-global').click()
  await p.waitForTimeout(1500)
  log(
    'Follow global perspective: the pane follows again (no params, no local mark)',
    !decodeURIComponent(p.url()).includes('localPerspective') &&
      (await p.locator('[data-testid="perspective-circle"][data-local]').count()) === 0,
  )

  // Versions: the pill opens the inventory side panel.
  await p.getByTestId('header-versions').click()
  await p.waitForTimeout(2500)
  log(
    'Versions: the pill opens the inventory side panel',
    await visible(p, 'version-inventory-panel'),
  )
  await p.screenshot({path: 'journeys-captures/e9-openbeta/versions-panel.png'})
  await context.close()
}

{
  // Persistent across tools: the same two controls and the same variant in the Releases tool.
  const {p, context} = await open(DOC)
  await p.getByTestId('releases-tool-link').click()
  await p.waitForTimeout(5000)
  log(
    'tools: both controls stay in the navbar in the Releases tool',
    /Drafts|Published/.test(await stateText(p)) &&
      (await visible(p, 'variants-chip')) &&
      (await count(p, 'address-row')) === 0,
  )
  log(
    'tools: the variant is the same (global, not per tool)',
    /Returning visitors/.test(await text(p, 'variants-chip')),
    await text(p, 'variants-chip'),
  )
  await p.screenshot({
    path: 'journeys-captures/e9-openbeta/releases-tool.png',
    clip: {x: 0, y: 0, width: 1440, height: 300},
  })
  await context.close()
}

{
  // A reference pane opens following global; its own circle opens its own bar, for that pane only.
  const {p, context} = await open(REF)
  const circles = p.getByTestId('perspective-circle')
  log(
    'reference: it follows global (a dashed circle per pane, no bar, no local mark)',
    (await circles.count()) === 2 &&
      (await count(p, 'local-perspective-row')) === 0 &&
      (await p.locator('[data-testid="perspective-circle"][data-local]').count()) === 0,
    `${await circles.count()} circles`,
  )
  await circles.nth(1).click()
  await p.waitForTimeout(900)
  log(
    'reference: its circle opens the bar for that pane only',
    (await count(p, 'local-perspective-row')) === 1,
  )
  await p.getByTestId('local-state').click()
  await p.waitForTimeout(700)
  await p.getByRole('menuitem', {name: 'Published'}).first().click()
  await p.waitForTimeout(1800)
  const held = decodeURIComponent(p.url())
  log(
    'reference: changing the address gives the pane its own (the URL holds it) and the circle turns local',
    held.includes('localPerspective=published') &&
      (await p.locator('[data-testid="perspective-circle"][data-local]').count()) === 1,
    held.split('/structure/')[1]?.slice(0, 110),
  )
  log(
    'reference: the global perspective did not move',
    /Returning visitors/.test(await text(p, 'variants-chip')) && /Draft/.test(await stateText(p)),
  )
  await p.screenshot({path: 'journeys-captures/e9-openbeta/reference-local.png'})
  await p.getByTestId('local-follow-global').click()
  await p.waitForTimeout(1800)
  log(
    'reference: Follow global perspective returns it to global',
    !decodeURIComponent(p.url()).includes('localPerspective') &&
      (await p.locator('[data-testid="perspective-circle"][data-local]').count()) === 0,
  )
  await context.close()
}

await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
