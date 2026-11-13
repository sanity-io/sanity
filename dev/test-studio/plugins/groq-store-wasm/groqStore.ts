import {bootGroqStore, type BootResult, type Metric} from '@sanity/groq-store-wasm/boot'

/**
 * Boots `@sanity/groq-store-wasm` (a service worker that routes Content Lake `/data/query`
 * requests to a SharedWorker holding the dataset in a wasm GROQ engine) and keeps the counters
 * the debug bar shows. Ported from the test studio in sanity-labs/groq-wasm.
 */

export type GroqStoreStatus = {
  /** Whether the service worker and the SharedWorker were started at all. */
  boot: BootResult | {started: false; reason: string}
  /** Whether the store is switched on for this browser (`?groqStore=on|off`). */
  enabled: boolean
  /** Whether a service worker controls this tab (a hard reload bypasses it). */
  controlled: boolean
  /** `/data/query` requests in this tab answered by the wasm store. */
  answered: number
  /** Requests the store host declined, sent on to Content Lake. */
  passthrough: number
  /** Requests sent to Content Lake without asking a store: no host yet, or it was too slow. */
  unaccelerated: number
  answerMs: number
  reasons: Record<string, number>
  /** Latest store event from the shared host, for every tab. */
  store: string
  storeError?: string
  guardOff: boolean
  progress?: {exportBytes?: number; memoryBytes?: number; documents?: number}
  lastStopped?: LastRun
  mutations: {applied: number; stale: number}
  fences: {count: number; lifted: number; ms: number; how: Record<string, number>}
  /**
   * Time the page waited for each `/data/query` response, from the browser's resource timing,
   * whoever answered it. Comparable with the store on and off.
   */
  latency: {count: number; p50: number; p95: number}
}

type LastRun = {
  key: string
  phase: string
  exportBytes?: number
  memoryBytes?: number
  documents?: number
  at: number
}

const SERVICE_WORKER_PATH = '/groq-sw.js'
const ENABLED_KEY = 'groq-store-wasm:enabled'
const GUARD_KEY = 'groq-store-wasm:guard'
const LAST_RUN_KEY = 'groq-store-wasm:last-run'
const RELOADED_KEY = 'groq-store-wasm:reloaded'
const LATENCY_SAMPLES = 500

function readStorage(storage: 'localStorage' | 'sessionStorage', key: string): string | null {
  try {
    return typeof window === 'undefined' ? null : window[storage].getItem(key)
  } catch {
    return null
  }
}

function writeStorage(
  storage: 'localStorage' | 'sessionStorage',
  key: string,
  value: string | null,
): void {
  try {
    if (typeof window === 'undefined') return
    if (value === null) window[storage].removeItem(key)
    else window[storage].setItem(key, value)
  } catch {
    // Storage can be disabled; the store then just uses its defaults.
  }
}

function searchParam(name: string): string | null {
  return typeof location === 'undefined' ? null : new URL(location.href).searchParams.get(name)
}

/** Whether the store runs in this browser, and why not if it doesn't. */
function initialMode(): {enabled: true} | {enabled: false; reason: string} {
  if (process.env.SANITY_STUDIO_GROQ_STORE === 'off') {
    return {enabled: false, reason: 'off (SANITY_STUDIO_GROQ_STORE=off)'}
  }
  const override = searchParam('groqStore')
  if (override === 'on' || override === 'off') writeStorage('localStorage', ENABLED_KEY, override)
  const stored = readStorage('localStorage', ENABLED_KEY)
  if (stored === 'off') return {enabled: false, reason: 'off for this browser'}
  // Keeps e2e runs on Content Lake unless a test opts in with `?groqStore=on`.
  if (stored !== 'on' && typeof navigator !== 'undefined' && navigator.webdriver) {
    return {enabled: false, reason: 'off in automated browsers (?groqStore=on)'}
  }
  return {enabled: true}
}

function initialGuardOff(): boolean {
  const override = searchParam('groqGuard')
  if (override === 'off') writeStorage('localStorage', GUARD_KEY, 'off')
  if (override === 'on') writeStorage('localStorage', GUARD_KEY, null)
  return readStorage('localStorage', GUARD_KEY) === 'off'
}

function isLastRun(value: unknown): value is LastRun {
  return (
    typeof value === 'object' &&
    value !== null &&
    'key' in value &&
    typeof value.key === 'string' &&
    'phase' in value &&
    typeof value.phase === 'string'
  )
}

function storedLastRun(): LastRun | undefined {
  try {
    const value: unknown = JSON.parse(readStorage('localStorage', LAST_RUN_KEY) ?? 'null')
    return isLastRun(value) ? value : undefined
  } catch {
    return undefined
  }
}

const mode = initialMode()
const previousRun = storedLastRun()

let status: GroqStoreStatus = {
  boot: {started: false, reason: mode.enabled ? 'not started' : mode.reason},
  enabled: mode.enabled,
  controlled: false,
  answered: 0,
  passthrough: 0,
  unaccelerated: 0,
  answerMs: 0,
  reasons: {},
  store: 'idle',
  guardOff: initialGuardOff(),
  lastStopped:
    previousRun && previousRun.phase !== 'live' && previousRun.phase !== 'guarded'
      ? previousRun
      : undefined,
  mutations: {applied: 0, stale: 0},
  fences: {count: 0, lifted: 0, ms: 0, how: {}},
  latency: {count: 0, p50: 0, p95: 0},
}
const listeners = new Set<() => void>()

function update(next: Partial<GroqStoreStatus>): void {
  status = {...status, ...next}
  for (const listener of listeners) listener()
}

/** Snapshot for `useSyncExternalStore`. */
export const getGroqStoreStatus = (): GroqStoreStatus => status

/** Subscription for `useSyncExternalStore`. */
export function subscribeGroqStoreStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Switches the store on or off for this browser and reloads. */
export function setGroqStoreEnabled(enabled: boolean): void {
  writeStorage('localStorage', ENABLED_KEY, enabled ? 'on' : 'off')
  const url = new URL(location.href)
  url.searchParams.delete('groqStore')
  location.replace(url)
}

const bump = (reason: string): Record<string, number> => ({
  ...status.reasons,
  [reason]: (status.reasons[reason] ?? 0) + 1,
})

function onMetric(metric: Metric): void {
  if (metric.type === 'route') {
    if (metric.outcome === 'answer') {
      update({answered: status.answered + 1, answerMs: status.answerMs + metric.ms})
    } else if (metric.outcome === 'passthrough') {
      update({passthrough: status.passthrough + 1, reasons: bump(metric.reason ?? 'unknown')})
    } else {
      update({unaccelerated: status.unaccelerated + 1, reasons: bump(metric.outcome)})
    }
    return
  }
  if (metric.type !== 'store') return
  switch (metric.event) {
    case 'building':
      update({store: 'building', storeError: undefined})
      persist(metric, 'building')
      break
    case 'progress':
      update({
        store: 'building',
        storeError: undefined,
        progress: {
          exportBytes: metric.exportBytes,
          memoryBytes: metric.memoryBytes,
          documents: metric.documents,
        },
      })
      persist(metric, 'building')
      break
    case 'export':
      update({
        store: `loaded ${metric.documents ?? '?'} docs in ${Math.round(metric.ms ?? 0)} ms`,
        storeError: undefined,
      })
      persist(metric, 'building')
      break
    case 'live':
      update({
        store: `live${status.store.startsWith('loaded') ? `, ${status.store}` : ''}`,
        storeError: undefined,
        progress: {...status.progress, memoryBytes: metric.memoryBytes},
      })
      persist(metric, 'live')
      break
    case 'drafts-parity':
      if (!metric.answerable) {
        update({storeError: metric.reason ?? 'drafts perspective is passthrough-only'})
      }
      break
    case 'reconnect':
      update({store: 'reconnecting'})
      break
    case 'dropped':
      update({store: 'dropped (not authorized)'})
      break
    case 'guarded':
      update({store: 'guarded', storeError: metric.reason ?? 'memory limit reached'})
      persist(metric, 'guarded')
      break
    case 'poisoned':
      update({store: 'restarting', storeError: metric.reason ?? 'wasm instance poisoned'})
      persist(metric, 'poisoned')
      break
    case 'failed':
      update({store: 'failed', storeError: metric.error ?? 'unknown error'})
      persist(metric, 'failed')
      break
    case 'mutation':
      update({
        mutations: {
          applied: status.mutations.applied + (metric.applied ?? 0),
          stale: status.mutations.stale + (metric.stale ?? 0),
        },
      })
      break
    case 'fenced':
      update({fences: {...status.fences, count: status.fences.count + 1}})
      break
    case 'unfenced': {
      const how = metric.how ?? 'unknown'
      update({
        fences: {
          ...status.fences,
          lifted: status.fences.lifted + 1,
          ms: status.fences.ms + (metric.ms ?? 0),
          how: {...status.fences.how, [how]: (status.fences.how[how] ?? 0) + 1},
        },
      })
      break
    }
    default:
      break
  }
}

let lastPersistedAt = 0
/** Keeps the last store phase across a crashed tab, so the bar can say how far it got. */
function persist(metric: Extract<Metric, {type: 'store'}>, phase: string): void {
  const now = Date.now()
  if (metric.event === 'progress' && now - lastPersistedAt < 500) return
  lastPersistedAt = now
  const previous = storedLastRun()
  const key = metric.key === '*' && previous ? previous.key : metric.key
  const sameRun = previous?.key === key
  const run: LastRun = {
    key,
    phase,
    exportBytes: metric.exportBytes ?? (sameRun ? previous?.exportBytes : undefined),
    memoryBytes: metric.memoryBytes ?? (sameRun ? previous?.memoryBytes : undefined),
    documents: metric.documents ?? (sameRun ? previous?.documents : undefined),
    at: now,
  }
  writeStorage('localStorage', LAST_RUN_KEY, JSON.stringify(run))
}

const QUERY_PATH = /^\/v[^/]+\/data\/query\//
const latencies: number[] = []

function isQueryUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.hostname.endsWith('.api.sanity.io') && QUERY_PATH.test(url.pathname)
  } catch {
    return false
  }
}

function percentile(sorted: number[], fraction: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0
}

/** Records how long every `/data/query` request took, answered by the store or by Content Lake. */
function observeQueryLatency(): void {
  if (typeof PerformanceObserver === 'undefined') return
  const observer = new PerformanceObserver((list) => {
    let added = 0
    for (const entry of list.getEntries()) {
      if (!isQueryUrl(entry.name)) continue
      latencies.push(entry.duration)
      if (latencies.length > LATENCY_SAMPLES) latencies.shift()
      added += 1
    }
    if (added === 0) return
    const sorted = latencies.toSorted((a, b) => a - b)
    update({
      latency: {
        count: status.latency.count + added,
        p50: percentile(sorted, 0.5),
        p95: percentile(sorted, 0.95),
      },
    })
  })
  try {
    observer.observe({type: 'resource', buffered: true})
  } catch {
    // Older browsers only take `entryTypes`.
    observer.observe({entryTypes: ['resource']})
  }
}

/** Removes the router when the store is switched off, so this tab talks to Content Lake directly. */
async function removeRouter(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations()
  const results = await Promise.all(
    registrations
      .filter((registration) => {
        const worker = registration.active ?? registration.waiting ?? registration.installing
        return worker !== null && new URL(worker.scriptURL).pathname === SERVICE_WORKER_PATH
      })
      .map((registration) => registration.unregister()),
  )
  const removed = results.includes(true)
  // An unregistered worker keeps controlling the tabs it already controls, so reload once.
  if (removed && navigator.serviceWorker.controller) {
    if (readStorage('sessionStorage', RELOADED_KEY) === null) {
      writeStorage('sessionStorage', RELOADED_KEY, '1')
      location.reload()
    }
    return
  }
  writeStorage('sessionStorage', RELOADED_KEY, null)
}

let started = false

/**
 * Starts the store host (SharedWorker) and registers the router (service worker), unless the
 * store is switched off. Safe to call outside a browser (CLI config loading) and more than once.
 */
export function startGroqStore(): void {
  if (started || typeof window === 'undefined' || typeof navigator === 'undefined') return
  started = true
  try {
    observeQueryLatency()
    if (!mode.enabled) {
      if ('serviceWorker' in navigator) {
        removeRouter().catch((error: unknown) => console.warn('[groq-store-wasm]', error))
      }
      return
    }
    const boot = bootGroqStore({
      serviceWorkerUrl: SERVICE_WORKER_PATH,
      hostUrl: `/groq-host.js?wasm=/groq_wasm_bg.wasm${status.guardOff ? '&guard=off' : ''}`,
      hostName: status.guardOff ? 'groq-store-wasm-guard-off' : undefined,
      onMetric,
    })
    update({boot})
    if (!boot.started) {
      console.warn(`[groq-store-wasm] not started: ${boot.reason}`)
      return
    }
    const controlled = (): void => update({controlled: navigator.serviceWorker.controller !== null})
    controlled()
    navigator.serviceWorker.addEventListener('controllerchange', controlled)
  } catch (error) {
    console.warn('[groq-store-wasm] failed to start', error)
    update({boot: {started: false, reason: `failed to start: ${String(error)}`}})
  }
}
