// C1 option C, the shipped Perspective Filter bar: rest, one value set, remove hover; light and dark; and its measurements.
// node journeys/shoot-c1c.mts -> journeys-captures/c1-baseline/c-<state>-<theme>.png
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  const p = await (await b.newContext({viewport: {width: 1300, height: 420}, colorScheme: theme})).newPage()
  const shot = (state: string) => p.screenshot({path: `journeys-captures/c1-baseline/c-${state}-${theme}.png`, clip: {x: 0, y: 0, width: 1300, height: 200}})
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3000)
  await p.goto('http://localhost:3350/structure/book;book-lighthouse?design=show.a,stage.ga,c1.c')
  await p.waitForTimeout(9000)
  await shot('rest')
  // measurements of the bar
  const info = await p.evaluate(() => {
    const box = (e: Element) => { const r = e.getBoundingClientRect(); return {x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10} }
    const bar = [...document.querySelectorAll('div')].find((d) => d.textContent?.trim().startsWith('Version') && d.querySelector('button') && d.textContent.includes('Variant') && d.getBoundingClientRect().height < 80 && d.getBoundingClientRect().height > 20)
    const buttons = bar ? [...bar.querySelectorAll('button')].map((x) => ({text: x.textContent?.trim(), ...box(x), radius: getComputedStyle(x).borderRadius})) : []
    return {bar: bar ? box(bar) : null, buttons}
  })
  console.log(theme, JSON.stringify(info))
  // set a value in the Variant filter
  const variant = p.getByRole('button', {name: /All users/})
  await variant.click()
  await p.waitForTimeout(700)
  await p.screenshot({path: `journeys-captures/c1-baseline/c-menu-open-${theme}.png`, clip: {x: 0, y: 0, width: 1300, height: 420}})
  const item = p.getByRole('menuitem').filter({hasNotText: /All users/}).first()
  await item.click()
  await p.waitForTimeout(1200)
  await shot('one-value-set')
  const remove = p.getByRole('button', {name: /remove|clear/i}).first()
  if (await remove.isVisible().catch(() => false)) {
    await remove.hover()
    await p.waitForTimeout(300)
    await shot('remove-hover')
  }
  await p.context().close()
}
await b.close()
