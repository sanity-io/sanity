// Entry points that open a variant version as a document, plus the direct versions.<scope>.<id> probe. node journeys/verify-open.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 300))
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1456, height: 900}})).newPage()
await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(4000)
const url = () => decodeURIComponent(p.url()).replace('http://localhost:3350', '')
const ctx = async () => (await p.locator('[data-testid=presentation-context-line]').innerText().catch(() => 'NO CONTEXT LINE')).replace(/\s+/g, ' ')
try {
  // 1. C5 definition lens row
  await p.goto('http://localhost:3350/inventory?preset=open-beta-a')
  await p.waitForTimeout(10000)
  await p.locator('[data-testid=def-lens] select').selectOption({label: (await p.locator('[data-testid=def-lens] select option').allTextContents()).find((t) => /Members/.test(t))})
  await p.locator('[data-testid^=lens-def-docs-row-book-lighthouse]').first().click()
  await p.waitForTimeout(8000)
  log(/\/structure\/book;book-lighthouse/.test(url()) && /variant=aud-members/.test(url()) && /perspective=/.test(url()), 'definition lens row opens the document at that version', url())
  log(/Members/.test(await ctx()), 'document pane shows the context line', await ctx())
  // 2. visitor lens Open
  await p.goto('http://localhost:3350/inventory?preset=open-beta-a')
  await p.waitForTimeout(10000)
  await p.locator('[data-testid=c5-a] button[role=radio]', {hasText: 'Visitor'}).click()
  await p.locator('[data-testid=c5-a] select').first().selectOption({label: 'Members'})
  await p.locator('[data-testid=lens-visitor-row-book-lighthouse]').getByRole('button', {name: 'Open'}).click()
  await p.waitForTimeout(8000)
  log(/book-lighthouse/.test(url()) && /variant=aud-members/.test(url()) && /perspective=published/.test(url()), 'visitor lens Open opens the served version', url())
  log(/Members/.test(await ctx()), 'context line shows the served version', await ctx())
  // 3. inventory row (inspector) keeps the inspector and shows the version
  await p.goto('http://localhost:3350/structure/book;book-lighthouse%2Cinspect%3Dvariants-inventory?preset=open-beta-a&design=show.a,stage.open-beta,c4.a')
  await p.waitForTimeout(12000)
  await p.getByText('Returning visitors').last().click().catch(() => undefined)
  await p.waitForTimeout(4000)
  log(/inspect=variants-inventory/.test(url()) && /variant=/.test(url()), "Andrej's inventory row keeps the inspector and sets the version", url())
  // 4. shipped Variants tool row link
  await p.goto('http://localhost:3350/variants/aud-members?preset=open-beta-a')
  await p.waitForTimeout(11000)
  await p.getByText('The Lighthouse Keeper').first().click()
  await p.waitForTimeout(8000)
  log(/book-lighthouse/.test(url()) && /variant=aud-members/.test(url()), 'shipped Variants-tool row opens the document at that version', url())
  // 5. direct probe of a stored variant version id
  const rows = (await x.fetch('*[_id match "*book-lighthouse" && _system.variant._ref == "_.variants.aud-members"]{_id,"b":_system.bundleId}')) as {_id: string; b?: string}[]
  const target = rows[0]
  await p.goto(`http://localhost:3350/structure/book;${encodeURIComponent(target._id)}?preset=open-beta-a`)
  await p.waitForTimeout(10000)
  const body = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
  log(true, 'PROBE direct id ' + target._id, `url=${url()} | title=${await p.title()} | ${/Title|Subtitle/.test(body) ? 'form shown' : 'no form'} | ${body.match(/(not found|doesn't exist|Document not found|cannot be edited|read-only)[^.]*/i)?.[0] ?? body.slice(0, 160)}`)
  await p.screenshot({path: join(import.meta.dirname, '..', 'journeys-captures', 'probe-direct-version-id.png')})
} catch (e) {
  log(false, 'aborted', String(e).split('\n')[0])
  await p.screenshot({path: join(import.meta.dirname, '..', 'journeys-captures', 'verify-open-failure.png')})
}
await b.close()
