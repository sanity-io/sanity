import {API_VERSIONS, VARIANTS_API_VERSION} from '../../apiVersions'
import {prefixApiVersion} from '../../util/prefixApiVersion'
import {validateApiVersion} from '../../util/validateApiVersion'

export interface ApiVersionOption {
  value: string
  /** What sets the version apart, shown next to it in the list */
  note?: 'latest' | 'variants' | 'experimental' | 'legacy'
}

const DATED = /^v\d{4}-\d{2}-\d{2}$/

/**
 * The API versions the API version field lists: the dated ones newest first, then `vX`, then
 * `v1`, which is legacy and not recommended. `extra` adds versions such as the tool's
 * configured default or the tab's own, when they are valid dated versions not listed already.
 */
export function getApiVersionOptions(extra: readonly string[] = []): ApiVersionOption[] {
  const dated = new Set<string>()
  for (const version of [...API_VERSIONS, ...extra]) {
    if (!validateApiVersion(version)) continue
    const prefixed = prefixApiVersion(version)
    if (DATED.test(prefixed)) dated.add(prefixed)
  }
  const newestFirst = [...dated].toSorted((a, b) => b.localeCompare(a))
  return [
    ...newestFirst.map((value, index): ApiVersionOption => ({
      value,
      note: index === 0 ? 'latest' : value === VARIANTS_API_VERSION ? 'variants' : undefined,
    })),
    {value: 'vX', note: 'experimental'},
    {value: 'v1', note: 'legacy'},
  ]
}
