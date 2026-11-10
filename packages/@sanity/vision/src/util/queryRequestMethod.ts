import {encodeQueryString} from './encodeQueryString'

/**
 * `@sanity/client` sends a query as `GET`, with the query and its params in the URL's search
 * params, unless that encoded string is this long or longer: then it sends `POST` with
 * `{query, params}` as a JSON body and only the options (perspective, variant, tag, ...) in
 * the URL. The number is the client's `getQuerySizeLimit` (`src/data/dataMethods.ts`,
 * `_dataRequestOptions`: `useGet = strQuery.length < getQuerySizeLimit`), which is tagged
 * `@internal` and not exported from the package, so Vision keeps it here. `queryNetwork.test.ts`
 * checks it against the installed client at the boundary.
 */
export const QUERY_URL_SIZE_LIMIT = 11264

export type QueryRequestMethod = 'GET' | 'POST'

/**
 * The length of the string the client measures: `?query=…&$param=…` with the params as JSON,
 * encoded by `URLSearchParams` (so a space counts one character, as `+`), without any option.
 * In UTF-16 code units, as the client's `.length` counts it.
 */
export function encodedQuerySize(query: string, params: Record<string, unknown>): number {
  return encodeQueryString(query, params).length
}

/** The method `@sanity/client` sends a query with, by the rule above */
export function queryRequestMethod(
  query: string,
  params: Record<string, unknown>,
): QueryRequestMethod {
  return encodedQuerySize(query, params) < QUERY_URL_SIZE_LIMIT ? 'GET' : 'POST'
}

/**
 * A query URL's search params split the way the client keeps them apart: the query with its
 * params (`query`, `$name`), which it measures and moves into the body from the limit on, and
 * the options (everything else), which stay in the URL either way
 */
export function splitQuerySearchParams(searchParams: URLSearchParams): {
  query: URLSearchParams
  options: URLSearchParams
} {
  const query = new URLSearchParams()
  const options = new URLSearchParams()
  for (const [key, value] of searchParams) {
    ;(key === 'query' || key.startsWith('$') ? query : options).append(key, value)
  }
  return {query, options}
}

/**
 * `encodedQuerySize` for the query and params a request URL carries (the options left out), for
 * where only the URL of a request is at hand; `0` for text that is not a URL
 */
export function encodedQuerySizeOfUrl(url: string): number {
  let searchParams: URLSearchParams
  try {
    searchParams = new URL(url).searchParams
  } catch {
    return 0
  }
  return `?${splitQuerySearchParams(searchParams).query}`.length
}
