// Create and delete, by real clicks, for a variant definition and a variant document. Throwaway data only. node journeys/verify-crud.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 260))
const DOC = 'book-crud-pw-1'
const base = 'http://localhost:3350'
const defIds = async () => (await x.fetch('*[_type == "system.variant" && conditions.audience == "pw-crud"]._id')) as string[]
const variantDocs = async () => (await x.fetch('*[_id match "*" + $id && defined(_system.variant)]._id', {id: DOC})) as string[]
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1456, height: 900}})).newPage()
const shot = (n: string) => p.screenshot({path: `journeys-captures/crud-${n}.png`})
await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(4000)
try {
  // 1. Create a definition through the dialog.
  await p.goto(`${base}/variants?preset=open-beta-a`)
  await p.waitForTimeout(9000)
  await p.getByRole('button', {name: /New variant definition/}).click()
  const d = p.getByRole('dialog')
  await d.getByPlaceholder('e.g. Loyal customers').fill('PW crud definition')
  await d.getByLabel('Key').fill('audience')
  await d.getByLabel('Value').fill('pw-crud')
  await shot('1-create-definition-dialog')
  await d.getByRole('button', {name: 'Create variant definition'}).click()
  await p.waitForTimeout(5000)
  const defs = await defIds()
  log(defs.length === 1, 'CREATE variant definition (dialog)', defs.join(','))
  const variantId = (defs[0] ?? '').replace('_.variants.', '')
  if (!variantId) throw new Error('definition not created')
  await shot('2-after-create-definition')

  // 2. Create a variant document: base document by API, the variant version by the banner button.
  await x.createOrReplace({_id: DOC, _type: 'book', title: 'CRUD test 1'})
  await p.goto(`${base}/structure/book;${DOC}?perspective=drafts&variant=${variantId}&preset=open-beta-a`)
  await p.waitForTimeout(12000)
  await shot('3-missing-variant-banner')
  await p.getByRole('button', {name: /Create variant/}).first().click()
  await p.waitForTimeout(6000)
  const made = await variantDocs()
  log(made.length === 1, 'CREATE variant document (banner Create variant)', made.join(','))
  await shot('4-after-create-variant')

  // 3. Delete the variant document through the version list.
  await p.goto(`${base}/structure/book;${DOC}%2Cinspect%3Dvariants-inventory?perspective=drafts&variant=${variantId}&preset=open-beta-a`)
  await p.waitForTimeout(12000)
  await p.getByRole('button', {name: /Actions for PW crud/}).first().click()
  await p.getByRole('menuitem', {name: 'Delete this version'}).click()
  await shot('5-delete-variant-dialog')
  await p.getByRole('dialog').getByRole('button', {name: /^Delete 1/}).click()
  await p.waitForTimeout(5000)
  const left = await variantDocs()
  log(left.length === 0 && (await x.fetch('count(*[_id == $id])', {id: DOC})) === 1, 'DELETE variant document (version list)', `variant versions left ${left.length}`)

  // 4. Delete the definition from its detail page.
  await p.goto(`${base}/variants/${variantId}?preset=open-beta-a`)
  await p.waitForTimeout(9000)
  await p.locator('button[aria-haspopup]').last().click()
  await p.getByRole('menuitem', {name: /Delete/}).first().click()
  await shot('6-delete-definition-dialog')
  await p.getByRole('dialog').getByRole('button', {name: /Yes, delete/i}).click()
  await p.waitForTimeout(5000)
  log((await defIds()).length === 0, 'DELETE variant definition (detail menu)', `left ${(await defIds()).length}`)
} catch (e) {
  log(false, 'script error', String(e))
} finally {
  // Throwaway cleanup, whatever happened.
  for (const id of await variantDocs()) await x.delete(id).catch(() => undefined)
  await x.delete(DOC).catch(() => undefined)
  await x.delete(`drafts.${DOC}`).catch(() => undefined)
  for (const id of await defIds()) await x.action({actionType: 'sanity.action.variant.definition.delete', variantId: id.replace('_.variants.', '')} as never).catch(() => undefined)
  console.log('leftovers:', (await x.fetch('count(*[_id match "*book-crud-pw-1*" || (_type == "system.variant" && conditions.audience == "pw-crud")])')) as number)
  await b.close()
}
