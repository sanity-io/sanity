// Screenshots of the Journeys remote (connected to a studio window), light and dark -> journeys-captures/remote/
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  const context = await b.newContext({viewport: {width: 520, height: 900}, colorScheme: theme})
  const main = await context.newPage()
  await main.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await main.waitForTimeout(3500)
  await main.goto('http://localhost:3350/structure/book')
  await main.getByRole('button', {name: 'Design options'}).waitFor({timeout: 40000})
  const remote = await context.newPage()
  await remote.goto('http://localhost:3350/static/remote.html')
  await remote.waitForFunction(() => document.getElementById('conn')?.textContent === 'Connected', null, {timeout: 20000})
  await remote.locator('#journey').selectOption('j03')
  await remote.locator('li[data-step="2"] .t').click()
  await remote.waitForTimeout(2500)
  await remote.locator('li[data-step="0"] input[type=checkbox]').check()
  await remote.screenshot({path: `journeys-captures/remote/remote-${theme}.png`})
  await context.close()
}
await b.close()
