// Cold-start dry run of RUNBOOK.md's "Demo path in 5 minutes", with real clicks, timing, console errors and a contrast
// check in light and dark. node journeys/dryrun.mts   (both servers must run; writes nothing to the dataset)
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const out = join(import.meta.dirname, '..', 'journeys-captures', 'dryrun')
mkdirSync(out, {recursive: true})
const base = 'http://localhost:3350'
type Row = {theme: string; step: string; ms: number; ok: boolean; note: string; errors: string[]; lowContrast: number; examples: string[]}
const rows: Row[] = []

/** Text elements whose colour against the effective background is below 3:1 (WCAG large-text floor). */
const contrast = (page: Page) =>
  page.evaluate(() => {
    const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number)
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const bgOf = (el: Element | null): number[] => {
      let n = el
      let acc: number[] = [255, 255, 255]
      const stack: number[][] = []
      while (n) {
        const bg = parse(getComputedStyle(n).backgroundColor)
        if (bg.length >= 3 && (bg[3] ?? 1) > 0) stack.push(bg)
        if (bg.length >= 3 && (bg[3] ?? 1) >= 1) break
        n = n.parentElement
      }
      for (const bg of stack.reverse()) {
        const a = bg[3] ?? 1
        acc = [0, 1, 2].map((i) => bg[i] * a + acc[i] * (1 - a))
      }
      return acc
    }
    const bad: string[] = []
    let n = 0
    for (const el of document.querySelectorAll('body *')) {
      const own = [...el.childNodes].filter((c) => c.nodeType === 3 && (c.textContent ?? '').trim().length > 1)
      if (!own.length) continue
      const r = el.getBoundingClientRect()
      if (r.width < 4 || r.height < 4) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.3) continue
      const fg = parse(cs.color)
      if (fg.length < 3) continue
      const bg = bgOf(el)
      const l1 = lum(fg.slice(0, 3))
      const l2 = lum(bg)
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
      n++
      if (ratio < 3 && (fg[3] ?? 1) > 0.5) bad.push(`${ratio.toFixed(1)} "${(own[0].textContent ?? '').trim().slice(0, 28)}"`)
    }
    return {checked: n, bad}
  })

for (const theme of ['light', 'dark'] as const) {
  const browser = await chromium.launch()
  const context = await browser.newContext({viewport: {width: 1456, height: 900}, colorScheme: theme})
  const page = await context.newPage()
  let errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 120)}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/experimental API|Failed to load resource.*(favicon|sockjs)|net::ERR_ABORTED/.test(t)) errors.push(`console: ${t.slice(0, 140)}`)
  })
  await page.goto(`${base}/#token=${encodeURIComponent(token)}`)
  await page.waitForTimeout(2500)

  const step = async (name: string, fn: () => Promise<string>) => {
    errors = []
    const t0 = Date.now()
    let ok = true
    let note = ''
    try {
      note = await fn()
    } catch (e) {
      ok = false
      note = String(e).split('\n')[0].slice(0, 160)
    }
    const ms = Date.now() - t0
    const c = await contrast(page).catch(() => ({checked: 0, bad: [] as string[]}))
    await page.screenshot({path: join(out, `${theme}-${name.replace(/\W+/g, '-')}.png`)}).catch(() => undefined)
    rows.push({theme, step: name, ms, ok, note, errors: [...new Set(errors)].slice(0, 4), lowContrast: c.bad.length, examples: c.bad.slice(0, 4)})
    console.log(`${theme.padEnd(5)} ${ok ? 'OK  ' : 'FAIL'} ${String(ms).padStart(6)}ms  ${name}: ${note}${errors.length ? `  [${[...new Set(errors)].length} console errors]` : ''}${c.bad.length ? `  [${c.bad.length} low contrast: ${c.bad.slice(0, 2).join('; ')}]` : ''}`)
  }

  await step('1a structure list', async () => {
    await page.goto(`${base}/structure/book`)
    await page.locator('[data-testid^=version-mark-]').first().waitFor({timeout: 30000})
    return `${await page.locator('[data-testid^=version-mark-]').count()} rows with a version mark`
  })
  await step('1b hover popover', async () => {
    await page.locator('[data-testid^=version-mark-]').nth(5).hover()
    await page.locator('[data-testid^=version-popover-]').first().waitFor({timeout: 8000})
    return 'popover shown'
  })
  await step('1c click: document + list', async () => {
    await page.locator('[data-testid^=version-mark-]').nth(5).click()
    await page.locator('[data-testid^=inventory-row-]').first().waitFor({timeout: 20000})
    return `${await page.locator('[data-testid^=inventory-row-]').count()} version rows; toolbar ${await page.getByTestId('inventory-toolbar').count() ? 'shown' : 'missing'}`
  })
  await step('2a version menu: View as…', async () => {
    await page.goto(`${base}/structure/book`)
    await page.locator('[data-ui=ReleasesNav] button').last().waitFor({timeout: 20000})
    await page.waitForTimeout(1500)
    await page.locator('[data-ui=ReleasesNav] button').last().click()
    const item = page.getByRole('menuitem', {name: /View as|Add a dimension/}).first()
    await item.waitFor({timeout: 8000})
    const label = await item.innerText()
    await item.click()
    await page.locator('[data-testid^=picker-value-]').first().click()
    await page.locator('[data-testid=address-row]').waitFor({timeout: 8000})
    return `menu row "${label.trim()}", then the row: ${(await page.locator('[data-testid=address-row]').innerText()).replace(/\s+/g, ' ')}`
  })
  await step('2b missing-variant banner', async () => {
    await page.getByText('Glass Houses').first().click()
    await page.locator('[data-testid^=doc-banner-]').first().waitFor({timeout: 12000})
    return (await page.locator('[data-testid^=doc-banner-]').first().innerText()).replace(/\s+/g, ' ')
  })
  await step('3 Variants tool: grey rows + bulk bar', async () => {
    await page.goto(`${base}/variants/aud-members`)
    await page.locator('[data-absent]').first().waitFor({timeout: 30000})
    const grey = await page.locator('[data-absent]').count()
    await page.locator('tr, [role=row]').filter({has: page.locator('[data-absent]')}).first().locator('input[type=checkbox]').check()
    const bar = (await page.locator('[data-testid=bulk-bar]').innerText()).replace(/\s+/g, ' ')
    return `${grey} grey rows; bulk bar: ${bar}`
  })
  await step('4a Presentation: the shared perspective bar', async () => {
    await page.goto(`${base}/presentation`)
    // The same perspective bar as in the other tools: the version pill's menu, then the dimension picker.
    await page.locator('[data-ui=ReleasesNav] button').last().waitFor({timeout: 30000})
    // Presentation re-renders while the preview connects; open the menu once it has.
    await page.waitForFunction(() => [...document.querySelectorAll('iframe')].length > 0, null, {timeout: 30000})
    await page.waitForTimeout(7000)
    await page.locator('[data-ui=ReleasesNav] button').last().click()
    await page.getByRole('menuitem', {name: /View as|Add a dimension/}).first().click()
    const dimension = page.locator('[data-testid^=picker-dimension-]').first()
    if (!(await page.locator('[data-testid^=picker-value-]').first().isVisible().catch(() => false)) && (await dimension.isVisible().catch(() => false))) await dimension.click()
    await page.locator('[data-testid^=picker-value-]', {hasText: 'Members'}).first().click()
    const f = page.frames().find((x) => x.url().includes(':3334'))!
    await f.locator('[data-testid=preview-state]').waitFor({timeout: 20000})
    await page.waitForTimeout(3000)
    return await f.locator('[data-testid=preview-state]').innerText()
  })
  await step('4b click title: On this page', async () => {
    const f = page.frames().find((x) => x.url().includes(':3334'))!
    await f.locator('h3', {hasText: 'The Lighthouse Keeper'}).first().click()
    await page.locator('[data-testid=presentation-context-line]').waitFor({timeout: 15000})
    return (await page.locator('[data-testid=presentation-context-line]').innerText()).replace(/\s+/g, ' ')
  })
  await step('5a Design options window', async () => {
    await page.goto(`${base}/structure/book`)
    await page.getByRole('button', {name: 'Design options'}).waitFor({timeout: 30000})
    await page.getByRole('button', {name: 'Design options'}).click()
    await page.getByRole('dialog', {name: 'Design options'}).waitFor({timeout: 8000})
    await page.getByRole('dialog').getByRole('radio', {name: 'B', exact: true}).first().click()
    await page.waitForTimeout(800)
    await page.getByRole('dialog').getByRole('radio', {name: 'A', exact: true}).first().click()
    return 'opened, Show B then A'
  })
  await step('5b Journeys remote opens from the Design options window', async () => {
    const dialog = page.getByRole('dialog', {name: 'Design options'})
    if (!(await dialog.isVisible().catch(() => false))) await page.getByRole('button', {name: 'Design options'}).click()
    const [popup] = await Promise.all([context.waitForEvent('page', {timeout: 8000}), dialog.getByRole('button', {name: 'Journeys remote'}).click()])
    await popup.waitForSelector('#conn', {timeout: 8000})
    const text = await popup.locator('#conn').innerText()
    await popup.close()
    return `remote opened (${text})`
  })
  await step('6 Presentation grid', async () => {
    await page.goto(`${base}/presentation-grid`)
    await page.locator('[data-testid^=grid-frame-]').first().waitFor({timeout: 30000})
    await page.waitForTimeout(8000)
    const status = await page.locator('[data-testid^=grid-status-]').allInnerTexts()
    return `${status.length} frames, ${status.filter((t) => /connected/.test(t)).length} connected`
  })
  await browser.close()
}
writeFileSync(join(out, 'dryrun.json'), JSON.stringify(rows, null, 2))
