import {type RouteMatcher} from './createDebugProxy'
import {type ProxyRequest} from './proxy'

/** The request path (without query string), or '' if it can't be parsed. */
function pathOf(req: ProxyRequest): string {
  if (!req.url) {
    return ''
  }
  // req.url is path-relative ("/v1/…"); the base is only needed to parse it.
  return new URL(req.url, 'http://localhost').pathname
}

/** Match requests whose path contains the given substring. */
export function urlIncludes(substring: string): RouteMatcher {
  return (req: ProxyRequest) => pathOf(req).includes(substring)
}

/** Match the Sanity listener (SSE) endpoint. */
export function isListenEndpoint(): RouteMatcher {
  return urlIncludes('/listen')
}

/** Match the get-org-id endpoint (used to look up a project's organization). */
export function isGetOrgIdEndpoint(): RouteMatcher {
  return urlIncludes('get-org-id')
}

/** Combine matchers with logical OR. */
export function anyOf(...matchers: RouteMatcher[]): RouteMatcher {
  return (req) => matchers.some((m) => m(req))
}

/** Combine matchers with logical AND. */
export function allOf(...matchers: RouteMatcher[]): RouteMatcher {
  return (req) => matchers.every((m) => m(req))
}
