import {type StyleCensus} from '@repo/utils/style-systems'
import {type Browser} from 'playwright'

import {type BenchScenario, type ScenarioStep} from '../../scenarios/types'
import {type AttachedPage, attachPage, createSessionContext} from '../browser'
import {type RunningSide} from '../servers'
import {SessionError} from './errors'
import {HERMETICITY_HINT, unexpectedEndpointHint} from './interaction'
import {awaitReadiness, scenarioUrl} from './navigation'
import {resetMockForScenario} from './seed'
import {milestoneMeasureName, runStep} from './steps'
import {takePageStyleCensus} from './styles'

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
  /**
   * Headline: navigation start → form editable + probe keystroke landed.
   * Null for a scenario whose load steps have no `awaitEditable`.
   */
  timeToEditableMs: number | null
  /**
   * Navigation start → each load-step `milestone` reached, in the order
   * reached (see BenchScenario.load).
   */
  milestones: {name: string; atMs: number}[]
  /**
   * Navigation start → the load steps finished (the later of editable and
   * the last milestone): the cutoff for `jsPaths` and `auth`.
   */
  loadEndMs: number
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
   * Pathnames of the JS chunks fetched before the load ended — joined
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
    /** Auth requests completed before the load ended. */
    trips: number
    /** Navigation start → first auth request issued (client-controlled). */
    firstRequestMs: number | null
    /** Union of in-flight windows of those requests (network/server share). */
    inFlightMs: number
  }
  /**
   * Style-system census of the loaded document (report-only) — see
   * @repo/utils/style-systems. Independent of the load condition (the same
   * page renders either way); null when no probe was supplied or it failed.
   */
  styles: StyleCensus | null
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

/** The pre-steps probe budget for the editable input, kept from the fixed probe. */
const EDITABLE_INPUT_TIMEOUT_MS = 30_000

/**
 * Load steps for a scenario without `load`: the editable probe on its first
 * interaction target, after `awaitReadiness` (the readiness selector keeps
 * its own timeout and error).
 */
export function defaultLoadSteps(scenario: BenchScenario): ScenarioStep[] {
  const first = scenario.interactions[0]
  return first ? [{kind: 'awaitEditable', field: first.fieldPath}] : []
}

function hasEditableStep(steps: ScenarioStep[]): boolean {
  return steps.some((step) => step.kind === 'awaitEditable')
}

function describeStep(step: ScenarioStep): string {
  if ('milestone' in step && step.milestone !== undefined) return `"${step.milestone}"`
  if ('label' in step && step.label !== undefined) return `"${step.label}"`
  return step.kind
}

/** `bench:milestone:*` measures → milestones in the order reached (first hit per name). */
export function collectMilestones(
  measures: {name: string; duration: number}[],
): PageLoadSample['milestones'] {
  const prefix = milestoneMeasureName('')
  const seen = new Set<string>()
  const milestones: PageLoadSample['milestones'] = []
  for (const measure of measures) {
    if (!measure.name.startsWith(prefix)) continue
    const name = measure.name.slice(prefix.length)
    if (seen.has(name)) continue
    seen.add(name)
    milestones.push({name, atMs: measure.duration})
  }
  return milestones.sort((a, b) => a.atMs - b.atMs)
}

async function measureLoad(options: {
  attached: AttachedPage
  running: RunningSide
  url: string
  scenario: BenchScenario
  condition: LoadCondition
  instrumentation: string
  styleProbe?: string
  config: PageLoadConfig
}): Promise<PageLoadSample> {
  const {attached, url, scenario, condition, instrumentation, styleProbe, config} = options
  const {page} = attached

  await page.addInitScript(instrumentation)
  await page.goto(url, {waitUntil: 'domcontentloaded', timeout: config.readinessTimeoutMs})

  const diagnostics = () => [...attached.consoleErrors, ...attached.httpErrors]
  const loadSteps = scenario.load?.steps ?? defaultLoadSteps(scenario)
  if (scenario.load === undefined) {
    await awaitReadiness(page, scenario, {
      timeoutMs: config.readinessTimeoutMs,
      context: condition,
      diagnostics,
    })
  }
  const stepContext = {
    page,
    running: options.running,
    timeoutMs: scenario.load === undefined ? EDITABLE_INPUT_TIMEOUT_MS : config.readinessTimeoutMs,
    interruptions: {count: 0, totalMs: 0},
    label: condition,
    diagnostics,
  }
  for (const step of loadSteps) {
    await runStep(stepContext, step).catch((error: unknown) => {
      if (error instanceof SessionError) throw error
      throw new SessionError(
        'readiness-timeout',
        `load step ${describeStep(step)} failed (${condition}): ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`,
        diagnostics(),
      )
    })
  }

  const entries = await page.evaluate(() => window.__bench?.take() ?? null)
  if (!entries) {
    throw new SessionError('page-error', 'instrumentation collector missing')
  }

  const timeToEditableMs =
    entries.measures.find((measure) => measure.name === 'bench:time-to-editable')?.duration ?? null
  if (timeToEditableMs === null && hasEditableStep(loadSteps)) {
    throw new SessionError('page-error', `bench:time-to-editable measure missing (${condition})`)
  }
  const milestones = collectMilestones(entries.measures)
  const loadEndMs = Math.max(
    timeToEditableMs ?? 0,
    ...milestones.map((milestone) => milestone.atMs),
  )
  const fcp = entries.paints.find((paint) => paint.name === 'first-contentful-paint')

  // Style census once the load steps finished: every load metric above is
  // already measured, so the DOM walk cannot land in any of them
  const styles = styleProbe ? await takePageStyleCensus(page, styleProbe) : null

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
    timeToEditableMs,
    milestones,
    loadEndMs,
    fcpMs: fcp?.startTime ?? null,
    lcpMs: entries.largestContentfulPaint?.startTime ?? null,
    cls: entries.layoutShifts
      .filter((shift) => !shift.hadRecentInput)
      .reduce((sum, shift) => sum + shift.value, 0),
    clsAttribution: foldClsAttribution(entries.layoutShifts),
    jsPaths: bootJsPaths(entries.resources, loadEndMs),
    blockingMs: entries.loafs.reduce((sum, loaf) => sum + loaf.blockingDuration, 0),
    loafAttribution: foldLoafAttribution(entries.loafs),
    auth: deriveAuthMilestones(entries.resources, loadEndMs),
    styles,
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
  /** The bundled style probe (runner/inject.ts); omitted = no style census. */
  styleProbe?: string
  config?: Partial<PageLoadConfig>
}): Promise<PageLoadSample[]> {
  const {browser, running, scenario, instrumentation, styleProbe} = options
  const config = {...DEFAULT_PAGELOAD_CONFIG, ...options.config}

  const auth = scenario.load?.auth ?? 'authenticated'
  const conditions = scenario.load?.conditions ?? ['boot-cold', 'open-doc-warm']

  resetMockForScenario(running, scenario)
  running.mock.setRequireToken(auth === 'logged-out')

  const session = await createSessionContext(browser, running.side, running.studioUrl, {
    cpuThrottleRate: config.cpuThrottleRate,
    auth,
  })
  const {context} = session

  const url = scenarioUrl(running.studioUrl, scenario)

  try {
    const samples: PageLoadSample[] = []
    for (const condition of conditions) {
      // Cold uses the session's first page; warm opens a second page in the
      // same context (primed HTTP cache) after the previous page closed
      const attached =
        condition === 'boot-cold'
          ? session
          : await attachPage(context, {cpuThrottleRate: config.cpuThrottleRate})
      await applyNetworkEmulation(attached, config.network)
      samples.push(
        await measureLoad({
          attached,
          running,
          url,
          scenario,
          condition,
          instrumentation,
          styleProbe,
          config,
        }),
      )
      await attached.page.close()
    }

    if (session.violations.length > 0) {
      throw new SessionError(
        'hermeticity-violation',
        session.violations.join(', '),
        HERMETICITY_HINT,
      )
    }
    const {unexpected} = running.mock.ledger.snapshot()
    if (unexpected.length > 0) {
      throw new SessionError(
        'unexpected-endpoint',
        unexpected.map((entry) => `${entry.method} ${entry.path}`).join(', '),
        unexpectedEndpointHint(unexpected.map((entry) => entry.path)),
      )
    }

    return samples
  } finally {
    running.mock.setRequireToken(false)
    await context.close()
  }
}
