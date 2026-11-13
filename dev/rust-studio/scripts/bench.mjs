// oxlint-disable no-console
// Rust studio vs JS-lite vs the full JS studio, same origin, same API, same documents: time until
// the document's title shows (cold and with the HTTP cache), the bytes of code loaded, memory after
// a garbage collection (V8 heap, wasm memory, the renderer process's PSS), typing latency in a
// string field and a long Portable Text field, and scroll frames, at 1x and 4x CPU throttling.
//
//   STUDIO_ORIGIN=http://localhost:3333 RUNS=7 node scripts/bench.mjs
//
// Locally the brotli sizes are computed from `../test-studio/dist`, since `serve.mjs` does not
// compress; against the preview deployment (with SHARE_URL) the transfer sizes are the CDN's.
// Runs are interleaved (rust, jslite, js, rust, ...) so drift in API latency hits all three.
import {randomUUID} from 'node:crypto'
import {readFileSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {brotliCompressSync, gzipSync} from 'node:zlib'

const require = createRequire(new URL('../../../e2e/package.json', import.meta.url))
const {chromium} = require('@playwright/test')

const TOKEN = process.env.STUDIO_AUTH_TOKEN
const token = encodeURIComponent(TOKEN)
const ORIGIN = process.env.STUDIO_ORIGIN ?? 'http://localhost:3333'
const LOCAL = ORIGIN.startsWith('http://localhost')
const DIST = new URL('../../test-studio/dist', import.meta.url).pathname
const RUNS = Number(process.env.RUNS ?? 7)
const ONLY = process.env.ONLY?.split(',')
const ARISTOTLE = '04c86968-2e91-4ba0-9dbc-be947fdf807e'
const studios = Object.fromEntries(
  Object.entries({
    rust: '/rust/test/structure',
    jslite: '/js-lite/test/structure',
    js: '/test/structure',
  }).filter(([name]) => !ONLY || ONLY.includes(name)),
)
const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]
const pct = (values, p) =>
  values.toSorted((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))]
const round = (value, digits = 0) => +value.toFixed(digits)
const api = 'https://ppsg7ml5.api.sanity.io/v2025-02-19/data'
const auth = {'authorization': `Bearer ${TOKEN}`, 'content-type': 'application/json'}
const mutate = (mutations) =>
  fetch(`${api}/mutate/test`, {method: 'POST', headers: auth, body: JSON.stringify({mutations})})

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-precise-memory-info'],
})
const createdIds = []
const log = (...args) => console.error(...args)

async function withPage(fn) {
  const context = await browser.newContext({viewport: {width: 1440, height: 900}})
  await context.addInitScript(() => {
    const capture = (result) => {
      const memory = (result.instance ?? result).exports?.memory
      if (memory instanceof WebAssembly.Memory) (globalThis.__wasmMemories ??= []).push(memory)
      return result
    }
    const streaming = WebAssembly.instantiateStreaming
    if (streaming)
      WebAssembly.instantiateStreaming = (...args) =>
        streaming.apply(WebAssembly, args).then(capture)
    const instantiate = WebAssembly.instantiate
    WebAssembly.instantiate = (...args) => instantiate.apply(WebAssembly, args).then(capture)
  })
  const page = await context.newPage()
  if (process.env.SHARE_URL && !LOCAL) {
    await page.goto(process.env.SHARE_URL)
    await page.waitForLoadState('domcontentloaded')
    // The share link lands on `/`, the JS studio, whose entry modules would otherwise be cached
    // before its "cold" load.
    await page.goto('about:blank')
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.clearBrowserCache')
    await cdp.detach()
  }
  try {
    return await fn(page)
  } finally {
    await context.close()
  }
}

const hasValue = (value) =>
  [...document.querySelectorAll('input')].some((input) => input.value.trim() === value)

// A Portable Text document with 30 paragraphs, for the editor's cost.
const PT_ID = `bench-pt-${randomUUID()}`
const PT_TITLE = 'Benchmark: thirty paragraphs'
// The JS test studio has no top-level simpleBlock list; this is where its edit intent lands.
const ptPath = (name) =>
  name === 'js' ? `input-standard;portable-text;simpleBlock;${PT_ID}` : `simpleBlock;${PT_ID}`
async function seed() {
  createdIds.push(PT_ID)
  const body = Array.from({length: 30}, (_, i) => ({
    _type: 'block',
    _key: `b${i}`,
    style: i % 10 === 0 ? 'h2' : 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `s${i}a`,
        text: `Paragraph ${i + 1}. The quick brown fox jumps over the lazy dog, `,
        marks: [],
      },
      {_type: 'span', _key: `s${i}b`, text: 'and some of it is bold', marks: ['strong']},
      {
        _type: 'span',
        _key: `s${i}c`,
        text: ', then plain text again until the end of the paragraph.',
        marks: [],
      },
    ],
  }))
  const res = await mutate([
    {createOrReplace: {_id: PT_ID, _type: 'simpleBlock', title: PT_TITLE, body}},
  ])
  if (!res.ok) throw new Error(`seed failed ${res.status}`)
}

// The proportional set size of the page's renderer process: every allocator (V8, wasm, Blink, compiled code).
async function rendererPss() {
  const session = await browser.newBrowserCDPSession()
  const {processInfo} = await session.send('SystemInfo.getProcessInfo')
  await session.detach()
  const sizes = processInfo
    .filter((info) => info.type === 'renderer')
    .map((info) => {
      try {
        const rollup = readFileSync(`/proc/${info.id}/smaps_rollup`, 'utf8')
        return Number(/^Pss:\s+(\d+)/m.exec(rollup)[1]) / 1024
      } catch {
        return 0
      }
    })
  return Math.max(0, ...sizes)
}

async function memory(page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('HeapProfiler.enable')
  await cdp.send('HeapProfiler.collectGarbage')
  await page.waitForTimeout(200)
  const heap = await cdp.send('Runtime.getHeapUsage')
  const dom = await cdp.send('Memory.getDOMCounters')
  await cdp.detach()
  const wasm = await page.evaluate(() =>
    (globalThis.__wasmMemories ?? []).reduce((sum, memory) => sum + memory.buffer.byteLength, 0),
  )
  return {
    heapMB: heap.usedSize / 1e6,
    backingMB: (heap.backingStorageSize ?? 0) / 1e6,
    wasmMB: wasm / 1e6,
    rendererMB: await rendererPss(),
    domNodes: dom.nodes,
    listeners: dom.jsEventListeners,
  }
}

async function load(name, doc, value) {
  return withPage(async (page) => {
    const files = new Map()
    let apiRequests = 0
    page.on('request', (request) => request.url().includes('.api.sanity.io') && apiRequests++)
    const url = `${ORIGIN}${studios[name]}/${doc}#token=${token}`
    const started = Date.now()
    await page.goto(url)
    await page.waitForFunction(hasValue, value, {timeout: 60_000, polling: 16})
    const ready = Date.now() - started
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0]
      const resources = performance
        .getEntriesByType('resource')
        .filter(
          (entry) =>
            new URL(entry.name).origin === location.origin &&
            /\.(m?js|wasm|css)(\?|$)/.test(new URL(entry.name).pathname),
        )
        .map((entry) => ({
          path: new URL(entry.name).pathname,
          transfer: entry.transferSize,
          decoded: entry.decodedBodySize,
        }))
      return {domContentLoaded: nav.domContentLoadedEventEnd, resources}
    })
    for (const resource of timing.resources) files.set(resource.path, resource)
    // Warm: a full reload of the same document, with the HTTP cache (and each studio's own caches).
    await page.goto('about:blank')
    const warmStarted = Date.now()
    await page.goto(url)
    await page.waitForFunction(hasValue, value, {timeout: 60_000, polling: 16})
    const warm = Date.now() - warmStarted
    await page.waitForTimeout(1500)
    const mem = await memory(page)
    return {
      ready,
      warm,
      apiRequests,
      domContentLoaded: timing.domContentLoaded,
      files: [...files.values()],
      ...mem,
    }
  })
}

function bytes(files) {
  const totals = {}
  for (const file of files) {
    const ext = file.path.split('.').pop()
    const total = (totals[ext] ??= {files: 0, raw: 0, brotli: 0, gzip: 0, transfer: 0})
    total.files++
    total.transfer += file.transfer
    if (LOCAL) {
      const content = readFileSync(DIST + file.path)
      total.raw += content.length
      total.gzip += gzipSync(content).length
      total.brotli += brotliCompressSync(content).length
    } else {
      total.raw += file.decoded
    }
  }
  for (const total of Object.values(totals))
    for (const key of ['raw', 'brotli', 'gzip', 'transfer']) total[key] = round(total[key] / 1024)
  return totals
}

async function typing(name, throttle) {
  const id = randomUUID()
  createdIds.push(id)
  return withPage(async (page) => {
    await page.goto(`${ORIGIN}${studios[name]}/author;${id}#token=${token}`)
    const input = page.locator('[data-testid="field-name"] input')
    await input.waitFor({timeout: 60_000})
    await page.waitForTimeout(1500)
    const cdp = await page.context().newCDPSession(page)
    if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: throttle})
    await input.click()
    await page.evaluate(() => {
      globalThis.__latencies = []
      window.addEventListener(
        'keydown',
        (event) => {
          const start = event.timeStamp
          requestAnimationFrame(() =>
            setTimeout(() => globalThis.__latencies.push(performance.now() - start), 0),
          )
        },
        {capture: true},
      )
    })
    const text = 'The quick brown fox jumps over'
    await input.pressSequentially(text, {delay: 60})
    await page.waitForTimeout(1500)
    const latencies = await page.evaluate(() => globalThis.__latencies)
    const value = await input.inputValue()
    if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1})
    await page.waitForTimeout(2000)
    return {p50: median(latencies), p95: pct(latencies, 0.95), ok: value === text}
  })
}

async function ptTyping(name, throttle) {
  return withPage(async (page) => {
    await page.goto(`${ORIGIN}${studios[name]}/${ptPath(name)}#token=${token}`)
    await page.waitForFunction(hasValue, PT_TITLE, {timeout: 60_000, polling: 16})
    const editable = page.locator('[data-testid="field-body"] [contenteditable="true"]').first()
    await editable.waitFor({timeout: 30_000})
    await page.waitForTimeout(1500)
    const cdp = await page.context().newCDPSession(page)
    if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: throttle})
    // The caret at the end of the third paragraph's first span.
    await page.evaluate(() => {
      const editable =
        document.querySelector('[data-testid="field-body"] [data-testid="pt-editable"]') ??
        document.querySelector('[data-testid="field-body"] [contenteditable="true"]')
      const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          node.parentElement.closest('[contenteditable="false"]') ||
          !node.textContent.startsWith('Paragraph 3.')
            ? NodeFilter.FILTER_SKIP
            : NodeFilter.FILTER_ACCEPT,
      })
      const node = walker.nextNode()
      editable.focus()
      const range = document.createRange()
      range.setStart(node, node.textContent.length)
      range.collapse(true)
      getSelection().removeAllRanges()
      getSelection().addRange(range)
      globalThis.__latencies = []
      window.addEventListener(
        'keydown',
        (event) => {
          const start = event.timeStamp
          requestAnimationFrame(() =>
            setTimeout(() => globalThis.__latencies.push(performance.now() - start), 0),
          )
        },
        {capture: true},
      )
    })
    await page.keyboard.type('typing into a long document ', {delay: 60})
    await page.waitForTimeout(1500)
    const latencies = await page.evaluate(() => globalThis.__latencies)
    const ok = await page.evaluate(() =>
      document
        .querySelector('[data-testid="field-body"]')
        .textContent.includes(
          'Paragraph 3. The quick brown fox jumps over the lazy dog, typing into a long document',
        ),
    )
    if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1})
    await page.waitForTimeout(2500)
    return {p50: median(latencies), p95: pct(latencies, 0.95), ok}
  })
}

async function scroll(name, throttle) {
  return withPage(async (page) => {
    await page.goto(`${ORIGIN}${studios[name]}/author#token=${token}`)
    const row = page.locator('a[href*="/author;"]').first()
    await row.waitFor({timeout: 60_000})
    await page.waitForTimeout(2000)
    const box = await row.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + 200)
    const cdp = await page.context().newCDPSession(page)
    if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: throttle})
    await page.evaluate(() => {
      globalThis.__frames = []
      let last = performance.now()
      const tick = (now) => {
        globalThis.__frames.push(now - last)
        last = now
        if (!globalThis.__stopFrames) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    for (let i = 0; i < 40; i++) {
      await page.mouse.wheel(0, 400)
      await page.waitForTimeout(50)
    }
    await page.waitForTimeout(500)
    const frames = await page.evaluate(() => {
      globalThis.__stopFrames = true
      return globalThis.__frames.slice(1)
    })
    if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1})
    return {p95: round(pct(frames, 0.95), 1), over50ms: frames.filter((frame) => frame > 50).length}
  })
}

const results = Object.fromEntries(Object.keys(studios).map((name) => [name, {author: [], pt: []}]))
try {
  await seed()
  for (let run = 0; run < RUNS; run++) {
    for (const name of Object.keys(studios)) {
      results[name].author.push(await load(name, `author;${ARISTOTLE}`, 'Aristotle'))
      results[name].pt.push(await load(name, ptPath(name), PT_TITLE))
      log(
        `run ${run + 1}/${RUNS} ${name}: ready ${results[name].author.at(-1).ready} ms, pt ${results[name].pt.at(-1).ready} ms`,
      )
    }
  }
  if (process.env.SKIP_INTERACTION !== '1') {
    for (const name of Object.keys(studios)) {
      for (const throttle of [1, 4]) {
        results[name][`scroll${throttle}x`] = await scroll(name, throttle)
        const runs = [await typing(name, throttle), await typing(name, throttle)]
        results[name][`typing${throttle}x`] = {
          p50: round(median(runs.map((r) => r.p50)), 1),
          p95: round(median(runs.map((r) => r.p95)), 1),
          ok: runs.every((r) => r.ok),
        }
        const ptRuns = [await ptTyping(name, throttle), await ptTyping(name, throttle)]
        results[name][`ptTyping${throttle}x`] = {
          p50: round(median(ptRuns.map((r) => r.p50)), 1),
          p95: round(median(ptRuns.map((r) => r.p95)), 1),
          ok: ptRuns.every((r) => r.ok),
        }
        log(
          name,
          throttle,
          JSON.stringify([
            results[name][`scroll${throttle}x`],
            results[name][`typing${throttle}x`],
            results[name][`ptTyping${throttle}x`],
          ]),
        )
      }
    }
  }
} finally {
  await browser.close()
  const ids = createdIds.flatMap((id) => [id, `drafts.${id}`])
  const response = await mutate(ids.map((id) => ({delete: {id}})))
  log('cleanup', response.status, createdIds.length, 'documents')
}

const summary = {}
for (const [name, result] of Object.entries(results)) {
  const pick = (list, key) => list.map((run) => run[key])
  summary[name] = {
    readyMs: median(pick(result.author, 'ready')),
    readyRunsMs: pick(result.author, 'ready'),
    warmReadyMs: median(pick(result.author, 'warm')),
    ptReadyMs: median(pick(result.pt, 'ready')),
    ptWarmReadyMs: median(pick(result.pt, 'warm')),
    domContentLoadedMs: round(median(pick(result.author, 'domContentLoaded'))),
    apiRequests: median(pick(result.author, 'apiRequests')),
    bytes: bytes(result.author[0].files),
    heapMB: round(median(pick(result.author, 'heapMB')), 1),
    backingMB: round(median(pick(result.author, 'backingMB')), 1),
    wasmMB: round(median(pick(result.author, 'wasmMB')), 1),
    rendererMB: round(median(pick(result.author, 'rendererMB'))),
    domNodes: median(pick(result.author, 'domNodes')),
    ptHeapMB: round(median(pick(result.pt, 'heapMB')), 1),
    ptBackingMB: round(median(pick(result.pt, 'backingMB')), 1),
    ptWasmMB: round(median(pick(result.pt, 'wasmMB')), 1),
    ptRendererMB: round(median(pick(result.pt, 'rendererMB'))),
    ptDomNodes: median(pick(result.pt, 'domNodes')),
    ...Object.fromEntries(
      Object.entries(result).filter(([key]) => key !== 'author' && key !== 'pt'),
    ),
  }
}
const out = process.env.OUT ?? 'bench.json'
writeFileSync(
  out,
  JSON.stringify({origin: ORIGIN, runs: RUNS, at: new Date().toISOString(), summary}, null, 2),
)
console.log(JSON.stringify(summary, null, 2))
