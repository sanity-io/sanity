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
import {type SchemaDiagnostics} from './getStudioConfigurationDiagnostics'
import {getStylesDiagnostics, type StylesDiagnostics} from './getStylesDiagnostics'
import {
  DEFAULT_REQUEST_PERFORMANCE_CAPACITY,
  type RequestPerformanceSnapshot,
  type RequestPerformanceTracker,
} from './requestPerformance'

const DEFAULT_REQUEST_TIMEOUT = 10_000
/** @internal */
export interface StudioDiagnosticsOptions {
  client: SanityClient
  getRequestHistory?: RequestPerformanceTracker['getSnapshot']
  requestTimeout?: number
  schema: SchemaDiagnostics
  studio: {
    basePath?: string
    dataset: string
    projectId: string
    /** Undefined when the Studio was mounted without `renderStudio` */
    reactStrictMode?: boolean
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
export interface ListenDiagnostic {
  durationMs: number
  error?: string
  openMs?: number
  path: '/listen?query=*'
  status: 'success' | 'timeout' | 'error'
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
  status: 'success' | 'timeout' | 'error'
  timedOut: boolean
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
  generatedAt: string
  network: {
    geoIpCountry?: string | null
    listen: {
      first: ListenDiagnostic
      secondWhileFirstOpen: ListenDiagnostic
    }
    protocol: ApiNetworkDiagnostic
    requestHistory: RequestPerformanceSnapshot
    requests: RequestDiagnostic[]
    shard?: string
  }
  schema: SchemaDiagnostics
  startedAt: string
  studio: StudioDiagnosticsOptions['studio'] & {
    apiHost?: string
    /**
     * Whether a `sanity` entry exists in an import map, the auto-updating studio signal. Always
     * set by {@link gatherStudioDiagnostics}; optional only because reports from older studios
     * lack it.
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
  getRequestHistory,
  requestTimeout = DEFAULT_REQUEST_TIMEOUT,
  schema,
  studio,
  user,
}: StudioDiagnosticsOptions): Promise<StudioDiagnostics> {
  const startedAt = new Date()
  const startedAtMeasurement = performance.now()
  const diagnosticClient = client.withConfig({maxRetries: 0, useCdn: false})
  const requestTarget = {dataset: studio.dataset, projectId: studio.projectId}
  const requestHistoryBeforeDiagnostics =
    getRequestHistory?.(requestTarget) ?? createEmptyRequestHistory(requestTarget, startedAt)
  const protocol = await firstValueFrom(getApiNetworkDiagnostic(diagnosticClient))
  const listen = await runListenDiagnostics(diagnosticClient, requestTimeout)
  const {geoIpCountry, requests} = await runRequestDiagnostics(diagnosticClient, requestTimeout)
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

  return {
    browser,
    diagnosticVersion: 1,
    durationMs: elapsedSince(startedAtMeasurement),
    generatedAt: generatedAt.toISOString(),
    network: {geoIpCountry, listen, protocol, requestHistory, requests, shard},
    schema,
    startedAt: startedAt.toISOString(),
    studio: {
      ...studio,
      apiHost: clientConfig.apiHost,
      autoUpdates: hasSanityPackageInImportMap(),
      location: typeof location === 'undefined' ? undefined : location.href,
    },
    styles: getStylesDiagnostics(),
    user: {
      id: user?.id,
      provider: user?.provider,
      roles: user?.roles.map(({name, title}) => ({name, title})) ?? [],
    },
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
): Promise<StudioDiagnostics['network']['listen']> {
  const first = startListenDiagnostic(client, timeoutMs)

  try {
    const firstResult = await first.result
    const second = startListenDiagnostic(client, timeoutMs)

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

async function runRequestDiagnostics(
  client: SanityClient,
  timeoutMs: number,
): Promise<{geoIpCountry?: string | null; requests: RequestDiagnostic[]}> {
  const requests: RequestDiagnostic[] = []
  const credentiallessClient = client.withConfig({token: undefined, withCredentials: false})
  let geoIpCountry: string | null | undefined

  requests.push(
    await measureRequest('/ping', timeoutMs, async (signal) => {
      await credentiallessClient.request({
        maxRetries: 0,
        signal,
        tag: 'diagnostics.ping',
        timeout: timeoutMs,
        url: '/ping',
      })
      return {detail: 'API reached'}
    }),
  )

  requests.push(
    await measureRequest('/geoip/country', timeoutMs, async (signal) => {
      const result = await credentiallessClient.request<{isoCode: string | null}>({
        maxRetries: 0,
        signal,
        tag: 'diagnostics.geoip-country',
        timeout: timeoutMs,
        url: '/geoip/country',
      })
      geoIpCountry = typeof result.isoCode === 'string' ? result.isoCode : null
      return {detail: geoIpCountry ?? 'country could not be resolved'}
    }),
  )

  requests.push(
    await measureRequest('/query?query=1', timeoutMs, (signal) =>
      requestConstantQuery(client, signal),
    ),
  )

  requests.push(
    await measureRequest('/query?query=*[0]._id', timeoutMs, async (signal) => {
      const result = await client.fetch<string | null>(
        '*[0]._id',
        {},
        {
          signal,
          stega: false,
          tag: 'diagnostics.query-document',
          timeout: timeoutMs,
          useCdn: false,
        },
      )
      return {detail: result ? 'document ID received' : 'dataset contains no documents'}
    }),
  )

  requests.push(
    await measureRequest('/doc/<random-nonexistent-id>', timeoutMs, async (signal) => {
      const result = await client.getDocument(createNonexistentDocumentId(), {
        signal,
        tag: 'diagnostics.document',
      })
      return {
        detail: result ? 'unexpected document returned' : 'document not found (as expected)',
      }
    }),
  )

  return {geoIpCountry, requests}
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
