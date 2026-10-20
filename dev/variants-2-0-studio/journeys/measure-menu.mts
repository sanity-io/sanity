// Measures the shipped version menu as the studio renders it. node journeys/measure-menu.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1456, height: 900}})).newPage()
await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(3000)
await p.goto('http://localhost:3350/structure/book?design=show.a,stage.ga')
await p.waitForTimeout(8000)
await p.locator('[data-ui=ReleasesNav] button').last().click()
await p.waitForTimeout(800)
console.log(JSON.stringify(await p.evaluate(() => {
  const m = document.querySelector('[data-testid="release-menu"]') as HTMLElement | null
  const r = (e: Element) => { const b = e.getBoundingClientRect(); return Math.round(b.width * 10) / 10 + 'x' + Math.round(b.height * 10) / 10 }
  if (!m) return {error: 'no release-menu', menus: [...document.querySelectorAll('[role=menu]')].map((x) => (x as HTMLElement).dataset.testid ?? x.className.slice(0, 40))}
  const headers = [...m.querySelectorAll('*')].filter((t) => t.children.length === 0 && /^(as soon as possible|at time|undecided)$/i.test(t.textContent?.trim() ?? '')).map((t) => { const s = getComputedStyle(t); const box = t.parentElement ? getComputedStyle(t.parentElement) : s; return {text: t.textContent?.trim(), fontSize: s.fontSize, fontWeight: s.fontWeight, letterSpacing: s.letterSpacing, textTransform: s.textTransform, paddingLeft: box.paddingLeft, paddingTop: box.paddingTop, box: r(t.parentElement ?? t)} })
  return {
    menu: r(m), popover: r(m.closest('[data-ui="Popover"]') ?? m),
    items: [...m.querySelectorAll('[role="menuitem"]')].map((e) => `${e.textContent?.trim().slice(0, 22)} ${r(e)} pad=${getComputedStyle(e).padding} fs=${getComputedStyle(e.querySelector('[data-ui="Text"]') ?? e).fontSize}`),
    headers, rootFontSize: getComputedStyle(document.documentElement).fontSize, devicePixelRatio, innerWidth, zoom: window.outerWidth / window.innerWidth,
  }
}), null, 1))
await b.close()
