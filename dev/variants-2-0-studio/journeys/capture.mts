// Walks the journeys in options/journeys.json against http://localhost:3350 with Playwright and captures a screenshot
// per step: journeys-captures/<journey>-<step>.png, plus journeys-captures/run.json (status per step:
// pass | differs | not reachable, with what the studio did). Start the studio first.
//   node journeys/capture.mts [j03 j05 ...]     all journeys, or just the ones named
// Needs `sanity login` (the CLI token signs the browser in and writes the throwaway data). Writes ONLY to the private
// variants-2-0 dataset: documents named book-c5-pw-*, the definition aud-pw-empty, and whatever a step creates (those
// are removed at the end).
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import {chromium, type Page} from 'playwright'

const base = 'http://localhost:3350'
const out = join(import.meta.dirname, '..', 'journeys-captures')
mkdirSync(out, {recursive: true})

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const warn = console.warn
console.warn = (...a: unknown[]) => {
  if (String(a[0]).includes('experimental')) return
  warn(...a)
}
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})

type Status = 'pass' | 'differs' | 'not reachable'
interface StepResult {step: string; title: string; status: Status; note: string}
const results: StepResult[] = []

const DOCS = ['book-c5-pw-1', 'book-c5-pw-2', 'book-c5-pw-3']
const EMPTY_DEF = 'aud-pw-empty'
const MEMBERS = 'aud-members'
const created: {doc: string; variant: string; bundle: string}[] = []

const journeys = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'options', 'journeys.json'), 'utf8')) as {
  id: string
  title: string
  steps: {title: string; component: string; option: string; preset: string; route: string; expect: string}[]
}[]
const only = process.argv.slice(2)

async function cleanup() {
  for (const c of created) {
    try {
      await x.action({actionType: 'sanity.action.document.variant.delete', publishedId: c.doc, variantId: c.variant, ...(c.bundle === 'published' ? {} : {bundleId: c.bundle})} as never)
    } catch {
      // Already gone.
    }
  }
  const ids: string[] = await x.fetch('*[_id match "*book-c5-pw-*"]._id')
  for (const id of ids) await x.delete(id).catch(() => undefined)
  await x.action({actionType: 'sanity.action.variant.definition.delete', variantId: EMPTY_DEF} as never).catch(() => undefined)
}

const visible = (page: Page, sel: string, timeout = 8000) => page.locator(sel).first().waitFor({state: 'visible', timeout}).then(() => true, () => false)
const settle = (page: Page, ms = 2500) => page.waitForTimeout(ms)

async function goto(page: Page, route: string, preset: string, extra = '') {
  // The journeys say /structure; the studio's list of books is /structure/book.
  const path = route === '/structure' ? '/structure/book' : route
  await page.goto(`${base}${path}?preset=${preset}${extra}`)
  await page.waitForLoadState('domcontentloaded')
  await settle(page, 7000)
}

type Check = {status: Status; note: string}
const ok = (note = ''): Check => ({status: 'pass', note})
const differs = (note: string): Check => ({status: 'differs', note})
const missing = (note: string): Check => ({status: 'not reachable', note})

const lens = (page: Page, name: string) => page.locator('[data-testid=c5-a] button[role=radio]', {hasText: name}).first()

async function walk(page: Page, journey: (typeof journeys)[number]) {
  const run = async (index: number, fn: () => Promise<Check>) => {
    const s = journey.steps[index]
    let check: Check
    try {
      check = await fn()
    } catch (e) {
      check = missing(String(e).split('\n')[0].slice(0, 200))
    }
    const id = `${journey.id}-${index + 1}`
    await page.screenshot({path: join(out, `${id}.png`)}).catch(() => undefined)
    results.push({step: id, title: s.title, ...check})
    console.log(check.status.toUpperCase().padEnd(13), id, s.title, '-', check.note)
  }
  const first = journey.steps[0]
  await goto(page, first.route === '/variants' && journey.id !== 'j05' && journey.id !== 'j11' && journey.id !== 'j12' && journey.id !== 'j02' ? '/variants' : first.route, first.preset)

  switch (journey.id) {
    case 'j01': {
      await run(0, async () => {
        const rows = await page.locator('text=Variant definitions').count()
        const docs = await page.locator('text=Documents').count()
        return rows && docs ? differs('The overview lists definitions with a Documents column; the empty state is not reachable because the dataset has many definitions.') : missing('overview not found')
      })
      await run(1, async () => {
        await page.getByRole('button', {name: /New variant definition/}).click()
        const dialog = await visible(page, '[role=dialog]')
        return dialog ? ok(`dialog fields: ${(await page.locator('[role=dialog]').innerText()).replace(/\s+/g, ' ').slice(0, 140)}`) : differs('no dialog opened')
      })
      await run(2, async () => ok(`dialog (not filled; creating a definition here would write to the dataset): ${(await page.locator('[role=dialog]').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120)}`))
      await page.keyboard.press('Escape')
      await run(3, async () => {
        await settle(page, 1000)
        const z = await page.locator('text=0').count()
        return z ? differs('Definitions show a Documents count; there is no Create action on a definition row in the overview (rows have a menu).') : missing('no counts')
      })
      break
    }
    case 'j02': {
      await goto(page, `/variants/${MEMBERS}`, first.preset)
      await run(0, async () => ((await visible(page, 'text=Total documents')) ? ok('detail shows the definition panel, details and documents table') : differs('detail page not shown')))
      await run(1, async () => {
        await page.getByRole('button', {name: /Edit definition/}).click()
        const dialog = await visible(page, '[role=dialog]')
        return dialog ? differs('Edit opens a dialog, not in-place editing: ' + (await page.locator('[role=dialog]').innerText()).replace(/\s+/g, ' ').slice(0, 100)) : differs('no dialog opened')
      })
      await run(2, async () => {
        const text = await page.locator('[role=dialog]').innerText().catch(() => '')
        return /affect|document/i.test(text) ? ok(text.replace(/\s+/g, ' ').slice(0, 120)) : differs('no notice naming how many documents the change affects')
      })
      await page.keyboard.press('Escape')
      break
    }
    case 'j03': {
      await run(0, async () => ((await visible(page, '[data-testid^=version-mark-]')) ? ok(`${await page.locator('[data-testid^=version-mark-]').count()} rows with a version mark`) : differs('no version marks')))
      await run(1, async () => {
        const chevron = page.locator('[data-ui=ReleasesNav] button').last()
        await chevron.waitFor({state: 'visible', timeout: 20000})
        await settle(page, 1500)
        await chevron.click()
        const menu = await visible(page, '[role=menuitem]')
        return menu ? ok('version menu opens; row: ' + ((await page.locator('[role=menuitem]').allInnerTexts()).filter((t) => /View as|Add a dimension/.test(t)).join(',') || 'no dimension row')) : differs('menu did not open')
      })
      await run(2, async () => {
        await page.getByRole('menuitem', {name: /View as|Add a dimension/}).first().click()
        await settle(page, 800)
        const value = page.locator('[data-testid^=picker-value-]').first()
        if (!(await value.isVisible().catch(() => false))) {
          const dim = page.locator('[data-testid^=picker-dimension-]').first()
          if (await dim.isVisible().catch(() => false)) await dim.click()
        }
        await page.locator('[data-testid^=picker-value-]').first().click()
        await settle(page, 1200)
        return (await page.locator('[data-testid=address-row]').isVisible()) ? ok('row: ' + (await page.locator('[data-testid=address-row]').innerText()).replace(/\s+/g, ' ')) : differs('no address row')
      })
      await run(3, async () => {
        await page.getByText('Glass Houses', {exact: false}).first().click()
        await settle(page, 4000)
        return (await visible(page, '[data-testid^=doc-banner-]', 8000)) ? ok('banner: ' + (await page.locator('[data-testid^=doc-banner-]').first().innerText()).replace(/\s+/g, ' ').slice(0, 100)) : differs('no missing-variant banner shown')
      })
      await run(4, async () => {
        await page.getByRole('button', {name: /Create variant/}).click()
        await settle(page, 4000)
        const gone = !(await page.locator('[data-testid^=doc-banner-]').first().isVisible().catch(() => false))
        const rows = (await x.fetch('*[_id match "*book-glass*" && defined(_system.variant)]{_id,"v":_system.variant._ref,"b":_system.bundleId}')) as {v: string; b?: string}[]
        for (const r of rows) created.push({doc: 'book-glass', variant: r.v.replace('_.variants.', ''), bundle: r.b ?? 'published'})
        return gone ? ok('variant created as a draft; banner gone (will be removed at the end)') : differs('banner still visible after Create')
      })
      break
    }
    case 'j04': {
      await run(0, async () => ((await visible(page, '[data-testid^=version-mark-]')) ? ok('rows carry a version mark') : differs('no marks')))
      await run(1, async () => {
        await page.locator('[data-testid^=version-mark-]').nth(5).click()
        await settle(page, 4000)
        return /inspect/.test(decodeURIComponent(page.url())) ? ok(`URL: ${decodeURIComponent(page.url()).split('/structure')[1]}`) : differs('document opened without the inventory: ' + page.url())
      })
      await run(2, async () => {
        const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ')
        return /Published/.test(text) && /Versions of/.test(text) ? ok('inventory rows with address and state visible') : differs('inventory not readable')
      })
      await run(3, async () => {
        const before = page.url()
        await page.getByText('Members').first().click().catch(() => undefined)
        await settle(page, 2500)
        return page.url() !== before ? ok('URL changed: ' + page.url().split('3350')[1]) : differs('selecting an inventory row only sets the address (perspective/row); it does not navigate to a version document (no variant route in the flag-on studio)')
      })
      break
    }
    case 'j05': {
      await goto(page, `/variants/${MEMBERS}`, first.preset)
      for (const id of DOCS) await x.createOrReplace({_id: id, _type: 'book', title: `C5 test ${id.slice(-1)}`})
      await page.reload()
      await settle(page, 9000)
      await run(0, async () => {
        const absent = await page.locator('[data-absent]').count()
        return absent > 0 ? ok(`${absent} grey rows for documents without a Members version`) : differs('no grey rows')
      })
      await run(1, async () => {
        for (const n of [1, 2]) {
          const row = page.locator('tr, [role=row], [data-testid*=row]').filter({hasText: `C5 test ${n}`}).first()
          await row.locator('input[type=checkbox]').check()
        }
        const bar = await page.locator('[data-testid=bulk-bar]').innerText().catch(() => '')
        return /Create/.test(bar) && /Add to release/.test(bar) ? ok('bulk bar: ' + bar.replace(/\s+/g, ' ')) : differs('bulk bar: ' + bar.replace(/\s+/g, ' '))
      })
      await run(2, async () => {
        await page.locator('[data-testid=bulk-bar]').getByRole('button', {name: /Create/}).click()
        const text = (await page.getByRole('dialog').innerText()).replace(/\s+/g, ' ')
        return /Address/.test(text) && /Where/.test(text) ? ok(text.slice(0, 160)) : differs(text.slice(0, 160))
      })
      await run(3, async () => {
        await page.getByRole('dialog').getByRole('button', {name: /Create 2/}).click()
        await visible(page, '[data-testid=bulk-results]', 20000)
        const text = (await page.locator('[data-testid=bulk-results]').innerText()).replace(/\s+/g, ' ')
        for (const d of DOCS.slice(0, 2)) created.push({doc: d, variant: MEMBERS, bundle: 'drafts'})
        return (text.match(/✓/g) ?? []).length === 2 ? ok(text) : differs(text)
      })
      await page.getByRole('dialog').getByRole('button', {name: 'Close'}).last().click().catch(() => undefined)
      break
    }
    case 'j06': {
      await run(0, async () => {
        await page.locator('[data-ui=ReleasesNav] button').last().waitFor({state: 'visible', timeout: 20000})
        await settle(page, 1500)
        await page.locator('[data-ui=ReleasesNav] button').last().click()
        const items = (await page.locator('[role=menuitem]').allInnerTexts()).filter((t) => /Published|Drafts|Halloween|Black Friday|ASAP/.test(t))
        return items.length ? ok(items.join(' | ')) : differs('no state rows')
      })
      await run(1, async () => {
        await page.getByRole('menuitem', {name: /View as|Add a dimension/}).first().click()
        await settle(page, 800)
        return (await visible(page, '[data-testid^=picker-]')) ? ok('picker opens (open beta: one flat list)') : differs('no picker')
      })
      await run(2, async () => {
        const value = page.locator('[data-testid^=picker-value-]').first()
        if (!(await value.isVisible().catch(() => false))) await page.locator('[data-testid^=picker-dimension-]').first().click()
        await page.locator('[data-testid^=picker-value-]').first().click()
        await settle(page, 1200)
        const chips = await page.locator('[data-testid^=chip-]').count()
        return chips >= 1 ? ok(`${chips} chip(s): ` + (await page.locator('[data-testid=address-row]').innerText()).replace(/\s+/g, ' ')) : differs('no chip')
      })
      await run(3, async () => {
        const pill = page.locator('[data-ui=ReleasesNav]')
        await pill.locator('button').first().click()
        await settle(page, 600)
        const hidden = !(await page.locator('[data-testid=address-row]').isVisible().catch(() => false))
        await pill.locator('button').first().click()
        await settle(page, 600)
        const shown = await page.locator('[data-testid=address-row]').isVisible().catch(() => false)
        return hidden && shown ? ok('the pill label hides and shows the row; the chip stays') : differs(`label click: row hidden=${hidden}, shown again=${shown}`)
      })
      await run(4, async () => {
        await page.getByRole('button', {name: /Clear/}).first().click()
        await settle(page, 800)
        return (await page.locator('[data-testid^=chip-]').count()) === 0 ? ok('chip removed') : differs('chip still present')
      })
      break
    }
    case 'j07': {
      // The stand-in preview (dev/preview-iframe: vite --port 3334) is the default Presentation preview.
      await run(0, async () => ((await visible(page, '[data-testid=presentation-variants-button]', 20000)) ? ok('Presentation loads; the dimension control is in the preview header next to the state pill') : differs('Presentation loaded without the dimension control')))
      const frame = () => page.frames().find((f) => f.url().includes(':3334'))
      await run(1, async () => {
        await page.locator('[data-testid=presentation-variants-button]').click()
        await page.locator('[data-testid^=picker-value-]', {hasText: 'Members'}).first().click()
        await settle(page, 6000)
        const badge = await frame()?.locator('[data-testid=preview-state]').innerText().catch(() => '')
        return /variant aud-members/.test(badge ?? '') ? ok(`the preview received the variant: ${badge}`) : differs(`preview badge: ${badge || 'no preview frame'}`)
      })
      await run(2, async () => {
        await frame()?.getByText('The Lighthouse Keeper').first().click()
        await settle(page, 6000)
        const line = (await page.locator('[data-testid=presentation-context-line]').innerText().catch(() => '')).replace(/\s+/g, ' ')
        return line ? ok(`click-to-edit opened the document form; context line: ${line}`) : differs('clicking the title did not open a document form')
      })
      break
    }
    case 'j08': {
      await run(0, async () => {
        await lens(page, 'Dimension').click()
        const rows = await page.locator('[data-testid^=lens-dimension-row-]').count()
        return rows ? differs(`${rows} value rows with Definitions and Documents counts, not counts per lifecycle state`) : differs('no rows')
      })
      await run(1, async () => {
        const rows = await page.locator('[data-testid^=lens-dimension-row-]').allInnerTexts()
        const zero = rows.find((r) => /\n0\n0\s*$/.test(r + '\n'))
        return zero ? ok('a value with no definitions: ' + zero.replace(/\s+/g, ' ')) : differs('every listed value is used by at least one definition (values are derived from definitions, so a value nobody authored cannot appear)')
      })
      await run(2, async () => {
        await page.goto(`${base}/variants/${MEMBERS}?preset=open-beta-a`)
        await settle(page, 9000)
        return (await page.locator('[data-absent]').count()) ? ok('grey rows with Create') : differs('no grey rows')
      })
      break
    }
    case 'j09': {
      await run(0, async () => {
        await lens(page, 'Visitor').click()
        const selects = await page.locator('[data-testid=c5-a] select').count()
        return selects ? ok(`${selects} visitor pickers, default: ` + (await page.locator('[data-testid=c5-a] select').first().inputValue() || 'Anyone')) : differs('no visitor picker')
      })
      await run(1, async () => {
        const select = page.locator('[data-testid=c5-a] select').first()
        const option = (await select.locator('option').allTextContents())[1]
        await select.selectOption({index: 1})
        await settle(page, 800)
        const row = (await page.locator('[data-testid=lens-visitor-row-book-lighthouse]').innerText().catch(() => '')).replace(/\s+/g, ' ')
        return row ? ok(`${option}: ${row}`) : differs('no per-document row')
      })
      await run(2, async () => {
        await page.goto(`${base}/structure/book;book-lighthouse?preset=open-beta-a`)
        await settle(page, 7000)
        return ok('document opens in the studio; the visitor choice is not carried into the studio perspective (the Visitor lens is read only)')
      })
      break
    }
    case 'j10': {
      await run(0, async () => ((await visible(page, '[data-testid^=version-mark-]')) ? differs('there is no route to open a variant version as its own document in this studio; the list opens the base document') : missing('no list')))
      await run(1, async () => {
        await page.locator('[data-testid^=version-mark-]').nth(5).click()
        await settle(page, 4000)
        return /Versions of/.test(await page.locator('body').innerText()) ? ok('inventory shows the version rows with states') : differs('inventory not shown')
      })
      await run(2, async () => missing('the inventory panel has no Delete (the bulk bar was removed in the port); deleting a variant version is only possible from the Variants tool bulk bar'))
      await run(3, async () => missing('no delete step reachable from the document editor'))
      break
    }
    case 'j11': {
      await goto(page, `/variants/${MEMBERS}`, first.preset)
      for (const id of DOCS) await x.createOrReplace({_id: id, _type: 'book', title: `C5 test ${id.slice(-1)}`})
      for (const id of DOCS.slice(0, 2)) {
        await x.action({actionType: 'sanity.action.document.variant.create', publishedId: id, variantId: MEMBERS, bundleId: 'drafts', document: {_type: 'book', title: `C5 test ${id.slice(-1)}`}} as never).catch(() => undefined)
        created.push({doc: id, variant: MEMBERS, bundle: 'drafts'})
      }
      await page.reload()
      await settle(page, 9000)
      await run(0, async () => ((await visible(page, 'text=C5 test 1', 12000)) ? ok('detail lists the definition and its documents') : differs('test documents not listed')))
      await run(1, async () => {
        for (const n of [1, 2]) await page.locator('tr, [role=row], [data-testid*=row]').filter({hasText: `C5 test ${n}`}).first().locator('input[type=checkbox]').check()
        const bar = (await page.locator('[data-testid=bulk-bar]').innerText().catch(() => '')).replace(/\s+/g, ' ')
        return /Delete/.test(bar) ? ok('bulk bar: ' + bar) : differs('bulk bar: ' + bar)
      })
      await run(2, async () => {
        await page.locator('[data-testid=bulk-bar]').getByRole('button', {name: /^Delete/}).click()
        const text = (await page.getByRole('dialog').innerText()).replace(/\s+/g, ' ')
        return /C5 test 1/.test(text) && /fall|fallback|base/i.test(text) ? ok(text.slice(0, 200)) : differs('dialog lists the documents but not the fallback per audience: ' + text.slice(0, 200))
      })
      await run(3, async () => {
        await page.getByRole('dialog').getByRole('button', {name: /^Delete 2/}).click()
        await visible(page, '[data-testid=bulk-results]', 20000)
        const text = (await page.locator('[data-testid=bulk-results]').innerText()).replace(/\s+/g, ' ')
        return (text.match(/✓/g) ?? []).length === 2 ? ok(text) : differs(text)
      })
      await page.getByRole('dialog').getByRole('button', {name: 'Close'}).last().click().catch(() => undefined)
      break
    }
    case 'j12': {
      await x.action({actionType: 'sanity.action.variant.definition.create', variantId: EMPTY_DEF, conditions: {audience: 'pw-empty'}, priority: 0, metadata: {title: 'PW empty'}} as never).catch(() => undefined)
      await goto(page, `/variants/${EMPTY_DEF}`, first.preset)
      await run(0, async () => ((await visible(page, 'text=Total documents')) ? ((await page.locator('text=Total documents').locator('xpath=following::*[1]').innerText().catch(() => '')).trim() === '0' ? ok('0 documents') : ok('detail page shown')) : differs('detail not shown')))
      await run(1, async () => {
        await page.getByRole('button', {name: /More|\.\.\./}).first().click().catch(async () => page.locator('button[aria-haspopup]').last().click())
        const item = page.getByRole('menuitem', {name: /Delete/})
        if (!(await item.first().isVisible({timeout: 3000}).catch(() => false))) return differs('no Delete in the definition menu')
        await item.first().click()
        return (await visible(page, '[role=dialog]')) ? ok((await page.locator('[role=dialog]').innerText()).replace(/\s+/g, ' ').slice(0, 140)) : differs('no confirm dialog')
      })
      await run(2, async () => {
        await page.locator('[role=dialog]').getByRole('button', {name: /Yes, delete/i}).click()
        await settle(page, 4000)
        const gone = (await x.fetch('count(*[_id == "_.variants.' + EMPTY_DEF + '"])')) === 0
        return gone ? ok('definition deleted') : differs('definition still exists')
      })
      break
    }
    case 'j14': {
      const FM = '/structure/fieldMarksTest;fm-1?perspective=published&variant=aud-members'
      const marks = () =>
        page.evaluate(() => {
          const ys = [...document.querySelectorAll('[data-testid="base-variant-diff-indicator"]')].map((e) => Math.round(e.getBoundingClientRect().y))
          const label = (t: string) => {
            const el = [...document.querySelectorAll('label, [data-testid^="field-"] *, h2, h3, div')].find((n) => (n as HTMLElement).innerText?.trim() === t && n.children.length === 0)
            return el ? Math.round(el.getBoundingClientRect().y) : null
          }
          return {ys, label: Object.fromEntries(['Title', 'Subtitle', 'Settings', 'Theme', 'Meta', 'Owner', 'Region', 'Tags', 'Sections', 'Featured', 'Cover', 'Body'].map((t) => [t, label(t)]))}
        })
      // A mark sits level with its field's label or input, a little above or below the label's top edge.
      const near = (m: Awaited<ReturnType<typeof marks>>, name: string, span = 70) => {
        const y = m.label[name]
        return y == null ? null : m.ys.filter((v) => v >= y - 30 && v <= y + span).length
      }
      // Marks from one field's label to the next (an array field and its items).
      const between = (m: Awaited<ReturnType<typeof marks>>, from: string, to: string) => {
        const a = m.label[from]
        const b = m.label[to]
        return a == null || b == null ? null : m.ys.filter((v) => v >= a - 30 && v < b - 30).length
      }
      await page.setViewportSize({width: 1500, height: 3000})
      await page.goto(`${base}${FM}&preset=open-beta-a`)
      await settle(page, 14000)
      await run(0, async () => {
        const line = (await page.locator('[data-testid=presentation-context-line]').innerText().catch(() => '')).replace(/\s+/g, ' ')
        return /Members/.test(line) ? ok(`pane context line: ${line}`) : differs('no context line naming the variant')
      })
      let m = await marks()
      await run(1, async () => {
        await page.locator('[data-testid="base-variant-diff-indicator"]').first().hover()
        await settle(page, 700)
        const tip = (await page.locator('body').innerText()).includes('Changed from base variant')
        const subtitle = near(m, 'Subtitle')
        return m.ys.length > 0 && subtitle === 0 && tip ? ok(`${m.ys.length} marks; Subtitle (identical) has none; tooltip "Changed from base variant" shown`) : differs(`marks=${m.ys.length}, subtitle marks=${subtitle}, tooltip=${tip}`)
      })
      await run(2, async () => {
        const facts = {settings: near(m, 'Settings', 10), meta: near(m, 'Meta', 10), region: near(m, 'Region', 70), tagsAndItems: between(m, 'Tags', 'Sections'), sectionsAndItems: between(m, 'Sections', 'Featured')}
        // One mark across a whole array field and its items = the field mark only, none on the items.
        return facts.region && facts.meta && facts.settings && facts.tagsAndItems === 1 && facts.sectionsAndItems === 1 ? ok(`leaf and both parents marked; each array shows exactly one mark for the field and its items (${JSON.stringify(facts)})`) : differs(JSON.stringify(facts))
      })
      await run(3, async () => {
        const body = near(m, 'Body', 20)
        const blocks = await page.locator('[data-testid=block-mark]').count()
        return body === 1 && blocks === 0 ? ok('Body has one field mark and no block-level marks (C9 A, shipped)') : differs(`Body marks=${body}, block marks=${blocks}`)
      })
      await run(4, async () => {
        const preview = encodeURIComponent('/variants-preview.html?route=fm:fm-1')
        await page.setViewportSize({width: 1100, height: 1500})
        await page.goto(`${base}/presentation?preset=open-beta-a&preview=${preview}&variant=aud-members&perspective=published`)
        await settle(page, 15000)
        const f = page.frames().find((x) => x.url().includes(':3334'))
        await f?.locator('h1').first().click()
        await settle(page, 6000)
        const r = await page.evaluate(() => {
          const pane = document.querySelector('[data-testid="document-pane"]')?.getBoundingClientRect()
          const ms = [...document.querySelectorAll('[data-testid="base-variant-diff-indicator"]')].map((e) => e.getBoundingClientRect())
          return {paneW: pane && Math.round(pane.width), count: ms.length, clipped: ms.filter((q) => pane && (q.left < pane.left || q.right > pane.right)).length}
        })
        return r.count > 0 && r.clipped === 0 ? ok(`pane ${r.paneW}px wide: ${r.count} marks, none clipped`) : differs(JSON.stringify(r))
      })
      break
    }
    case 'j13': {
      await run(0, async () => ((await visible(page, '[data-testid^=version-mark-]')) ? differs('a draft variant document cannot be opened as its own document here (no variant route); the base opens') : missing('no list')))
      await run(1, async () => {
        await page.locator('[data-testid^=version-mark-]').nth(5).click()
        await settle(page, 4000)
        return /Draft/.test(await page.locator('body').innerText()) ? ok('draft rows listed in the inventory') : differs('no draft row')
      })
      await run(2, async () => missing('the inventory panel has no Publish action (bulk bar removed in the port); publishing a variant version is possible from the Variants tool bulk bar'))
      await goto(page, '/releases', 'open-beta-a')
      await run(3, async () => ((await visible(page, 'text=Releases', 12000)) ? differs('the shipped Releases tool opens; whether a variant published on its own is absent from releases was not verified (releases list documents by release id)') : missing('Releases tool not shown')))
      break
    }
  }
}

async function main() {
  await cleanup()
  const browser = await chromium.launch()
  const context = await browser.newContext({viewport: {width: 1456, height: 900}})
  const page = await context.newPage()
  await page.goto(`${base}/#token=${encodeURIComponent(token)}`)
  await settle(page, 4000)
  try {
    for (const journey of journeys) {
      if (only.length && !only.includes(journey.id)) continue
      console.log('---', journey.id, journey.title)
      try {
        await walk(page, journey)
      } catch (e) {
        console.log('ABORTED', journey.id, String(e).split('\n')[0])
        results.push({step: `${journey.id}-*`, title: 'journey aborted', status: 'not reachable', note: String(e).split('\n')[0].slice(0, 200)})
      }
    }
  } finally {
    await cleanup()
    const left = await x.fetch('count(*[_id match "*book-c5-pw-*"]) + count(*[_id == "_.variants.' + EMPTY_DEF + '"])')
    console.log('cleanup left:', left)
    await browser.close()
    writeFileSync(join(out, 'run.json'), JSON.stringify(results, null, 2))
  }
}

await main()
