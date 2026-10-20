// Screenshots of the Design options window for C5, C6 and C8, light and dark, into journeys-captures/. node journeys/shoot-diagrams.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  const context = await b.newContext({viewport: {width: 1500, height: 1250}, colorScheme: theme})
  // A big window, so the frames gallery shows several columns (the stored rect is the window's own size).
  await context.addInitScript(() => window.localStorage.setItem('variants-2-0-studio:window', JSON.stringify({x: 4, y: 4, w: 1490, h: 1240})))
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3000)
  await p.goto('http://localhost:3350/structure/book')
  await p.getByRole('button', {name: 'Design options'}).waitFor({timeout: 40000})
  await p.getByRole('button', {name: 'Design options'}).click()
  const dialog = p.getByRole('dialog', {name: 'Design options'})
  await dialog.waitFor({timeout: 8000})
  for (const id of ['c5', 'c6', 'c8']) {
    await dialog.getByRole('button', {name: new RegExp(`^${id.toUpperCase()}\\b`, 'i')}).first().click()
    await p.waitForTimeout(600)
    const frames = await dialog.locator('[data-testid=spec-diagram]').count()
    console.log(theme, id, 'spec diagrams in the window:', frames)
    await dialog.screenshot({path: `journeys-captures/diagrams-${id}-${theme}.png`})
  }
}
await b.close()
