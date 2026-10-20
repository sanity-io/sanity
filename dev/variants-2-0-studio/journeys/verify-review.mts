// E9 reviewPanel A, B, C on Field marks test 2 (Returning visitors, draft against published and against base).
// Screenshots -> journeys-captures/e9-review/<option>-<width>-<theme>.png.   node journeys/verify-review.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-review', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
async function open(opt: string, width = 1440, theme: 'light' | 'dark' = 'light', extra = '') {
  const context = await b.newContext({viewport: {width, height: 1000}, colorScheme: theme})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3350/structure/fieldMarksTest;fm-2?perspective=drafts&variant=aud-returning-visitors&design=show.a,stage.open-beta,reviewPanel.${opt}${extra}`)
  await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(6000)
  return {p, context}
}
const openPanel = async (p: Page) => {
  await p.getByTestId('pane-context-menu-button').last().click()
  await p.waitForTimeout(500)
  await p.getByTestId('action-history').first().click()
  await p.waitForTimeout(3500)
}
{
  const {p, context} = await open('a')
  await openPanel(p)
  log('A: the stock panel (no E9 panel)', (await p.getByTestId('e9-review').count()) === 0)
  await context.close()
}
for (const opt of ['b', 'c'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    const {p, context} = await open(opt, 1440, theme, ',fieldMarks.b')
    await openPanel(p)
    log(`${opt.toUpperCase()} ${theme}: the E9 panel opens from Review changes`, (await p.getByTestId('e9-review').count()) === 1)
    if (!(await p.getByTestId('e9-review').count())) { await context.close(); continue }
    log(`${opt.toUpperCase()} ${theme}: Showing and Against rows name both sides`, /Returning visitors/.test((await p.getByTestId('review-showing').textContent()) ?? '') && /Published/.test((await p.getByTestId('review-against').textContent()) ?? ''))
    const total = (await p.getByTestId('review-total').textContent()) ?? ''
    log(`${opt.toUpperCase()} ${theme}: the total and the cards agree`, new RegExp(`^${await p.getByTestId('review-card').count()} change`).test(total), total)
    await p.screenshot({path: `journeys-captures/e9-review/${opt}-1440-${theme}.png`})
    if (theme === 'light') {
      await p.getByTestId('review-against').click()
      const disabled = await p.getByRole('menuitem', {name: /Open beta compares one dimension at a time/}).count()
      log(`${opt.toUpperCase()}: two-move counterparts are disabled with the reason`, disabled > 0, `${disabled} disabled`)
      await p.keyboard.press('Escape')
      const before = await p.getByTestId('review-card').count()
      await p.getByTestId('review-revert').first().click()
      await p.waitForTimeout(2500)
      log(`${opt.toUpperCase()}: Revert removes the change from the list and offers Undo`, (await p.getByTestId('review-card').count()) < before && (await p.getByTestId('undo-revert').count()) === 1, `${before} -> ${await p.getByTestId('review-card').count()}`)
      await p.getByTestId('undo-revert').click()
      await p.waitForTimeout(2500)
      log(`${opt.toUpperCase()}: Undo puts it back`, (await p.getByTestId('review-card').count()) === before, String(await p.getByTestId('review-card').count()))
      if (opt === 'c') {
        await p.getByTestId('review-card').nth(1).click()
        await p.waitForTimeout(800)
        log('C: the selected card thickens its field mark', (await p.locator('[data-e9-mark][data-selected]').count()) > 0)
        log('C: Open full view is offered', (await p.getByTestId('review-full-view').count()) === 1)
        await p.screenshot({path: 'journeys-captures/e9-review/c-selected-1440-light.png'})
      } else log('B: no full view and no two-way link', (await p.getByTestId('review-full-view').count()) === 0)
    }
    await context.close()
  }
}
await b.close()
process.exit(failed ? 1 : 0)
