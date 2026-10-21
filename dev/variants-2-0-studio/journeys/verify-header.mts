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
const LOCKED = 'show.a,stage.open-beta,navLayout.b,c1.b,c2.c,c4.a'
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

await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
