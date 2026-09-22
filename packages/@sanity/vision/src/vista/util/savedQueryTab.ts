import JSON5 from 'json5'

import {API_VERSIONS} from '../../apiVersions'
import {type QueryConfig} from '../../hooks/useSavedQueries'
import {type VistaTab, type VistaTabInit, type VistaTabOptions} from '../store/types'
import {parseQueryUrl} from './parseQueryUrl'

/**
 * Turns a saved query (stored as its query URL) into the fields of a tab. Options the URL does
 * not carry (or carries in an unsupported form) are left to the receiving tab.
 */
export function savedQueryToTabInit(
  saved: QueryConfig,
  datasets: readonly string[],
): VistaTabInit | null {
  const parsed = parseQueryUrl(saved.url, datasets)
  if (!parsed) {
    return null
  }

  const options: Partial<VistaTabOptions> = {}
  if (parsed.dataset) {
    options.dataset = parsed.dataset
  }
  if (parsed.apiVersion) {
    if (API_VERSIONS.includes(parsed.apiVersion)) {
      options.apiVersion = parsed.apiVersion
      options.customApiVersion = false
    } else {
      options.customApiVersion = parsed.apiVersion
    }
  }
  if (parsed.perspective) {
    options.perspective = parsed.perspective
  }

  return {
    title: saved.title,
    query: parsed.query,
    rawParams: parsed.rawParams,
    options,
  }
}

/** Whether a tab already shows the given saved query (same query text and params) */
export function tabMatchesSavedQuery(
  tab: VistaTab,
  saved: QueryConfig,
  datasets: readonly string[],
): boolean {
  const parsed = parseQueryUrl(saved.url, datasets)
  if (!parsed) {
    return false
  }
  return (
    tab.query === parsed.query &&
    normalizeParams(tab.rawParams) === normalizeParams(parsed.rawParams)
  )
}

function normalizeParams(raw: string): string {
  try {
    return JSON.stringify(JSON5.parse(raw))
  } catch {
    return raw.trim()
  }
}
