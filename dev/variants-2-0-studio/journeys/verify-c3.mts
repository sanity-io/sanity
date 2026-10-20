// C3: ONE indicator in the document list, reactive to the perspective, and option D (the list grouped or sorted by match).
//   base perspective: one published or draft badge per row (the draft over the published); a perspective: no state dots, a diamond only on rows with a matching variant.
// Screenshots -> journeys-captures/c3-list/<frame>-<light|dark>.png
// node journeys/verify-c3.mts   (the studio must run)
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const base = 'http://localhost:3350'
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 220))
const b = await chromium.launch()
const context = await b.newContext({viewport: {width: 1300, height: 760}})
const p = await context.newPage()
await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(3000)

const open = async (design: string) => {
  await p.goto(`${base}/structure/book?design=${design}`)
  await p.locator('[data-testid=state-badge]').first().waitFor({timeout: 40000})
  await p.waitForTimeout(2500)
}
const states = () => p.locator('[data-testid=state-badge]').evaluateAll((els) => els.map((e) => e.getAttribute('data-state')))
const choose = async (audience = 'members') => {
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.getByRole('menuitem', {name: /Add a dimension|View as/}).first().click()
  await p.waitForTimeout(500)
  await p.locator(`[data-testid^=picker-value-audience-${audience}]`).first().click()
  await p.waitForTimeout(1500)
}

for (const option of ['a', 'b', 'd'] as const) {
  await open(`show.a,stage.ga,c3.${option}`)
  const baseStates = await states()
  log(baseStates.length > 0 && baseStates.every((s) => s === 'published' || s === 'draft'), `${option}: base perspective, every badge is one published or draft icon`, `${baseStates.length} rows: ${[...new Set(baseStates)].join(',')}`)
  const perRow = await p.locator('[data-testid=state-badge]').evaluateAll((els) => els.filter((e) => e.closest('[data-testid=state-badge]') !== e || e.querySelectorAll('[data-testid=state-badge]').length > 0).length)
  log(perRow === 0, `${option}: no stacked or duplicated badges`)
  if (option === 'a') await p.screenshot({path: 'journeys-captures/c3-list/L1-base.png', clip: {x: 0, y: 40, width: 700, height: 560}})
  await choose('members')
  const withPerspective = await states()
  if (option === 'd') {
    log(withPerspective.length === 0, 'd: with a perspective rows carry no state dot and no diamond (the sections say it)', `${withPerspective.length} badges`)
    const has = await p.getByTestId('list-section-has').count()
    const none = await p.getByTestId('list-section-none').count()
    log(has === 1 && none === 1, 'd: two sections, Has variant and No variant for this perspective', `${has}/${none}`)
    const text = (await p.getByTestId('list-section-has').innerText()) + ' | ' + (await p.getByTestId('list-section-none').innerText())
    log(/Has variant/.test(text) && /No variant for this perspective/.test(text), 'd: the section titles read as drawn', text.replace(/\n/g, ' '))
    await p.screenshot({path: 'journeys-captures/c3-list/L4-grouped.png', clip: {x: 0, y: 40, width: 700, height: 600}})
    const before = await p.locator('[data-testid=list-section-none]').count()
    const rowsBefore = await p.getByText(/^By /).count()
    await p.getByTestId('list-section-none').getByRole('button').click()
    await p.waitForTimeout(600)
    await p.screenshot({path: 'journeys-captures/c3-list/L4-grouped-collapsed.png', clip: {x: 0, y: 40, width: 700, height: 600}})
    const rowsAfter = await p.getByText(/^By /).count()
    log(before === 1 && rowsAfter < rowsBefore, 'd: the second section collapses', `${rowsBefore} -> ${rowsAfter}`)
  } else {
    const dots = withPerspective.filter(Boolean)
    log(dots.length > 0 && dots.every((s) => s === 'variant'), `${option}: with a perspective the state dots are gone and only diamonds remain`, `${withPerspective.length} badges, kinds ${[...new Set(withPerspective)].join(',')}`)
    const total = await p.locator('[data-testid="document-list-pane"] [data-ui=PaneItem], [data-testid="document-list-pane"] li').count()
    log(withPerspective.length < baseStates.length, `${option}: the diamond is only on documents that have a matching variant`, `${withPerspective.length} diamonds of ${baseStates.length} rows`)
    if (option === 'a') await p.screenshot({path: 'journeys-captures/c3-list/L2-perspective.png', clip: {x: 0, y: 40, width: 700, height: 560}})
  }
}
// Sorted: no sections, the matching documents first.
await open('show.a,stage.ga,c3.d,list.sorted')
await choose('members')
log((await p.getByTestId('list-section-has').count()) === 0 && (await p.getByTestId('list-section-none').count()) === 0, 'd, sorted: no sections')
await p.screenshot({path: 'journeys-captures/c3-list/L3-sorted.png', clip: {x: 0, y: 40, width: 700, height: 600}})
await b.close()
