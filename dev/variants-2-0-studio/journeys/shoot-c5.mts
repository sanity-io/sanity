// C5 screenshots (document lens, definition lens, selection with bulk bar, delete dialog), light and dark.
// node journeys/shoot-c5.mts <label>   (label: before-1, after-1, ...) -> journeys-captures/token-fix/<label>-<state>-<theme>.png
// Read only: the delete dialog is opened and cancelled.
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const label = process.argv[2] ?? 'shot'
const out = join(import.meta.dirname, '..', 'journeys-captures', 'token-fix')
mkdirSync(out, {recursive: true})
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  const p = await (await b.newContext({viewport: {width: 1456, height: 900}, colorScheme: theme})).newPage()
  const shot = (state: string) => p.screenshot({path: join(out, `${label}-${state}-${theme}.png`)})
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3500)
  await p.goto('http://localhost:3350/inventory?preset=open-beta-a')
  await p.waitForTimeout(10000)
  await p.locator('[data-testid=c5-a] button[role=radio]', {hasText: 'Document'}).click().catch(() => undefined)
  await p.waitForTimeout(1500)
  await shot('document-lens')
  await p.locator('[data-testid=c5-a] button[role=radio]', {hasText: 'Definition'}).click()
  await p.waitForTimeout(800)
  const select = p.locator('[data-testid=def-lens] select')
  await select.selectOption({label: (await select.locator('option').allTextContents()).find((t) => /Members/.test(t))})
  await p.waitForTimeout(2500)
  await shot('definition-lens')
  // Selection with the bulk bar and the delete dialog, on the Variants tool detail (seeded data, nothing is confirmed).
  await p.goto('http://localhost:3350/variants/aud-members?preset=open-beta-a')
  await p.waitForTimeout(10000)
  const boxes = p.locator('input[type=checkbox]')
  await boxes.nth(3).check()
  await boxes.nth(4).check()
  await p.waitForTimeout(500)
  await shot('selection-bulk-bar')
  // Delete needs rows that have a version: clear, then tick the two Lighthouse rows.
  await p.getByRole('button', {name: 'Clear', exact: true}).click().catch(() => undefined)
  const versioned = p.locator('tr, [role=row], [data-testid*=row]').filter({hasText: "The Lighthouse Keeper's Almanac"})
  for (let i = 0; i < Math.min(2, await versioned.count()); i++) await versioned.nth(i).locator('input[type=checkbox]').check()
  await p.locator('[data-testid=bulk-bar]').getByRole('button', {name: /^Delete$/}).click().catch(() => undefined)
  await p.waitForTimeout(1200)
  await shot('delete-dialog')
  await p.keyboard.press('Escape')
}
await b.close()
