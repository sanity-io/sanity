// oxlint-disable no-console
// Reloading a studio whose document cache persisted, compared with reloading it cold: the species
// list is loaded once to fill the cache and persist it, then reloaded RUNS times each way, in the
// same browser profile so the HTTP cache, the token and the persisted cache carry over:
//
// - cold: `?persist=0`, which neither restores nor saves the cache;
// - stale: the cache restores from IndexedDB, its rows show stale until revalidated.
//
// Every frame counts the list rows that show content, and those of them still marked stale
// (`[data-stale]`). Reported: when the first row with content painted, when every visible row was
// current, when the whole cache was (the warm-up, or the revalidation, finished), the bytes
// downloaded from the API until then, and the main thread's long tasks meanwhile.
//
//   STUDIO_ORIGIN=http://localhost:3333 node scripts/reload.mjs
//
// ONLY=rust,jslite picks studios, CACHE a cache budget in MiB, THROTTLE a CPU slowdown, RUNS the
// reloads each way (they alternate), OUT the JSON file the results go to.
import {writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'

const require = createRequire(new URL('../../../e2e/package.json', import.meta.url))
const {chromium} = require('@playwright/test')

const token = encodeURIComponent(process.env.STUDIO_AUTH_TOKEN)
const ORIGIN = process.env.STUDIO_ORIGIN ?? 'http://localhost:3333'
const THROTTLE = Number(process.env.THROTTLE ?? 1)
const RUNS = Number(process.env.RUNS ?? 3)
const ONLY = process.env.ONLY?.split(',')
const studios = Object.entries({
  rust: '/rust/test/structure/species',
  jslite: '/js-lite/test/structure/species',
}).filter(([name]) => !ONLY || ONLY.includes(name))
const round = (value, digits = 0) => (value == null ? null : +value.toFixed(digits))
const log = (...args) => console.error(...args)

function query(params) {
  const search = new URLSearchParams(params)
  if (process.env.CACHE) search.set('cache', process.env.CACHE)
  const text = search.toString()
  return text ? `?${text}` : ''
}

function record() {
  const LOADING = '[data-ui="Skeleton"], [data-ui="TextSkeleton"], [data-ui="Spinner"]'
  const state = {longTasks: [], firstContent: null, firstStale: null, current: null, maxStale: 0}
  globalThis.__reload = state
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries())
      state.longTasks.push({start: entry.startTime, duration: entry.duration})
  }).observe({type: 'longtask', buffered: true})
  // The time the frame reads the rows, not its timestamp: that is when the frame began, which a
  // long task before it puts ahead of the commit it shows.
  const frame = () => {
    const now = performance.now()
    const rows = [...document.querySelectorAll('a[href*="/species;"]')]
    let content = 0
    let stale = 0
    for (const row of rows) {
      if (row.querySelector(LOADING)) continue
      content++
      if (row.querySelector('[data-stale]') || row.matches('[data-stale]')) stale++
    }
    if (content > 0) state.firstContent ??= now
    if (stale > 0) state.firstStale ??= now
    state.maxStale = Math.max(state.maxStale, stale)
    // Every visible row shows content, none of it stale.
    if (rows.length > 0 && content === rows.length && stale === 0) state.current ??= now
    else state.current = null
    state.rows = {rows: rows.length, content, stale}
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

async function visit(page, url, bytes) {
  bytes.total = 0
  bytes.requests = 0
  bytes.preflights = 0
  bytes.tags = {}
  await page.goto(url)
  const status = await page
    .waitForFunction(
      () => {
        const status = globalThis.__studioCache
        const done =
          status &&
          status.staleGroups === 0 &&
          !status.warming &&
          (status.warmedAt != null || status.full)
        return done ? status : undefined
      },
      undefined,
      {timeout: Number(process.env.TIMEOUT ?? 300_000), polling: 100},
    )
    .catch(async (error) => {
      log('timed out:', JSON.stringify(await page.evaluate(() => globalThis.__studioCache)))
      throw error
    })
  const cache = await status.jsonValue()
  await page.waitForTimeout(300)
  const state = await page.evaluate(() => globalThis.__reload)
  const doneAt = cache.warmedAt ?? state.current
  const tasks = state.longTasks.filter((task) => task.start <= doneAt)
  return {
    cache,
    result: {
      firstContentMs: round(state.firstContent),
      firstStaleMs: round(state.firstStale),
      visibleCurrentMs: round(state.current),
      cacheCurrentMs: round(doneAt),
      restoredDocs: cache.restoredDocs ?? 0,
      restoredInMs: round(cache.restoredIn),
      docs: cache.docs,
      apiKB: round(bytes.total / 1024),
      apiRequests: bytes.requests,
      apiPreflights: bytes.preflights,
      apiByTag: bytes.tags,
      storedMB: round((await page.evaluate(() => navigator.storage.estimate())).usage / 1e6, 1),
      longTasks: tasks.length,
      blockingMs: round(tasks.reduce((sum, task) => sum + task.duration - 50, 0)),
      longestTaskMs: round(Math.max(0, ...tasks.map((task) => task.duration))),
    },
  }
}

async function persisted(page, after) {
  await page.waitForFunction(
    (after) => {
      const status = globalThis.__studioCache
      return status?.persistedAt != null && status.persistedAt > after && !status.saving
    },
    after,
    {timeout: 120_000, polling: 100},
  )
  return page.evaluate(() => globalThis.__studioCache)
}

async function run(name, path) {
  const browser = await chromium.launch({channel: 'chrome', headless: true})
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 900}})
    await context.addInitScript(record)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => {
      log(name, 'page error:', error.message)
      errors.push(error.message)
    })
    page.on('response', (response) => {
      if (response.status() >= 400)
        log(name, response.status(), response.request().method(), response.url().slice(0, 160))
    })
    page.on('console', (message) => {
      if (message.type() === 'error') log(name, 'console error:', message.text().slice(0, 300))
    })
    const cdp = await context.newCDPSession(page)
    const bytes = {total: 0, requests: 0, preflights: 0}
    const api = new Set()
    await cdp.send('Network.enable')
    const tags = new Map()
    cdp.on('Network.requestWillBeSent', ({requestId, request, type}) => {
      if (!/\.api\.sanity\.(io|work)\//.test(request.url) || request.url.includes('/listen/'))
        return
      const tag = new URL(request.url).searchParams.get('tag')?.replace(/^sanity\.studio\./, '')
      // A CORS preflight is a round trip of its own, counted apart from the request it clears.
      const preflight = type === 'Preflight' || request.method === 'OPTIONS'
      const name = tag ?? new URL(request.url).pathname.split('/').slice(2, 4).join('/')
      tags.set(requestId, preflight ? `${name} (preflight)` : name)
      api.add(requestId)
    })
    const failed = (requestId, status) => {
      const tag = tags.get(requestId)
      if (!tag) return
      const entry = (bytes.tags[tag] ??= {requests: 0, kB: 0})
      entry.failed = [...(entry.failed ?? []), status]
    }
    cdp.on('Network.responseReceived', ({requestId, response}) => {
      if (response.status >= 400) failed(requestId, response.status)
    })
    cdp.on('Network.loadingFailed', ({requestId, errorText}) => failed(requestId, errorText))
    cdp.on('Network.loadingFinished', ({requestId, encodedDataLength}) => {
      if (!api.delete(requestId)) return
      bytes.total += encodedDataLength
      const tag = tags.get(requestId)
      if (tag.endsWith('(preflight)')) bytes.preflights++
      else bytes.requests++
      const entry = (bytes.tags[tag] ??= {requests: 0, kB: 0})
      entry.requests++
      entry.kB = round(entry.kB + encodedDataLength / 1024)
    })
    if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: THROTTLE})

    // Fills the cache and persists it.
    const first = await visit(page, `${ORIGIN}${path}${query({})}#token=${token}`, bytes)
    const saved = await persisted(page, first.cache.warmedAt ?? 0)
    log(
      name,
      `filled: ${first.cache.docs} docs, persisted ${round(saved.persistedBytes / 1e6, 1)} MB in ${round(saved.persistedIn)} ms`,
    )

    const runs = {cold: [], stale: []}
    for (let index = 0; index < RUNS; index++) {
      const cold = await visit(page, `${ORIGIN}${path}${query({persist: '0'})}`, bytes)
      log(name, 'cold', JSON.stringify(cold.result))
      runs.cold.push(cold.result)
      const stale = await visit(page, `${ORIGIN}${path}${query({})}`, bytes)
      log(name, 'stale', JSON.stringify(stale.result))
      runs.stale.push(stale.result)
      // The revalidated cache saves again before the next reload reads it.
      await persisted(page, stale.cache.warmedAt ?? 0).catch(() => {})
    }
    return {
      persistedMB: round(saved.persistedBytes / 1e6, 1),
      persistedInMs: round(saved.persistedIn),
      ...runs,
      errors,
    }
  } finally {
    await browser.close()
  }
}

const median = (values) => {
  const sorted = values.filter((value) => value != null).sort((a, b) => a - b)
  return sorted.length === 0 ? null : sorted[Math.floor(sorted.length / 2)]
}

const results = {}
for (const [name, path] of studios) results[name] = await run(name, path)
writeFileSync(process.env.OUT ?? 'reload.json', `${JSON.stringify(results, null, 2)}\n`)
for (const [name, result] of Object.entries(results)) {
  console.log(`${name}: persisted ${result.persistedMB} MB in ${result.persistedInMs} ms`)
  for (const mode of ['cold', 'stale']) {
    const runs = result[mode]
    const m = (key) => median(runs.map((run) => run[key]))
    console.log(
      [
        `  ${mode} (median of ${runs.length}): first row with content ${m('firstContentMs')} ms` +
          (mode === 'stale'
            ? ` (${m('restoredDocs')} docs restored in ${m('restoredInMs')} ms)`
            : ''),
        `every visible row current ${m('visibleCurrentMs')} ms, the whole cache ${m('cacheCurrentMs')} ms`,
        `API ${m('apiKB')} kB in ${m('apiRequests')} requests, long tasks ${m('longTasks')}, blocking ${m('blockingMs')} ms, longest ${m('longestTaskMs')} ms`,
      ].join('\n    '),
    )
  }
  if (result.errors.length > 0) console.log(`  errors: ${result.errors.join('; ')}`)
}
