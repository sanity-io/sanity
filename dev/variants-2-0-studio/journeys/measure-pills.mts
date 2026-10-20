// Measures the navbar version pill (ReleasesNav) and option B's Variants pill as rendered: rest, one value set, menu open.
// node journeys/measure-pills.mts -> prints px, screenshots at 2x light into journeys-captures/c1-baseline/pill-*.png
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1300, height: 500}, deviceScaleFactor: 2, colorScheme: 'light'})).newPage()
const measure = (label: string) =>
  p.evaluate((label) => {
    const r = (e: Element | null) => { if (!e) return null; const b = e.getBoundingClientRect(); return {x: Math.round(b.x * 10) / 10, y: Math.round(b.y * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10} }
    const cs = (e: Element | null) => (e ? getComputedStyle(e) : null)
    const nav = document.querySelector('[data-ui=ReleasesNav]')
    const navbar = nav?.closest('nav') ?? nav?.parentElement?.parentElement
    const pad = (e: Element | null) => { const s = cs(e); return s ? `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}` : null }
    const labelBox = nav?.querySelector('[data-ui=Box]')
    const labelText = nav?.querySelector('[data-ui=Text]')
    const btns = nav ? [...nav.querySelectorAll('button')] : []
    const chev = btns.at(-1)
    const svg = chev?.querySelector('svg')
    const variants = document.querySelector('[data-testid=variants-button]')
    const next = nav?.nextElementSibling
    return {
      label,
      versionPill: {outer: r(nav), border: cs(nav)?.borderTopWidth, padding: pad(nav), radius: cs(nav)?.borderRadius, labelBoxPadding: pad(labelBox ?? null), labelFont: cs(labelText ?? null)?.fontSize, labelWeight: cs(labelText ?? null)?.fontWeight, chevronButton: r(chev ?? null), chevronButtonPadding: pad(chev ?? null), chevronIcon: r(svg ?? null), chevronBg: chev ? getComputedStyle(chev).backgroundColor : null, gapToNext: next && nav ? Math.round((next.getBoundingClientRect().x - nav.getBoundingClientRect().right) * 10) / 10 : null},
      variantsPill: variants ? {outer: r(variants), padding: pad(variants), font: cs(variants.querySelector('[data-ui=Text]'))?.fontSize, icon: r(variants.querySelector('svg')), radius: cs(variants)?.borderRadius} : null,
      navbarHeight: r(document.querySelector('[data-testid=studio-navbar], header, nav'))?.h ?? null,
    }
  }, label)
const clip = {x: 700, y: 0, width: 600, height: 120}
await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(3000)
for (const [name, design] of [['A', 'show.a,stage.ga'], ['B', 'show.a,stage.ga,c1.b']] as const) {
  await p.goto(`http://localhost:3350/structure/book;book-lighthouse?design=${design}`)
  await p.locator('[data-ui=ReleasesNav] button').last().waitFor({timeout: 40000})
  await p.waitForTimeout(3500)
  console.log(name, 'rest', JSON.stringify(await measure('rest')))
  await p.screenshot({path: `journeys-captures/c1-baseline/pill-${name}-rest.png`, clip})
  // one value set
  if (name === 'A') {
    await p.locator('[data-ui=ReleasesNav] button').last().click()
    await p.getByRole('menuitem', {name: /Add a dimension/}).first().click()
    await p.waitForTimeout(500)
    await p.locator('[data-testid^=picker-dimension-]').first().click()
    await p.locator('[data-testid^=picker-value-]').first().click()
  } else {
    await p.locator('[data-testid=variants-button]').click()
    await p.waitForTimeout(500)
    await p.locator('[data-testid^=picker-dimension-]').first().click().catch(() => undefined)
    await p.locator('[data-testid^=picker-value-]').first().click()
  }
  await p.waitForTimeout(1000)
  console.log(name, 'one value', JSON.stringify(await measure('one value')))
  await p.screenshot({path: `journeys-captures/c1-baseline/pill-${name}-one-value.png`, clip})
  await p.locator('[data-ui=ReleasesNav] button').last().click()
  await p.waitForTimeout(600)
  console.log(name, 'menu open', JSON.stringify(await measure('menu open')))
  await p.screenshot({path: `journeys-captures/c1-baseline/pill-${name}-menu-open.png`, clip: {x: 700, y: 0, width: 600, height: 420}})
  await p.keyboard.press('Escape')
}
await b.close()
