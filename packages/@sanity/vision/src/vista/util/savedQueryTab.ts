import {type ClientPerspective} from '@sanity/client'
import {dequal} from 'dequal/lite'
import JSON5 from 'json5'

import {type QueryConfig} from '../../hooks/useSavedQueries'
import {type ParsedQueryUrl} from '../../util/parseQueryUrl'
import {type VistaTab, type VistaTabInit, type VistaTabOptions} from '../store/types'

/**
 * The fields of a tab for a parsed query URL (a saved query or a paste). A URL is the request
 * that was sent, so the tab gets the perspective it states, including none: a URL without one
 * ran on the API default, which is not what a tab on `global` would send. What the tab cannot
 * represent is left to it: a dataset the tool does not know, a perspective it cannot pick (a
 * release stack), and the variant, which a tab cannot pin (the option follows the navbar or
 * sends none). The content source map follows the URL, since a request either asked for one or
 * did not.
 */
export function parsedQueryToTabInit(parsed: ParsedQueryUrl): VistaTabInit {
  const options: Partial<VistaTabOptions> = {includeSourceMap: parsed.includeSourceMap}
  if (parsed.isKnownDataset) {
    // A URL names its dataset, so the tab stops following the workspace's
    options.datasetMode = 'pinned'
    options.dataset = parsed.dataset
  }
  if (parsed.apiVersion) {
    options.apiVersion = parsed.apiVersion
  }
  if (parsed.urlPerspective === undefined) {
    // No perspective in the URL means the request ran on the API default
    options.perspective = undefined
  } else if (parsed.perspective) {
    options.perspective = parsed.perspective === 'pinnedRelease' ? 'global' : parsed.perspective
  }

  return {query: parsed.query, rawParams: parsed.rawParams, options}
}

/** Like `parsedQueryToTabInit`, also applying the saved query's title (clearing a stale one) */
export function savedQueryToTabInit(saved: QueryConfig, parsed: ParsedQueryUrl): VistaTabInit {
  return {...parsedQueryToTabInit(parsed), title: saved.title}
}

/** The request a tab would send right now, as far as a saved URL states it (`resolveRequestOptions`) */
export interface EffectiveRequestOptions {
  dataset: string
  apiVersion: string
  perspective: ClientPerspective | undefined
  variant: string | undefined
}

/**
 * Whether a tab already shows the given saved query: the same query text and params, sent to the
 * dataset, API version, perspective and variant the saved URL states, with or without a content
 * source map as it did. A saved URL is the request the tab sent, so the tab is compared through
 * the request it would send now, not through its options: a tab on the `global` perspective
 * saved `perspective=drafts` while the navbar was on drafts, and a tab with a navbar variant
 * selected saved `vX` and `variant=…` whatever its own API version.
 */
export function tabMatchesParsedQuery(
  tab: VistaTab,
  parsed: ParsedQueryUrl,
  effective: EffectiveRequestOptions,
): boolean {
  return (
    tab.query === parsed.query &&
    haveSameParams(tab.rawParams, parsed.rawParams) &&
    parsed.dataset === effective.dataset &&
    (parsed.apiVersion === undefined || parsed.apiVersion === effective.apiVersion) &&
    parsed.urlPerspective === toUrlPerspective(effective.perspective) &&
    parsed.variant === effective.variant &&
    parsed.includeSourceMap === tab.options.includeSourceMap
  )
}

/** A perspective as `encodeQueryString` writes it into a URL: a stack becomes comma separated */
function toUrlPerspective(perspective: ClientPerspective | undefined): string | undefined {
  return perspective === undefined ? undefined : String(perspective) || undefined
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
