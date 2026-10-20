// Screenshots of the Journeys remote (connected to a studio window), light and dark, at three walk steps of j01 and j03
// -> journeys-captures/remote/<journey>-step<n>-<theme>.png   node journeys/shoot-remote.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  const context = await b.newContext({viewport: {width: 1200, height: 800}, colorScheme: theme})
  const main = await context.newPage()
  await main.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await main.waitForTimeout(3500)
  await main.goto('http://localhost:3350/structure/book')
  await main.getByRole('button', {name: 'Design options'}).waitFor({timeout: 40000})
  const remote = await context.newPage()
  await remote.goto('http://localhost:3350/static/remote.html')
  await remote.waitForFunction(() => document.getElementById('conn')?.textContent === 'Connected', null, {timeout: 20000})
  for (const [id, steps] of [['j01', [0, 1, 2]], ['j03', [0, 2, 4]]] as const) {
    await remote.locator(`button.jr[data-journey="${id}"]`).click()
    for (const i of steps) {
      await remote.locator(`#steps button[data-step="${i}"]`).click()
      await remote.waitForTimeout(1800)
      await remote.screenshot({path: `journeys-captures/remote/${id}-step${i + 1}-${theme}.png`})
    }
  }
  await context.close()
}
await b.close()
