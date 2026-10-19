// C2 A pills follow PR #39: Variants first, a divider, Published, Draft, Releases. node journeys/verify-pills.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1456, height: 900}})).newPage()
await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(4000)
await p.goto('http://localhost:3350/structure/book;book-lighthouse?design=show.a,c2.a')
await p.waitForTimeout(12000)
const row = p.locator('[data-testid=doc-pills-a]').first()
const order = (await row.locator('button, [data-testid=pills-divider]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.testid === 'pills-divider' ? '|' : (e.textContent ?? '').trim()))).filter(Boolean)
console.log(/^Variants · \d+,\|,Published,Draft,Releases · \d+/.test(order.join(',')) ? 'PASS' : 'FAIL', order.join(' '))
await p.screenshot({path: 'journeys-captures/pills-a.png', clip: {x: 400, y: 0, width: 1000, height: 140}})
await b.close()
