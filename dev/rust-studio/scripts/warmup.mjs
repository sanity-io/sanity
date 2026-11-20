// oxlint-disable no-console
// The main thread while the document cache warms up: each studio opens the species list, and
// from the replica's start until it is warm, the page records long tasks, the gaps between
// animation frames, and the delay of key presses typed into an input every PRESS_MS. The delay is
// the time from the key press to its handler, and to the next frame after it.
//
//   STUDIO_ORIGIN=http://localhost:3333 node scripts/warmup.mjs
//
// ONLY=rust,jslite picks studios, CACHE a cache budget in MiB, THROTTLE a CPU slowdown, RUNS the
// loads per studio (they alternate), OUT the JSON file the results go to.
import {writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'

const require = createRequire(new URL('../../../e2e/package.json', import.meta.url))
const {chromium} = require('@playwright/test')

const token = encodeURIComponent(process.env.STUDIO_AUTH_TOKEN)
const ORIGIN = process.env.STUDIO_ORIGIN ?? 'http://localhost:3333'
const THROTTLE = Number(process.env.THROTTLE ?? 1)
const RUNS = Number(process.env.RUNS ?? 1)
const PRESS_MS = Number(process.env.PRESS_MS ?? 150)
const ONLY = process.env.ONLY?.split(',')
const search = process.env.CACHE ? `?cache=${process.env.CACHE}` : ''
const studios = Object.entries({
  rust: '/rust/test/structure/species',
  jslite: '/js-lite/test/structure/species',
}).filter(([name]) => !ONLY || ONLY.includes(name))
const round = (value, digits = 0) => +value.toFixed(digits)
const log = (...args) => console.error(...args)

function record() {
  const state = {longTasks: [], frames: [], keys: [], loafs: [], memory: []}
  globalThis.__warmup = state
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries())
      state.longTasks.push({start: entry.startTime, duration: entry.duration})
  }).observe({type: 'longtask', buffered: true})
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.blockingDuration <= 0) continue
      state.loafs.push({
        start: entry.startTime,
        duration: entry.duration,
        blocking: entry.blockingDuration,
        scripts: entry.scripts.map((script) => ({
          invoker: script.invoker,
          source: `${script.sourceURL.split('/').pop()}:${script.sourceFunctionName}`,
          duration: script.duration,
        })),
      })
    }
  }).observe({type: 'long-animation-frame', buffered: true})
  const frame = (now) => {
    state.frames.push(now)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
  setInterval(() => {
    const heap = performance.memory?.usedJSHeapSize ?? 0
    const wasm = (globalThis.__wasmMemories ?? []).reduce(
      (sum, memory) => sum + memory.buffer.byteLength,
      0,
    )
    state.memory.push({at: performance.now(), heap, wasm})
  }, 250)
  const capture = (result) => {
    const memory = (result.instance ?? result).exports?.memory
    if (memory instanceof WebAssembly.Memory) (globalThis.__wasmMemories ??= []).push(memory)
    return result
  }
  const streaming = WebAssembly.instantiateStreaming
  if (streaming)
    WebAssembly.instantiateStreaming = (...args) => streaming.apply(WebAssembly, args).then(capture)
  const instantiate = WebAssembly.instantiate
  WebAssembly.instantiate = (...args) => instantiate.apply(WebAssembly, args).then(capture)
  globalThis.__probe = () => {
    const input = document.createElement('input')
    input.setAttribute('aria-label', 'Benchmark probe')
    Object.assign(input.style, {
      position: 'fixed',
      left: '8px',
      bottom: '8px',
      width: '120px',
      zIndex: '100000',
    })
    input.addEventListener('keydown', (event) => {
      const handled = performance.now()
      requestAnimationFrame((painted) =>
        state.keys.push({
          at: event.timeStamp,
          delay: handled - event.timeStamp,
          toFrame: painted - event.timeStamp,
        }),
      )
    })
    document.body.append(input)
    input.focus()
  }
}

function percentile(sorted, p) {
  return sorted.length === 0
    ? 0
    : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]
}

function summarize(state, cache) {
  const from = cache.warmedAt - cache.warmedIn
  const to = cache.warmedAt
  const inWindow = (start) => start >= from && start <= to
  const tasks = state.longTasks.filter((task) => inWindow(task.start))
  const durations = tasks.map((task) => task.duration).sort((a, b) => a - b)
  const frames = state.frames.filter((at) => inWindow(at))
  const gaps = frames
    .slice(1)
    .map((at, index) => at - frames[index])
    .sort((a, b) => a - b)
  const keys = state.keys.filter((key) => inWindow(key.at))
  const delays = keys.map((key) => key.delay).sort((a, b) => a - b)
  const toFrame = keys.map((key) => key.toFrame).sort((a, b) => a - b)
  const memory = state.memory.filter((sample) => inWindow(sample.at))
  const scripts = new Map()
  for (const loaf of state.loafs.filter((entry) => inWindow(entry.start)))
    for (const script of loaf.scripts) {
      const key = `${script.invoker} ${script.source}`
      const entry = scripts.get(key) ?? {key, count: 0, ms: 0, max: 0}
      entry.count++
      entry.ms += script.duration
      entry.max = Math.max(entry.max, script.duration)
      scripts.set(key, entry)
    }
  return {
    warmedInS: round(cache.warmedIn / 1000, 1),
    docs: cache.docs,
    full: cache.full,
    longTasks: {
      count: tasks.length,
      blockingMs: round(durations.reduce((sum, ms) => sum + ms - 50, 0)),
      longestMs: round(durations.at(-1) ?? 0),
      over100: durations.filter((ms) => ms > 100).length,
    },
    frames: {
      count: frames.length,
      p95Ms: round(percentile(gaps, 0.95), 1),
      maxMs: round(gaps.at(-1) ?? 0),
      over50: gaps.filter((gap) => gap > 50).length,
    },
    keys: {
      count: keys.length,
      delayP50Ms: round(percentile(delays, 0.5), 1),
      delayP95Ms: round(percentile(delays, 0.95), 1),
      delayMaxMs: round(delays.at(-1) ?? 0),
      toFrameP95Ms: round(percentile(toFrame, 0.95), 1),
      toFrameMaxMs: round(toFrame.at(-1) ?? 0),
    },
    peakMB: {
      heap: round(Math.max(0, ...memory.map((sample) => sample.heap)) / 1e6, 1),
      wasm: round(Math.max(0, ...memory.map((sample) => sample.wasm)) / 1e6, 1),
    },
    topScripts: [...scripts.values()]
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 6)
      .map((entry) => ({...entry, ms: round(entry.ms), max: round(entry.max)})),
  }
}

async function run(name, path) {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--enable-precise-memory-info'],
  })
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 900}})
    await context.addInitScript(record)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    if (THROTTLE > 1) {
      const cdp = await context.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', {rate: THROTTLE})
    }
    await page.goto(`${ORIGIN}${path}${search}#token=${token}`)
    await page.waitForFunction(() => globalThis.__studioCache?.types > 0, undefined, {
      timeout: 120_000,
      polling: 100,
    })
    await page.evaluate(() => globalThis.__probe())
    let cache
    while (!cache) {
      await page.keyboard.press('a')
      await page.waitForTimeout(PRESS_MS)
      cache = await page.evaluate(() => {
        const status = globalThis.__studioCache
        return status.warmedAt != null || (status.full && !status.warming) ? status : undefined
      })
    }
    await page.waitForTimeout(500)
    const state = await page.evaluate(() => globalThis.__warmup)
    if (cache.warmedAt == null) {
      cache = {...cache, warmedAt: state.frames.at(-1), warmedIn: state.frames.at(-1)}
    }
    return {...summarize(state, cache), errors}
  } finally {
    await browser.close()
  }
}

const results = Object.fromEntries(studios.map(([name]) => [name, []]))
for (let index = 0; index < RUNS; index++) {
  for (const [name, path] of studios) {
    const result = await run(name, path)
    log(name, JSON.stringify(result))
    results[name].push(result)
  }
}

writeFileSync(process.env.OUT ?? 'warmup.json', `${JSON.stringify(results, null, 2)}\n`)
for (const [name, runs] of Object.entries(results)) {
  for (const result of runs) {
    const {longTasks: tasks, frames, keys, peakMB} = result
    console.log(
      [
        `${name}: ${result.docs} docs, warmed in ${result.warmedInS} s${result.full ? ' (budget full)' : ''}`,
        `long tasks: ${tasks.count}, ${tasks.over100} over 100 ms, longest ${tasks.longestMs} ms, total blocking ${tasks.blockingMs} ms`,
        `frames: ${frames.count}, gap p95 ${frames.p95Ms} ms, max ${frames.maxMs} ms, ${frames.over50} over 50 ms`,
        `key presses: ${keys.count}, delay p50 ${keys.delayP50Ms} / p95 ${keys.delayP95Ms} / max ${keys.delayMaxMs} ms, to the next frame p95 ${keys.toFrameP95Ms} / max ${keys.toFrameMaxMs} ms`,
        `peak heap ${peakMB.heap} MB, wasm ${peakMB.wasm} MB`,
      ].join('\n  '),
    )
  }
}
