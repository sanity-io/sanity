import {type Browser} from 'playwright'

import {type BenchScenario} from '../../scenarios/types'
import {type AttachedPage, attachPage, createSessionContext} from '../browser'
import {type RunningSide} from '../servers'
import {SessionError} from './errors'
import {HERMETICITY_HINT} from './interaction'
import {awaitReadiness, scenarioUrl} from './navigation'

export type LoadCondition = 'boot-cold' | 'open-doc-warm'

export interface PageLoadConfig {
  cpuThrottleRate: number
  /** Fast-4G-ish preset; null disables network emulation. */
  network: {latencyMs: number; downloadKbps: number; uploadKbps: number} | null
  readinessTimeoutMs: number
}

export const DEFAULT_PAGELOAD_CONFIG: PageLoadConfig = {
  cpuThrottleRate: 4,
  network: {latencyMs: 40, downloadKbps: 10_000, uploadKbps: 5_000},
  readinessTimeoutMs: 90_000,
}

export interface PageLoadSample {
  condition: LoadCondition
  /** Headline: navigation start → form editable + probe keystroke landed. */
  timeToEditableMs: number
  // No ttfbMs: the document is served by the local mock, so its TTFB is a
  // 2–10ms constant of the bench setup (the navigation request also bypasses
  // the emulated network latency) — a number we chose, not one we measure
  fcpMs: number | null
  lcpMs: number | null
  /** Cumulative layout shift (entries without recent input). */
  cls: number
  /**
   * Which elements shifted, with each one's summed contribution — so a CLS
   * regression names its culprit. Directional: a shift entry listing several
   * sources credits its full value to each of them.
   */
  clsAttribution: {source: string; totalValue: number}[]
  /**
   * Pathnames of the JS chunks fetched before the form was editable — joined
   * with the dist's exact gzip sizes at report time to measure what booting
   * actually downloads (the index.html entry chunk is a fraction of it).
   */
  jsPaths: string[]
  /** Total LoAF blocking during load. */
  blockingMs: number
  /**
   * Top blocking scripts (LoAF attribution) during the load — names the
   * functions that own `blockingMs`, so a slow time-to-editable is
   * diagnosable from the stored run instead of just observable.
   */
  loafAttribution: {sourceUrl: string; functionName: string; totalMs: number}[]
  /**
   * Auth boot-path milestones (report-only). Splits the auth cost into the
   * part we control (how late the first request is issued, how many
   * serialized trips sit on the path) and the part we don't (time an auth
   * request is in flight — near zero against the local mock, but exactly
   * the window that scales with real-world API latency per trip).
   */
  auth: {
    /** Auth requests completed before the form became editable. */
    trips: number
    /** Navigation start → first auth request issued (client-controlled). */
    firstRequestMs: number | null
    /** Union of in-flight windows of those requests (network/server share). */
    inFlightMs: number
  }
}

/**
 * Auth-class requests, mirroring the mock's ledger classification
 * (mock-api/createServer.ts): /vX/users/me and /vX/auth/* on the API host.
 */
const AUTH_RESOURCE = /\/v[^/]+\/(?:users\/me(?:\?|$)|auth\/)/

/** Total length of the union of [start, end] windows (overlaps counted once). */
export function unionDurationMs(windows: {start: number; end: number}[]): number {
  const sorted = windows.toSorted((a, b) => a.start - b.start)
  let total = 0
  let cursor = Number.NEGATIVE_INFINITY
  for (const {start, end} of sorted) {
    if (end <= cursor) continue
    total += end - Math.max(start, cursor)
    cursor = end
  }
  return total
}

/** Fold LoAF script entries into per-script blocking totals, largest first. */
export function foldLoafAttribution(
  loafs: {scripts: {sourceUrl: string; functionName: string; duration: number}[]}[],
  top = 10,
): PageLoadSample['loafAttribution'] {
  const byScript = new Map<string, {sourceUrl: string; functionName: string; totalMs: number}>()
  for (const loaf of loafs) {
    for (const script of loaf.scripts) {
      const key = `${script.sourceUrl}#${script.functionName}`
      const existing = byScript.get(key) ?? {
        sourceUrl: script.sourceUrl,
        functionName: script.functionName,
        totalMs: 0,
      }
      existing.totalMs += script.duration
      byScript.set(key, existing)
    }
  }
  return [...byScript.values()].sort((a, b) => b.totalMs - a.totalMs).slice(0, top)
}

/** Fold layout shifts into per-element value totals, largest first. */
export function foldClsAttribution(
  shifts: {value: number; hadRecentInput: boolean; sources: string[]}[],
  top = 10,
): PageLoadSample['clsAttribution'] {
  const bySource = new Map<string, {source: string; totalValue: number}>()
  for (const shift of shifts) {
    if (shift.hadRecentInput) continue
    for (const source of shift.sources) {
      const existing = bySource.get(source) ?? {source, totalValue: 0}
      existing.totalValue += shift.value
      bySource.set(source, existing)
    }
  }
  return [...bySource.values()].sort((a, b) => b.totalValue - a.totalValue).slice(0, top)
}

/**
 * Pathnames of JS chunks fetched before the form became editable, deduped and
 * sorted. Pathname only: the origin is the bench server, and the report-time
 * gzip lookup is keyed by dist-relative path.
 */
export function bootJsPaths(
  resources: {url: string; responseEnd: number}[],
  editableAtMs: number,
): string[] {
  const paths = new Set<string>()
  for (const resource of resources) {
    if (resource.responseEnd <= 0 || resource.responseEnd > editableAtMs) continue
    try {
      const {pathname} = new URL(resource.url)
      if (/\.m?js$/.test(pathname)) paths.add(pathname)
    } catch {
      // Not a URL (data: etc.) — not a chunk
    }
  }
  return [...paths].sort()
}

/** Derive the auth milestones from resource timing (see PageLoadSample.auth). */
export function deriveAuthMilestones(
  resources: {url: string; startTime: number; responseEnd: number}[],
  editableAtMs: number,
): PageLoadSample['auth'] {
  const authRequests = resources.filter(
    (resource) =>
      AUTH_RESOURCE.test(resource.url) &&
      resource.responseEnd > 0 &&
      resource.responseEnd <= editableAtMs,
  )
  return {
    trips: authRequests.length,
    firstRequestMs:
      authRequests.length > 0
        ? Math.min(...authRequests.map((resource) => resource.startTime))
        : null,
    inFlightMs: unionDurationMs(
      authRequests.map((resource) => ({start: resource.startTime, end: resource.responseEnd})),
    ),
  }
}

async function applyNetworkEmulation(
  attached: AttachedPage,
  network: PageLoadConfig['network'],
): Promise<void> {
  if (!network) return
  await attached.cdp.send('Network.enable')
  await attached.cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: network.latencyMs,
    downloadThroughput: (network.downloadKbps * 1000) / 8,
    uploadThroughput: (network.uploadKbps * 1000) / 8,
  })
}

async function measureLoad(options: {
  attached: AttachedPage
  url: string
  scenario: BenchScenario
  condition: LoadCondition
  instrumentation: string
  config: PageLoadConfig
}): Promise<PageLoadSample> {
  const {attached, url, scenario, condition, instrumentation, config} = options
  const {page} = attached

  await page.addInitScript(instrumentation)
  await page.goto(url, {waitUntil: 'domcontentloaded', timeout: config.readinessTimeoutMs})

  await awaitReadiness(page, scenario, {
    timeoutMs: config.readinessTimeoutMs,
    context: condition,
    diagnostics: () => [...attached.consoleErrors, ...attached.httpErrors],
  })

  const firstField = scenario.interactions[0]
  const input = page
    .locator(
      `[data-testid="field-${firstField.fieldPath}"] input[type="text"], ` +
        `[data-testid="field-${firstField.fieldPath}"] textarea, ` +
        `[data-testid="field-${firstField.fieldPath}"] [contenteditable="true"]`,
    )
    .first()
  await input.waitFor({state: 'visible', timeout: 30_000})
  await input.click()
  await input.evaluate((el) => {
    el.addEventListener('input', () => performance.measure('bench:time-to-editable'), {once: true})
  })
  await page.keyboard.press('a')

  await page
    .waitForFunction(
      () => performance.getEntriesByName('bench:time-to-editable', 'measure').length > 0,
      undefined,
      {timeout: 20_000, polling: 100},
    )
    .catch(() => {
      throw new SessionError('probe-timeout', `probe keystroke never landed (${condition})`, [
        ...attached.consoleErrors,
        ...attached.httpErrors,
      ])
    })

  const entries = await page.evaluate(() => window.__bench?.take() ?? null)
  if (!entries) {
    throw new SessionError('page-error', 'instrumentation collector missing')
  }

  const timeToEditable = entries.measures.find(
    (measure) => measure.name === 'bench:time-to-editable',
  )
  if (!timeToEditable) {
    throw new SessionError('page-error', `bench:time-to-editable measure missing (${condition})`)
  }
  const fcp = entries.paints.find((paint) => paint.name === 'first-contentful-paint')

  // Per-page invariants — validated before this page's teardown can abort
  // anything (navigation/close aborts in-flight requests and would log
  // spurious "network error"s otherwise)
  if (attached.pageErrors.length > 0) {
    throw new SessionError('page-error', attached.pageErrors.join('\n'))
  }
  if (attached.consoleErrors.length > 0) {
    throw new SessionError('console-error', attached.consoleErrors.join('\n'), attached.httpErrors)
  }

  return {
    condition,
    timeToEditableMs: timeToEditable.duration,
    fcpMs: fcp?.startTime ?? null,
    lcpMs: entries.largestContentfulPaint?.startTime ?? null,
    cls: entries.layoutShifts
      .filter((shift) => !shift.hadRecentInput)
      .reduce((sum, shift) => sum + shift.value, 0),
    clsAttribution: foldClsAttribution(entries.layoutShifts),
    jsPaths: bootJsPaths(entries.resources, timeToEditable.duration),
    blockingMs: entries.loafs.reduce((sum, loaf) => sum + loaf.blockingDuration, 0),
    loafAttribution: foldLoafAttribution(entries.loafs),
    auth: deriveAuthMilestones(entries.resources, timeToEditable.duration),
  }
}

/**
 * One pageLoad sample pair: `boot-cold` (fresh context = empty HTTP cache,
 * CPU + network throttled) then `open-doc-warm` (a second page in the same
 * context — primed cache). Each condition gets its own page and error
 * collectors: the cold page is validated and closed before the warm page
 * navigates, so teardown-aborted requests never read as failures.
 */
export async function runPageLoadSample(options: {
  browser: Browser
  running: RunningSide
  scenario: BenchScenario
  instrumentation: string
  config?: Partial<PageLoadConfig>
}): Promise<PageLoadSample[]> {
  const {browser, running, scenario, instrumentation} = options
  const config = {...DEFAULT_PAGELOAD_CONFIG, ...options.config}

  running.mock.hub.closeAll()
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.store.seed(scenario.fixture())

  const session = await createSessionContext(browser, running.side, running.studioUrl, {
    cpuThrottleRate: config.cpuThrottleRate,
  })
  const {context} = session

  const url = scenarioUrl(running.studioUrl, scenario)

  try {
    await applyNetworkEmulation(session, config.network)
    const cold = await measureLoad({
      attached: session,
      url,
      scenario,
      condition: 'boot-cold',
      instrumentation,
      config,
    })
    await session.page.close()

    const warmPage = await attachPage(context, {cpuThrottleRate: config.cpuThrottleRate})
    await applyNetworkEmulation(warmPage, config.network)
    const warm = await measureLoad({
      attached: warmPage,
      url,
      scenario,
      condition: 'open-doc-warm',
      instrumentation,
      config,
    })

    if (session.violations.length > 0) {
      throw new SessionError(
        'hermeticity-violation',
        session.violations.join(', '),
        HERMETICITY_HINT,
      )
    }

    return [cold, warm]
  } finally {
    await context.close()
  }
}
