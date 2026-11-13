/** Parameters of an authorization response (RFC 6749 section 4.1.2, RFC 9207 `iss`). */
export const OAUTH_RESPONSE_PARAMS = [
  'code',
  'state',
  'error',
  'error_description',
  'error_uri',
  'iss',
]

/**
 * The path to put in the address bar when `location` carries an authorization response, or
 * `undefined` when it doesn't. A response carries a code, or an error and `state`; anything else is
 * an ordinary Studio URL, even one with an unrelated `error` parameter. Only the OAuth parameters
 * go: the rest of the query and the hash stay.
 *
 * A code from someone else's authorization request is redeemable by whoever wrote that request, so
 * every response leaves the URL, whether or not this tab asked for it.
 */
export function pathWithoutAuthorizationResponse(location: {
  pathname: string
  search: string
  hash?: string
}): string | undefined {
  const params = new URLSearchParams(location.search)
  const isAuthorizationResponse = params.has('code') || (params.has('error') && params.has('state'))
  if (!isAuthorizationResponse) return undefined

  for (const name of OAUTH_RESPONSE_PARAMS) params.delete(name)
  const query = params.toString()
  // A path that starts with `//` would name another origin, which `history.replaceState` refuses.
  const pathname = location.pathname.replace(/^\/+/, '/')
  return `${pathname}${query ? `?${query}` : ''}${location.hash ?? ''}`
}

let stashedResponse: URLSearchParams | undefined

/**
 * Takes an authorization response out of the address bar and keeps it for the OAuth store.
 * `ActiveWorkspaceMatcher` calls it in a Studio with an OAuth workspace, before the router reads
 * the URL: the router carries the query into every redirect, and features copy the URL into
 * documents and links. The response may have landed on any workspace, through a redirect relay or
 * a redirect away from a hidden workspace.
 *
 * @internal
 */
export function stashAuthorizationResponse(): void {
  if (typeof window === 'undefined') return
  const cleanPath = pathWithoutAuthorizationResponse(window.location)
  if (cleanPath === undefined) return
  stashedResponse = new URLSearchParams(window.location.search)
  window.history.replaceState(window.history.state, '', cleanPath)
}

/**
 * Keeps a response an OAuth store took out of the URL itself, so that the store whose request it
 * answers can still take it when that is another workspace's store.
 *
 * @internal
 */
export function keepAuthorizationResponse(response: URLSearchParams): void {
  stashedResponse = response
}

/**
 * The stashed response, left in place for the store whose request it answers.
 *
 * @internal
 */
export function peekStashedAuthorizationResponse(): URLSearchParams | undefined {
  return stashedResponse
}

/**
 * The stashed response, once. Only the store whose request it answers takes it.
 *
 * @internal
 */
export function takeStashedAuthorizationResponse(): URLSearchParams | undefined {
  const response = stashedResponse
  stashedResponse = undefined
  return response
}
