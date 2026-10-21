// The localization plugin scenario (switch `localization`: A off, B the document-level plugin on). Screenshots -> journeys-captures/e9-localization/.
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
await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
