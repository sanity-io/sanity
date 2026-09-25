import JSON5 from 'json5'

import {type QueryConfig} from '../../hooks/useSavedQueries'
import {type ParsedQueryUrl, parseQueryUrl} from '../../util/parseQueryUrl'
import {prefixApiVersion} from '../../util/prefixApiVersion'
import {type VistaTab, type VistaTabInit, type VistaTabOptions} from '../store/types'

/**
 * The fields of a tab for a parsed query URL (a saved query or a paste). Options the URL does not
 * carry (or carries in an unsupported form) are left to the receiving tab.
 */
export function parsedQueryToTabInit(parsed: ParsedQueryUrl): VistaTabInit {
  const options: Partial<VistaTabOptions> = {}
  if (parsed.dataset) {
    options.dataset = parsed.dataset
  }
  if (parsed.apiVersion) {
    options.apiVersion = parsed.apiVersion
  }
  if (parsed.perspective) {
    options.perspective = parsed.perspective
  }

  return {query: parsed.query, rawParams: parsed.rawParams, options}
}

/** Like `parsedQueryToTabInit`, also applying the saved query's title (clearing a stale one) */
export function savedQueryToTabInit(saved: QueryConfig, parsed: ParsedQueryUrl): VistaTabInit {
  return {...parsedQueryToTabInit(parsed), title: saved.title}
}

/** Whether a tab already shows the given saved query (same query, params and options) */
export function tabMatchesSavedQuery(
  tab: VistaTab,
  saved: QueryConfig,
  datasets: readonly string[],
): boolean {
  const parsed = parseQueryUrl(saved.url, datasets)
  return parsed !== null && tabMatchesParsedQuery(tab, parsed)
}

/**
 * Same as `tabMatchesSavedQuery`, for callers that already parsed the saved query's URL. Options
 * the URL does not carry are left to the receiving tab (see `parsedQueryToTabInit`), so they take
 * no part in the match.
 */
export function tabMatchesParsedQuery(tab: VistaTab, parsed: ParsedQueryUrl): boolean {
  return (
    tab.query === parsed.query &&
    normalizeParams(tab.rawParams) === normalizeParams(parsed.rawParams) &&
    (parsed.dataset === undefined || parsed.dataset === tab.options.dataset) &&
    (parsed.apiVersion === undefined ||
      prefixApiVersion(parsed.apiVersion) === prefixApiVersion(tab.options.apiVersion)) &&
    (parsed.perspective === undefined || parsed.perspective === tab.options.perspective)
  )
}

function normalizeParams(raw: string): string {
  try {
    return JSON.stringify(JSON5.parse(raw))
  } catch {
    return raw.trim()
  }
}
