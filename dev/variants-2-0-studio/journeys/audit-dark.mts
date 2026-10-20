// E9 step 0b: dark mode. The Studio's own scheme is set explicitly (localStorage sanityStudio:ui:colorScheme) while the OS scheme is the
// OPPOSITE, so anything that follows prefers-color-scheme (or a hard-coded colour) instead of the Studio scheme shows up as a "light island".
// node journeys/audit-dark.mts  -> journeys-captures/e9-audit/dark-<surface>-<scheme>.png and dark-islands.json
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const dir = 'journeys-captures/e9-audit'
mkdirSync(dir, {recursive: true})
const base = 'http://localhost:3350'
const surfaces: {id: string; path: string; open?: string}[] = [
  {id: 'doc-variant', path: '/structure/fieldMarksTest;fm-1?perspective=published&variant=aud-members&design=show.a,stage.open-beta'},
  {id: 'doc-base', path: '/structure/book;book-lighthouse?design=show.a,stage.ga,c2.b'},
  {id: 'picker', path: '/structure/book;book-lighthouse?design=show.a,stage.ga', open: 'Published'},
  {id: 'inventory', path: '/inventory'},
  {id: 'variants-tool', path: '/variants'},
  {id: 'releases', path: '/releases'},
  {id: 'presentation', path: '/presentation'},
  {id: 'options-window', path: '/structure/book', open: 'Design options'},
]
const scan = () => {
  const parse = (c: string) => {
    const m = c.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
    return {r, g, b, a}
  }
  const lum = ({r, g, b}: {r: number; g: number; b: number}) => {
    const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const bgOf = (el: Element) => {
    for (let e: Element | null = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor)
      if (c && c.a > 0.5) return c
    }
    return {r: 255, g: 255, b: 255, a: 1}
  }
  const out: {text: string; tag: string; testid: string; bg: string; fg: string; ratio: number}[] = []
  const seen = new Set<string>()
  for (const el of document.querySelectorAll('body *')) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent?.trim()).map((n) => n.textContent!.trim()).join(' ')
    if (!own) continue
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2 || getComputedStyle(el).visibility === 'hidden') continue
    const bg = bgOf(el)
    const fg = parse(getComputedStyle(el).color)
    if (!fg) continue
    const [l1, l2] = [lum(bg), lum(fg)]
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    // A light island: a near-white ground in a dark Studio, or text that cannot be read on its ground.
    if (l1 > 0.6 || ratio < 3) {
      const key = `${el.tagName}|${(el as HTMLElement).dataset.testid ?? ''}|${own.slice(0, 24)}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({text: own.slice(0, 40), tag: el.tagName, testid: (el as HTMLElement).dataset.testid ?? '', bg: `${bg.r},${bg.g},${bg.b}`, fg: `${fg.r},${fg.g},${fg.b}`, ratio: Math.round(ratio * 10) / 10})
    }
  }
  return out
}
const b = await chromium.launch()
const all: Record<string, unknown> = {}
// Studio dark under an OS that says light, and Studio light under an OS that says dark.
for (const [scheme, os] of [['dark', 'light'], ['light', 'dark']] as const) {
  const context = await b.newContext({viewport: {width: 1440, height: 900}, colorScheme: os})
  await context.addInitScript((s) => { try { localStorage.setItem('sanityStudio:ui:colorScheme', s) } catch {} }, scheme)
  const p = await context.newPage()
  await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  for (const s of surfaces) {
    await p.goto(`${base}${s.path}`)
    await p.waitForTimeout(6500)
    if (s.open) {
      const btn = s.id === 'picker' ? p.getByTestId('row-version').first() : p.getByRole('button', {name: s.open}).first()
      await btn.click({timeout: 8000}).catch(() => undefined)
      await p.waitForTimeout(900)
    }
    await p.screenshot({path: `${dir}/dark-${s.id}-${scheme}.png`})
    all[`${s.id}@${scheme}`] = await p.evaluate(scan)
  }
  await context.close()
}
writeFileSync(`${dir}/dark-islands.json`, JSON.stringify(all, null, 2))
for (const [k, v] of Object.entries(all)) console.log(k, (v as unknown[]).length)
await b.close()
