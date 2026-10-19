// D1 (Delete = one version) on throwaway data. node journeys/verify-d1.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const V = 'aud-members'
const doc = {_type: 'book', title: 'C5 test 1'}
const rows = async () => ((await x.fetch('*[_id match "*book-c5-pw-1" && defined(_system.variant)]{"b":_system.bundleId}')) as {b?: string}[]).map((r) => r.b ?? 'published').sort()
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 260))
const cleanup = async () => { for (const id of await x.fetch('*[_id match "*book-c5-pw-*"]._id')) await x.delete(id).catch(() => undefined) }
await cleanup()
await x.createOrReplace({_id: 'book-c5-pw-1', ...doc})
await x.createOrReplace({_id: 'book-c5-pw-3', _type: 'book', title: 'C5 test 3'})
const c = (bundleId: string) => ({actionType: 'sanity.action.document.variant.create', publishedId: 'book-c5-pw-1', variantId: V, bundleId, document: doc})
await x.action([c('drafts'), {actionType: 'sanity.action.document.variant.publish', publishedId: 'book-c5-pw-1', variantId: V, bundleId: 'drafts'}] as never)
await x.action(c('drafts') as never)
await x.action(c('rUndecided') as never)
log(JSON.stringify(await rows()) === JSON.stringify(['drafts', 'published', 'rUndecided']), 'setup: published + draft + release versions', JSON.stringify(await rows()))
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1456, height: 900}})).newPage()
await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(4000)
await p.goto('http://localhost:3350/variants/aud-members?preset=open-beta-a')
await p.waitForTimeout(11000)
const dlg = p.getByRole('dialog')
const bar = (n: RegExp) => p.locator('[data-testid=bulk-bar]').getByRole('button', {name: n})
const row = (n: number) => p.locator('tr, [role=row], [data-testid*=row]').filter({hasText: `C5 test ${n}`})
try {
  log((await row(1).count()) >= 3, 'one row per stored version', `${await row(1).count()} rows for C5 test 1`)
  // select the draft row only (the row whose Appears-in chip says Draft) = the second
  const draftRow = row(1).filter({hasText: /Draft/}).first()
  await draftRow.locator('input[type=checkbox]').check()
  await bar(/^Delete$/).click()
  const t1 = (await dlg.innerText()).replace(/\s+/g, ' ')
  log(/not served yet/.test(t1) && /Only the version named above/.test(t1), 'Delete dialog for a draft version', t1)
  await dlg.getByRole('button', {name: /^Delete 1/}).click()
  await dlg.locator('[data-testid=bulk-results]').waitFor({timeout: 30000})
  await dlg.getByRole('button', {name: 'Close'}).last().click()
  await p.waitForTimeout(2500)
  const after = await rows()
  log(after.length === 2 && after.includes('published') && after.includes('rUndecided') && !after.includes('drafts'), 'Delete removed only the draft version', JSON.stringify(after))
  // mixed: a version row + an absent row
  await row(1).first().locator('input[type=checkbox]').check()
  await row(3).first().locator('input[type=checkbox]').check()
  await bar(/^Delete$/).click()
  const t2 = (await dlg.innerText()).replace(/\s+/g, ' ')
  log(/skipped/.test(t2) && !/C5 test 3 ·/.test(t2), 'mixed selection: absent row skipped and said so', t2)
  await dlg.getByRole('button', {name: 'Cancel'}).click()
  // delete all versions
  await bar(/Delete all versions/).click()
  const t3 = (await dlg.innerText()).replace(/\s+/g, ' ')
  log(/Delete all \d+ versions/.test(t3) && /Published/.test(t3) && /fall back to the base document/.test(t3) && /cannot be undone/.test(t3), 'Delete all versions dialog lists every version and the fallback', t3)
  await dlg.getByRole('button', {name: /^Delete all \d+ versions$/}).click()
  await dlg.locator('[data-testid=bulk-results]').waitFor({timeout: 30000})
  await dlg.getByRole('button', {name: 'Close'}).last().click()
  await p.waitForTimeout(2500)
  log((await rows()).length === 0, 'Delete all versions removed every version', JSON.stringify(await rows()))
} catch (e) {
  log(false, 'aborted', String(e).split('\n')[0])
  await p.screenshot({path: join(import.meta.dirname, '..', 'journeys-captures', 'verify-d1-failure.png')})
} finally {
  await cleanup()
  await b.close()
}
