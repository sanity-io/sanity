import {
  isSupportedPerspective,
  isVirtualPerspective,
  type SupportedPerspective,
} from '../perspectives'
import {parseApiQueryString} from './parseApiQueryString'
import {validateApiVersion} from './validateApiVersion'

/**
 * Matches Content Lake query and listen URLs on any domain (custom CDN domains included),
 * capturing the API version, the dataset and the query string.
 */
export const SANITY_QUERY_URL = /\/(vX|v1|v\d{4}-\d\d-\d\d)\/.*?(?:query|listen)\/(.*?)\?(.*)/

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
 * pieces of a tab. Returns `null` when the text is not such a URL.
 */
export function parseQueryUrl(data: string, datasets: readonly string[]): ParsedQueryUrl | null {
  const match = data.trim().match(SANITY_QUERY_URL)
  if (!match) {
    return null
  }

  const [, usedApiVersion, usedDataset, urlQuery] = match

  let parts
  try {
    parts = parseApiQueryString(new URLSearchParams(urlQuery))
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
    url: data.trim(),
  }
}
