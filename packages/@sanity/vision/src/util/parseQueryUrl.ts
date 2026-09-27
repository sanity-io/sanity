import {
  isSupportedPerspective,
  isVirtualPerspective,
  type SupportedPerspective,
} from '../perspectives'
import {parseApiQueryString} from './parseApiQueryString'
import {validateApiVersion} from './validateApiVersion'

/**
 * Matches Content Lake query and listen URLs on any domain (custom CDN domains included),
 * capturing the API version, the dataset and the query string. Not anchored: the classic tool's
 * paste handler has always picked the URL out of the pasted text with it. `parseQueryUrl` is
 * stricter and takes the whole text to be the URL.
 */
export const SANITY_QUERY_URL = /\/(vX|v1|v\d{4}-\d\d-\d\d)\/.*?(?:query|listen)\/(.*?)\?(.*)/

/** The path of a query or listen URL: the API version, whatever lies between, the dataset */
const QUERY_URL_PATHNAME = /^\/(vX|v1|v\d{4}-\d\d-\d\d)\/.*?(?:query|listen)\/([^/]+)\/?$/

export interface ParsedQueryUrl {
  query: string
  params: Record<string, unknown>
  rawParams: string
  /** Only set when the URL's dataset is one the tool knows about */
  dataset: string | undefined
  apiVersion: string | undefined
  /** Only set for perspectives the tool can represent (`raw`, `published`, `drafts`) */
  perspective: SupportedPerspective | undefined
  /** The URL carried a perspective that could not be mapped (for instance a release stack) */
  hasUnsupportedPerspective: boolean
  url: string
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

  const urlPerspective = parts.options.perspective
  const perspective =
    urlPerspective &&
    isSupportedPerspective(urlPerspective) &&
    !isVirtualPerspective(urlPerspective)
      ? urlPerspective
      : undefined

  return {
    query: parts.query,
    params: parts.params,
    rawParams: JSON.stringify(parts.params, null, 2),
    dataset: datasets.includes(usedDataset) ? usedDataset : undefined,
    apiVersion: validateApiVersion(usedApiVersion) ? usedApiVersion : undefined,
    perspective,
    hasUnsupportedPerspective: Boolean(urlPerspective) && perspective === undefined,
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
