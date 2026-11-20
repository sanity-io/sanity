// oxlint-disable no-console
// The document cache, compared: each studio warms its cache on the species list (32 000+
// documents), then the list is flung from top to bottom at STEP pixels per frame while every
// frame counts the rows that show a skeleton, and OPENS documents whose rows show no loading
// state are opened while an observer records any loading state the form shows. Memory is
// measured after a garbage collection once the cache is warm.
//
//   STUDIO_ORIGIN=http://localhost:3333 node scripts/cache.mjs
//
// ONLY=rust,jslite,js picks studios, STEP (3000) the fling speed, OPENS (12) the documents to open,
// THROTTLE a CPU slowdown for the fling and the opens, CACHE a cache budget in MiB for the Rust
// and JS-lite studios, OUT the JSON file the results go to.
import {readFileSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'

const require = createRequire(new URL('../../../e2e/package.json', import.meta.url))
const {chromium} = require('@playwright/test')

const token = encodeURIComponent(process.env.STUDIO_AUTH_TOKEN)
const ORIGIN = process.env.STUDIO_ORIGIN ?? 'http://localhost:3333'
const STEP = Number(process.env.STEP ?? 3000)
const OPENS = Number(process.env.OPENS ?? 12)
const THROTTLE = Number(process.env.THROTTLE ?? 1)
const ONLY = process.env.ONLY?.split(',')
const search = process.env.CACHE ? `?cache=${process.env.CACHE}` : ''
const studios = Object.entries({
  rust: {path: '/rust/test/structure/species', replica: true},
  jslite: {path: '/js-lite/test/structure/species', replica: true},
  js: {path: '/test/structure/species', replica: false},
}).filter(([name]) => !ONLY || ONLY.includes(name))
const round = (value, digits = 0) => +value.toFixed(digits)
const log = (...args) => console.error(...args)

async function rendererPss(browser) {
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

async function memory(browser, page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('HeapProfiler.enable')
  await cdp.send('HeapProfiler.collectGarbage')
  await page.waitForTimeout(300)
  const heap = await cdp.send('Runtime.getHeapUsage')
  await cdp.detach()
  const wasm = await page.evaluate(() =>
    (globalThis.__wasmMemories ?? []).reduce((sum, memory) => sum + memory.buffer.byteLength, 0),
  )
  return {
    heapMB: round(heap.usedSize / 1e6, 1),
    wasmMB: round(wasm / 1e6, 1),
    rendererMB: round(await rendererPss(browser), 1),
  }
}

// Shared by the page functions: the list's scroller, its row height, and the loading states.
function installHelpers() {
  const LOADING = '[data-ui="Skeleton"], [data-ui="TextSkeleton"], [data-ui="Spinner"]'
  // Closed overlays keep their content mounted, hidden.
  const rows = () =>
    [...document.querySelectorAll('a[href*="/species;"]')].filter(
      (row) => row.getClientRects().length > 0,
    )
  const scrollerOf = (element) => {
    for (let node = element?.parentElement; node; node = node.parentElement) {
      const {overflowY} = getComputedStyle(node)
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight)
        return node
    }
    return undefined
  }
  let list
  globalThis.__bench = {
    LOADING,
    rows,
    // The list's, the tallest: an open document's pane can link to the document too.
    // Kept once found, since a list showing only skeletons has no row to find it from.
    scroller() {
      if (list?.isConnected) return list
      const scrollers = [...new Set(rows().map(scrollerOf))].filter(Boolean)
      list = scrollers.sort((a, b) => b.scrollHeight - a.scrollHeight)[0]
      return list
    },
    rowHeight() {
      const scroller = globalThis.__bench.scroller()
      const tops = [
        ...new Set(
          rows()
            .filter((row) => scroller?.contains(row))
            .map((row) => Math.round(row.getBoundingClientRect().top)),
        ),
      ]
      tops.sort((a, b) => a - b)
      const gaps = tops.slice(1).map((top, index) => top - tops[index])
      return Math.min(...gaps.filter((gap) => gap > 20))
    },
    // Row slots in the scroller's viewport: those showing a skeleton, and those with nothing.
    sample(scroller, rowHeight) {
      const box = scroller.getBoundingClientRect()
      const slots = Math.floor(box.height / rowHeight)
      const offset = scroller.scrollTop % rowHeight
      const slotOf = (rect) =>
        Math.floor((rect.top + rect.height / 2 - box.top + offset) / rowHeight)
      const skeleton = new Set()
      const filled = new Set()
      for (const element of scroller.querySelectorAll(LOADING)) {
        const rect = element.getBoundingClientRect()
        if (rect.bottom > box.top && rect.top < box.bottom) skeleton.add(slotOf(rect))
      }
      for (const row of scroller.querySelectorAll('a[href*="/species;"]')) {
        const rect = row.getBoundingClientRect()
        if (rect.bottom > box.top && rect.top < box.bottom) filled.add(slotOf(rect))
      }
      let blank = 0
      for (let slot = 0; slot < slots; slot++) if (!skeleton.has(slot) && !filled.has(slot)) blank++
      return {skeleton: [...skeleton].filter((slot) => slot < slots).length, blank}
    },
    // Loading states right of the list and below the navbar: the document pane's.
    paneLoading(scroller, element) {
      if (!element.isConnected) return false
      const rect = element.getBoundingClientRect()
      const list = scroller.getBoundingClientRect()
      return rect.width > 0 && rect.left >= list.right - 1 && rect.top >= 52
    },
  }
}

async function warm(page, replica) {
  if (!replica) {
    // The JS studio has no cache to warm; give its list the time the others take.
    await page.waitForTimeout(20_000)
    return undefined
  }
  const started = Date.now()
  await page.waitForFunction(
    () => {
      const status = globalThis.__studioCache
      return status && (status.warmedAt != null || (status.full && !status.warming))
    },
    undefined,
    {timeout: 300_000, polling: 500},
  )
  // Requests already in flight finish before the measurements start.
  await page.waitForTimeout(1000)
  log(`  warmed in ${((Date.now() - started) / 1000).toFixed(1)} s after the list showed`)
  return page.evaluate(() => globalThis.__studioCache)
}

async function fling(page) {
  return page.evaluate(async (step) => {
    const bench = globalThis.__bench
    const scroller = bench.scroller()
    const rowHeight = bench.rowHeight()
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
    scroller.scrollTop = 0
    for (let i = 0; i < 10; i++) await frame()
    const frames = []
    let skeletonRows = 0
    let blankRows = 0
    let skeletonFrames = 0
    let worst = 0
    let stuck = 0
    let last = performance.now()
    let previous = -1
    // Each frame samples what the previous scroll rendered, then scrolls on.
    while (stuck < 30) {
      const now = await frame()
      frames.push(now - last)
      last = now
      const {skeleton, blank} = bench.sample(scroller, rowHeight)
      skeletonRows += skeleton
      blankRows += blank
      if (skeleton + blank > 0) skeletonFrames++
      worst = Math.max(worst, skeleton + blank)
      stuck = scroller.scrollTop === previous ? stuck + 1 : 0
      previous = scroller.scrollTop
      scroller.scrollTop += step
    }
    frames.sort((a, b) => a - b)
    return {
      rows: Math.round(scroller.scrollHeight / rowHeight),
      frames: frames.length,
      skeletonFrames,
      skeletonRows,
      blankRows,
      worstFrame: worst,
      p95FrameMs: +frames[Math.floor(frames.length * 0.95)].toFixed(1),
    }
  }, STEP)
}

// Opens a document from a row and reports how long its form took and whether it showed a loading
// state on the way; `loaded` picks a row without a skeleton, otherwise one with.
async function open(page, loaded) {
  const target = await page.evaluate(async (loaded) => {
    const bench = globalThis.__bench
    const scroller = bench.scroller()
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
    const max = scroller.scrollHeight - scroller.clientHeight
    for (let attempt = 0; attempt < 40; attempt++) {
      scroller.scrollTop = Math.floor(Math.random() * max)
      for (let i = 0; i < 3; i++) await frame()
      const box = scroller.getBoundingClientRect()
      const candidates = bench.rows().filter((row) => {
        const rect = row.getBoundingClientRect()
        const selected = row.closest('[data-selected]') || row.hasAttribute('data-selected')
        return (
          scroller.contains(row) &&
          rect.top > box.top + 10 &&
          rect.bottom < box.bottom - 10 &&
          !selected &&
          !row.querySelector(bench.LOADING) === loaded
        )
      })
      if (candidates.length === 0) continue
      const row = candidates[Math.floor(candidates.length / 2)]
      const rect = row.getBoundingClientRect()
      return {
        href: row.getAttribute('href'),
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      }
    }
    return undefined
  }, loaded)
  if (!target) return undefined
  await page.evaluate(() => {
    const bench = globalThis.__bench
    const scroller = bench.scroller()
    for (const field of document.querySelectorAll('[data-testid^="field-"]'))
      field.setAttribute('data-bench-old', '')
    const seen = []
    const record = (element) => {
      if (!bench.paneLoading(scroller, element)) return
      const owner = element.closest('[data-testid]')?.getAttribute('data-testid')
      seen.push(`${element.getAttribute('data-ui')}${owner ? ` in ${owner}` : ''}`)
    }
    const observer = new MutationObserver((records) => {
      for (const {addedNodes} of records)
        for (const node of addedNodes) {
          if (!(node instanceof Element)) continue
          if (node.matches(bench.LOADING)) record(node)
          for (const element of node.querySelectorAll(bench.LOADING)) record(element)
        }
    })
    observer.observe(document.body, {childList: true, subtree: true})
    globalThis.__open = {seen, observer, clicked: performance.now()}
  })
  await page.mouse.click(target.x, target.y)
  const result = await page.evaluate(async () => {
    const bench = globalThis.__bench
    const scroller = bench.scroller()
    const state = globalThis.__open
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
    let ready
    const until = performance.now() + 20_000
    while (performance.now() < until) {
      const now = await frame()
      for (const element of document.querySelectorAll(bench.LOADING))
        if (bench.paneLoading(scroller, element)) {
          const owner = element.closest('[data-testid]')?.getAttribute('data-testid')
          state.seen.push(`${element.getAttribute('data-ui')}${owner ? ` in ${owner}` : ''}`)
        }
      const fresh = document.querySelector('[data-testid^="field-"]:not([data-bench-old])')
      const loading = [...document.querySelectorAll(bench.LOADING)].some((element) =>
        bench.paneLoading(scroller, element),
      )
      if (ready === undefined && fresh && !loading) ready = now - state.clicked
      // Late loading states (references, images) count too.
      if (ready !== undefined && now - state.clicked > ready + 500) break
    }
    state.observer.disconnect()
    return {ms: ready === undefined ? undefined : Math.round(ready), seen: [...new Set(state.seen)]}
  })
  return {href: target.href, ...result, flashed: result.seen.length > 0}
}

const results = {}
for (const [name, studio] of studios) {
  log(`${name}:`)
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--enable-precise-memory-info'],
  })
  try {
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
    await context.addInitScript(installHelpers)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    const path = `${studio.path}${studio.replica ? search : ''}`
    await page.goto(`${ORIGIN}${path}#token=${token}`)
    await page.waitForFunction(() => globalThis.__bench.rows().length > 0, undefined, {
      timeout: 120_000,
      polling: 250,
    })
    const cache = await warm(page, studio.replica)
    const warmMemory = await memory(browser, page)
    log('  memory', warmMemory)
    const cdp = await page.context().newCDPSession(page)
    if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: THROTTLE})
    const flung = await fling(page)
    log('  fling', flung)
    const opens = []
    for (let i = 0; i < OPENS; i++) {
      const opened = await open(page, true)
      if (opened) opens.push(opened)
      log('  open', opened)
    }
    const skeletonOpen = await open(page, false)
    log('  skeleton row open', skeletonOpen)
    if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1})
    const after = studio.replica ? await page.evaluate(() => globalThis.__studioCache) : undefined
    const times = opens.flatMap((opened) => (opened.ms === undefined ? [] : [opened.ms]))
    times.sort((a, b) => a - b)
    results[name] = {
      cache,
      memory: warmMemory,
      fling: flung,
      opens: {
        count: opens.length,
        flashed: opens.filter((opened) => opened.flashed).length,
        medianMs: times[Math.floor(times.length / 2)],
        maxMs: times.at(-1),
        seen: [...new Set(opens.flatMap((opened) => opened.seen))],
      },
      skeletonOpen,
      evictedDuringRun: after && cache ? after.evictions - cache.evictions : undefined,
      fetchedDuringRun: after && cache ? after.fetched - cache.fetched : undefined,
      errors,
    }
  } finally {
    await browser.close()
  }
}

writeFileSync(process.env.OUT ?? 'cache.json', `${JSON.stringify(results, null, 2)}\n`)
for (const [name, result] of Object.entries(results)) {
  const {cache, memory: mem, fling: flung, opens} = result
  console.log(
    [
      `${name}:`,
      cache
        ? `${cache.docs} docs held, ${(cache.bytes / 1e6).toFixed(1)} of ${(cache.budget / 1e6).toFixed(1)} MB, warmed in ${((cache.warmedIn ?? 0) / 1000).toFixed(1)} s${cache.full ? ' (budget full)' : ''}`
        : 'no cache',
      `heap ${mem.heapMB} MB, wasm ${mem.wasmMB} MB, renderer ${mem.rendererMB} MB`,
      `fling over ${flung.rows} rows in ${flung.frames} frames: ${flung.skeletonFrames} frames with skeleton or blank rows, ${flung.skeletonRows + flung.blankRows} row-frames, worst ${flung.worstFrame}`,
      `opens: ${opens.flashed}/${opens.count} flashed a loading state, median ${opens.medianMs} ms, max ${opens.maxMs} ms`,
      `skeleton row open: ${result.skeletonOpen ? (result.skeletonOpen.flashed ? 'showed loading states' : 'NO loading state') : 'no skeleton row found'}`,
      result.evictedDuringRun === undefined
        ? ''
        : `evicted ${result.evictedDuringRun} / fetched ${result.fetchedDuringRun} groups during the run`,
    ]
      .filter(Boolean)
      .join('\n  '),
  )
}
