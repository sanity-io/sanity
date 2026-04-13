import {type CDPSession, type Page, type Request, type Response} from 'playwright'

import {type RequestEntry, type ResourceMetrics} from './types'

interface CollectOptions {
  page: Page
  /** URL to navigate to */
  url: string
  /** Called when the page should be considered "ready" for measurement */
  waitForReady: (page: Page) => Promise<void>
}

interface CollectResult {
  metrics: ResourceMetrics
  requests: RequestEntry[]
}

export async function collectMetrics({
  page,
  url,
  waitForReady,
}: CollectOptions): Promise<CollectResult> {
  // Use a Map keyed by Request object reference to reliably match requests to responses,
  // even when the same URL appears multiple times (parallel requests, retries).
  const requestMap = new Map<Request, RequestEntry>()

  page.on('request', (request: Request) => {
    requestMap.set(request, {
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      responseStatus: 0,
      transferSize: 0,
    })
  })

  page.on('response', (response: Response) => {
    const entry = requestMap.get(response.request())
    if (entry) {
      entry.responseStatus = response.status()
      // Use Content-Length header for wire size. response.body() returns the
      // decompressed buffer which over-reports for gzip/brotli-compressed assets.
      const contentLength = response.headers()['content-length']
      entry.transferSize = contentLength ? parseInt(contentLength, 10) : 0
    }
  })

  // Navigate to the URL
  await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 60_000})

  // Wait for the scenario-specific readiness condition
  await waitForReady(page)

  // Open a Chrome DevTools Protocol (CDP) session to access browser internals
  // that aren't available through regular web APIs. This is the same protocol
  // that Chrome DevTools uses — Playwright exposes it programmatically.
  // See: https://chromedevtools.github.io/devtools-protocol/
  const cdp = await page.context().newCDPSession(page)

  // Query DOM node count, event listener count, and other browser-level metrics
  const perfMetrics = await getCdpPerformanceMetrics(cdp)

  // Force garbage collection, then measure how much memory the app is retaining
  const heapUsed = await getHeapAfterGC(cdp)

  await cdp.detach()

  const requests = [...requestMap.values()]

  return {
    metrics: {
      httpRequestCount: requests.length,
      httpTransferBytes: requests.reduce((sum, r) => sum + r.transferSize, 0),
      domNodeCount: perfMetrics.Nodes,
      jsEventListenerCount: perfMetrics.JSEventListeners,
      jsHeapUsedBytes: heapUsed,
    },
    requests,
  }
}

/**
 * Uses the CDP Performance domain to read browser-level counters.
 * Returns a map of metric names to values, e.g. { Nodes: 1234, JSEventListeners: 56 }.
 * Full list of available metrics: https://chromedevtools.github.io/devtools-protocol/tot/Performance/#method-getMetrics
 */
async function getCdpPerformanceMetrics(cdp: CDPSession): Promise<Record<string, number>> {
  await cdp.send('Performance.enable')
  const {metrics} = await cdp.send('Performance.getMetrics')
  await cdp.send('Performance.disable')

  const result: Record<string, number> = {}
  for (const {name, value} of metrics) {
    result[name] = value
  }
  return result
}

/**
 * Forces V8 to run garbage collection, then reads the heap size.
 * This gives us the "retained" memory — what the app is actually holding onto,
 * excluding garbage that would be collected eventually. Without forcing GC first,
 * heap measurements can vary by 2x+ between runs depending on when GC last ran.
 */
async function getHeapAfterGC(cdp: CDPSession): Promise<number> {
  await cdp.send('HeapProfiler.collectGarbage')
  // Small delay to let GC complete
  await new Promise((resolve) => setTimeout(resolve, 100))
  const {usedSize} = await cdp.send('Runtime.getHeapUsage')
  return usedSize
}
