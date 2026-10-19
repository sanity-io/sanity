// Captures the studio and runs the C5 click-through with Playwright against http://localhost:3350 (start the studio first).
//   node journeys/capture.mts              journey screenshots + the C5 click-through
// Output: journeys-captures/ (screenshots and run.json). Needs `sanity login` (the CLI token signs the browser in and
// writes the throwaway documents). Writes ONLY to the private variants-2-0 dataset, only documents named book-c5-pw-*,
// and removes them at the end.
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

type Result = {name: string; ok: boolean; detail: string}
const results: Result[] = []
const record = (name: string, ok: boolean, detail = '') => {
  results.push({name, ok, detail})
  console.log(ok ? 'PASS' : 'FAIL', name, detail)
}

const DOCS = ['book-c5-pw-1', 'book-c5-pw-2', 'book-c5-pw-3']
const VARIANT_LABEL = /Members/
const VARIANT_ID = 'aud-members'

async function cleanup() {
  const ids: string[] = await x.fetch('*[_id match "*book-c5-pw-*"]._id')
  for (const id of ids) {
    try {
      await x.delete(id)
    } catch {
      // Already gone.
    }
  }
}

async function versionsOf(id: string) {
  return (await x.fetch('*[_id match "*" + $id]{_id, "v": _system.variant._ref, "b": _system.bundleId}', {id})) as {_id: string; v?: string; b?: string}[]
}

async function open(page: Page, path: string) {
  await page.goto(`${base}${path}`)
  await page.waitForLoadState('domcontentloaded')
}

async function main() {
  await cleanup()
  const browser = await chromium.launch()
  const context = await browser.newContext({viewport: {width: 1456, height: 900}})
  const page = await context.newPage()
  await page.goto(`${base}/#token=${encodeURIComponent(token)}`)

  // ---- 1. journey screenshots: one per journey (and per step when journeys.json has steps)
  const journeys = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'options', 'journeys.json'), 'utf8'))
  for (const j of journeys) {
    const steps = j.steps?.length ? j.steps : [{title: 'start', route: '/structure/book', preset: j.id}]
    for (const [i, step] of steps.entries()) {
      try {
        await open(page, `${step.route ?? '/structure/book'}?preset=${step.preset ?? j.id}`)
        await page.waitForTimeout(6000)
        await page.screenshot({path: join(out, `${j.id}-step${i + 1}.png`)})
      } catch (e) {
        record(`capture ${j.id} step ${i + 1}`, false, String(e))
      }
    }
  }
  record('journey screenshots', true, `${journeys.length} journeys`)

  // ---- 2. C5 click-through on throwaway documents
  for (const id of DOCS) await x.createOrReplace({_id: id, _type: 'book', title: `C5 test ${id.slice(-1)}`})
  await open(page, '/inventory?design=show.a,stage.open-beta')
  await page.waitForSelector('[data-testid=def-lens]', {timeout: 60000})
  const select = page.locator('[data-testid=def-lens] select')
  const option = (await select.locator('option').allTextContents()).find((t) => VARIANT_LABEL.test(t))
  await select.selectOption({label: option})
  const row = (id: string) => page.locator(`[data-testid=lens-def-docs-row-${id}]`)
  const tick = async (id: string) => row(id).locator('input[type=checkbox]').check()
  const bar = (name: RegExp) => page.locator('[data-testid=bulk-bar]').getByRole('button', {name})
  const dialog = page.getByRole('dialog')
  const confirm = async (name: RegExp) => {
    await dialog.getByRole('button', {name}).click()
    await dialog.locator('[data-testid=bulk-results]').waitFor({timeout: 30000})
    const text = await dialog.locator('[data-testid=bulk-results]').innerText()
    await dialog.getByRole('button', {name: 'Close'}).click()
    return text
  }
  const rowText = async (id: string) => (await row(id).innerText()).replace(/\s+/g, ' ')

  try {
    // a. bulk create on two absent rows
    for (const id of [DOCS[0], DOCS[1]]) await tick(id)
    await bar(/Create/).click()
    await page.screenshot({path: join(out, 'c5-create-dialog.png')})
    const created = await confirm(/Create 2 variant/)
    await page.waitForTimeout(2500)
    const v1 = await versionsOf(DOCS[0])
    record('bulk Create on 2 absent rows', (created.match(/✓/g) ?? []).length === 2 && v1.some((r) => r.v?.endsWith(VARIANT_ID)), created.replace(/\s+/g, ' '))
    record('rows show Draft only after create', /Draft only/.test(await rowText(DOCS[0])) && /Draft only/.test(await rowText(DOCS[1])), await rowText(DOCS[0]))

    // b. bulk Publish on the two rows
    for (const id of [DOCS[0], DOCS[1]]) await tick(id)
    await bar(/^Publish/).click()
    const published = await confirm(/^Publish 2/)
    await page.waitForTimeout(2500)
    record('bulk Publish on 2 rows', (published.match(/✓/g) ?? []).length === 2 && /Published/.test(await rowText(DOCS[0])), await rowText(DOCS[0]))

    // c. mixed selection: one published row (pw-1) + one absent row (pw-3)
    await tick(DOCS[0])
    await tick(DOCS[2])
    const enabled = {
      unpublish: await bar(/^Unpublish/).isEnabled(),
      create: await bar(/Create/).isEnabled(),
      publish: await bar(/^Publish/).isEnabled(),
    }
    record('mixed selection enables only what applies', enabled.unpublish && enabled.create && !enabled.publish, JSON.stringify(enabled))
    await bar(/^Unpublish/).click()
    const dialogText = await dialog.innerText()
    const unpublished = await confirm(/^Unpublish 1/)
    await page.waitForTimeout(2500)
    record('mixed selection: Unpublish applies to the published row only', /C5 test 1/.test(dialogText) && !/C5 test 3/.test(dialogText) && (unpublished.match(/✓/g) ?? []).length === 1, `${dialogText.replace(/\s+/g, ' ').slice(0, 140)} | ${await rowText(DOCS[0])}`)

    // d. Add to release (pw-2, published) into the undecided release
    await page.locator('[data-testid=bulk-bar] button', {hasText: 'Clear'}).click().catch(() => undefined)
    await tick(DOCS[1])
    await bar(/Add to release/).click()
    await dialog.locator('select').selectOption({label: 'Autumn catalogue (undecided)'})
    const added = await confirm(/^Add to release 1/)
    const v2 = await versionsOf(DOCS[1])
    record('Add to release', (added.match(/✓/g) ?? []).length === 1 && v2.some((r) => r.b === 'rUndecided'), added.replace(/\s+/g, ' '))
    await page.screenshot({path: join(out, 'c5-after-add-to-release.png')})

    // e. bulk Delete on all three
    for (const id of DOCS) await tick(id).catch(() => undefined)
    await page.waitForTimeout(500)
    await bar(/^Delete/).click()
    const deleted = await confirm(/^Delete \d/)
    await page.waitForTimeout(2500)
    const left = (await Promise.all([DOCS[0], DOCS[1]].map(versionsOf))).flat().filter((r) => r.v)
    record('bulk Delete removes the variant versions', left.length === 0, `${(deleted.match(/✓/g) ?? []).length} ok, ${left.length} variant versions left`)
  } catch (e) {
    record('C5 click-through aborted', false, String(e).split('\n')[0])
    await page.screenshot({path: join(out, 'c5-failure.png')})
  } finally {
    await cleanup()
    const leftover = await x.fetch('count(*[_id match "*book-c5-pw-*"])')
    record('cleanup of throwaway documents', leftover === 0, `${leftover} left`)
    await browser.close()
    writeFileSync(join(out, 'run.json'), JSON.stringify(results, null, 2))
  }
}

await main()
