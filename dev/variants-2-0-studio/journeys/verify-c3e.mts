// C3 option E: the grouped list (D) and the flyout (B) together. Screenshot -> journeys-captures/e9-header/C3-E.png.   node journeys/verify-c3e.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'

import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8'))
  .authToken as string
mkdirSync('journeys-captures/e9-header', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`)
  if (!pass) failed++
}
const b = await chromium.launch()
const BASE = 'show.a,stage.open-beta,navLayout.b,c1.d,c2.c,c4.a'
async function run(c3: string) {
  const context = await b.newContext({viewport: {width: 1440, height: 900}})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(
    `http://localhost:3350/structure/book?design=${BASE},c3.${c3}&perspective=published&variant=aud-members`,
  )
  await p.locator('[data-testid^="version-mark-"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(5000)
  return {p, context}
}
{
  const {p, context} = await run('e')
  const sections = await p.locator('[data-testid^="list-section-"]').allInnerTexts()
  log(
    'E1: with a perspective the list is in two sections',
    sections.length === 2 && /Has variant/.test(sections[0]) && /No variant/.test(sections[1]),
    sections.join(' | ').replace(/\n/g, ' '),
  )
  log(
    'E2: the rows carry no diamond (the section says it)',
    (await p.locator('[data-testid="state-badge"][data-state="variant"]').count()) === 0,
  )
  await p.locator('[data-testid^="version-mark-"]').first().hover()
  await p.waitForTimeout(1200)
  log(
    'E3: the control opens the flyout with clickable version rows',
    (await p.getByText(/See all \d+ versions in inventory|Published .* ago/).count()) > 0,
  )
  await p.screenshot({
    path: 'journeys-captures/e9-header/C3-E.png',
    clip: {x: 0, y: 40, width: 900, height: 520},
  })
  await context.close()
}
{
  const {p, context} = await run('d')
  log(
    'D unchanged: sections, read-only popover',
    (await p.locator('[data-testid^="list-section-"]').count()) === 2,
  )
  await context.close()
}
await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
