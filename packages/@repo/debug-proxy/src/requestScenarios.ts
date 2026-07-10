import {Subscription} from 'rxjs'

import {type ProxyHandler} from './createDebugProxy'
import {writeResponseHead} from './proxy'

/** The 5xx status codes a faulted request is randomly assigned. */
const SERVICE_ERROR_STATUSES = [500, 502, 503, 504] as const

const STATUS_TEXT: Record<number, string> = {
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

/**
 * Wrap a handler so that, with the given probability, a request fails with a
 * synthetic 5xx response instead of being forwarded upstream — simulating an
 * incident where endpoints intermittently return various server errors.
 *
 * Each faulted request independently picks a status at random from
 * {@link SERVICE_ERROR_STATUSES} (500/502/503/504). A short JSON body mirrors
 * the shape of a real Sanity API error so clients parse it the same way. The
 * upstream is never contacted for a faulted request, so this also exercises
 * the "request never reached the backend" case.
 *
 * `probability` is clamped to [0, 1]; 0 forwards everything (a no-op wrapper).
 */
export function intermittentServiceErrors(
  probability: number,
): (handler: ProxyHandler) => ProxyHandler {
  const p = Math.min(1, Math.max(0, probability))
  return (handler) => {
    if (p === 0) {
      return handler
    }
    return (req, res, target) => {
      if (Math.random() >= p) {
        return handler(req, res, target)
      }
      const statusCode =
        SERVICE_ERROR_STATUSES[Math.floor(Math.random() * SERVICE_ERROR_STATUSES.length)]
      const statusText = STATUS_TEXT[statusCode] ?? 'Server Error'
      const body = JSON.stringify({
        error: {
          type: 'serverError',
          statusCode,
          message: `[debug-proxy] simulated ${statusCode} ${statusText}`,
        },
      })
      // Preflight requests must still succeed or the browser blocks the real
      // request before our fault can be observed; only fault actual calls.
      if (req.method === 'OPTIONS') {
        return handler(req, res, target)
      }
      const originHeader = req.headers.origin
      const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader
      const corsHeaders =
        typeof origin === 'string'
          ? {
              'access-control-allow-origin': origin,
              'access-control-allow-credentials': 'true',
              'vary': 'origin',
            }
          : {'access-control-allow-origin': '*'}
      writeResponseHead(res, statusCode, statusText, {
        ...corsHeaders,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      })
      res.end(body)
      // No upstream request was made, so there's nothing to tear down — return
      // an already-empty subscription to satisfy the ProxyHandler signature.
      return Subscription.EMPTY
    }
  }
}
