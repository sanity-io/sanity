import {
  isSupportedPerspective,
  isVirtualPerspective,
  type SupportedPerspective,
} from '../perspectives'
import {parseApiQueryString} from './parseApiQueryString'
import {stringifyParams} from './stringifyParams'
import {validateApiVersion} from './validateApiVersion'

/**
 * The path of a query or listen URL: the API version, whole segments in between (`data`), the
 * `query` or `listen` segment and the dataset
 */
const QUERY_URL_PATHNAME = /^\/(vX|v1|v\d{4}-\d\d-\d\d)\/(?:[^/]+\/)*(?:query|listen)\/([^/]+)\/?$/

export interface ParsedQueryUrl {
  query: string
  params: Record<string, unknown>
  rawParams: string
  /** The dataset the URL names */
  dataset: string
  /**
   * Whether that dataset is one the tool knows about; a tab only pins a known one (the URL may
   * come from another project, or name a dataset the user cannot see)
   */
  isKnownDataset: boolean
  apiVersion: string | undefined
  /**
   * The perspective as the URL states it (a release stack included), if any. `previewDrafts`, the
   * API's old name for `drafts` that the classic tool saved queries with, reads as `drafts`.
   */
  urlPerspective: string | undefined
  /** Only set for perspectives the tool can represent (`raw`, `published`, `drafts`) */
  perspective: SupportedPerspective | undefined
  /** The URL carried a perspective that could not be mapped (for instance a release stack) */
  hasUnsupportedPerspective: boolean
  /** The content variant the request was sent with, if any */
  variant: string | undefined
  /** Whether the request asked for a content source map (`resultSourceMap=true`) */
  includeSourceMap: boolean
  /** The request went to the API CDN, `<project>.apicdn.sanity.io` (a custom domain cannot tell) */
  useCdn: boolean
  url: string
}

const API_CDN_HOST = /(?:^|\.)apicdn\.sanity\.(?:io|work)$/

/** `<project>.apicdn.sanity.io`, where `useCdn` sends queries */
export function isApiCdnHost(hostname: string): boolean {
  return API_CDN_HOST.test(hostname)
}

/**
 * Parses a Content Lake query (or listen) URL, as pasted from the browser's network tab, into the
 * pieces of a tab. Returns `null` when the text is not such a URL: the whole text has to be one
 * http(s) URL, since a query URL quoted inside other text is not a paste of that URL, and the
 * redesign claims a paste it parses and replaces the tab's query with it.
 */
export function parseQueryUrl(data: string, datasets: readonly string[]): ParsedQueryUrl | null {
  const trimmed = data.trim()
  const url = parseHttpUrl(trimmed)
  const match = url?.pathname.match(QUERY_URL_PATHNAME)
  if (!url || !match) {
    return null
  }

  const [, usedApiVersion, usedDataset] = match

  let parts
  try {
    parts = parseApiQueryString(url.searchParams)
  } catch {
    return null
  }
  if (!parts.query) {
    return null
  }

  const urlPerspective =
    parts.options.perspective === 'previewDrafts' ? 'drafts' : parts.options.perspective
  const perspective =
    urlPerspective &&
    isSupportedPerspective(urlPerspective) &&
    !isVirtualPerspective(urlPerspective)
      ? urlPerspective
      : undefined
  // `@sanity/client` writes the option only when it asked for a source map, as `true` or as the
  // `withKeyArraySelector` mode its stega encoding and Presentation's loaders use
  const {resultSourceMap} = parts.options
  const includeSourceMap = resultSourceMap === 'true' || resultSourceMap === 'withKeyArraySelector'

  return {
    query: parts.query,
    params: parts.params,
    rawParams: stringifyParams(parts.params),
    dataset: usedDataset,
    isKnownDataset: datasets.includes(usedDataset),
    apiVersion: validateApiVersion(usedApiVersion) ? usedApiVersion : undefined,
    urlPerspective: urlPerspective || undefined,
    perspective,
    hasUnsupportedPerspective: Boolean(urlPerspective) && perspective === undefined,
    variant: parts.options.variant || undefined,
    includeSourceMap,
    useCdn: isApiCdnHost(url.hostname),
    url: trimmed,
  }
}

function parseHttpUrl(text: string): URL | null {
  try {
    const url = new URL(text)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}
