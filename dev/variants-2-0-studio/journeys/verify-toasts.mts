// The result toasts, from the Design options "Result toasts" entry: each event shows the stock toast with the drawn copy, tone, action and duration;
// one toast at a time; the action is a filled button (default) or a text link (Look > Toast action).
// Screenshots -> journeys-captures/toasts/<event>-<button|link>-<light|dark>.png
// node journeys/verify-toasts.mts   (the studio must run)
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'

import {chromium, type Page} from 'playwright'

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8'))
  .authToken as string
const base = 'http://localhost:3350'
const log = (ok: boolean, name: string, d = '') =>
  console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 220))
const b = await chromium.launch()

async function boot(theme: 'light' | 'dark', design = 'show.a,stage.ga') {
  const context = await b.newContext({viewport: {width: 1500, height: 900}, colorScheme: theme})
  const p = await context.newPage()
  await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3000)
  await p.goto(`${base}/structure/book?design=${design}`)
  await p.getByRole('button', {name: 'Design options'}).waitFor({timeout: 40000})
  await p.waitForTimeout(1500)
  await p.getByRole('button', {name: 'Design options'}).click()
  await p.getByTestId('rail-toasts').click()
  return {context, p}
}
const toastOf = (p: Page) => p.locator('[data-ui=Toast]')

const EVENTS: {
  id: string
  title: RegExp
  action?: string
  status: 'success' | 'warning' | 'error' | 'info'
  stays: boolean
}[] = [
  {
    id: 'version-created',
    title: /German version created/,
    action: 'Open',
    status: 'success',
    stays: false,
  },
  {
    id: 'versions-created',
    title: /12 German versions created/,
    action: 'Show',
    status: 'success',
    stays: false,
  },
  {
    id: 'definition-created',
    title: /German definition created/,
    action: 'View',
    status: 'success',
    stays: false,
  },
  {id: 'version-deleted', title: /German version deleted/, status: 'success', stays: false},
  {
    id: 'definition-deleted',
    title: /German definition deleted/,
    action: 'Show versions',
    status: 'warning',
    stays: false,
  },
  {id: 'published', title: /German version published/, status: 'success', stays: false},
  {
    id: 'some-failed',
    title: /10 of 12 German versions created/,
    action: 'Show failures',
    status: 'warning',
    stays: true,
  },
  {
    id: 'failed',
    title: /Couldn't create the German version/,
    action: 'Try again',
    status: 'error',
    stays: true,
  },
  {id: 'in-progress', title: /Creating 12 German versions\.\.\./, status: 'info', stays: true},
]

for (const theme of ['light', 'dark'] as const) {
  for (const look of ['button', 'link'] as const) {
    const {context, p} = await boot(theme, `show.a,stage.ga${look === 'link' ? ',toast.link' : ''}`)
    let okAll = 0
    const misses: string[] = []
    for (const ev of EVENTS) {
      await p.getByTestId(`toast-preview-${ev.id}`).click()
      await toastOf(p).first().waitFor({timeout: 6000})
      await p
        .waitForFunction(
          ([re]) =>
            new RegExp(re as string).test(
              document.querySelector('[data-ui=Toast]')?.textContent ?? '',
            ),
          [ev.title.source],
          {timeout: 4000},
        )
        .catch(() => undefined)
      await p.waitForTimeout(300)
      const count = await toastOf(p).count()
      const text = (await toastOf(p).first().innerText()).replace(/\n/g, ' ')
      const action = p.locator('[data-testid=toast-action]')
      const hasAction = (await action.count()) > 0
      const okCopy = ev.title.test(text)
      const okAction = ev.action
        ? hasAction &&
          (await action.first().innerText()).replace(' →', '') === ev.action &&
          (await action.first().getAttribute('data-look')) === look
        : !hasAction
      if (count === 1 && okCopy && okAction) okAll++
      else
        misses.push(
          `${ev.id}: toasts ${count}, copy ${okCopy}, action ${okAction} [${text.slice(0, 60)}]`,
        )
      if (theme === 'light' || ev.id === 'failed')
        await p.screenshot({
          path: `journeys-captures/toasts/${ev.id}-${look}-${theme}.png`,
          clip: {x: 900, y: 600, width: 600, height: 300},
        })
    }
    log(
      okAll === EVENTS.length,
      `${theme}/${look}: every event shows one toast with its copy and ${look} action`,
      misses.join(' | '),
    )
    if (look === 'button' && theme === 'light') {
      // Geometry of the button: 6px radius, padding 7 14, filled with the toast's foreground; of the link: underlined, muted.
      await p.getByTestId('toast-preview-failed').click()
      await p.waitForTimeout(400)
      const st = await p
        .locator('[data-testid=toast-action]')
        .first()
        .evaluate((e) => {
          const c = getComputedStyle(e)
          return {
            r: c.borderRadius,
            pad: c.padding,
            fs: c.fontSize,
            fw: c.fontWeight,
            bg: c.backgroundColor,
            fg: c.color,
          }
        })
      log(
        st.r === '6px' && st.pad === '7px 14px' && st.fs === '13px' && st.bg !== st.fg,
        'button: 6px radius, padding 7 14, 13px, filled (fill differs from label)',
        JSON.stringify(st),
      )
      const w = await toastOf(p)
        .first()
        .evaluate((e) => Math.round(e.getBoundingClientRect().width))
      log(Math.abs(w - 380) <= 2, 'the toast is the stock 380px wide', String(w))
      const edge = await p.evaluate(() => {
        const t = document.querySelector('[data-ui=Toast]')!
        const btn = t.querySelector('[data-testid=toast-action]')!.getBoundingClientRect()
        const close = [...t.querySelectorAll('button')]
          .filter((b) => !b.hasAttribute('data-testid'))
          .pop()!
          .querySelector('svg')!
          .getBoundingClientRect()
        return {btn: Math.round(btn.right), close: Math.round(close.right)}
      })
      log(
        Math.abs(edge.btn - edge.close) <= 2,
        "the button's right edge is on the close icon's right edge",
        JSON.stringify(edge),
      )
    }
    if (look === 'link' && theme === 'light') {
      await p.getByTestId('toast-preview-failed').click()
      await p.waitForTimeout(400)
      const st = await p
        .locator('[data-testid=toast-action]')
        .first()
        .evaluate((e) => {
          const c = getComputedStyle(e)
          return {td: c.textDecorationLine, fs: c.fontSize, fw: c.fontWeight}
        })
      log(
        st.td === 'underline' && st.fs === '13px',
        'link: underlined 13px text link',
        JSON.stringify(st),
      )
    }
    // Durations: the latest toast (success) leaves after about 5 s; a failure stays.
    if (look === 'button' && theme === 'light') {
      await p.getByTestId('toast-preview-version-deleted').click()
      await toastOf(p).first().waitFor({timeout: 4000})
      await p.waitForTimeout(7000)
      log((await toastOf(p).count()) === 0, 'success toast (5 s) is gone after 7 s')
      await p.getByTestId('toast-preview-failed').click()
      await p.waitForTimeout(12000)
      log((await toastOf(p).count()) === 1, 'a failure stays after 12 s')
      await p.getByTestId('toast-preview-definition-deleted').click()
      await p.waitForTimeout(7000)
      log((await toastOf(p).count()) === 1, 'caution toast is still there at 7 s (10 s)')
      await p.waitForTimeout(5000)
      log((await toastOf(p).count()) === 0, 'caution toast is gone after 12 s')
    }
    await context.close()
  }
}
await b.close()
