// The localization plugin scenario (switch `localization`: A off, B document-level, C field-level, D both). Screenshots -> journeys-captures/e9-localization/.
// node journeys/verify-localization.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-localization', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
async function open(path: string) {
  const context = await b.newContext({viewport: {width: 1440, height: 900}})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3350${path}`)
  await p.locator('[data-testid="document-pane"], [data-testid="document-list-pane"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(6500)
  return {p, context}
}
const BASE = 'show.a,stage.open-beta,navLayout.b,c1.b,c2.c,c4.a'
const listText = (p: Page) => p.locator('[data-testid="document-list-pane"]').last().innerText().catch(() => '')

for (const on of [false, true]) {
  const label = on ? 'on' : 'off'
  const design = `${BASE}${on ? ',localization.b' : ''}`
  // The Book list: English only while the plugin is off; every language while it is on.
  const list = await open(`/structure/book?design=${design}`)
  const text = await listText(list.p)
  log(`${label}: the Book list ${on ? 'also lists the Danish, Swedish and Norwegian books' : 'is English only'}`, on ? /Fyrvogterens almanak/.test(text) && /Fyrvaktarens almanacka/.test(text) && /Fyrvokterens almanakk/.test(text) : /Lighthouse Keeper/.test(text) && !/Fyrvogter|Fyrvakt/.test(text))
  await list.context.close()
  // The document: the plugin's Translations menu and badge only while it is on.
  const doc = await open(`/structure/book;book-lighthouse?design=${design}`)
  const translations = doc.p.getByRole('button', {name: 'Translations'})
  log(`${label}: the document header ${on ? 'has the plugin\'s Translations menu' : 'has no Translations menu'}`, on ? (await translations.count()) === 1 : (await translations.count()) === 0)
  if (on) {
    await translations.click()
    await doc.p.waitForTimeout(2000)
    const items = await doc.p.locator('[data-ui="Popover"], [data-ui="MenuItem"]').allInnerTexts()
    const all = items.join(' ')
    log('on: the menu offers English, Danish, Swedish and Norwegian, and Manage Translations', /English/.test(all) && /Danish/.test(all) && /Swedish/.test(all) && /Norwegian/.test(all) && /Manage Translations/.test(all))
    await doc.p.screenshot({path: 'journeys-captures/e9-localization/translations-menu.png', clip: {x: 640, y: 55, width: 800, height: 420}})
  }
  await doc.context.close()
}
// The Danish version is its own document, in Danish, joined to the English one by its metadata document.
{
  const {p, context} = await open(`/structure/book;book-lighthouse-da?design=${BASE},localization.b`)
  const text = await p.locator('body').innerText()
  log('on: the Danish version is its own document, with Danish text', /Fyrvogterens almanak/.test(text) && /Af Maren Halvorsen/.test(text))
  await context.close()
}

// Field-level (C): one document per book with every language in its fields; a locale pill in the navbar; the filter hides a language in the form.
{
  const FL = `${BASE},localization.c`
  const list = await open(`/structure/bookFieldLevel?design=${FL}`)
  log('field-level: the Content list has "Book (field-level)", and the locale pill is in the navbar', /Book \(field-level\)/.test(await list.p.locator('body').innerText()) && (await list.p.getByTestId('locale-pill').count()) === 1)
  await list.context.close()
  const {p, context} = await open(`/structure/bookFieldLevel;fl-book-lighthouse?design=${FL}`)
  const fields = () => p.locator('[data-testid="document-pane"] input[type="text"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))
  log('field-level: the title holds every language inside the one document', (await fields()).some((v) => /Fyrvogterens almanak/.test(v)) && (await fields()).some((v) => /Fyrvaktarens almanacka/.test(v)) && (await fields()).some((v) => /Fyrvokterens almanakk/.test(v)))
  log('field-level: the pill reads "All (4)"', /All \(4\)/.test(await p.getByTestId('locale-pill-button').innerText()))
  await p.getByTestId('locale-pill-button').click()
  await p.waitForTimeout(1200)
  log('field-level: the pill menu offers Show all locales and the four languages', (await p.getByTestId('locale-all').count()) === 1 && (await p.locator('[data-testid^="locale-"]:not([data-testid="locale-all"]):not([data-testid="locale-pill"]):not([data-testid="locale-pill-button"])').count()) === 4)
  await p.screenshot({path: 'journeys-captures/e9-localization/locale-pill.png', clip: {x: 940, y: 0, width: 500, height: 330}})
  await p.getByTestId('locale-da').click()
  await p.waitForTimeout(1500)
  log('field-level: choosing Danish off hides it in the form and the pill says "3 of 4"', !(await fields()).some((v) => /Fyrvogterens almanak/.test(v)) && (await fields()).some((v) => /Fyrvaktarens almanacka/.test(v)) && /3 of 4/.test(await p.getByTestId('locale-pill-button').innerText()))
  await p.screenshot({path: 'journeys-captures/e9-localization/field-level-filtered.png'})
  await context.close()
}
// Both (D): the two approaches side by side.
{
  const {p, context} = await open(`/structure/book;book-lighthouse?design=${BASE},localization.d`)
  log('both: the document-level menu and the field-level pill are there together', (await p.getByRole('button', {name: 'Translations'}).count()) === 1 && (await p.getByTestId('locale-pill').count()) === 1)
  await context.close()
}
// Off (A): none of it is visible.
{
  const {p, context} = await open(`/structure/book?design=${BASE}`)
  log('off: no locale pill, and neither "Book (field-level)" nor "Translation metadata" in the Content list', (await p.getByTestId('locale-pill').count()) === 0 && !/Book \(field-level\)|Translation metadata/.test(await p.locator('body').innerText()))
  await context.close()
}
await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
