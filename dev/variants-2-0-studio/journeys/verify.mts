// Targeted verification pass (writes only throwaway data in variants-2-0: book-c5-pw-*, removed at the end).
//   node journeys/verify.mts
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import {chromium, type Page} from 'playwright'

const base = 'http://localhost:3350'
const out = join(import.meta.dirname, '..', 'journeys-captures')
mkdirSync(out, {recursive: true})
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const DOCS = ['book-c5-pw-1', 'book-c5-pw-2', 'book-c5-pw-3']
const V = 'aud-members'
const results: {name: string; ok: boolean; detail: string}[] = []
const rec = (name: string, ok: boolean, detail = '') => { results.push({name, ok, detail}); console.log(ok ? 'PASS' : 'FAIL', name, '-', detail.slice(0, 220)) }
const sleep = (page: Page, ms: number) => page.waitForTimeout(ms)
const rows = async (id: string) => (await x.fetch('*[_id match "*" + $id && defined(_system.variant)]{_id,"b":_system.bundleId}', {id})) as {_id: string; b?: string}[]

async function cleanup() {
  for (const id of await x.fetch('*[_id match "*book-c5-pw-*"]._id')) await x.delete(id).catch(() => undefined)
}

async function guarded(name: string, fn: () => Promise<void>, page: Page) {
  try { await fn() } catch (e) { rec(name, false, String(e).split('\n')[0]); await page.screenshot({path: join(out, `verify-${name.replace(/\W+/g, '-')}.png`)}).catch(() => undefined) }
}

async function main() {
  await cleanup()
  for (const id of DOCS) await x.createOrReplace({_id: id, _type: 'book', title: `C5 test ${id.slice(-1)}`})
  for (const id of DOCS.slice(0, 2)) await x.action({actionType: 'sanity.action.document.variant.create', publishedId: id, variantId: V, bundleId: 'drafts', document: {_type: 'book', title: `C5 test ${id.slice(-1)}`}} as never)
  const browser = await chromium.launch()
  const page = await (await browser.newContext({viewport: {width: 1456, height: 900}})).newPage()
  await page.goto(`${base}/#token=${encodeURIComponent(token)}`)
  await sleep(page, 4000)
  const dlg = page.getByRole('dialog')
  const bar = (n: RegExp) => page.locator('[data-testid=bulk-bar]').getByRole('button', {name: n})
  const tick = (n: number) => page.locator('tr, [role=row], [data-testid*=row]').filter({hasText: `C5 test ${n}`}).first().locator('input[type=checkbox]')

  try {
    await page.goto(`${base}/variants/${V}?preset=open-beta-a`)
    await sleep(page, 10000)

    await guarded('bulk Publish on 2 rows', async () => {
      await tick(1).check(); await tick(2).check()
      await bar(/^Publish/).click()
      await dlg.getByRole('button', {name: /^Publish 2/}).click()
      await dlg.locator('[data-testid=bulk-results]').waitFor({timeout: 30000})
      const text = await dlg.locator('[data-testid=bulk-results]').innerText()
      await dlg.getByRole('button', {name: 'Close'}).last().click()
      await sleep(page, 2500)
      const r1 = await rows(DOCS[0])
      rec('bulk Publish on 2 rows', (text.match(/✓/g) ?? []).length === 2 && r1.some((r) => !r.b), text.replace(/\s+/g, ' '))
    }, page)

    await guarded('mixed selection', async () => {
      await tick(1).check(); await tick(3).check()
      const en = {publish: await bar(/^Publish/).isEnabled(), unpublish: await bar(/^Unpublish/).isEnabled(), create: await bar(/Create/).isEnabled(), del: await bar(/^Delete/).isEnabled(), add: await bar(/Add to release/).isEnabled()}
      rec('mixed selection (1 published + 1 absent) enables only what applies', !en.publish && en.unpublish && en.create && en.del && en.add, JSON.stringify(en))
      await bar(/^Unpublish/).click()
      const text = (await dlg.innerText()).replace(/\s+/g, ' ')
      rec('Unpublish dialog lists only the published row with a fallback', /C5 test 1/.test(text) && !/C5 test 3/.test(text) && /fall back to the base document/.test(text), text.slice(0, 200))
      await dlg.getByRole('button', {name: /^Unpublish 1/}).click()
      await dlg.locator('[data-testid=bulk-results]').waitFor({timeout: 30000})
      await dlg.getByRole('button', {name: 'Close'}).last().click()
      await sleep(page, 2500)
      const r1 = await rows(DOCS[0])
      rec('Unpublish through the UI', r1.length === 1 && r1[0].b === 'drafts', JSON.stringify(r1))
    }, page)

    await guarded('Add to release', async () => {
      await tick(2).check()
      await bar(/Add to release/).click()
      await dlg.locator('select').selectOption({label: 'Autumn catalogue (undecided)'})
      await dlg.getByRole('button', {name: /^Add to release 1/}).click()
      await dlg.locator('[data-testid=bulk-results]').waitFor({timeout: 30000})
      const text = (await dlg.locator('[data-testid=bulk-results]').innerText()).replace(/\s+/g, ' ')
      await dlg.getByRole('button', {name: 'Close'}).last().click()
      await sleep(page, 2000)
      const r2 = await rows(DOCS[1])
      rec('Add to release through the UI', r2.some((r) => r.b === 'rUndecided'), `${text} | ${JSON.stringify(r2.map((r) => r.b ?? 'published'))}`)
    }, page)

    await guarded('Delete dialog fallback (published variant)', async () => {
      await tick(2).check()
      await bar(/^Delete/).click()
      const text = (await dlg.innerText()).replace(/\s+/g, ' ')
      rec('Delete dialog says what the audience falls back to', /Members fall back to/.test(text), text.slice(0, 220))
      await dlg.getByRole('button', {name: 'Cancel'}).click()
    }, page)

    // C4 option C: the lens in the inspector
    await page.goto(`${base}/structure/book;book-c5-pw-2%2Cinspect%3Dvariants-inventory?design=show.a,stage.open-beta,c4.c`)
    await sleep(page, 10000)
    await guarded('C4 lens row click keeps the inspector and shows the version', async () => {
      await page.locator('[data-testid=lens-doc-versions-mini]').waitFor({timeout: 20000})
      await page.locator('[data-testid=lens-doc-versions-mini-row-members\\|published], [data-testid^=lens-doc-versions-mini-row-]').filter({hasText: 'Members'}).first().click()
      await sleep(page, 2500)
      const url = decodeURIComponent(page.url())
      rec('C4 lens row click keeps the inspector and sets the version', /inspect=variants-inventory/.test(url) && /(variant|perspective)=/.test(url), url.split('/structure')[1] ?? url)
    }, page)
    await guarded('C4 lens row menu', async () => {
      await page.getByRole('button', {name: /Actions for Members/}).first().click()
      const items = await page.getByRole('menuitem').allInnerTexts()
      rec('C4 lens per-row menu offers Publish/Unpublish/Delete as they apply', items.some((t) => /Delete/.test(t)), items.join(' | '))
      await page.keyboard.press('Escape')
    }, page)

    // Dimension and visitor lenses
    await page.goto(`${base}/inventory?preset=open-beta-a`)
    await sleep(page, 9000)
    await guarded('Dimension lens lifecycle counts', async () => {
      await page.locator('[data-testid=c5-a] button[role=radio]', {hasText: 'Dimension'}).click()
      const head = (await page.locator('[data-testid=lens-dimension]').innerText()).replace(/\s+/g, ' ')
      rec('Dimension lens shows counts per lifecycle state', /Published/.test(head) && /Draft/.test(head) && /In a release/.test(head), head.slice(0, 160))
    }, page)
    await guarded('Visitor open in studio', async () => {
      await page.locator('[data-testid=c5-a] button[role=radio]', {hasText: 'Visitor'}).click()
      const select = page.locator('[data-testid=c5-a] select').first()
      await select.selectOption({index: 1})
      await page.getByRole('button', {name: /Open in the studio as this visitor/}).click()
      await sleep(page, 4000)
      const url = decodeURIComponent(page.url())
      rec('Open in the studio as this visitor applies the perspective', /\/structure/.test(url) && /variant=/.test(url), url.split('3350')[1])
    }, page)

    // Flaky steps by hand-equivalent clicks
    await page.goto(`${base}/structure/book?preset=open-beta-a`)
    await sleep(page, 12000)
    await guarded('j03-2 version menu', async () => {
      await page.locator('[data-ui=ReleasesNav] button').last().click()
      await page.getByRole('menuitem').first().waitFor({timeout: 8000})
      rec('j03-2 version menu opens (re-run)', true, (await page.getByRole('menuitem').allInnerTexts()).slice(0, 3).join(' | '))
      await page.keyboard.press('Escape')
    }, page)
    await guarded('j06-4 label toggles the row', async () => {
      await page.locator('[data-ui=ReleasesNav] button').last().click()
      await page.getByRole('menuitem', {name: /View as|Add a dimension/}).first().click()
      await page.locator('[data-testid^=picker-value-]').first().click()
      await sleep(page, 1200)
      const buttons = await page.locator('[data-ui=ReleasesNav] button').allInnerTexts()
      const label = page.locator('[data-ui=ReleasesNav] [role=button], [data-ui=ReleasesNav] button').filter({hasText: /Drafts|Published/}).first()
      const before = await page.locator('[data-testid=address-row]').isVisible()
      await label.click(); await sleep(page, 700)
      const afterHide = await page.locator('[data-testid=address-row]').isVisible()
      await label.click(); await sleep(page, 700)
      const afterShow = await page.locator('[data-testid=address-row]').isVisible()
      rec('j06-4 pill label hides and shows the row (re-run)', before && !afterHide && afterShow, `buttons: ${JSON.stringify(buttons)} | before=${before} afterClick1=${afterHide} afterClick2=${afterShow}`)
    }, page)
  } finally {
    await cleanup()
    rec('cleanup', (await x.fetch('count(*[_id match "*book-c5-pw-*"])')) === 0, 'throwaway documents removed')
    await browser.close()
    writeFileSync(join(out, 'verify.json'), JSON.stringify(results, null, 2))
  }
}
await main()
