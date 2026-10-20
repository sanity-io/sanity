// The two C1 layout switches. Row layout (left | right | center) places the "Showing + chips" group and the actions (Add dimension, Clear);
// Pill when the row is open (summary | count) decides what the top-right pill and option B's Variants button show while the row is visible.
// Screenshots: rest, one, three and four chips in each layout, light -> journeys-captures/c1-layout/<layout>-<n>.png
// node journeys/verify-layout.mts   (the studio must run)
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const base = 'http://localhost:3350'
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 200))
mkdirSync('journeys-captures/c1-layout', {recursive: true})
const b = await chromium.launch()
const context = await b.newContext({viewport: {width: 1300, height: 560}})
const p = await context.newPage()
await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(3000)

const open = async (design: string) => {
  await p.goto(`${base}/structure/book;book-lighthouse?design=${design}`)
  await p.locator('[data-ui=ReleasesNav] button').last().waitFor({timeout: 40000})
  await p.waitForTimeout(2500)
}
const DIMS = ['audience', 'locale', 'market', 'channel']
const addChips = async (n: number) => {
  // The first click opens the version menu's extra row; later chips come from Add dimension.
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.getByRole('menuitem', {name: /Add a dimension|View as/}).first().click()
  for (let i = 0; i < n; i++) {
    if (i > 0) await p.locator('[data-testid=row-add]').click()
    await p.waitForTimeout(400)
    await p.locator(`[data-testid^=picker-value-${DIMS[i]}-]`).first().click()
    await p.waitForTimeout(500)
  }
}
const rect = async (sel: string) => p.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, w: r.width} })

const layouts = ['left', 'actionsRight', 'centered'] as const
for (const layout of layouts) {
  await open(`show.a,stage.ga,dim.4,rowWidth.a${layout === 'centered' ? '' : `,rowlayout.${layout}`}`)
  await addChips(1)
  const row = await rect('[data-testid=address-row]')
  const group = await rect('[data-testid=address-row-group]')
  const chips = await p.locator('[data-testid^=chip-]:not([data-testid$=-remove])').first().evaluate((e) => e.getBoundingClientRect().left)
  const actions = await rect('[data-testid=address-row-actions]')
  const dataLayout = await p.locator('[data-testid=address-row-layout]').getAttribute('data-layout')
  log(dataLayout === layout, `${layout}: the row reports its layout`, String(dataLayout))
  if (layout === 'left') log(actions.l - (chips + 0) < 520 && actions.r < row.r - 150, 'left: Add dimension and Clear follow the chips (not pinned to the edge)', `chips ${Math.round(chips)}, actions ${Math.round(actions.l)}-${Math.round(actions.r)}, row ${Math.round(row.r)}`)
  if (layout === 'actionsRight') log(row.r - actions.r < 40 && chips - row.l < 200, 'right: chips left, Add dimension and Clear pinned to the right edge', `chips ${Math.round(chips)}, actions ${Math.round(actions.l)}-${Math.round(actions.r)}, row ${Math.round(row.r)}`)
  if (layout === 'centered') {
    const mid = (group.l + group.r) / 2
    log(Math.abs(mid - (row.l + row.r) / 2) < 60 && row.r - actions.r < 40, 'center: the Showing + chips group is centred, the actions are pinned right', `group centre ${Math.round(mid)}, row centre ${Math.round((row.l + row.r) / 2)}, actions end ${Math.round(actions.r)} of ${Math.round(row.r)}`)
  }
}

// Shots: rest, 1, 3, 4 chips in each layout.
const shoot = async (layout: string, n: number) => p.screenshot({path: `journeys-captures/c1-layout/${layout}-${n}chips.png`, clip: {x: 0, y: 0, width: 1300, height: 190}})
for (const layout of layouts) {
  const url = `show.a,stage.ga,dim.4,rowWidth.a${layout === 'centered' ? '' : `,rowlayout.${layout}`}`
  await open(url)
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.getByRole('menuitem', {name: /Add a dimension|View as/}).first().click()
  await p.waitForTimeout(500)
  await p.keyboard.press('Escape')
  await shoot(layout, 0)
  for (const n of [1, 3, 4]) {
    await open(url)
    await addChips(n)
    await shoot(layout, n)
  }
}

// Pill label: count (default) vs summary; row open vs hidden.
await open('show.a,stage.ga,dim.4')
await addChips(2)
const pill = p.locator('[data-ui=ReleasesNav]').first()
log((await p.locator('[data-testid=pill-count]').count()) === 1 && (await p.locator('[data-testid=pill-values]').count()) === 0, 'count (default): with the row open the pill shows the version and a count', (await pill.innerText()).replace(/\n/g, ' '))
log(/Drafts\s*·\s*2/.test((await pill.innerText()).replace(/\n/g, ' ')), 'count: the text reads "Drafts · 2"')
await p.locator('[title="Hide the variants row"]').first().click() // the label toggles the row
await p.waitForTimeout(500)
log((await p.locator('[data-testid=pill-values]').count()) === 1 && (await p.locator('[data-testid=pill-count]').count()) === 0, 'count: with the row hidden the pill shows the full summary', (await pill.innerText()).replace(/\n/g, ' '))
await open('show.a,stage.ga,dim.4,pill.summary')
await addChips(2)
log((await p.locator('[data-testid=pill-values]').count()) === 1 && (await p.locator('[data-testid=pill-count]').count()) === 0, 'summary: with the row open the pill still shows the full summary')
// Option B's Variants button.
await open('show.b,stage.ga,dim.4')
await p.locator('[data-testid=variants-button]').click()
await p.locator('[data-testid^=picker-value-audience-]').first().click()
await p.waitForTimeout(600)
const hiddenText = (await p.locator('[data-testid=variants-button]').innerText()).trim()
log(hiddenText.length > 1, 'B, count: with the row hidden the Variants button shows the value names', hiddenText)
await p.locator('[data-testid=variants-button]').click() // the chevron shows the row
await p.waitForTimeout(500)
const vb = (await p.locator('[data-testid=variants-button]').innerText()).trim()
log(/^1$/.test(vb), 'B, count: with the row open the Variants button shows only the count', vb)
await open('show.b,stage.ga,dim.4,pill.summary')
await p.locator('[data-testid=variants-button]').click()
await p.locator('[data-testid^=picker-value-audience-]').first().click()
await p.waitForTimeout(600)
const vb2 = (await p.locator('[data-testid=variants-button]').innerText()).trim()
log(vb2.length > 1, 'B, summary: the Variants button keeps the value names', vb2)
await b.close()
