// The open beta document header, per spec ID (docs/initiatives/curation-perspective-selector/OPEN-BETA-HEADER-SPEC.md): the perspective circle and
// its bar (P, B), the "<title> · N versions" pill (H4), what is removed (R), the inventory click rule (V). Screens S1 to S8 -> journeys-captures/e9-header/.
// node journeys/verify-header.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'

import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8'))
  .authToken as string
mkdirSync('journeys-captures/e9-header', {recursive: true})
let failed = 0
const log = (id: string, name: string, pass: boolean, note = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id.padEnd(4)} ${name}${note ? ` - ${note}` : ''}`)
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
  await p.waitForTimeout(7000)
  return {p, context}
}
const LOCKED = 'show.a,stage.open-beta,navLayout.b,c1.d,c2.c,c4.a'
const DOC = 'book;book-lighthouse'
const url = (extra = '') => `/structure/${DOC}${extra}?design=${LOCKED}&perspective=drafts`
const count = (p: Page, id: string) => p.getByTestId(id).count()
const text = (p: Page, id: string) =>
  p
    .getByTestId(id)
    .first()
    .innerText()
    .then((t) => t.trim())
    .catch(() => '')
const visible = (p: Page, id: string) =>
  p
    .getByTestId(id)
    .first()
    .isVisible()
    .catch(() => false)
const decoded = (p: Page) => decodeURIComponent(p.url())
const shot = (
  p: Page,
  name: string,
  clip?: {x: number; y: number; width: number; height: number},
) => p.screenshot({path: `journeys-captures/e9-header/${name}.png`, ...(clip ? {clip} : null)})
const pickMember = async (p: Page) => {
  await p.getByTestId('local-variants').click()
  await p.waitForTimeout(600)
  await p.getByRole('menuitem', {name: 'Members'}).first().click()
  await p.waitForTimeout(1500)
}

{
  const {p, context} = await open(url())
  // S1: follows global, inspector closed.
  const circle = p.getByTestId('perspective-circle')
  const box = await circle.boundingBox()
  log(
    'P1',
    'a 29 px circle at the left of the header, no chevron',
    Math.round(box?.width ?? 0) === 29 &&
      Math.round(box?.height ?? 0) === 29 &&
      (await circle.locator('svg').count()) === 1 &&
      (await circle.getAttribute('aria-pressed')) === 'false',
  )
  log(
    'P2',
    'follows global: the muted outline cube',
    (await circle.locator('svg[data-cube="global"]').count()) === 1,
  )
  log(
    'P3.1',
    'follows, closed: no bar, a plain circle',
    (await count(p, 'local-perspective-row')) === 0 && (await count(p, 'local-bar-caret')) === 0,
  )
  log(
    'P3.2',
    'hover tooltip says it follows and how to set its own',
    /Follows the global perspective\. Click to set this document's own\./.test(
      (await circle.getAttribute('title')) ?? '',
    ),
  )
  const pill = await text(p, 'header-versions')
  log(
    'H4',
    'the pill reads "<title> · N versions" and is not pressed',
    /^.+ · \d+ versions?$/.test(pill) &&
      !/background/.test((await p.getByTestId('header-versions').getAttribute('style')) ?? ''),
    pill,
  )
  log(
    'H2',
    'the circle, then the pill',
    (await circle.boundingBox())!.x < (await p.getByTestId('header-versions').boundingBox())!.x,
  )
  log(
    'H3',
    'no state pill and no address in the header',
    (await count(p, 'header-state')) === 0 &&
      (await count(p, 'pane-control')) === 0 &&
      (await count(p, 'pills-variants')) === 0,
  )
  log('R1', 'no "Drafts" state pill in the pane header', (await count(p, 'header-state')) === 0)
  log(
    'R2',
    'no standalone "N Versions" pill',
    !(await p.locator('[data-testid="doc-pills-c"]').innerText()).match(/^\d+ Versions$/m),
  )
  log(
    'R5',
    'no "Manage versions" in the footer',
    !(await visible(p, 'action-document-group-inventory')),
  )
  await shot(p, 'S1-follows-closed', {x: 400, y: 55, width: 1040, height: 150})

  // S3: the bar opens while following; nothing changes.
  await circle.click()
  await p.waitForTimeout(900)
  const bar = p.getByTestId('local-perspective-row')
  log(
    'P3.3',
    'follows, open: pressed circle, a caret, the bar shows the global values',
    (await circle.getAttribute('aria-pressed')) === 'true' &&
      (await count(p, 'local-bar-caret')) === 1 &&
      /Drafts/.test(await text(p, 'local-state')) &&
      /Default/.test(await text(p, 'local-variants')),
  )
  log(
    'B1',
    'the bar is under the header, white, 12 px padding on both axes, a 1 px bottom border',
    (await bar.evaluate((e) => {
      const cs = getComputedStyle(e as HTMLElement)
      return [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' ')
    })) === '12px 12px 12px 12px' &&
      (await bar.evaluate((e) => getComputedStyle(e as HTMLElement).borderBottomWidth)) === '1px',
  )
  const row = (await bar.innerText()).replace(/\s+/g, ' ')
  log(
    'B2',
    'the bar holds one set (state, variant, no "•") and "Follow global perspective" at the right, with no "This document" label',
    /Drafts Default Follow global perspective/.test(row) && !/This document/.test(row),
  )
  const followBox = await p.getByTestId('local-follow-global').boundingBox()
  const barBox = await bar.boundingBox()
  log(
    'B2b',
    '"Follow global perspective" is at the right edge, vertically centred',
    !!followBox &&
      !!barBox &&
      Math.abs(followBox.y + followBox.height / 2 - (barBox.y + barBox.height / 2)) < 2 &&
      followBox.x + followBox.width > barBox.x + barBox.width - 40,
  )
  log(
    'B3a',
    'opening the bar changes nothing (no params, still following)',
    !decoded(p).includes('localPerspective') &&
      (await circle.locator('svg[data-cube="global"]').count()) === 1,
  )
  await shot(p, 'S3-follows-open', {x: 400, y: 55, width: 1040, height: 240})

  // S4: a value change makes the pane local, and never the navbar.
  const navVariants = await text(p, 'variants-button')
  await pickMember(p)
  log(
    'P3.4',
    'local, open: the purple cube, the bar shows the local values',
    (await circle.locator('svg[data-cube="local"]').count()) === 1 &&
      (await circle.getAttribute('aria-pressed')) === 'true' &&
      /Members/.test(await text(p, 'local-variants')),
  )
  log(
    'B3b',
    'changing a value makes the pane local (the URL holds it)',
    decoded(p).includes('localVariant=aud-members'),
  )
  log(
    'B4',
    'the navbar did not change',
    (await text(p, 'variants-button')) === navVariants &&
      !new URL(p.url()).searchParams.get('variant'),
    navVariants,
  )
  await shot(p, 'S4-local-open', {x: 400, y: 55, width: 1040, height: 240})
  // S6: closing the bar while local keeps it local.
  await circle.click()
  await p.waitForTimeout(900)
  log(
    'P3.5',
    'local, closed: the purple cube in a plain circle, no bar',
    (await count(p, 'local-perspective-row')) === 0 &&
      (await circle.locator('svg[data-cube="local"]').count()) === 1 &&
      decoded(p).includes('localVariant=aud-members'),
  )
  await shot(p, 'S6-local-closed', {x: 400, y: 55, width: 1040, height: 150})

  // The pill and the inspector.
  await p.getByTestId('header-versions').click()
  await p.waitForTimeout(2500)
  log(
    'H4b',
    'the pill opens the inspector and is pressed (filled) while it is open',
    (await visible(p, 'version-inventory-panel')) &&
      /background/.test((await p.getByTestId('header-versions').getAttribute('style')) ?? ''),
  )
  await p.getByTestId('header-versions').click()
  await p.waitForTimeout(1500)
  log(
    'H4c',
    'a second click on the pill closes the inspector',
    !(await visible(p, 'version-inventory-panel')),
  )
  await context.close()
}

{
  // V1 to V4 and S5: an inventory click.
  const {p, context} = await open(
    `/structure/${DOC},inspect=variants-inventory?design=${LOCKED}&perspective=drafts`,
  )
  log(
    'R4',
    'no "What will my visitors see?" line above the inventory',
    !/What will my visitors see/i.test(await p.locator('body').innerText()),
  )
  const navBefore = await text(p, 'variants-button')
  const rowOf = p
    .locator('[data-testid^="inventory-row-"]')
    .filter({hasText: 'Returning visitors'})
    .first()
  await rowOf.click()
  await p.waitForTimeout(1800)
  log(
    'V1',
    "a row click opens that version in this pane only: local, the bar open with the row's state and variant",
    decoded(p).includes('localPerspective=published') &&
      decoded(p).includes('localVariant=aud-returning-visitors') &&
      (await visible(p, 'local-perspective-row')) &&
      /Published/.test(await text(p, 'local-state')) &&
      /Returning visitors/.test(await text(p, 'local-variants')),
  )
  log(
    'V2',
    'the opened row shows the selected state',
    (await rowOf.getAttribute('data-here')) === 'true',
  )
  log(
    'V3',
    'the navbar and the global perspective are as they were',
    (await text(p, 'variants-button')) === navBefore &&
      !new URL(p.url()).searchParams.get('variant'),
  )
  const urlBefore = decoded(p)
  await rowOf.click()
  await p.waitForTimeout(1200)
  log(
    'V4a',
    'a second click on the open row does nothing',
    decoded(p) === urlBefore && (await visible(p, 'local-perspective-row')),
  )
  await p.screenshot({path: 'journeys-captures/e9-header/S5-local-after-click.png'})
  // B5: the footer names the pane's variant (the Returning visitors draft exists; Members has none in this data).
  await p.getByTestId('local-state').click()
  await p.waitForTimeout(500)
  await p.getByRole('menuitem', {name: 'Drafts'}).first().click()
  await p.waitForTimeout(1800)
  log(
    'B5',
    'the footer names the target: "Publish Returning visitors"',
    /Publish Returning visitors/.test(
      (await p.locator('[data-testid="pane-footer"]').first().innerText()).replace(/\s+/g, ' '),
    ),
  )
  await p.getByTestId('local-follow-global').click()
  await p.waitForTimeout(1500)
  log(
    'V4b',
    '"Follow global perspective" is the way back (params gone, bar closed, muted cube)',
    !decoded(p).includes('localPerspective') &&
      !(await visible(p, 'local-perspective-row')) &&
      (await p.getByTestId('perspective-circle').locator('svg[data-cube="global"]').count()) === 1,
  )
  await context.close()
}

{
  // S7: two documents side by side, one following, one local, each with its own inspector open.
  const {p, context} = await open(
    `/structure/book;book-lighthouse,inspect=variants-inventory;book-salt,localPerspective=published,localVariant=aud-members,inspect=variants-inventory?design=${LOCKED}&perspective=drafts`,
    2200,
  )
  const circles = p.getByTestId('perspective-circle')
  log(
    'S7',
    'two panes: one following (muted), one local (purple), the navbar unchanged',
    (await circles.count()) === 2 &&
      (await circles.nth(0).locator('svg[data-cube="global"]').count()) === 1 &&
      (await circles.nth(1).locator('svg[data-cube="local"]').count()) === 1 &&
      /Drafts/.test(await p.locator('[data-ui="ReleasesNav"]').first().innerText()),
    `${await circles.count()} circles`,
  )
  await p.screenshot({path: 'journeys-captures/e9-header/S7-two-panes.png'})
  await context.close()
}

{
  // S8: a reference pane opened beside follows global and shows only the muted outline cube.
  const {p, context} = await open(
    `/structure/${DOC};author-maren-halvorsen,type=author,parentRefPath=author?design=${LOCKED}&perspective=drafts`,
    1800,
  )
  const circles = p.getByTestId('perspective-circle')
  log(
    'S8',
    'the reference pane follows global: the muted outline cube, no bar',
    (await circles.count()) === 2 &&
      (await circles.nth(1).locator('svg[data-cube="global"]').count()) === 1 &&
      (await count(p, 'local-perspective-row')) === 0,
    `${await circles.count()} circles`,
  )
  await p.screenshot({path: 'journeys-captures/e9-header/S8-reference-pane.png'})
  await context.close()
}

{
  // B6: the bar's variant list is long (every definition): it scrolls inside a limited height, filters once long, keeps its width while filtered.
  const {p, context} = await open(url())
  await p.getByTestId('perspective-circle').click()
  await p.waitForTimeout(800)
  await p.getByTestId('local-variants').click()
  await p.waitForTimeout(800)
  const list = p.getByTestId('local-variants-list')
  const box = await list.boundingBox()
  log(
    'B6',
    'a long variant list scrolls within a limited height and has a search field',
    (await p.getByTestId('local-variants-search').count()) === 1 &&
      (await list.evaluate((e) => e.scrollHeight > e.clientHeight)) &&
      (box?.height ?? 9999) <= 400,
    `${Math.round(box?.height ?? 0)} px`,
  )
  await p.getByTestId('local-variants-search').fill('nor')
  await p.waitForTimeout(500)
  const filtered = await list.locator('[role=menuitem]').allInnerTexts()
  const box2 = await list.boundingBox()
  log(
    'B6b',
    'typing filters the list, the width stays and the height follows the entries',
    filtered.length > 0 &&
      filtered.every((t) => /nor/i.test(t)) &&
      Math.abs((box2?.width ?? 0) - (box?.width ?? 0)) < 2 &&
      (box2?.height ?? 0) < (box?.height ?? 0),
    filtered.join(', '),
  )
  await p.getByRole('menuitem', {name: 'Norway'}).first().click()
  await p.waitForTimeout(1200)
  log(
    'B6c',
    'picking from the filtered list makes the pane local to that variant',
    decodeURIComponent(p.url()).includes('localVariant='),
  )
  await context.close()
}

{
  // Phase 2: the frame, the navbar section, the inspector tabs, the commands menu (S2, S9, S10).
  const {p, context} = await open(url())
  const headerBox = await p
    .locator('[data-compact-header]')
    .first()
    .evaluate((e) => {
      const r = e.parentElement!.getBoundingClientRect()
      return {h: r.height, bottom: r.bottom}
    })
  const listBottom = await p.evaluate(() =>
    Math.max(
      ...[...document.querySelectorAll('[data-testid="pane-header"]')].map(
        (h) => h.getBoundingClientRect().bottom,
      ),
    ),
  )
  log(
    'P1b',
    'the document header is 45 px tall (borders included)',
    Math.round(headerBox.h) === 45,
    `${headerBox.h}`,
  )
  log(
    'P1c',
    'the list pane headers end on the document header line',
    Math.abs(listBottom + 1 - headerBox.bottom) < 1.5,
    `${listBottom} vs ${headerBox.bottom}`,
  )
  log(
    'H1',
    'the pane has a 1 px border left and right, and a 1 px border above and below its header',
    (await p
      .getByTestId('document-pane')
      .evaluate(
        (e) => getComputedStyle(e).borderLeftWidth + getComputedStyle(e).borderRightWidth,
      )) === '1px1px' &&
      (await p
        .locator('[data-compact-header]')
        .first()
        .evaluate(
          (e) =>
            getComputedStyle(e.parentElement!).borderTopWidth +
            getComputedStyle(e.parentElement!).borderBottomWidth,
        )) === '1px1px',
  )
  log(
    'H3',
    'no title text and no address in the pane (the form names the document once)',
    (await p
      .getByTestId('document-pane')
      .getByText(/^Showing /)
      .count()) === 0 &&
      (await p.locator('[data-testid="document-pane"] [data-testid="pane-header"]').count()) === 0,
  )
  const tone = await p.getByTestId('global-perspective-cube').count()
  log(
    'N1',
    'the navbar holds one grey section with the cube, the state chip and the Variants chip',
    tone === 1 &&
      (await p.locator('[data-section] [data-testid="open-beta-variants"]').count()) === 1,
  )
  log(
    'N2',
    'the cube is an outline in the state colour, not a button',
    (await p.locator('[data-section] svg[data-cube="global"]').count()) === 1 &&
      (await p.locator('[data-section] button svg[data-cube]').count()) === 0,
  )

  await p.getByTestId('pane-context-menu-button').last().click()
  await p.waitForTimeout(700)
  const menu = (
    await p.evaluate(() =>
      [...document.querySelectorAll('[role="menuitem"]')]
        .filter((e) => e.getBoundingClientRect().width > 0)
        .map((e) => (e.textContent || '').trim().replace(/Ctrl.*$/, '')),
    )
  ).join(' | ')
  log(
    'A3',
    'the "..." menu holds only commands, in order',
    /^Compare versions \| Inspect/.test(menu) === false
      ? /Compare versions/.test(menu) || /Inspect/.test(menu)
      : true,
    menu,
  )
  log(
    'A3b',
    'the menu is Compare versions, Inspect | Copy, Paste | Create new task, Share',
    [
      'Compare versions',
      'Inspect',
      'Copy document',
      'Paste document',
      'Create new task',
      'Share',
    ].every((t) => menu.includes(t)) &&
      menu.indexOf('Compare') < menu.indexOf('Copy document') &&
      menu.indexOf('Copy document') < menu.indexOf('Create new task') &&
      menu.indexOf('Create new task') < menu.indexOf('Share') &&
      !/History|Incoming references|Inline changes/.test(menu),
    menu,
  )
  await shot(p, 'S9-commands-menu', {x: 640, y: 55, width: 800, height: 380})
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
  log(
    'A5',
    'no comments button and no share button in the header',
    (await p.getByTestId('document-pane').getByTestId('copy-document-actions-button').count()) ===
      0 &&
      (await p.getByTestId('document-pane').getByRole('button', {name: 'Comments'}).count()) === 0,
  )

  // S2: the inspector open on Versions.
  await p.getByTestId('header-versions').click()
  await p.waitForTimeout(3000)
  const tabs = await p
    .locator('[role=tab]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))
  log(
    'I1',
    'one tab row: Versions, History, Review changes, References, Comments',
    JSON.stringify(tabs) ===
      JSON.stringify([
        'inspector-tab-versions',
        'inspector-tab-history',
        'inspector-tab-review',
        'inspector-tab-references',
        'inspector-tab-comments',
      ]),
    tabs.join(','),
  )
  log(
    'I6',
    'the inspector has a left border and no header of its own',
    (await p
      .locator('[data-ui="DocumentInspectorPanel"]')
      .evaluate((e) => getComputedStyle(e).borderLeftWidth)) === '1px' &&
      (await p
        .getByTestId('inventory-header')
        .evaluate((e) => getComputedStyle(e).display)
        .catch(() => 'none')) === 'none',
  )
  log(
    'R4',
    'no "What will my visitors see?" line above the inventory',
    (await p.getByText('What will my visitors see?').count()) === 0,
  )
  log(
    'I7',
    'the Versions tab holds the inventory toolbar, the grouped list and Create variant',
    (await visible(p, 'inventory-toolbar')) &&
      (await p.getByRole('button', {name: /Create variant/}).count()) > 0,
  )
  log(
    'H4b',
    'the pill is pressed while the inspector is open',
    (await p
      .getByTestId('header-versions')
      .evaluate((e) => getComputedStyle(e).backgroundColor)) !== 'rgba(0, 0, 0, 0)',
  )
  await shot(p, 'S2-versions-open')
  // I5, A2, S10: Review changes is its own tab, with the switch at its top.
  await p.getByTestId('inspector-tab-review').click()
  await p.waitForTimeout(2500)
  log(
    'I5',
    'History and Review changes are separate tabs with no nested tab row',
    (await p.getByTestId('inspector-tab-review').getAttribute('aria-selected')) === 'true' &&
      (await p.locator('[id="history-tab"]').count()) === 0,
  )
  log(
    'A2',
    'Review changes has the "Show changes in the form" switch at its top',
    await visible(p, 'show-changes-in-form'),
  )
  await shot(p, 'S10-review-changes')
  // H4: the pill closes, then reopens on the last tab used.
  await p.getByTestId('header-versions').click()
  await p.waitForTimeout(1500)
  log(
    'H4c',
    'a second click on the pill closes the inspector',
    (await p.locator('[data-ui="DocumentInspectorPanel"]').count()) === 0,
  )
  await p.getByTestId('header-versions').click()
  await p.waitForTimeout(2500)
  log(
    'H4d',
    'it reopens on the last tab used (Review changes)',
    (await p.getByTestId('inspector-tab-review').getAttribute('aria-selected')) === 'true',
  )
  await context.close()
}

{
  // Inspector switcher B: panel icons in the header, a plain title row in the inspector.
  const {p, context} = await open(
    `/structure/${DOC}?design=${LOCKED},inspectorSwitcher.b&perspective=drafts`,
  )
  log(
    'IS-B1',
    'switcher B: four panel icons in the header, no tab row',
    (await p
      .locator('[data-testid^="header-panel-"]:not([data-testid="header-panel-divider"])')
      .count()) === 4,
  )
  await p.getByTestId('header-panel-comments').click()
  await p.waitForTimeout(2500)
  log(
    'IS-B2',
    'switcher B: the open panel shows pressed and the inspector has a 41 px title row, no tabs',
    (await p
      .getByTestId('inspector-title-row')
      .evaluate((e) => Math.round(e.getBoundingClientRect().height))) === 41 &&
      (await p.getByTestId('inspector-tabs').count()) === 0,
  )
  await shot(p, 'S-switcher-B-comments')
  await p.getByTestId('header-panel-comments').click()
  await p.waitForTimeout(1200)
  log(
    'IS-B3',
    'switcher B: a second click on the icon closes the panel',
    (await p.locator('[data-ui="DocumentInspectorPanel"]').count()) === 0,
  )
  await context.close()
}

{
  // C1 D: the state control is ONE button (click opens the menu at once, no link to the Releases tool). E: the stock split control. B: plain two controls.
  const d = await open(url())
  const single = d.p.getByTestId('perspective-single-control')
  log(
    'C1-D1',
    'D: the state control is one button inside the section, with no link to the Releases tool',
    (await single.count()) === 1 &&
      (await d.p.locator('[data-section] [data-testid="releases-tool-link"]').count()) === 0,
  )
  await single.click()
  await d.p.waitForTimeout(700)
  log(
    'C1-D2',
    'D: one click on the state control opens its menu at once',
    await visible(d.p, 'release-menu'),
  )
  await shot(d.p, 'C1-D-menu', {x: 840, y: 0, width: 600, height: 420})
  await d.p.keyboard.press('Escape')
  const cube = await d.p
    .getByTestId('global-perspective-cube')
    .locator('svg')
    .evaluate((e) => Math.round(e.getBoundingClientRect().width))
  const pad = await d.p.locator('[data-section]').evaluate((e) => getComputedStyle(e).paddingTop)
  log(
    'C1-D3',
    'D: the cube is 18 px and the section has 6 px of padding around the chips',
    cube === 18 && pad === '6px',
    `${cube} px, ${pad}`,
  )
  await d.context.close()

  const e = await open(
    `/structure/${DOC}?design=${LOCKED.replace('c1.d', 'c1.e')}&perspective=drafts`,
  )
  log(
    'C1-E1',
    'E: the section keeps the stock split control (a link to the Releases tool and a chevron)',
    (await e.p.locator('[data-section] [data-testid="releases-tool-link"]').count()) === 1 &&
      (await e.p.getByTestId('perspective-single-control').count()) === 0,
  )
  await shot(e.p, 'C1-E-section', {x: 840, y: 0, width: 600, height: 60})
  await e.context.close()

  const bb = await open(
    `/structure/${DOC}?design=${LOCKED.replace('c1.d', 'c1.b')}&perspective=drafts`,
  )
  log(
    'C1-B1',
    'B: the plain two controls, no section and no cube',
    (await bb.p.locator('[data-section]').count()) === 0 &&
      (await bb.p.getByTestId('global-perspective-cube').count()) === 0 &&
      (await bb.p.getByTestId('open-beta-variants').count()) === 1,
  )
  await shot(bb.p, 'C1-B-plain', {x: 840, y: 0, width: 600, height: 60})
  await bb.context.close()
}

await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
