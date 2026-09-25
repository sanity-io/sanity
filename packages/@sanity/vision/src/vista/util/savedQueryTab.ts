import {dequal} from 'dequal/lite'
import JSON5 from 'json5'

import {type QueryConfig} from '../../hooks/useSavedQueries'
import {type ParsedQueryUrl, parseQueryUrl} from '../../util/parseQueryUrl'
import {prefixApiVersion} from '../../util/prefixApiVersion'
import {type VistaTab, type VistaTabInit, type VistaTabOptions} from '../store/types'
import {getTabDataset} from './tabDataset'

/**
 * The fields of a tab for a parsed query URL (a saved query or a paste). Options the URL does not
 * carry (or carries in an unsupported form) are left to the receiving tab.
 */
export function parsedQueryToTabInit(parsed: ParsedQueryUrl): VistaTabInit {
  const options: Partial<VistaTabOptions> = {}
  if (parsed.dataset) {
    // A URL names its dataset, so the tab stops following the workspace's
    options.datasetMode = 'pinned'
    options.dataset = parsed.dataset
  }
  if (parsed.apiVersion) {
    options.apiVersion = parsed.apiVersion
  }
  if (parsed.perspective) {
    options.perspective = parsed.perspective === 'pinnedRelease' ? 'global' : parsed.perspective
  }

  return {query: parsed.query, rawParams: parsed.rawParams, options}
}

/** Like `parsedQueryToTabInit`, also applying the saved query's title (clearing a stale one) */
export function savedQueryToTabInit(saved: QueryConfig, parsed: ParsedQueryUrl): VistaTabInit {
  return {...parsedQueryToTabInit(parsed), title: saved.title}
}

/**
 * Whether a tab already shows the given saved query: same query text and params, and the same
 * dataset, API version and perspective wherever the saved URL states them. `workspaceDataset` is
 * what a tab following the workspace queries.
 */
export function tabMatchesSavedQuery(
  tab: VistaTab,
  saved: QueryConfig,
  datasets: readonly string[],
  workspaceDataset: string,
): boolean {
  const parsed = parseQueryUrl(saved.url, datasets)
  return parsed !== null && tabMatchesParsedQuery(tab, parsed, workspaceDataset)
}

/** Same as `tabMatchesSavedQuery`, for callers that already parsed the saved query's URL */
export function tabMatchesParsedQuery(
  tab: VistaTab,
  parsed: ParsedQueryUrl,
  workspaceDataset: string,
): boolean {
  return (
    tab.query === parsed.query &&
    haveSameParams(tab.rawParams, parsed.rawParams) &&
    (parsed.dataset === undefined ||
      parsed.dataset === getTabDataset(tab.options, workspaceDataset)) &&
    (parsed.apiVersion === undefined ||
      parsed.apiVersion === prefixApiVersion(tab.options.apiVersion)) &&
    (parsed.perspective === undefined || parsed.perspective === tab.options.perspective)
  )
}

/** Parsed params are compared structurally, so key order and formatting do not matter */
function haveSameParams(a: string, b: string): boolean {
  const parsedA = parseParamsOrNull(a)
  const parsedB = parseParamsOrNull(b)
  if (parsedA === null || parsedB === null) {
    return a.trim() === b.trim()
  }
  return dequal(parsedA, parsedB)
}

function parseParamsOrNull(raw: string): unknown {
  try {
    return JSON5.parse(raw)
  } catch {
    return null
  }
}
