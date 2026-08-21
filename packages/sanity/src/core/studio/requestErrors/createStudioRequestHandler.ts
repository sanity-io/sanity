import {type RequestHandler, type RequestHandlerOptions, type SanityClient} from '@sanity/client'

import {type RequestFailureDiagnostics} from '../../store/authStore/createAuthStore'
import {getRequestBucket, type RequestPerformanceTracker} from '../diagnostics/requestPerformance'
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
  return (request, next) => {
    const execute = async (): Promise<unknown> => {
      const requestMeasurement = startRequestMeasurement(request, requestPerformance, getClient)

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
  getClient: (() => SanityClient) | undefined,
): {complete: (status: 'success' | 'error' | 'aborted') => void} | undefined {
  if (!tracker || !getClient) return undefined

  const classification = getRequestBucket(request.url)
  if (!classification) return undefined

  const {dataset, projectId} = getClient().config()
  if (!dataset || !projectId) return undefined

  const startedAt = new Date()
  const startedAtMeasurement = performance.now()

  return {
    complete: (status) => {
      tracker.record({
        ...classification,
        dataset,
        durationMs: Math.round((performance.now() - startedAtMeasurement) * 100) / 100,
        projectId,
        startedAt: startedAt.toISOString(),
        status,
      })
    },
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  )
}
