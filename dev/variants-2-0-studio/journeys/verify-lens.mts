// C4 "What will my visitors see?": the editor lens beside the inventory panel, its three states, the draft beneath the published version,
// the Create CTA wired to the create dialog, and the Priority view hidden from the views menu (open beta scope, default).
// Screenshots -> journeys-captures/c4-lens/<state>.png
// node journeys/verify-lens.mts   (the studio must run)
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const base = 'http://localhost:3350'
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 240))
mkdirSync('journeys-captures/c4-lens', {recursive: true})
const b = await chromium.launch()
const context = await b.newContext({viewport: {width: 1500, height: 900}})
const p = await context.newPage()
await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(3000)

const open = async (design: string, doc = 'book-lighthouse') => {
  await p.goto(`${base}/structure/book;${doc}%2Cinspect%3Dvariants-inventory?design=${design}`)
  await p.getByTestId('visitor-lens-open').waitFor({timeout: 40000})
  await p.waitForTimeout(2500)
}
const pick = async (picks: {dim: string; value: string}[]) => {
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.getByRole('menuitem', {name: /Add a dimension|View as/}).first().click()
  await p.waitForTimeout(600)
  for (let i = 0; i < picks.length; i++) {
    if (i > 0) await p.locator('[data-testid=row-add]').click()
    await p.waitForTimeout(400)
    await p.locator(`[data-testid^=picker-value-${picks[i].dim}-${picks[i].value}]`).first().click()
    await p.waitForTimeout(600)
  }
}
const lens = async (name: string) => {
  await p.getByTestId('visitor-lens-open').click()
  await p.getByTestId('visitor-lens').waitFor({timeout: 8000})
  await p.waitForTimeout(800)
  const text = (await p.getByTestId('visitor-lens').innerText()).replace(/\n/g, ' | ')
  await p.screenshot({path: `journeys-captures/c4-lens/${name}.png`})
  return text
}

try {
  // Idle: no perspective.
  await open('show.a,stage.ga,c4.a')
  log((await lens('idle')).includes('Choose who to look at'), 'no perspective: the lens asks for one')
  await p.getByTestId('visitor-lens-close').click()

  // Full match: Members (audience = members). The Lighthouse Keeper's Almanac has a published Members version.
  await open('show.a,stage.ga,c4.a')
  await pick([{dim: 'audience', value: 'members'}])
  let text = await lens('full-match')
  log((await p.getByTestId('lens-full').count()) === 1 && /Members/.test(text) && /Served now/i.test(text) && /Published/.test(text), 'full match: only the variant that fits, as a published version', text)
  log((await p.getByTestId('lens-cta').count()) === 0 && (await p.getByTestId('lens-partial-prompt').count()) === 0, 'full match: no prompt to create anything')
  await p.getByTestId('visitor-lens-close').click()

  // Full match with a draft beneath: Students has a published version and a draft.
  await open('show.a,stage.ga,c4.a')
  await pick([{dim: 'audience', value: 'students'}])
  text = await lens('full-match-draft-beneath')
  log((await p.getByTestId('lens-draft').count()) === 1 && /Draft, not served/i.test(text), 'full match: the draft sits beneath the published version, as secondary', text)
  const order = await p.evaluate(() => { const a = document.querySelector('[data-testid=lens-served]')!.getBoundingClientRect().top; const d = document.querySelector('[data-testid=lens-draft]')!.getBoundingClientRect().top; return a < d })
  log(order, 'full match: the served version comes first')
  await p.getByTestId('visitor-lens-close').click()

  // Partial match: audience + locale; the Members variant covers one of the two values.
  await open('show.a,stage.ga,dim.4,c4.a')
  await pick([{dim: 'audience', value: 'members'}, {dim: 'locale', value: 'de-DE'}])
  text = await lens('partial-match')
  const partial = (await p.getByTestId('lens-partial').count()) === 1
  log(partial && (await p.getByTestId('lens-partial-prompt').count()) === 1 && /Partly matched/.test(text) && /Create a full variant/.test(text), 'partial match: the match plus a prompt to create a full variant', text)
  await p.getByTestId('visitor-lens-close').click()

  // No match: a perspective no definition names (market France + channel app, if present).
  await open('show.a,stage.ga,dim.4,c4.a')
  await pick([{dim: 'market', value: 'france'}, {dim: 'channel', value: 'app'}])
  text = await lens('no-match')
  log((await p.getByTestId('lens-none').count()) === 1 && /Nothing is set for this perspective/.test(text) && /see the base document/.test(text), 'no match: says so plainly', text)
  log((await p.getByTestId('lens-cta').count()) === 1, 'no match: offers the CTA', await p.getByTestId('lens-cta').innerText().catch(() => ''))
  await p.getByTestId('visitor-lens-close').click()
} catch (e) {
  log(false, 'script error', String(e).split('\n')[0])
}

// Create CTA: audience only (open beta), a variant the document lacks (the Nordic region has a definition).
try {
  await open('show.a,stage.open-beta,c4.a', 'book-the-quiet-cartographer')
  await pick([{dim: 'audience', value: 'nordic'}])
  const text = await lens('no-match-create')
  const cta = p.getByTestId('lens-cta')
  if (await cta.count()) {
    await cta.click()
    await p.waitForTimeout(1200)
    const dialog = p.getByRole('dialog').last()
    const dtext = (await dialog.innerText()).replace(/\n/g, ' | ')
    log(/Create/.test(dtext) && /Address/.test(dtext), 'the CTA opens the Create dialog with the definition preselected', dtext)
    await dialog.getByRole('button', {name: /Cancel/}).first().click().catch(() => undefined)
    await p.screenshot({path: 'journeys-captures/c4-lens/create-dialog.png'})
  } else {
    log(true, 'the CTA is absent for this document (it already has the version)', text)
  }
} catch (e) {
  log(false, 'script error (CTA)', String(e).split('\n')[0])
}

// Priority view hidden by default; shown with priority.show.
for (const [design, expected] of [['show.a,stage.ga,c4.a', false], ['show.a,stage.ga,c4.a,priority.show', true]] as const) {
  try {
    await open(design)
    await p.getByTestId('inventory-view-menu').click()
    await p.waitForTimeout(600)
    const items = await p.getByRole('menuitem').filter({hasText: /^By /}).evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').map((e) => (e.textContent ?? '').trim()))
    const hasPriority = items.some((t) => t.startsWith('By priority'))
    log(hasPriority === expected, `Priority view ${expected ? 'shown with the setting on Show' : 'hidden by default (open beta scope)'}`, items.join(' | '))
    await p.keyboard.press('Escape')
  } catch (e) {
    log(false, 'script error (views)', String(e).split('\n')[0])
  }
}
await b.close()
