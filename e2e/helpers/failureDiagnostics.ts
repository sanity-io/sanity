import {type Page, type TestInfo} from '@playwright/test'

/**
 * Per-request budget passed to the studio diagnostics gatherer. The default (10s) makes a
 * fully degraded pass take over a minute; 4s still cleanly separates healthy requests
 * (tens to hundreds of ms) from degraded ones while keeping the worst case inside the
 * capture deadline. True magnitudes of in-test requests are preserved in the report's
 * `network.requestHistory` either way.
 */
const GATHER_REQUEST_TIMEOUT_MS = 4_000
/** How long the page-side capture waits for the studio to install the bridge. */
const BRIDGE_WAIT_MS = 3_000
/** Per-request budget for the plain-fetch fallback probes. */
const FALLBACK_PROBE_TIMEOUT_MS = 5_000
/** Upper bound for the whole capture, enforced from the test runner. */
const CAPTURE_DEADLINE_MS = 35_000
/**
 * Extra time granted to the test so the capture cannot exhaust the shared test/teardown
 * budget and turn an ordinary failure into a teardown timeout.
 */
const CAPTURE_TIMEOUT_EXTENSION_MS = 45_000

interface PageCaptureArgs {
  apiBaseUrl: string
  bridgeWaitMs: number
  dataset: string
  probeTimeoutMs: number
  projectId: string
  requestTimeoutMs: number
}

interface FallbackProbe {
  authenticated: boolean
  durationMs: number
  error?: string
  path: string
  shard?: string
  status?: number
}

interface FallbackReport {
  fallbackVersion: 1
  generatedAt: string
  location: string
  online?: boolean
  probes: FallbackProbe[]
  reason: string
  userAgent?: string
}

type PageCaptureResult = (
  | {kind: 'studio'; diagnostics: unknown}
  | {kind: 'fallback'; report: FallbackReport}
) & {
  /**
   * Text of the studio's request error dialog (`RequestErrorDialog`: rate limited, server
   * error, or network error) when it is showing. The request-timing history only covers
   * `/data/*` traffic, so a 429 on `/users/me` that blocks the whole studio would otherwise
   * leave the capture looking healthy.
   */
  requestErrorDialog?: string
}

/**
 * Runs inside the browser. Prefers the studio diagnostics bridge installed by the
 * `e2e-diagnostics-bridge` plugin (dev/studio-e2e-testing/diagnosticsBridge.tsx), which
 * produces the same report as the help-menu Diagnostics dialog — including the request
 * timing history the studio recorded while the failing test ran. When the bridge never
 * appears (the studio shell did not mount, e.g. because the auth bootstrap request is
 * failing) or the gatherer itself throws, falls back to plain-fetch latency probes so
 * the capture still shows how the API behaves from the browser at failure time.
 */
async function captureInPage(args: PageCaptureArgs): Promise<PageCaptureResult> {
  const {apiBaseUrl, bridgeWaitMs, dataset, probeTimeoutMs, projectId, requestTimeoutMs} = args

  interface DiagnosticsBridge {
    gather: (options?: {requestTimeout?: number}) => Promise<unknown>
  }
  const getBridge = () =>
    (window as Window & {__sanityStudioDiagnostics?: DiagnosticsBridge}).__sanityStudioDiagnostics

  // `RequestErrorDialog` renders with this id; the header fallback covers a ui version
  // that does not forward the id to the DOM.
  function readRequestErrorDialog(): string | undefined {
    const byId = document.getElementById('request-error-dialog')
    const dialog =
      byId ??
      Array.from(document.querySelectorAll('[role="dialog"]')).find((element) =>
        /Too many requests|Server error|Network error/.test(element.textContent ?? ''),
      )
    const text = (dialog instanceof HTMLElement ? dialog.innerText : dialog?.textContent)
      ?.replace(/\s+/g, ' ')
      .trim()
    return text ? text.slice(0, 500) : undefined
  }

  const waitStartedAt = Date.now()
  let bridge = getBridge()
  while (!bridge && Date.now() - waitStartedAt < bridgeWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    bridge = getBridge()
  }

  const requestErrorDialog = readRequestErrorDialog()

  let fallbackReason = `The studio diagnostics bridge did not appear within ${bridgeWaitMs}ms — the studio shell may not have mounted.`
  if (bridge) {
    try {
      return {
        kind: 'studio',
        diagnostics: await bridge.gather({requestTimeout: requestTimeoutMs}),
        requestErrorDialog,
      }
    } catch (error) {
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      fallbackReason = `The studio diagnostics gatherer failed: ${detail}`
    }
  }

  let token: string | undefined
  try {
    const raw = localStorage.getItem(`__studio_auth_token_${projectId}`)
    if (raw) token = (JSON.parse(raw) as {token?: string}).token
  } catch {
    // The probes still measure reachability and latency without credentials.
  }

  async function probe(path: string, useAuth: boolean): Promise<FallbackProbe> {
    const authenticated = useAuth && Boolean(token)
    const startedAt = performance.now()
    const abortController = new AbortController()
    const timer = setTimeout(() => abortController.abort(), probeTimeoutMs)

    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        headers: authenticated ? {Authorization: `Bearer ${token}`} : undefined,
        signal: abortController.signal,
      })
      await response.arrayBuffer()
      return {
        authenticated,
        durationMs: Math.round(performance.now() - startedAt),
        path,
        shard: response.headers.get('x-sanity-shard') ?? undefined,
        status: response.status,
      }
    } catch (error) {
      return {
        authenticated,
        durationMs: Math.round(performance.now() - startedAt),
        error: abortController.signal.aborted
          ? `Timed out after ${probeTimeoutMs}ms`
          : error instanceof Error
            ? `${error.name}: ${error.message}`
            : String(error),
        path,
      }
    } finally {
      clearTimeout(timer)
    }
  }

  const probes: FallbackProbe[] = []
  probes.push(await probe('/v2025-02-19/ping', false))
  probes.push(await probe('/v2025-02-19/users/me', true))
  probes.push(await probe(`/v2025-02-19/data/query/${dataset}?query=1&returnQuery=false`, true))

  return {
    kind: 'fallback',
    report: {
      fallbackVersion: 1,
      generatedAt: new Date().toISOString(),
      location: location.href,
      online: navigator.onLine,
      probes,
      reason: fallbackReason,
      userAgent: navigator.userAgent,
    },
    requestErrorDialog,
  }
}

function resolveDataset(projectName: string): string {
  const browserDataset =
    projectName === 'firefox'
      ? process.env.SANITY_E2E_DATASET_FIREFOX
      : process.env.SANITY_E2E_DATASET_CHROMIUM
  return browserDataset || process.env.SANITY_E2E_DATASET || ''
}

/**
 * Attaches a Studio diagnostics report to every failed or timed-out test attempt so CI
 * artifacts show how the Sanity API behaved from the failing browser — request latency
 * percentiles for the whole session, live latency probes, the API shard, and connection
 * checks. The `studio-diagnostics.json` attachment is the same JSON the Diagnostics
 * dialog's "Copy output" produces, so it can be pasted straight into
 * dev/studio-diagnostics-viewer or shared with the platform team.
 *
 * Capture is strictly best-effort: any error is reported as an attachment instead of
 * masking the test's own failure.
 */
export async function captureStudioDiagnosticsOnFailure(
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  const isUnexpectedFailure =
    (testInfo.status === 'failed' || testInfo.status === 'timedOut') &&
    testInfo.status !== testInfo.expectedStatus
  if (!isUnexpectedFailure) return

  const attachError = async (detail: string) => {
    await testInfo.attach('studio-diagnostics-error.txt', {
      body: detail,
      contentType: 'text/plain',
    })
  }

  try {
    // A test that fails late (or times out) has little of the shared test/teardown budget
    // left; without this the capture would surface as a confusing teardown timeout.
    if (testInfo.timeout > 0) {
      testInfo.setTimeout(testInfo.timeout + CAPTURE_TIMEOUT_EXTENSION_MS)
    }

    if (page.isClosed()) {
      await attachError('The page was already closed; no diagnostics were captured.')
      return
    }

    let deadlineTimer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise<never>((_, reject) => {
      deadlineTimer = setTimeout(
        () => reject(new Error(`Diagnostics capture exceeded ${CAPTURE_DEADLINE_MS}ms`)),
        CAPTURE_DEADLINE_MS,
      )
    })

    const captureArgs: PageCaptureArgs = {
      apiBaseUrl: `https://${process.env.SANITY_E2E_PROJECT_ID}.api.sanity.work`,
      bridgeWaitMs: BRIDGE_WAIT_MS,
      dataset: resolveDataset(testInfo.project.name),
      probeTimeoutMs: FALLBACK_PROBE_TIMEOUT_MS,
      projectId: process.env.SANITY_E2E_PROJECT_ID || '',
      requestTimeoutMs: GATHER_REQUEST_TIMEOUT_MS,
    }

    try {
      const result = await Promise.race([page.evaluate(captureInPage, captureArgs), deadline])

      if (result.kind === 'studio') {
        await testInfo.attach('studio-diagnostics.json', {
          body: JSON.stringify(result.diagnostics, null, 2),
          contentType: 'application/json',
        })
      } else {
        await testInfo.attach('studio-diagnostics-fallback.json', {
          body: JSON.stringify(result.report, null, 2),
          contentType: 'application/json',
        })
      }
      if (result.requestErrorDialog) {
        await testInfo.attach('studio-request-error.txt', {
          body: result.requestErrorDialog,
          contentType: 'text/plain',
        })
      }
    } finally {
      clearTimeout(deadlineTimer)
    }
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    try {
      await attachError(`Could not capture studio diagnostics: ${detail}`)
    } catch {
      // The attachment itself failed — never let diagnostics capture fail the teardown.
    }
  }
}
