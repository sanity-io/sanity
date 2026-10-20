// C2 option B: a Published | Draft toggle (raised thumb) and one "Other versions · N" button; a variant in view is a removable chip.
// Screenshots (the pane header): B1 rest, B1b other side chosen, B2 popover, B3 variant chip -> journeys-captures/c2-b/<frame>-<light|dark>.png
// node journeys/verify-c2b.mts   (the studio must run)
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const base = 'http://localhost:3350'
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 220))
mkdirSync('journeys-captures/c2-b', {recursive: true})
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  const context = await b.newContext({viewport: {width: 1300, height: 700}, colorScheme: theme})
  const p = await context.newPage()
  await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3000)
  await p.goto(`${base}/structure/book;book-lighthouse?design=show.a,stage.ga,c2.b`)
  await p.getByTestId('published-toggle').waitFor({timeout: 40000})
  await p.waitForTimeout(2500)
  const shot = (frame: string) => p.screenshot({path: `journeys-captures/c2-b/${frame}-${theme}.png`, clip: {x: 640, y: 40, width: 660, height: 360}})
  try {
    if (theme === 'light') {
      log((await p.locator('[data-testid^=axis-]').count()) === 0, 'B: the per-axis controls are gone')
      const t = await p.getByTestId('published-toggle').evaluate((e) => { const r = e.getBoundingClientRect(); const seg = e.querySelector('button')!.getBoundingClientRect(); const next = document.querySelector('[data-testid=other-versions]')!.getBoundingClientRect(); return {h: Math.round(r.height), seg: Math.round(seg.height), gap: Math.round(next.left - r.right), pill: Math.round(next.height)} })
      log(t.h === 25 && t.seg === 21 && t.pill === 25 && t.gap === 8, 'B: toggle 25px, segments 21px, Other versions pill 25px, 8px between', JSON.stringify(t))
      const seg = await p.getByTestId('toggle-drafts').evaluate((e) => { const c = getComputedStyle(e); return {pad: c.paddingLeft + ' ' + c.paddingRight, gap: c.columnGap, fs: c.fontSize, fw: c.fontWeight, shadow: c.boxShadow !== 'none'} })
      log(seg.pad === '12px 12px' && seg.gap === '6px' && seg.fs === '13px' && seg.fw === '500' && seg.shadow, 'B: the chosen segment is a raised thumb: 12px padding, 6px gap, 13px medium', JSON.stringify(seg))
    }
    await shot('B1-rest')
    // The other half.
    const was = await p.getByTestId('toggle-drafts').getAttribute('aria-checked')
    await p.getByTestId('toggle-published').click()
    await p.waitForTimeout(700)
    log((await p.getByTestId('toggle-published').getAttribute('aria-checked')) === 'true' && (await p.getByTestId('toggle-drafts').getAttribute('aria-checked')) === 'false' && was === 'true', 'B: Published | Draft moves the thumb and the studio perspective', `was draft=${was}`)
    await shot('B1b-other-toggle')
    // The popover.
    const label = (await p.getByTestId('other-versions').innerText()).replace(/\n/g, ' ')
    log(/^Other versions · \d+$/.test(label), 'B: one "Other versions · N" button', label)
    await p.getByTestId('other-versions').click()
    await p.getByRole('menuitem', {name: /Open the version inventory…/}).waitFor({timeout: 5000})
    const items = await p.getByRole('menuitem').allInnerTexts()
    log(items.length >= 2 && items.at(-1)?.startsWith('Open the version inventory…'), 'B: the popover lists variants and releases and ends with "Open the version inventory…"', items.join(' | '))
    await p.waitForTimeout(500)
    if (theme === 'light') {
      const rows = await p.evaluate(() => {
        const menu = document.querySelector('[data-testid=open-inventory]')!.closest('[role=menu]')!
        const list = [...menu.querySelectorAll('[data-testid^=variant-], [data-testid^=release-]')]
        const l = [...menu.querySelectorAll('label, [data-ui=Label]')].find((e) => /variants/i.test(e.textContent ?? ''))
        const c = l ? getComputedStyle(l) : null
        return {
          variants: menu.querySelectorAll('[data-testid^=variant-]').length,
          releases: menu.querySelectorAll('[data-testid^=release-]').length,
          heights: list.map((e) => Math.round(e.getBoundingClientRect().height)),
          heading: c ? {fs: c.fontSize, fw: c.fontWeight, ls: c.letterSpacing, tt: c.textTransform} : null,
          last: menu.querySelector('[data-testid=open-inventory]')?.textContent ?? '',
        }
      })
      log(rows.variants <= 4 && rows.releases <= 2 && rows.variants > 0, 'B: the popover lists at most four variants and two releases', `${rows.variants} variants, ${rows.releases} releases`)
      log(rows.heights.every((h) => h === 50), 'B: rows with a second line are 50px', rows.heights.join(','))
      log(!!rows.heading && rows.heading.tt === 'uppercase' && rows.heading.fw === '600', 'B: section headings are uppercase, 600', JSON.stringify(rows.heading))
      log(/ · \d+ more$/.test(rows.last), 'B: the last row says how many more are in the inventory', rows.last)
    }
    await shot('B2-popover')
    // Pick a variant: it becomes a chip.
    const variantItem = p.locator('[role=menu] [data-testid^=variant-]').first()
    await variantItem.click()
    await p.waitForTimeout(1200)
    const chip = p.getByTestId('variant-chip')
    log((await chip.count()) === 1, 'B: a variant in view shows as a chip beside the toggle', await chip.innerText().catch(() => ''))
    await shot('B3-variant-chip')
    await p.getByTestId('variant-chip-remove').click()
    await p.waitForTimeout(600)
    log((await p.getByTestId('variant-chip').count()) === 0, 'B: the x on the chip returns to the base document')
    // The inventory.
    await p.getByTestId('other-versions').click()
    await p.getByRole('menuitem', {name: /Open the version inventory…/}).click()
    await p.waitForTimeout(1500)
    log((await p.locator('[data-testid=inventory-expand]').count()) > 0 || (await p.locator('[data-testid=inventory-toolbar]').count()) > 0, 'B: "Open the version inventory…" opens the inventory panel')
  } catch (e) {
    log(false, 'script error', String(e).split('\n')[0])
  }
  await context.close()
}
await b.close()
