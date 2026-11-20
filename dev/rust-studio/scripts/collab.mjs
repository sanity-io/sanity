// oxlint-disable no-console
// Two clients type into the same string field and the same Portable Text span at the same
// time. Clients are the Rust studio, JS-lite or the JS studio (CLIENTS=rust,js, rust,jslite, ...).
// Checks that nothing typed is lost or duplicated, the original text survives, words typed apart
// stay whole, and both screens converge on what Content Lake stores.
//
//   STUDIO_ORIGIN=http://localhost:3333 CLIENTS=rust,js node scripts/collab.mjs
//
// against `serve.mjs`, or the preview deployment with SHARE_URL set to its share link.
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
const stored = async (id) =>
  (await (await fetch(`${base}/doc/test/drafts.${id}`, {headers: auth})).json()).documents[0]
const rustOrigin = process.env.STUDIO_ORIGIN ?? 'http://localhost:3333'
const jsOrigin = process.env.JS_ORIGIN ?? rustOrigin
const kinds = (process.env.CLIENTS ?? 'rust,rust').split(',')
const words = Number(process.env.WORDS ?? 8)
const shots = process.env.SHOTS ?? '/tmp/collab-shots'

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

// Runs in the page: the title input and the editable of the body field, in either studio.
const PAGE_HELPERS = () => {
  window.__collab = {
    title: () => document.querySelector('[data-testid="field-title"] input'),
    editable: () =>
      document.querySelector('[data-testid="field-body"] [data-testid="pt-editable"]') ??
      document.querySelector('[data-testid="field-body"] [contenteditable="true"]'),
    // The text of the first block, without the others' cursors drawn into it (JS studio, JS-lite).
    spanText: () => {
      const editable = window.__collab.editable()
      const block =
        editable?.querySelector('[data-key="b1"], [data-block-key="b1"]') ??
        editable?.firstElementChild
      if (!block) return null
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          node.parentElement.closest('[contenteditable="false"]')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      })
      let text = ''
      let node
      while ((node = walker.nextNode())) text += node.textContent
      return text.replace(/\u200b|\ufeff/g, '')
    },
    // Puts the caret at `offset` in the first block's text.
    caretInSpan: (offset) => {
      const editable = window.__collab.editable()
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
  try {
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="field-title"] input')?.value ===
        'Collaborative editing',
      undefined,
      {timeout: 60_000},
    )
  } catch (error) {
    await page.screenshot({path: `${shots}/open-failed-${kind}.png`})
    log('open failed', kind, await page.evaluate(() => document.body.innerText.slice(0, 500)))
    throw error
  }
  await page.evaluate(PAGE_HELPERS)
  await page.waitForFunction(() => window.__collab.spanText()?.includes('Two people'), undefined, {
    timeout: 30_000,
  })
  return {kind, page, errors}
}

// Types `count` words, each with its space, starting at the caret.
async function typeWords(client, name, count, rng) {
  const typed = []
  for (let i = 0; i < count; i++) {
    const word = `${name}${i}`
    typed.push(word)
    await client.page.keyboard.type(`${word} `, {delay: 30 + rng() * 50})
    await sleep(rng() * 150)
  }
  return typed
}

function mulberry(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const sorted = (text) => [...text].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join('')

function verify(label, original, text, typed, apart) {
  const expected = original + typed.map((word) => `${word} `).join('')
  check(
    `${label}: every typed character is there exactly once`,
    sorted(text) === sorted(expected),
    JSON.stringify(text),
  )
  let rest = 0
  const survives = [...original].every((c) => (rest = text.indexOf(c, rest) + 1) > 0)
  check(`${label}: the original text survives in order`, survives)
  const tokens = text.split(' ')
  const whole = typed.filter((word) => tokens.filter((token) => token === word).length === 1).length
  if (apart)
    check(`${label}: every word is whole`, whole === typed.length, `${whole}/${typed.length}`)
  else log(`${label}: ${whole} of ${typed.length} words whole (both typed into the same gap)`)
}

async function settle(clients, read, readStored) {
  let last
  for (let i = 0; i < 40; i++) {
    await sleep(500)
    const shown = await Promise.all(clients.map((client) => read(client)))
    const value = await readStored()
    last = {shown, value}
    if (shown.every((text) => text === value)) return {value, converged: true}
  }
  return {value: last.value, converged: false, last}
}

const browser = await chromium.launch({channel: 'chrome', headless: process.env.HEADED !== '1'})
const ids = []
try {
  for (const apart of [true, false]) {
    const id = `collab-${randomUUID()}`
    ids.push(id)
    const title = 'Collaborative editing'
    const span = 'Two people, one paragraph.'
    await mutate([
      {
        createOrReplace: {
          _id: `drafts.${id}`,
          _type: 'simpleBlock',
          title,
          body: [
            {
              _type: 'block',
              _key: 'b1',
              style: 'normal',
              markDefs: [],
              children: [{_type: 'span', _key: 's1', text: span, marks: []}],
            },
          ],
        },
      },
    ])
    const clients = await Promise.all(kinds.map((kind) => open(browser, kind, id)))
    log(
      `opened ${kinds.join(' + ')} on ${id} (${apart ? 'typing apart' : 'typing into the same gap'})`,
    )
    await sleep(1500)
    const rng = mulberry(apart ? 1 : 2)
    const label = `${kinds.join('+')} ${apart ? 'apart' : 'same gap'}`

    // The string field: A types before "editing" or at the very start, B at the end or the same gap.
    const titleOffsets = apart
      ? [0, title.length]
      : ['Collaborative '.length, 'Collaborative '.length]
    await Promise.all(
      clients.map((client, i) =>
        client.page.evaluate((offset) => {
          const input = window.__collab.title()
          input.focus()
          input.setSelectionRange(offset, offset)
        }, titleOffsets[i]),
      ),
    )
    const startTitle = Date.now()
    const typedTitle = (
      await Promise.all(
        clients.map((client, i) =>
          i === 1 && apart
            ? client.page.keyboard.type(' ').then(() => typeWords(client, 'B', words, rng))
            : typeWords(client, 'AB'[i], words, rng),
        ),
      )
    ).flat()
    log(
      `typed ${typedTitle.length} words into the title in ${((Date.now() - startTitle) / 1000).toFixed(1)} s`,
    )
    const titleResult = await settle(
      clients,
      (client) => client.page.evaluate(() => window.__collab.title().value),
      async () => (await stored(id)).title,
    )
    check(
      `${label}: title converged on every screen and in Content Lake`,
      titleResult.converged,
      JSON.stringify(titleResult.last ?? titleResult.value),
    )
    // B started with a space so its first word does not glue onto "editing"
    verify(`${label} title`, apart ? `${title} ` : title, titleResult.value, typedTitle, apart)

    // The Portable Text span
    const spanOffsets = apart ? [0, span.length] : ['Two people, '.length, 'Two people, '.length]
    for (const [i, client] of clients.entries()) {
      await client.page.evaluate((offset) => window.__collab.caretInSpan(offset), spanOffsets[i])
    }
    const startSpan = Date.now()
    const typedSpan = (
      await Promise.all(
        clients.map((client, i) =>
          i === 1 && apart
            ? client.page.keyboard.type(' ').then(() => typeWords(client, 'D', words, rng))
            : typeWords(client, 'CD'[i], words, rng),
        ),
      )
    ).flat()
    log(
      `typed ${typedSpan.length} words into the span in ${((Date.now() - startSpan) / 1000).toFixed(1)} s`,
    )
    const spanResult = await settle(
      clients,
      (client) => client.page.evaluate(() => window.__collab.spanText()),
      async () => {
        const doc = await stored(id)
        return doc.body
          .map((block) => block.children.map((child) => child.text ?? '').join(''))
          .join('\n')
      },
    )
    check(
      `${label}: span converged on every screen and in Content Lake`,
      spanResult.converged,
      JSON.stringify(spanResult.last ?? spanResult.value),
    )
    verify(`${label} span`, apart ? `${span} ` : span, spanResult.value, typedSpan, apart)
    const doc = await stored(id)
    check(
      `${label}: still one block with its keys`,
      doc.body.length === 1 && doc.body[0]._key === 'b1',
      JSON.stringify(doc.body.map((b) => [b._key, b.children.map((c) => c._key)])),
    )
    for (const [i, client] of clients.entries()) {
      await client.page.screenshot({path: `${shots}/${label.replace(/[^a-z+]+/gi, '-')}-${i}.png`})
      check(
        `${label}: no page errors in ${client.kind} client ${'AB'[i]}`,
        client.errors.length === 0,
        client.errors.join(' | '),
      )
      await client.page.context().close()
    }
  }
} finally {
  log(
    'cleanup',
    await mutate(ids.flatMap((id) => [{delete: {id}}, {delete: {id: `drafts.${id}`}}])),
  )
  await browser.close()
  const failed = results.filter((result) => !result.ok)
  log(
    failed.length
      ? `${failed.length} of ${results.length} checks failed`
      : `all ${results.length} checks passed`,
  )
  process.exitCode = failed.length ? 1 : 0
}
