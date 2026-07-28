import {type Browser, type BrowserContext, chromium, type CDPSession, type Page} from 'playwright'

import {type BenchSide, EXPERIMENT, FAKE_TOKEN, REFERENCE} from '../constants'
import {TINY_PNG_BASE64} from '../scenarios/fixtures/assets'

const TINY_PNG = Buffer.from(TINY_PNG_BASE64, 'base64')

/**
 * External hosts the studio contacts that are irrelevant to the benchmark —
 * aborted without failing the session. Everything else non-local is a
 * hermeticity violation and fails the session loudly.
 */
const SILENCED_EXTERNAL = [
  'studio-static.sanity.io', // Inter webfonts — consistent fallback on both sides
  'telemetry.sanity.io',
]

/**
 * The only legitimate real-API traffic: telemetry/error tunnels hardcoded to
 * `https://api.sanity.io/vX/intake/…` (feedbackClient.ts,
 * sentryErrorReporter.ts). Anything else on api.sanity.io means the studio
 * bypassed the mock apiHost — that must fail the session as a hermeticity
 * violation, not silently measure a studio doing less work than production.
 */
const API_INTAKE_PATH = /^\/v[^/]+\/intake\//

export function launchBrowser(headless: boolean, certSpki?: string): Promise<Browser> {
  return chromium.launch({
    headless,
    // Treat the bench's self-signed cert as valid (see mock-api/tls.ts
    // spkiFingerprint — required for HTTP caching on warm loads)
    args: certSpki ? [`--ignore-certificate-errors-spki-list=${certSpki}`] : [],
  })
}

export interface SessionContext {
  context: BrowserContext
  page: Page
  cdp: CDPSession
  /** Non-allowlisted external requests observed (session must fail if any). */
  violations: string[]
  consoleErrors: string[]
  pageErrors: string[]
  /** 4xx/5xx responses seen — diagnostics for failures, not triggers. */
  httpErrors: string[]
}

export async function createSessionContext(
  browser: Browser,
  side: BenchSide,
  studioUrl: string,
  options: {cpuThrottleRate?: number} = {},
): Promise<SessionContext> {
  const context = await browser.newContext({
    // No ignoreHTTPSErrors here: the bench cert is made *valid* via the
    // SPKI allowlist launch flag (launchBrowser) — a bypassed-but-broken
    // cert would disable the browser HTTP cache and break warm loads
    storageState: {
      cookies: [],
      origins: [
        {
          origin: studioUrl,
          // Seed tokens for both project ids: the served dist's baked
          // projectId decides which one it reads, and both sides must use
          // the same (token) auth path for a symmetric comparison
          localStorage: [EXPERIMENT.projectId, REFERENCE.projectId].map((projectId) => ({
            name: `__studio_auth_token_${projectId}`,
            value: JSON.stringify({token: FAKE_TOKEN, time: new Date().toISOString()}),
          })),
        },
      ],
    },
  })

  const violations: string[] = []

  // Hermeticity guard: everything the page needs lives on localhost. Known
  // externals are silenced (aborted, not failed); anything else aborts AND
  // fails the session — environment drift must be loud (README: flake
  // resistance). The route pattern deliberately matches only NON-local
  // URLs: Playwright-routed requests bypass the browser HTTP cache and pay
  // an interception round-trip, which would break warm-load measurements
  // and add noise to every measured request.
  await context.route(
    /^https?:\/\/(?!localhost[:/]|127\.0\.0\.1[:/]|[^/]*\.localhost[:/])/,
    (route) => {
      const url = new URL(route.request().url())
      const host = url.hostname
      // Module version check (packageVersionStatus/fetchLatestVersions.ts):
      // answer "you're up to date" by echoing the minVersion from the URL
      // (`/modules/sanity/latest/^6.3.0/t…`) — works unmodified for both A/B
      // sides even when their versions differ, and an aborted request here
      // would log a console error and fail the session.
      if (host.endsWith('sanity-cdn.com') || host.endsWith('sanity-cdn.work')) {
        const modulePath = decodeURIComponent(url.pathname)
        const versionMatch = modulePath.match(/\^([0-9]+\.[0-9]+\.[0-9]+[^/]*)/)
        if (modulePath.includes('/modules/') && versionMatch) {
          const version = versionMatch[1]
          return route.fulfill({
            contentType: 'application/json',
            json: {latest: version, packageVersion: version},
          })
        }
        return route.abort('blockedbyclient')
      }
      // Scenario fixtures reference cdn.sanity.io asset URLs (see
      // scenarios/fixtures/assets.ts) — fulfill images with constant bytes
      // regardless of crop/size params. Deterministic, no network.
      if (host === 'cdn.sanity.io' && url.pathname.startsWith('/images/')) {
        return route.fulfill({contentType: 'image/png', body: TINY_PNG})
      }
      // Real-API host: silence only the telemetry intake tunnels; any other
      // request here is a mock bypass and fails the session (see
      // API_INTAKE_PATH) — it falls through to the violation branch below
      if (
        (host === 'api.sanity.io' || host.endsWith('.api.sanity.io')) &&
        API_INTAKE_PATH.test(url.pathname)
      ) {
        return route.abort('blockedbyclient')
      }
      if (SILENCED_EXTERNAL.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
        return route.abort('blockedbyclient')
      }
      violations.push(`${route.request().method()} ${url.href}`)
      return route.abort('blockedbyclient')
    },
  )

  const attached = await attachPage(context, options)
  return {context, violations, ...attached}
}

export interface AttachedPage {
  page: Page
  cdp: CDPSession
  consoleErrors: string[]
  pageErrors: string[]
  /** 4xx/5xx responses seen — diagnostics for failures, not triggers. */
  httpErrors: string[]
}

/**
 * Open and instrument a page in an existing session context — its own error
 * collectors and CDP session (CPU/network emulation is per-page). Used
 * directly by pageLoad's warm sample, which needs a second page so the cold
 * page's teardown aborts don't pollute the measurement.
 */
export async function attachPage(
  context: BrowserContext,
  options: {cpuThrottleRate?: number} = {},
): Promise<AttachedPage> {
  const page = await context.newPage()

  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text()
      // Resource-load failures for requests *we* aborted are expected noise
      if (text.startsWith('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT')) return
      // Initial-value template resolution has an internal timeout the studio
      // can exceed while booting a heavy document on a slow throttled host
      // (seen with syntheticLarge on CI). The document under test is seeded,
      // so the fallback is inconsequential — a load symptom, not mock drift.
      if (text.startsWith('Failed to resolve initial value')) return
      const location = message.location()
      consoleErrors.push(location.url ? `${text} (at ${location.url})` : text)
    }
  })
  // Failed responses are diagnostics (attached to session failures), not
  // failure triggers — the mock's ledger decides what counts as unexpected
  const httpErrors: string[] = []
  page.on('response', (response) => {
    if (response.status() >= 400) {
      httpErrors.push(`HTTP ${response.status()} ${response.request().method()} ${response.url()}`)
    }
  })
  page.on('pageerror', (error) => pageErrors.push(String(error)))

  const cdp = await context.newCDPSession(page)
  if (options.cpuThrottleRate && options.cpuThrottleRate > 1) {
    await cdp.send('Emulation.setCPUThrottlingRate', {rate: options.cpuThrottleRate})
  }

  return {page, cdp, consoleErrors, pageErrors, httpErrors}
}

/**
 * Fixed-work microbenchmark run once per bench invocation (unthrottled) —
 * the host-speed calibration score recorded in every report. CDP CPU
 * throttling is *relative* to host speed, so absolute numbers are only
 * comparable across runs via this score (see README: measurement decisions).
 * Higher = slower host.
 */
export async function calibrateHost(browser: Browser): Promise<number> {
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    // Median of 5 runs of a fixed integer-hash loop
    return await page.evaluate(() => {
      const runs: number[] = []
      for (let run = 0; run < 5; run++) {
        const start = performance.now()
        let hash = 2166136261
        for (let i = 0; i < 5_000_000; i++) {
          hash ^= i
          hash = Math.imul(hash, 16777619)
        }
        // Prevent dead-code elimination
        if (hash === 0) throw new Error('unreachable')
        runs.push(performance.now() - start)
      }
      runs.sort((a, b) => a - b)
      return runs[2]
    })
  } finally {
    await context.close()
  }
}
