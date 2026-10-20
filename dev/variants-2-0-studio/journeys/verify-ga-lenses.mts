// GA lenses: the stage gate on the lens switch, the Dimension coverage matrix, the Visitor lens. Read only.
// node journeys/verify-ga-lenses.mts   (both servers must run)
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 240))
const base = 'http://localhost:3350'
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1456, height: 900}})).newPage()
await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(3500)
const radios = () => p.locator('[data-testid=c5-a] button[role=radio]', {hasText: /^(Document|Definition|Dimension|Visitor)$/})
try {
  // 1. Gate: Open beta shows two lenses, GA shows four.
  await p.goto(`${base}/inventory?preset=open-beta-a`)
  await p.waitForTimeout(9000)
  const beta = await radios().allInnerTexts()
  log(beta.length === 2 && beta.join() === 'Document,Definition', 'Open beta: the lens switch shows Document and Definition only', beta.join(','))
  await p.goto(`${base}/inventory?preset=ga-many`)
  await p.waitForTimeout(9000)
  const ga = await radios().allInnerTexts()
  log(ga.length === 4, 'GA: the lens switch shows four lenses', ga.join(','))

  // 2. Matrix: one column per definition of the chosen dimension, plus the fixture columns.
  await radios().filter({hasText: 'Dimension'}).click()
  await p.waitForTimeout(1500)
  const dimension = await p.locator('[data-testid=dimension-picker]').inputValue()
  const defs = (await x.fetch('*[_type == "system.variant" && defined(conditions[$d])]._id', {d: dimension})) as string[]
  const cols = await p.locator('[data-testid^=lens-dimension-col-]:not([data-testid^=lens-dimension-col-declared-])').count()
  const declared = await p.locator('[data-testid^=lens-dimension-col-declared-]').count()
  log(cols === defs.length && defs.length > 0, `Matrix: ${dimension} has ${defs.length} definitions and ${cols} columns`, `${defs.length} vs ${cols}`)
  log(declared > 0 && (await p.locator('[data-testid=dimension-fixture]').isVisible()), `Matrix: ${declared} "no definition yet" fixture column(s), marked as a fixture`)
  const rowCount = await p.locator('[data-testid^=lens-dimension-row-]').count()
  const corpusDocs = (await x.fetch('count(array::unique(*[_type in ["book","bookLive"]]{"id": string::split(_id, ".")[-1]}.id))')) as number
  log(rowCount >= corpusDocs, `Matrix: one row per document plus the coverage row (${rowCount} rows, ${corpusDocs} documents)`)
  log(/of \d+/.test(await p.locator('[data-testid=dimension-summary]').innerText()), 'Matrix: coverage summary line', (await p.locator('[data-testid=dimension-summary]').innerText()).replace(/\s+/g, ' '))

  // 3. A column header opens the Definition lens for that definition.
  const header = p.locator('[data-testid^=lens-dimension-col-]:not([data-testid^=lens-dimension-col-declared-])').first()
  const id = ((await header.getAttribute('data-testid')) ?? '').replace('lens-dimension-col-', '')
  await header.click()
  await p.waitForTimeout(1500)
  const pinned = await p.locator('[data-testid=def-lens] select').inputValue().catch(() => '')
  log(pinned.includes(id) && (await radios().filter({hasText: 'Definition'}).first().getAttribute('aria-checked')) === 'true', 'Matrix: a column header opens the Definition lens for that definition', `${id} -> ${pinned}`)

  // 4. Visitor lens: nothing chosen, then a visitor chosen in the perspective bar.
  await radios().filter({hasText: 'Visitor'}).click()
  await p.waitForTimeout(1200)
  log(/No visitor is chosen/.test(await p.locator('[data-testid=visitor-resolution]').innerText()) && (await p.locator('[data-testid=visitor-computed]').isVisible()), 'Visitor: asks for the visitor in the bar and says it is computed in the browser')
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.getByRole('menuitem', {name: /View as|Add a dimension/}).first().click()
  await p.waitForTimeout(800)
  const dimBtn = p.locator('[data-testid^=picker-dimension-]').first()
  if (!(await p.locator('[data-testid^=picker-value-]').first().isVisible().catch(() => false)) && (await dimBtn.isVisible().catch(() => false))) await dimBtn.click()
  await p.locator('[data-testid^=picker-value-]').first().click()
  await p.waitForTimeout(1500)
  const head = (await p.locator('[data-testid=visitor-resolution]').innerText()).replace(/\s+/g, ' ')
  log(/Visitor: \w/.test(head) && !/Visitor: anyone/.test(head) && /Served/.test(head) && /Why/.test(head) && /Could be served/.test(head), 'Visitor: the bar value drives the lens (Served, Why, Could be served)', head.slice(0, 200))

  // 5. Stage back to Open beta while on a GA lens: the switch drops to two lenses and the lens falls back to Definition.
  await radios().filter({hasText: 'Dimension'}).click()
  await p.getByRole('button', {name: 'Design options'}).click()
  await p.getByRole('dialog', {name: 'Design options'}).getByRole('radio', {name: 'Open beta', exact: true}).click()
  await p.waitForTimeout(1200)
  const after = await radios().allInnerTexts()
  const active = await radios().filter({hasText: 'Definition'}).first().getAttribute('aria-checked')
  log(after.length === 2 && active === 'true', 'Stage switch to Open beta while on Dimension: two lenses, Definition shown', `${after.join(',')} definition=${active}`)
} catch (e) {
  log(false, 'script error', String(e).split('\n')[0])
  await p.screenshot({path: 'journeys-captures/ga-lenses-failure.png'}).catch(() => undefined)
} finally {
  await b.close()
}
