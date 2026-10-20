// Inside Presentation, links of the site change the route without a reload: the books stay loaded, the address bar follows,
// and "Documents on this page" keeps listing them. node journeys/verify-site-nav.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 200))
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1500, height: 900}})).newPage()
try {
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3000)
  await p.goto('http://localhost:3350/presentation')
  await p.waitForTimeout(9000)
  const f = () => p.frames().find((x) => x.url().includes(':3334'))!
  const bar = () => p.locator('input[type=text], input:not([type])').first().inputValue()
  const docs = async () => (await p.locator('body').innerText()).includes('A Field Guide to Small Hours')
  log(/route=list/.test(await bar()) && (await docs()), 'Catalogue loads with the documents list', await bar())
  await f().getByRole('link', {name: 'Home', exact: true}).click()
  await p.waitForTimeout(4000)
  log(/route=home/.test(await bar()), 'Home: the address bar follows the site', await bar())
  log((await f().locator('.shelf .book').count()) > 0, 'Home: the featured books are loaded', String(await f().locator('.shelf .book').count()))
  log(await docs(), 'Home: Documents on this page lists the books')
  await f().locator('.shelf .book').first().click()
  await p.waitForTimeout(4000)
  log(/route=book/.test(await bar()) && (await f().locator('.detail h1').count()) === 1, 'A book opens in place', await bar())
  await f().getByRole('link', {name: 'Campaign', exact: true}).click()
  await p.waitForTimeout(3000)
  log((await f().locator('[data-testid=campaign-title]').count()) === 1, 'Campaign page', await bar())
  await p.screenshot({path: 'journeys-captures/site/presentation-campaign.png'})
} catch (e) {
  log(false, 'script error', String(e).split('\n').slice(0, 3).join(' '))
}
await b.close()
