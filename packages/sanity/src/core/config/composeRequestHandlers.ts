import {type RequestHandler} from '@sanity/client'

/**
 * Runs `inner` inside `outer`: `outer` sees every request first and every failure last, after
 * `inner` had its chance to recover. Returns `outer` unchanged without an `inner`.
 *
 * @internal
 */
export function composeRequestHandlers(
  outer: RequestHandler,
  inner: RequestHandler | undefined,
): RequestHandler {
  if (!inner) return outer
  return (request, next) => outer(request, (outerRequest) => inner(outerRequest, next))
}
