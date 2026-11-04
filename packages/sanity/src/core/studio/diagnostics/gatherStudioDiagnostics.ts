import {type ListenEvent, type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {
  catchError,
  filter,
  firstValueFrom,
  map,
  of,
  share,
  take,
  tap,
  TimeoutError,
  timeout,
} from 'rxjs'

import {hasSanityPackageInImportMap} from '../../environment/importMap'
import {type ApiNetworkDiagnostic, getApiNetworkDiagnostic} from '../../network/isUsingLegacyHttp'
import {getDiagnosticsFindings, SLOW_PING_MS} from './getDiagnosticsFindings'
import {type SchemaDiagnostics} from './getStudioConfigurationDiagnostics'
import {getStylesDiagnostics, type StylesDiagnostics} from './getStylesDiagnostics'
import {type RequestActivitySnapshot} from './requestActivity'
import {
  DEFAULT_REQUEST_PERFORMANCE_CAPACITY,
  type RequestPerformanceSnapshot,
  type RequestPerformanceTracker,
} from './requestPerformance'
import {
  createStudioTabActivity,
  DEFAULT_TABS_CENSUS_TIMEOUT,
  type StudioTabActivity,
  type StudioTabsCensus,
} from './studioTabsCensus'

const DEFAULT_REQUEST_TIMEOUT = 10_000

/** Upper bound for a whole diagnostics run, so a stalled network can't keep the dialog busy for minutes */
const DEFAULT_MAX_DURATION = 20_000

/** Matches the default timeout of the ping-based network timing probe */
const PING_TIMEOUT = 2_500

/** Timeout for the remaining tests once the network looks stalled */
const STALLED_PROBE_TIMEOUT = 3_000

/** Tests that would get less than this much of the remaining run time are skipped instead */
const MIN_PROBE_TIME = 250

/** @internal */
export interface StudioDiagnosticsOptions {
  client: SanityClient
  /** This tab's open and pending requests */
  getRequestActivity?: () => RequestActivitySnapshot
  getRequestHistory?: RequestPerformanceTracker['getSnapshot']
  /** Upper bound for the whole run. Tests that can't start in time are reported as skipped. */
  maxDurationMs?: number
  /** Asks other Studio tabs in this browser for their request activity */
  requestTabsCensus?: (options: {
    currentTab: StudioTabActivity
    timeoutMs: number
  }) => Promise<StudioTabsCensus>
  requestTimeout?: number
  schema: SchemaDiagnostics
  studio: {
    basePath?: string
    dataset: string
    projectId: string
    reactVersion: string
    uniqueTargetCount: number
    version: string
    workspaceCount: number
    workspaceName?: string
    workspaceTitle?: string
  }
  user: CurrentUser | null
}

/** @internal */
export type DiagnosticsProbeStatus = 'success' | 'timeout' | 'error' | 'skipped'

/**
 * Why a test was skipped: the run hit its time limit, or (for the second listen connection) the
 * first connection never succeeded.
 *
 * @internal
 */
export type DiagnosticsSkipReason = 'time-limit' | 'first-connection-failed'

/** @internal */
export interface ListenDiagnostic {
  durationMs: number
  error?: string
  openMs?: number
  path: '/listen?query=*'
  skipReason?: DiagnosticsSkipReason
  status: DiagnosticsProbeStatus
  timedOut: boolean
  welcomeMs?: number
}

/** @internal */
export interface RequestDiagnostic {
  detail?: string
  durationMs: number
  error?: string
  path: string
  shard?: string
  skipReason?: DiagnosticsSkipReason
  status: DiagnosticsProbeStatus
  timedOut: boolean
}

/** @internal */
export interface StudioConnectionsDiagnostics {
  /** This tab's request activity when the run started, before the tests add their own requests */
  currentTab: RequestActivitySnapshot
  /** Request activity across the Studio tabs in this browser that answered */
  tabs?: StudioTabsCensus
}

/** @internal */
export interface DiagnosticsFinding {
  detail: string
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
}

/** @internal */
export interface StudioDiagnostics {
  browser: {
    colorDepth?: number
    connection?: {
      downlinkMbps?: number
      effectiveType?: string
      roundtripTimeMs?: number
      saveData?: boolean
    }
    cookieEnabled?: boolean
    deviceMemoryGb?: number
    devicePixelRatio?: number
    hardwareConcurrency?: number
    language?: string
    languages?: readonly string[]
    localStorage?: {
      error?: string
      status: 'success' | 'error' | 'unsupported'
    }
    maxTouchPoints?: number
    online?: boolean
    screen?: {availableHeight: number; availableWidth: number; height: number; width: number}
    timezone?: string
    userAgent?: string
    viewport?: {height: number; width: number}
  }
  diagnosticVersion: 1
  durationMs: number
  /** Conclusions drawn from the rest of the report. Missing from reports made by older studios. */
  findings?: DiagnosticsFinding[]
  generatedAt: string
  /** The run's time limit. Missing from reports made by older studios. */
  maxDurationMs?: number
  network: {
    /** Missing from reports made by older studios, or when request activity isn't tracked */
    connections?: StudioConnectionsDiagnostics
    geoIpCountry?: string | null
    listen: {
      first: ListenDiagnostic
      secondWhileFirstOpen: ListenDiagnostic
    }
    protocol: ApiNetworkDiagnostic
    requestHistory: RequestPerformanceSnapshot
    requests: RequestDiagnostic[]
    shard?: string
    /** The ping was slow or timed out, so the remaining tests used shorter timeouts */
    stalled?: boolean
  }
  schema: SchemaDiagnostics
  startedAt: string
  studio: StudioDiagnosticsOptions['studio'] & {
    apiHost?: string
    /**
     * Whether a `sanity` entry exists in an import map, the auto-updating studio signal.
     * Undefined in reports from older studios and when the import map cannot be parsed.
     */
    autoUpdates?: boolean
    location?: string
  }
  /**
   * Always set by {@link gatherStudioDiagnostics}; optional only because reports from older
   * studios lack it.
   */
  styles?: StylesDiagnostics
  user: {
    id?: string
    provider?: string
    roles: {name: string; title: string}[]
  }
}

interface ActiveListenDiagnostic {
  close: () => void
  result: Promise<ListenDiagnostic>
}

interface RequestDiagnosticSuccess {
  detail: string
  shard?: string
}

interface NavigatorConnection {
  downlink?: number
  effectiveType?: string
  rtt?: number
  saveData?: boolean
}

interface ExtendedNavigator extends Navigator {
  connection?: NavigatorConnection
  deviceMemory?: number
}

let diagnosticsQueue = Promise.resolve()

/**
 * Gathers a JSON-safe Studio diagnostics report. Calls are serialized so a new network
 * pass does not begin until the previous pass has completed.
 *
 * @internal
 */
export function gatherStudioDiagnostics(
  options: StudioDiagnosticsOptions,
): Promise<StudioDiagnostics> {
  const result = diagnosticsQueue.then(() => runStudioDiagnostics(options))
  diagnosticsQueue = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

/** @internal */
export function formatStudioDiagnostics(diagnostics: StudioDiagnostics): string {
  return JSON.stringify(diagnostics, null, 2)
}

async function runStudioDiagnostics({
  client,
  getRequestActivity,
  getRequestHistory,
  maxDurationMs = DEFAULT_MAX_DURATION,
  requestTabsCensus,
  requestTimeout = DEFAULT_REQUEST_TIMEOUT,
  schema,
  studio,
  user,
}: StudioDiagnosticsOptions): Promise<StudioDiagnostics> {
  const startedAt = new Date()
  const startedAtMeasurement = performance.now()
  const budget = createRunBudget(startedAtMeasurement + maxDurationMs)
  const diagnosticClient = client.withConfig({maxRetries: 0, useCdn: false})
  const requestTarget = {dataset: studio.dataset, projectId: studio.projectId}
  const requestHistoryBeforeDiagnostics =
    getRequestHistory?.(requestTarget) ?? createEmptyRequestHistory(requestTarget, startedAt)

  // Captured before the tests below add requests of their own. Other tabs answer the census
  // while the tests run, so waiting for their answers doesn't add to the run time.
  const currentTabActivity = getRequestActivity?.()
  const tabsCensus =
    currentTabActivity && requestTabsCensus
      ? requestTabsCensus({
          currentTab: createStudioTabActivity(currentTabActivity, studio.version),
          timeoutMs: budget.timeoutFor(DEFAULT_TABS_CENSUS_TIMEOUT) ?? MIN_PROBE_TIME,
        }).catch(() => undefined)
      : Promise.resolve(undefined)
  const protocol = await firstValueFrom(
    getApiNetworkDiagnostic(diagnosticClient, {
      timeout: budget.timeoutFor(PING_TIMEOUT) ?? MIN_PROBE_TIME,
    }),
  )

  // A slow ping means requests are stalling, in the browser or on the network. The remaining
  // tests would likely stall too, so give them less time and run the request tests side by side.
  const stalled = isStalledPing(protocol)
  const probeTimeout = stalled ? Math.min(requestTimeout, STALLED_PROBE_TIMEOUT) : requestTimeout
  const listen = await runListenDiagnostics(diagnosticClient, probeTimeout, budget)
  const {geoIpCountry, requests} = await runRequestDiagnostics(
    diagnosticClient,
    probeTimeout,
    budget,
    {concurrent: stalled},
  )
  const tabs = await tabsCensus
  const clientConfig = diagnosticClient.config()
  const browser = getBrowserDiagnostics()
  const generatedAt = new Date()
  const latestRequestHistory =
    getRequestHistory?.(requestTarget) ?? createEmptyRequestHistory(requestTarget, startedAt)
  const requestHistory = {
    ...latestRequestHistory,
    sessionSummary: requestHistoryBeforeDiagnostics.sessionSummary,
  }
  const shard = requests.find((request) => request.shard)?.shard
  const connections = currentTabActivity ? {currentTab: currentTabActivity, tabs} : undefined

  const report: StudioDiagnostics = {
    browser,
    diagnosticVersion: 1,
    durationMs: elapsedSince(startedAtMeasurement),
    generatedAt: generatedAt.toISOString(),
    maxDurationMs,
    network: {
      connections,
      geoIpCountry,
      listen,
      protocol,
      requestHistory,
      requests,
      shard,
      stalled,
    },
    schema,
    startedAt: startedAt.toISOString(),
    studio: {
      ...studio,
      apiHost: clientConfig.apiHost,
      autoUpdates: detectAutoUpdates(),
      location: typeof location === 'undefined' ? undefined : location.href,
    },
    styles: getStylesDiagnostics(),
    user: {
      id: user?.id,
      provider: user?.provider,
      roles: user?.roles.map(({name, title}) => ({name, title})) ?? [],
    },
  }

  return {...report, findings: getDiagnosticsFindings(report)}
}

interface RunBudget {
  /**
   * The timeout a test may use: the preferred timeout, shortened to the remaining run time.
   * Undefined when too little time is left and the test should be skipped.
   */
  timeoutFor: (preferredMs: number) => number | undefined
}

function createRunBudget(deadline: number): RunBudget {
  return {
    timeoutFor: (preferredMs) => {
      const remaining = Math.floor(deadline - performance.now())
      return remaining < MIN_PROBE_TIME ? undefined : Math.min(preferredMs, remaining)
    },
  }
}

function isStalledPing(protocol: ApiNetworkDiagnostic): boolean {
  return (
    protocol.status === 'timeout' ||
    (protocol.status === 'success' && protocol.durationMs >= SLOW_PING_MS)
  )
}

// hasSanityPackageInImportMap JSON.parses the page's import maps; a malformed one must not abort
// the report.
function detectAutoUpdates(): boolean | undefined {
  try {
    return hasSanityPackageInImportMap()
  } catch {
    return undefined
  }
}

function createEmptyRequestHistory(
  target: {dataset: string; projectId: string},
  startedAt: Date,
): RequestPerformanceSnapshot {
  return {
    ...target,
    entries: [],
    maxEntries: DEFAULT_REQUEST_PERFORMANCE_CAPACITY,
    sessionSummary: {buckets: [], startedAt: startedAt.toISOString(), totalRequests: 0},
    totalRequests: 0,
    truncated: false,
  }
}

async function runListenDiagnostics(
  client: SanityClient,
  timeoutMs: number,
  budget: RunBudget,
): Promise<StudioDiagnostics['network']['listen']> {
  const firstTimeout = budget.timeoutFor(timeoutMs)
  if (firstTimeout === undefined) {
    return {first: skippedListen('time-limit'), secondWhileFirstOpen: skippedListen('time-limit')}
  }

  const first = startListenDiagnostic(client, firstTimeout)

  try {
    const firstResult = await first.result
    // Without a working first connection, the second test has nothing to measure against
    if (firstResult.status !== 'success') {
      return {first: firstResult, secondWhileFirstOpen: skippedListen('first-connection-failed')}
    }

    const secondTimeout = budget.timeoutFor(timeoutMs)
    if (secondTimeout === undefined) {
      return {first: firstResult, secondWhileFirstOpen: skippedListen('time-limit')}
    }

    const second = startListenDiagnostic(client, secondTimeout)

    try {
      return {
        first: firstResult,
        secondWhileFirstOpen: await second.result,
      }
    } finally {
      second.close()
    }
  } finally {
    first.close()
  }
}

function startListenDiagnostic(client: SanityClient, timeoutMs: number): ActiveListenDiagnostic {
  const startedAt = performance.now()
  const partial: Pick<ListenDiagnostic, 'openMs' | 'welcomeMs'> = {}
  const events$ = client
    .listen(
      '*',
      {},
      {
        events: ['open', 'welcome'],
        includeMutations: false,
        includeResult: false,
        tag: 'diagnostics.listen',
      },
    )
    .pipe(share())

  const result = firstValueFrom(
    events$.pipe(
      tap((event: ListenEvent) => {
        if (event.type === 'open' && partial.openMs === undefined) {
          partial.openMs = elapsedSince(startedAt)
        }
        if (event.type === 'welcome' && partial.welcomeMs === undefined) {
          partial.welcomeMs = elapsedSince(startedAt)
        }
      }),
      filter(() => partial.openMs !== undefined && partial.welcomeMs !== undefined),
      take(1),
      map((): ListenDiagnostic => ({
        ...partial,
        durationMs: elapsedSince(startedAt),
        path: '/listen?query=*',
        status: 'success',
        timedOut: false,
      })),
      timeout({first: timeoutMs}),
      catchError((error: unknown) =>
        of({
          ...partial,
          durationMs: elapsedSince(startedAt),
          error: error instanceof TimeoutError ? undefined : formatError(error),
          path: '/listen?query=*' as const,
          status: error instanceof TimeoutError ? ('timeout' as const) : ('error' as const),
          timedOut: error instanceof TimeoutError,
        }),
      ),
    ),
  )

  // Keep the shared EventSource alive after the measurement completes. The first listener is
  // deliberately retained while the second listener is measured.
  const keepAliveSubscription = events$.subscribe({error: () => undefined})

  return {
    close: () => keepAliveSubscription.unsubscribe(),
    result,
  }
}

interface RequestProbe {
  path: string
  perform: (signal: AbortSignal, timeoutMs: number) => Promise<RequestDiagnosticSuccess>
}

async function runRequestDiagnostics(
  client: SanityClient,
  timeoutMs: number,
  budget: RunBudget,
  {concurrent}: {concurrent: boolean},
): Promise<{geoIpCountry?: string | null; requests: RequestDiagnostic[]}> {
  const credentiallessClient = client.withConfig({token: undefined, withCredentials: false})
  let geoIpCountry: string | null | undefined

  const probes: RequestProbe[] = [
    {
      path: '/ping',
      perform: async (signal, probeTimeoutMs) => {
        await credentiallessClient.request({
          maxRetries: 0,
          signal,
          tag: 'diagnostics.ping',
          timeout: probeTimeoutMs,
          url: '/ping',
        })
        return {detail: 'API reached'}
      },
    },
    {
      path: '/geoip/country',
      perform: async (signal, probeTimeoutMs) => {
        const result = await credentiallessClient.request<{isoCode: string | null}>({
          maxRetries: 0,
          signal,
          tag: 'diagnostics.geoip-country',
          timeout: probeTimeoutMs,
          url: '/geoip/country',
        })
        geoIpCountry = typeof result.isoCode === 'string' ? result.isoCode : null
        return {detail: geoIpCountry ?? 'country could not be resolved'}
      },
    },
    {
      path: '/query?query=1',
      perform: (signal) => requestConstantQuery(client, signal),
    },
    {
      path: '/query?query=*[0]._id',
      perform: async (signal, probeTimeoutMs) => {
        const result = await client.fetch<string | null>(
          '*[0]._id',
          {},
          {
            signal,
            stega: false,
            tag: 'diagnostics.query-document',
            timeout: probeTimeoutMs,
            useCdn: false,
          },
        )
        return {detail: result ? 'document ID received' : 'dataset contains no documents'}
      },
    },
    {
      path: '/doc/<random-nonexistent-id>',
      perform: async (signal) => {
        const result = await client.getDocument(createNonexistentDocumentId(), {
          signal,
          tag: 'diagnostics.document',
        })
        return {
          detail: result ? 'unexpected document returned' : 'document not found (as expected)',
        }
      },
    },
  ]

  const runProbe = (probe: RequestProbe): Promise<RequestDiagnostic> => {
    const probeTimeout = budget.timeoutFor(timeoutMs)
    if (probeTimeout === undefined) return Promise.resolve(skippedRequest(probe.path, 'time-limit'))
    return measureRequest(probe.path, probeTimeout, (signal) => probe.perform(signal, probeTimeout))
  }

  // Normally one at a time, so the measurements don't affect each other. When the network is
  // stalling the measurements are compromised anyway, and running them together keeps the run short.
  const requests = concurrent
    ? await Promise.all(probes.map(runProbe))
    : await probes.reduce<Promise<RequestDiagnostic[]>>(
        async (previous, probe) => [...(await previous), await runProbe(probe)],
        Promise.resolve([]),
      )

  return {geoIpCountry, requests}
}

function skippedListen(skipReason: DiagnosticsSkipReason): ListenDiagnostic {
  return {durationMs: 0, path: '/listen?query=*', skipReason, status: 'skipped', timedOut: false}
}

function skippedRequest(path: string, skipReason: DiagnosticsSkipReason): RequestDiagnostic {
  return {durationMs: 0, path, skipReason, status: 'skipped', timedOut: false}
}

async function measureRequest(
  path: string,
  timeoutMs: number,
  perform: (signal: AbortSignal) => Promise<RequestDiagnosticSuccess>,
): Promise<RequestDiagnostic> {
  const startedAt = performance.now()
  const abortController = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      abortController.abort()
      reject(new DiagnosticsTimeoutError())
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([perform(abortController.signal), timeoutPromise])
    return {
      ...result,
      durationMs: elapsedSince(startedAt),
      path,
      status: 'success',
      timedOut: false,
    }
  } catch (error) {
    const timedOut = error instanceof DiagnosticsTimeoutError
    return {
      durationMs: elapsedSince(startedAt),
      error: timedOut ? undefined : formatError(error),
      path,
      status: timedOut ? 'timeout' : 'error',
      timedOut,
    }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// Manual requesting in order to pick out `x-sanity-shard` header
async function requestConstantQuery(
  client: SanityClient,
  signal: AbortSignal,
): Promise<RequestDiagnosticSuccess> {
  const config = client.config()
  const url = new URL(client.getUrl(client.getDataUrl('query')))
  const tag = [config.requestTagPrefix, 'diagnostics.query-constant'].filter(Boolean).join('.')
  url.searchParams.set('query', '1')
  url.searchParams.set('returnQuery', 'false')
  url.searchParams.set('tag', tag)

  const headers = new Headers(config.headers)
  if (config.token) headers.set('Authorization', `Bearer ${config.token}`)
  if (!config.useProjectHostname && config.projectId) {
    headers.set('X-Sanity-Project-ID', config.projectId)
  }

  const response = await fetch(url, {
    credentials: config.withCredentials ? 'include' : undefined,
    headers,
    signal,
  })
  if (!response.ok) throw new Error(`Query probe returned HTTP ${response.status}`)

  const body = await response.json()
  const result = typeof body === 'object' && 'result' in body ? body.result : undefined
  return {
    detail: `result: ${String(result)}`,
    shard: response.headers.get('x-sanity-shard') || undefined,
  }
}

function createNonexistentDocumentId(): string {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  return `sanity-studio-diagnostics-${randomPart}`
}

function getBrowserDiagnostics(): StudioDiagnostics['browser'] {
  if (typeof navigator === 'undefined') return {}

  const extendedNavigator = navigator as ExtendedNavigator
  const connection = extendedNavigator.connection

  return {
    colorDepth: typeof screen === 'undefined' ? undefined : screen.colorDepth,
    connection: connection
      ? {
          downlinkMbps: connection.downlink,
          effectiveType: connection.effectiveType,
          roundtripTimeMs: connection.rtt,
          saveData: connection.saveData,
        }
      : undefined,
    cookieEnabled: navigator.cookieEnabled,
    deviceMemoryGb: extendedNavigator.deviceMemory,
    devicePixelRatio: typeof window === 'undefined' ? undefined : window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency,
    language: navigator.language,
    languages: navigator.languages,
    localStorage: checkLocalStorage(),
    maxTouchPoints: navigator.maxTouchPoints,
    online: navigator.onLine,
    screen:
      typeof screen === 'undefined'
        ? undefined
        : {
            availableHeight: screen.availHeight,
            availableWidth: screen.availWidth,
            height: screen.height,
            width: screen.width,
          },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
    viewport:
      typeof window === 'undefined'
        ? undefined
        : {height: window.innerHeight, width: window.innerWidth},
  }
}

function checkLocalStorage(): NonNullable<StudioDiagnostics['browser']['localStorage']> {
  if (typeof window === 'undefined') return {status: 'unsupported'}

  const key = `__sanity_studio_diagnostics_${Date.now()}_${Math.random()}`
  const value = 'available'

  try {
    const storage = window.localStorage
    storage.setItem(key, value)
    if (storage.getItem(key) !== value) {
      throw new Error('The written value could not be read back')
    }
    storage.removeItem(key)
    return {status: 'success'}
  } catch (error) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Ignore cleanup errors. The original failure is more useful to support.
    }
    return {error: formatError(error), status: 'error'}
  }
}

function elapsedSince(start: number): number {
  return Math.round((performance.now() - start) * 100) / 100
}

function formatError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

class DiagnosticsTimeoutError extends Error {
  override name = 'DiagnosticsTimeoutError'
}
