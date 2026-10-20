// The options window with the Storybook links of C1 to C9 -> journeys-captures/story-links/c<n>.png, and the link targets.
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
const context = await b.newContext({viewport: {width: 1400, height: 900}})
await context.addInitScript(() => window.localStorage.setItem('variants-2-0-studio:window', JSON.stringify({x: 4, y: 4, w: 1390, h: 880})))
const p = await context.newPage()
await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(3000)
await p.goto('http://localhost:3350/structure/book')
await p.getByRole('button', {name: 'Design options'}).click()
const dialog = p.getByRole('dialog', {name: 'Design options'})
await dialog.waitFor()
for (let n = 1; n <= 9; n++) {
  await dialog.getByRole('button', {name: new RegExp(`^C${n}\\b`)}).first().click()
  await p.waitForTimeout(500)
  const links = await dialog.locator('[data-testid=story-link]').evaluateAll((els) => els.map((e) => `${(e as HTMLAnchorElement).href.split('path=/story/')[1]}${e.hasAttribute('data-moved') ? ' (MOVED)' : ''}`))
  console.log(`C${n}:`, links.join(' | '))
  await dialog.screenshot({path: `journeys-captures/story-links/c${n}.png`})
}
console.log(await dialog.locator('[data-testid=storybook-base]').innerText())
await b.close()
