// The Design options window at 900 and 1400px wide, light and dark, Settings popover closed and open. -> journeys-captures/window-v2/<tag>/<width>-<theme>[-settings].png
// node journeys/shoot-window.mts <tag>   (tag: before or after)
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const tag = process.argv[2] ?? 'after'
const dir = `journeys-captures/window-v2/${tag}`
mkdirSync(dir, {recursive: true})
const key = 'variants-2-0-studio:window'
const b = await chromium.launch()
for (const width of [720, 900, 1400] as const) {
  for (const theme of ['light', 'dark'] as const) {
    const context = await b.newContext({viewport: {width: width + 80, height: 900}, colorScheme: theme})
    const p = await context.newPage()
    await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
    await p.waitForTimeout(3000)
    await p.evaluate(([k, w]) => localStorage.setItem(k as string, JSON.stringify({x: 16, y: 20, w, h: 840})), [key, width])
    await p.goto('http://localhost:3350/structure/book')
    await p.getByRole('button', {name: 'Design options'}).waitFor({timeout: 40000})
    await p.waitForTimeout(2000)
    await p.getByRole('button', {name: 'Design options'}).click()
    const dialog = p.getByRole('dialog', {name: 'Design options'})
    await dialog.waitFor()
    await p.waitForTimeout(600)
    await p.screenshot({path: `${dir}/${width}-${theme}.png`})
    const settings = dialog.getByRole('button', {name: 'Settings'})
    if (await settings.isVisible().catch(() => false)) {
      await settings.click()
      await p.waitForTimeout(400)
      await p.screenshot({path: `${dir}/${width}-${theme}-settings.png`})
    }
    await context.close()
  }
}
await b.close()
