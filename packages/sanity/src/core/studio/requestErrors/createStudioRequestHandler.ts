import {type RequestHandler, type RequestHandlerOptions, type SanityClient} from '@sanity/client'

import {type RequestFailureDiagnostics} from '../../store/authStore/createAuthStore'
import {
  getRequestBucket,
  studioRequestPerformance,
  type RequestPerformanceTracker,
} from '../diagnostics/requestPerformance'
import {isInvalidSessionError} from './classify'
import {type RequestErrorChannel} from './types'

interface StudioRequestHandlerOptions {
  channel: RequestErrorChannel
  diagnostics?: RequestFailureDiagnostics
  getClient?: () => SanityClient
  requestPerformance?: RequestPerformanceTracker
  waitForCorsRetry?: () => Promise<void>
}

/**
 * Handles the request failures that prevent the Studio itself from operating:
 * invalid sessions, invalid project or dataset configuration, and CORS
 * misconfiguration. All other failures remain the caller's responsibility.
 *
 * @internal
 */
export function createStudioRequestHandler({
  channel,
  diagnostics,
  getClient,
  requestPerformance,
  waitForCorsRetry,
}: StudioRequestHandlerOptions): RequestHandler {
  const performanceTracker =
    requestPerformance ?? (getClient ? studioRequestPerformance : undefined)

  return (request, next) => {
    const execute = async (): Promise<unknown> => {
      const requestMeasurement = startRequestMeasurement(request, performanceTracker)

      try {
        const result = await next(request)
        requestMeasurement?.complete('success')
        return result
      } catch (error) {
        const aborted = isAbortError(error)
        requestMeasurement?.complete(aborted ? 'aborted' : 'error')

        // Cancellation is expected request lifecycle behavior. Preserve it for
        // the caller without running the Studio's failure diagnostics.
        if (aborted) throw error

        if (isInvalidSessionError(error)) {
          return channel.handle(error)
        }

        if (diagnostics && getClient) {
          const client = getClient()
          const result = await diagnostics.diagnose(error, client)
          if (result.type !== 'unknown') {
            diagnostics.onRequestFailure(result, client)
            if (result.type === 'cors' && waitForCorsRetry) {
              await waitForCorsRetry()
              return execute()
            }
            return new Promise<never>(() => {})
          }
        }

        throw error
      }
    }

    return execute()
  }
}

function startRequestMeasurement(
  request: RequestHandlerOptions,
  tracker: RequestPerformanceTracker | undefined,
): {complete: (status: 'success' | 'error' | 'aborted') => void} | undefined {
  if (!tracker) return undefined
  if (isDiagnosticsRequest(request)) return undefined

  const classification = getRequestBucket(request.url)
  if (!classification) return undefined

  const projectId = getRequestProjectId(request)
  if (!projectId) return undefined

  const startedAt = new Date()
  const startedAtMeasurement = performance.now()

  return {
    complete: (status) => {
      tracker.record({
        ...classification,
        durationMs: Math.round((performance.now() - startedAtMeasurement) * 100) / 100,
        projectId,
        startedAt: startedAt.toISOString(),
        status,
      })
    },
  }
}

function getRequestProjectId(request: RequestHandlerOptions): string | undefined {
  const projectIdHeader = new Headers(request.headers).get('x-sanity-project-id')
  if (projectIdHeader) return projectIdHeader

  try {
    return new URL(request.url).hostname.split('.')[0] || undefined
  } catch {
    return undefined
  }
}

function isDiagnosticsRequest(request: RequestHandlerOptions): boolean {
  const query = request.query as unknown
  const queryTag =
    query instanceof URLSearchParams
      ? query.get('tag')
      : typeof query === 'object' && query !== null && 'tag' in query
        ? (query as {tag?: unknown}).tag
        : undefined

  if (typeof queryTag === 'string') return /(^|\.)diagnostics(\.|$)/.test(queryTag)

  try {
    const tag = new URL(request.url).searchParams.get('tag')
    return Boolean(tag && /(^|\.)diagnostics(\.|$)/.test(tag))
  } catch {
    return false
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  )
}
