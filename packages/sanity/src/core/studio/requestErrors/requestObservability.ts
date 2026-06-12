import {type HttpRequestEvent, type RequestOptions, type SanityClient} from '@sanity/client'
import {defer, type Observable} from 'rxjs'
import {tap} from 'rxjs/operators'

import {errorReporter} from '../../error/errorReporter'
import {type ConsentStatus, getTelemetryConsent$} from '../telemetry/telemetryConsent'
import {classifyRequestError} from './classify'

/**
 * Latest known consent status per project. Resolved lazily on the first
 * observed request for a project; requests observed while the status is
 * still `'loading'` are simply not recorded (boot noise is skipped rather
 * than queued).
 */
const consentByProject = new Map<string, ConsentStatus>()

function getConsent(client: SanityClient): ConsentStatus {
  const projectId = client.config().projectId ?? '__default'
  let status = consentByProject.get(projectId)
  if (status === undefined) {
    status = 'loading'
    consentByProject.set(projectId, status)
    getTelemetryConsent$(client).subscribe({
      next: (resolved) => consentByProject.set(projectId, resolved),
      // Couldn't resolve consent — treat as denied for this session.
      error: () => consentByProject.set(projectId, 'denied'),
    })
  }
  return status
}

function record(
  client: SanityClient,
  requestOptions: RequestOptions & {url: string},
  outcome: {startedAt: number; statusCode?: number; error?: unknown},
) {
  if (getConsent(client) !== 'granted') return

  const durationMs = Date.now() - outcome.startedAt
  errorReporter.recordRequest?.({
    url: requestOptions.url,
    method: requestOptions.method ?? 'GET',
    statusCode: outcome.statusCode,
    durationMs,
    failed: outcome.error !== undefined,
  })

  // Only infrastructure-level failures (network / 5xx / 429) are reported
  // as error events — caller-domain errors (validation, permissions, ...)
  // are expected application flow and would drown the signal.
  if (outcome.error !== undefined && classifyRequestError(outcome.error)) {
    errorReporter.reportError(
      outcome.error instanceof Error ? outcome.error : new Error(String(outcome.error)),
    )
  }
}

/**
 * Wrap a request observable with timing + outcome observation, reported
 * to the studio error reporter (Sentry) as breadcrumbs and — for
 * infrastructure-level failures — error events.
 *
 * Observation only: the stream's emissions and errors pass through
 * untouched, so this composes with any error handling strategy (local
 * `catchError`, the request-error channel, or none).
 *
 * Gated on the user's telemetry consent (`/intake/telemetry-status`).
 * The consent probe itself is excluded to avoid recursion.
 *
 * @internal
 */
export function observeRequest<T extends HttpRequestEvent>(
  client: SanityClient,
  requestOptions: RequestOptions & {url: string},
  source: Observable<T>,
): Observable<T> {
  // Don't observe the consent probe itself (recursion), and skip
  // observation entirely outside the browser.
  if (typeof window === 'undefined' || requestOptions.tag?.includes('telemetry-consent')) {
    return source
  }

  return defer(() => {
    const startedAt = Date.now()
    let statusCode: number | undefined
    return source.pipe(
      tap({
        next: (event) => {
          if (event && typeof event === 'object' && event.type === 'response') {
            statusCode = event.statusCode
          }
        },
        error: (error) => record(client, requestOptions, {startedAt, statusCode, error}),
        complete: () => record(client, requestOptions, {startedAt, statusCode}),
      }),
    )
  })
}
