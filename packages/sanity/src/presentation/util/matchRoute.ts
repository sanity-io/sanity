import {parseRoutePattern, type RoutePatternGroup} from './parseRoutePattern'

/**
 * The shape `path-to-regexp`'s `match()` returns, and the shape Presentation's `getRouteContext`
 * consumes. Repeated groups come back as arrays, exactly as path-to-regexp v6 and v8 return them.
 *
 * @internal
 */
export interface RouteMatch {
  path: string
  params: Record<string, string | string[]>
}

/** @internal */
export interface RouteMatcherOptions {
  /**
   * Match case-insensitively, mirroring path-to-regexp's `sensitive: false` default.
   *
   * @defaultValue true
   */
  ignoreCase?: boolean
  /**
   * Accept an optional trailing slash, mirroring path-to-regexp's `strict: false` default.
   *
   * @defaultValue true
   */
  trailingSlash?: boolean
  /**
   * Accept path-to-regexp v8 wildcards (`*name`) alongside v6 syntax.
   *
   * @defaultValue true
   */
  rewriteLegacyWildcards?: boolean
}

/** @internal */
export type RouteMatcher = (pathname: string) => RouteMatch | undefined

/**
 * `path-to-regexp` v6 decoded params with `decodeURIComponent` and let it throw on malformed input.
 * URLPattern hands back the raw, percent-encoded group, so decode it here — but keep the raw value
 * when it is not a valid encoding, so one stray `%` in a URL cannot take the whole tool down.
 */
function decode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function readParam(group: RoutePatternGroup, raw: string): string | string[] | undefined {
  if (!group.repeat) return decode(raw)
  // path-to-regexp omits a repeated param that matched nothing, and v8's `*name` requires at least
  // one segment, so an empty wildcard is not a match at all.
  if (raw === '') return undefined
  return raw.split(group.separator).map(decode)
}

/**
 * Compiles a route pattern into a matcher with the same observable behaviour as
 * `match(pattern, {decode: decodeURIComponent})` from path-to-regexp v6, but backed by URLPattern.
 *
 * Throws when the pattern is not valid URLPattern pathname syntax. `URLPattern` must be available
 * (natively or through `urlpattern-polyfill`) by the time this is called.
 *
 * @internal
 */
export function createRouteMatcher(
  pattern: string,
  options: RouteMatcherOptions = {},
): RouteMatcher {
  const {ignoreCase = true, trailingSlash = true, rewriteLegacyWildcards = true} = options
  const parsed = parseRoutePattern(pattern, {rewriteLegacyWildcards})
  // path-to-regexp's `strict: false` appends `(?:\/)?` to the generated regexp; `{/}?` is the
  // URLPattern spelling of the same thing, and adds no capturing group.
  const pathname = trailingSlash ? `${parsed.pathname}{/}?` : parsed.pathname
  const urlPattern = new URLPattern({pathname}, {ignoreCase})

  return function matchRoute(input: string): RouteMatch | undefined {
    const result = urlPattern.exec({pathname: input})
    if (!result) return undefined

    const {groups} = result.pathname
    const params: Record<string, string | string[]> = {}
    // Build params in pattern order: URLPattern implementations do not agree on the key order of
    // `groups`, and Presentation forwards these straight into a GROQ query.
    for (const group of parsed.groups) {
      const raw = groups[group.name]
      // An optional group that did not participate in the match is `undefined` in URLPattern and
      // absent in path-to-regexp.
      if (raw === undefined) continue
      const param = readParam(group, raw)
      if (param === undefined) {
        if (group.legacyWildcard) return undefined
        continue
      }
      params[group.name] = param
    }

    return {path: input, params}
  }
}
