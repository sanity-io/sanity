import {type DiagnosticsFinding, type StudioDiagnostics} from './gatherStudioDiagnostics'

/**
 * A ping normally completes in tens of milliseconds. When it takes longer than this (or times
 * out), the network is treated as stalled for the rest of the run.
 *
 * @internal
 */
export const SLOW_PING_MS = 1_000

/** Browsers allow about this many requests in flight per HTTP/2 or HTTP/3 connection */
const BROWSER_REQUEST_LIMIT = 100

/** Open listeners plus waiting requests at which new requests are likely to queue in the browser */
const REQUEST_LIMIT_REACHED = 90

/** Open listeners plus waiting requests worth a warning */
const REQUEST_LIMIT_NEAR = 60

/** A request in this tab waiting this long for a response is worth pointing out */
const LONG_WAIT_MS = 10_000

/**
 * Turns a diagnostics report into plain conclusions, most severe first. Pure, so viewers can
 * derive findings for reports from studios that didn't include them.
 *
 * @internal
 */
export function getDiagnosticsFindings(diagnostics: StudioDiagnostics): DiagnosticsFinding[] {
  const findings: DiagnosticsFinding[] = []
  const {browser, network} = diagnostics
  const {connections, protocol} = network
  const offline = browser.online === false

  if (offline) {
    findings.push({
      detail:
        'The browser reports that it has no network connection, so requests to Sanity cannot be sent.',
      id: 'browser-offline',
      severity: 'critical',
      title: 'The browser is offline',
    })
  }

  const totals = connections
    ? (connections.tabs?.totals ?? {
        oldestPendingMs: connections.currentTab.oldestPendingMs,
        openStreams: connections.currentTab.openStreams,
        pendingRequests: connections.currentTab.pendingRequests,
        tabs: 1,
      })
    : undefined
  const inFlight = totals ? totals.openStreams + totals.pendingRequests : 0
  const limitReached = inFlight >= REQUEST_LIMIT_REACHED

  if (totals && inFlight >= REQUEST_LIMIT_NEAR) {
    const waiting =
      totals.pendingRequests > 0
        ? ` and ${plural(totals.pendingRequests, 'request')} waiting for a response`
        : ''
    findings.push({
      detail:
        `${describeTabs(totals.tabs)} ${plural(totals.openStreams, 'open listener')}${waiting}. ` +
        `Browsers allow about ${BROWSER_REQUEST_LIMIT} requests in flight per connection, shared by every tab, ` +
        'so new requests wait until one finishes. Closing Studio tabs, especially ones with many live views ' +
        'like lists, boards or open documents, frees up room.',
      id: limitReached ? 'request-limit-reached' : 'request-limit-near',
      severity: limitReached ? 'critical' : 'warning',
      title: limitReached
        ? "The browser's connection to Sanity is full"
        : "Close to the browser's connection limit",
    })
  }

  if (!offline && protocol.status === 'timeout') {
    findings.push({
      detail:
        `The network timing request got no response within ${formatDuration(protocol.durationMs)}, ` +
        'although the browser reports being online. Requests are either stuck in the browser, for example ' +
        'because open tabs hold all of its connections to Sanity, or the network is stalling. ' +
        'The remaining tests used shorter timeouts.',
      id: 'ping-timeout',
      severity: 'critical',
      title: 'Requests to Sanity are stalling',
    })
  } else if (protocol.status === 'success') {
    const stalledMs = protocol.resourceTiming?.stalledMs ?? 0
    const responseMs = protocol.resourceTiming?.requestToFirstByteMs ?? 0

    if (stalledMs >= SLOW_PING_MS) {
      findings.push({
        detail:
          `The network timing request waited ${formatDuration(stalledMs)} in the browser before it was sent. ` +
          "That usually means the browser's connection to Sanity is busy with other requests, often from " +
          'other open tabs.',
        id: 'ping-stalled',
        severity: 'warning',
        title: 'Requests wait in the browser before they are sent',
      })
    } else if (responseMs >= SLOW_PING_MS) {
      findings.push({
        detail:
          `The network timing request took ${formatDuration(responseMs)} to get a response after it was ` +
          'sent, which points to a slow network or a slow API.',
        id: 'ping-slow-response',
        severity: 'warning',
        title: 'Slow responses from the Sanity API',
      })
    } else if (protocol.durationMs >= SLOW_PING_MS) {
      findings.push({
        detail:
          `It took ${formatDuration(protocol.durationMs)}, where it normally takes well under a second, ` +
          'so the remaining tests assumed a stalling network and used shorter timeouts.',
        id: 'ping-slow',
        severity: 'warning',
        title: 'The network timing request was slow',
      })
    }
  }

  const currentTab = connections?.currentTab
  if (
    !limitReached &&
    currentTab?.oldestPendingMs !== undefined &&
    currentTab.oldestPendingMs >= LONG_WAIT_MS
  ) {
    findings.push({
      detail:
        `${plural(currentTab.pendingRequests, 'request')} in this tab ` +
        `${currentTab.pendingRequests === 1 ? 'has' : 'have'} been waiting for a response, ` +
        `the longest for ${formatDuration(currentTab.oldestPendingMs)}.`,
      id: 'requests-waiting',
      severity: 'warning',
      title: 'Requests in this tab are waiting for a response',
    })
  }

  const skippedForTime = [
    network.listen.first,
    network.listen.secondWhileFirstOpen,
    ...network.requests,
  ].filter((probe) => probe.status === 'skipped' && probe.skipReason === 'time-limit').length

  if (skippedForTime > 0) {
    const limit = diagnostics.maxDurationMs
    findings.push({
      detail: `${limit ? `Diagnostics stop after ${formatDuration(limit)}, so ` : ''}${plural(skippedForTime, 'test')} ${skippedForTime === 1 ? 'was' : 'were'} skipped.`,
      id: 'time-limit',
      severity: 'info',
      title: 'Some tests were skipped',
    })
  }

  return findings
}

function describeTabs(tabs: number): string {
  return tabs === 1 ? 'This Studio tab has' : `${tabs} Studio tabs in this browser have`
}

function plural(count: number, noun: string): string {
  return `${count.toLocaleString('en-US')} ${noun}${count === 1 ? '' : 's'}`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  const seconds = Math.round(ms / 100) / 10
  return `${seconds.toLocaleString('en-US')} seconds`
}
