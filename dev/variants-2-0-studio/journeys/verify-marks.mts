// E9 fieldMarks B and C in the studio: marks by claim, roll-up counts, item and removed marks, the peek (C), keyboard. Screenshots -> journeys-captures/e9-marks/verify
// node journeys/verify-marks.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-marks/verify', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
async function open(opt: string, width = 1440, theme: 'light' | 'dark' = 'light') {
  const context = await b.newContext({viewport: {width, height: 2300}, colorScheme: theme})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3350/structure/fieldMarksTest;fm-2?perspective=drafts&variant=aud-returning-visitors&design=show.a,stage.open-beta,fieldMarks.${opt}`)
  await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(6500)
  return {p, context}
}
const marks = (p: Page) => p.evaluate(() => [...document.querySelectorAll('[data-testid="e9-mark"]')].map((e) => ({kind: e.getAttribute('data-kind'), label: e.getAttribute('aria-label'), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height)})))

{
  const {p, context} = await open('a')
  log('A: no E9 marks, the shipped form', (await marks(p)).length === 0)
  await context.close()
}
{
  const {p, context} = await open('b')
  const m = await marks(p)
  log('B: a Changed mark on the edited title', m.some((x) => x.label?.startsWith('Changed')))
  log('B: a roll-up on a container ("N differ from base" or "N changed inside")', m.some((x) => /\d+ (differ from base|changed inside)/.test(x.label ?? '')), m.map((x) => x.label).slice(0, 6).join(' | '))
  log('B: Added and Moved item marks on sections', m.some((x) => x.kind === 'added') && m.some((x) => x.kind === 'moved'))
  log('B: every mark is at least 24 x 24 to hit', m.every((x) => x.w >= 24 && x.h >= 24), m.filter((x) => x.w < 24 || x.h < 24).length + ' under')
  log('B: a removed item note under Sections', (await p.getByTestId('e9-removed-note').count()) >= 1)
  log('B: an unknown field note', (await p.getByTestId('e9-unknown-note').count()) === 1)
  log('B: no peek in B', (await p.getByTestId('e9-peek').count()) === 0)
  await p.screenshot({path: 'journeys-captures/e9-marks/verify/b.png'})
  await context.close()
}
{
  const {p, context} = await open('c')
  const first = p.getByTestId('e9-mark').first()
  await first.focus()
  await p.keyboard.press('Enter')
  await p.waitForTimeout(800)
  const peek = p.getByTestId('e9-peek')
  log('C: pressing a mark opens the peek (2 actions: focus, press)', (await peek.count()) === 1)
  const before = (await p.getByTestId('e9-peek-before').textContent()) ?? ''
  const after = (await p.getByTestId('e9-peek-after').textContent()) ?? ''
  log('C: the peek shows before and after', before.length > 0 && after.includes('edited'), `${before} -> ${after}`)
  log('C: the peek offers Open comparison', (await peek.getByRole('button', {name: 'Open comparison'}).count()) === 1)
  await p.screenshot({path: 'journeys-captures/e9-marks/verify/c-peek.png'})
  await p.keyboard.press('Escape')
  await context.close()
}
await b.close()
process.exit(failed ? 1 : 0)
