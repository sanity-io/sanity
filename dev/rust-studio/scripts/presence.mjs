// oxlint-disable no-console
// Presence between two clients (CLIENTS=rust,js, jslite,js, ...): when one focuses the title
// field or puts its caret in the Portable Text span, the other shows its avatar on that field and
// its cursor in the editor, in both directions. Origins and SHARE_URL as in `collab.mjs`.
import {randomUUID} from 'node:crypto'
import {createRequire} from 'node:module'

const require = createRequire(new URL('../../../e2e/package.json', import.meta.url))
const {chromium} = require('@playwright/test')

const token = process.env.STUDIO_AUTH_TOKEN
const base = 'https://ppsg7ml5.api.sanity.io/v2025-02-19/data'
const auth = {'authorization': `Bearer ${token}`, 'content-type': 'application/json'}
const t0 = Date.now()
const log = (...args) => console.log(`[${((Date.now() - t0) / 1000).toFixed(2)}s]`, ...args)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const mutate = (mutations) =>
  fetch(`${base}/mutate/test`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({mutations}),
  }).then((res) => res.status)
const rustOrigin = process.env.STUDIO_ORIGIN ?? 'http://localhost:3333'
const jsOrigin = process.env.JS_ORIGIN ?? rustOrigin
const kinds = (process.env.CLIENTS ?? 'rust,js').split(',')
const shots = process.env.SHOTS ?? '/tmp/presence-shots'

const url = (kind, id) => {
  const hash = `#token=${encodeURIComponent(token)}`
  switch (kind) {
    case 'rust':
      return `${rustOrigin}/rust/test/structure/simpleBlock;${id}${hash}`
    case 'jslite':
      return `${rustOrigin}/js-lite/test/structure/simpleBlock;${id}${hash}`
    case 'js':
      return `${jsOrigin}/test/intent/edit/id=${id};type=simpleBlock${hash}`
    default:
      throw new Error(`Unknown client ${kind}`)
  }
}

const results = []
const check = (name, ok, detail) => {
  results.push({name, ok})
  log(ok ? 'PASS' : 'FAIL', name, detail ?? '')
}

const PAGE_HELPERS = () => {
  window.__presence = {
    title: () => document.querySelector('[data-testid="field-title"] input'),
    editable: () =>
      document.querySelector('[data-testid="field-body"] [data-testid="pt-editable"]') ??
      document.querySelector('[data-testid="field-body"] [contenteditable="true"]'),
    caretInSpan: (offset) => {
      const editable = window.__presence.editable()
      const block =
        editable.querySelector('[data-key="b1"], [data-block-key="b1"]') ??
        editable.firstElementChild
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          node.parentElement.closest('[contenteditable="false"]')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      })
      let left = offset
      let node
      while ((node = walker.nextNode())) {
        const text = node.textContent.replace(/\ufeff/g, '')
        if (left <= text.length) break
        left -= text.length
      }
      editable.focus()
      const range = document.createRange()
      range.setStart(node, Math.min(left, node.textContent.length))
      range.collapse(true)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
      const rect = range.getBoundingClientRect()
      return {left: rect.left - editable.getBoundingClientRect().left}
    },
    // Avatars shown on the title field. The JS studio draws them in its presence overlay, outside
    // the field element, so this goes by where they are on screen.
    titleAvatars: () => {
      const field = document.querySelector('[data-testid="field-title"]').getBoundingClientRect()
      return [...document.querySelectorAll('[data-ui="Avatar"]')].filter((avatar) => {
        const rect = avatar.getBoundingClientRect()
        const middle = rect.top + rect.height / 2
        return (
          rect.width > 0 &&
          middle > field.top - 8 &&
          middle < field.top + 40 &&
          rect.left > field.left &&
          rect.left < field.right + 40
        )
      }).length
    },
    // A presence cursor in the body field, and where it is relative to the editable.
    cursor: () => {
      const cursor = document.querySelector(
        '[data-testid="field-body"] [data-testid^="presence-cursor-"]',
      )
      if (!cursor) return null
      const editable = window.__presence.editable()
      return {
        testId: cursor.dataset.testid,
        left: cursor.getBoundingClientRect().left - editable.getBoundingClientRect().left,
      }
    },
  }
}

async function open(browser, kind, id) {
  const context = await browser.newContext({viewport: {width: 1280, height: 900}})
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  if (process.env.SHARE_URL && !url(kind, id).startsWith('http://localhost')) {
    await page.goto(process.env.SHARE_URL)
    await page.waitForLoadState('domcontentloaded')
  }
  await page.goto(url(kind, id))
  await page.waitForFunction(
    () => document.querySelector('[data-testid="field-title"] input')?.value === 'Presence',
    undefined,
    {timeout: 60_000},
  )
  await page.evaluate(PAGE_HELPERS)
  return {kind, page, errors}
}

const waitFor = async (page, fn, arg, timeout = 15_000) => {
  try {
    const handle = await page.waitForFunction(fn, arg, {timeout, polling: 100})
    return await handle.jsonValue()
  } catch {
    return null
  }
}

const browser = await chromium.launch({channel: 'chrome', headless: process.env.HEADED !== '1'})
const id = `presence-${randomUUID()}`
try {
  await mutate([
    {
      createOrReplace: {
        _id: `drafts.${id}`,
        _type: 'simpleBlock',
        title: 'Presence',
        body: [
          {
            _type: 'block',
            _key: 'b1',
            style: 'normal',
            markDefs: [],
            children: [
              {_type: 'span', _key: 's1', text: 'Where is everyone looking right now?', marks: []},
            ],
          },
        ],
      },
    },
  ])
  const clients = []
  for (const kind of kinds) clients.push(await open(browser, kind, id))
  log(`opened ${kinds.join(' + ')} on ${id}`)
  await sleep(2000)

  for (const [from, to] of [
    [0, 1],
    [1, 0],
  ]) {
    const a = clients[from]
    const b = clients[to]
    const label = `${a.kind} ${'AB'[from]} → ${b.kind} ${'AB'[to]}`
    const before = await b.page.evaluate(() => window.__presence.titleAvatars())
    const started = Date.now()
    await a.page.evaluate(() => window.__presence.title().focus())
    const avatars = await waitFor(
      b.page,
      (before) => window.__presence.titleAvatars() > before && window.__presence.titleAvatars(),
      before,
    )
    check(
      `${label}: the title field shows the avatar`,
      avatars !== null,
      `${avatars ?? 0} avatar(s) after ${Date.now() - started} ms`,
    )
    await b.page.screenshot({path: `${shots}/${a.kind}-${b.kind}-${'AB'[to]}-title.png`})

    const offset = 'Where is '.length
    const caret = await a.page.evaluate((offset) => window.__presence.caretInSpan(offset), offset)
    const started2 = Date.now()
    const cursor = await waitFor(b.page, () => window.__presence.cursor())
    // Both screens lay the editable out alike, so the cursor sits near the caret's offset.
    const near = cursor && Math.abs(cursor.left - caret.left) < 24
    check(
      `${label}: the editor shows the cursor at the caret`,
      Boolean(near),
      cursor
        ? `${cursor.testId} at ${cursor.left.toFixed(1)}px, caret at ${caret.left.toFixed(1)}px, after ${Date.now() - started2} ms`
        : 'no cursor',
    )
    await b.page.screenshot({path: `${shots}/${a.kind}-${b.kind}-${'AB'[to]}-cursor.png`})

    // Moving the caret moves the cursor.
    const caret2 = await a.page.evaluate(
      (offset) => window.__presence.caretInSpan(offset),
      'Where is everyone looking'.length,
    )
    const moved = await waitFor(
      b.page,
      (left) => {
        const cursor = window.__presence.cursor()
        return cursor && Math.abs(cursor.left - left) < 24 ? cursor : null
      },
      caret2.left,
    )
    check(
      `${label}: the cursor follows the caret`,
      moved !== null,
      moved ? `${moved.left.toFixed(1)}px vs ${caret2.left.toFixed(1)}px` : '',
    )

    // Leaving the editor removes the cursor.
    await a.page.evaluate(() => document.activeElement.blur())
    const gone = await waitFor(b.page, () => window.__presence.cursor() === null)
    check(`${label}: the cursor goes when the editor loses focus`, gone !== null)
  }
  for (const [i, client] of clients.entries()) {
    check(
      `no page errors in ${client.kind} client ${'AB'[i]}`,
      client.errors.length === 0,
      client.errors.join(' | '),
    )
  }
} finally {
  log('cleanup', await mutate([{delete: {id}}, {delete: {id: `drafts.${id}`}}]))
  await browser.close()
  const failed = results.filter((result) => !result.ok)
  log(
    failed.length
      ? `${failed.length} of ${results.length} checks failed`
      : `all ${results.length} checks passed`,
  )
  process.exitCode = failed.length ? 1 : 0
}
