import {isApiVersionBelow} from './compareApiVersion'
import {validateApiVersion} from './validateApiVersion'

/** The API version from which a query without a perspective reads the published perspective */
const PUBLISHED_DEFAULT_API_VERSION = 'v2025-02-19'

/**
 * The perspective the Content Lake applies to a query that sends none: `published` from API
 * version 2025-02-19, `raw` before it and on `v1`. `vX` follows the newest API, so it reads
 * `published`. Returns `undefined` for a version that does not parse, which has no default.
 *
 * @see https://www.sanity.io/docs/content-lake/perspectives
 */
export function getDefaultPerspective(apiVersion: string): 'raw' | 'published' | undefined {
  if (!validateApiVersion(apiVersion)) return undefined
  return isApiVersionBelow(apiVersion, PUBLISHED_DEFAULT_API_VERSION) ? 'raw' : 'published'
}
