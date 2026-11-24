import {API_VERSIONS, VARIANTS_API_VERSION} from '../../apiVersions'
import {prefixApiVersion} from '../../util/prefixApiVersion'
import {validateApiVersion} from '../../util/validateApiVersion'

export interface ApiVersionOption {
  value: string
  /** The list's groups: today's date, the other dated versions, `vX` and `v1` */
  group: 'today' | 'dated' | 'experimental' | 'legacy'
  /** What sets a version apart, shown under it in the list */
  note?: 'variants' | 'experimental' | 'legacy'
}

const DATED = /^v\d{4}-\d{2}-\d{2}$/

/** Today's date as an API version, `v2025-01-31` for instance */
function getTodayApiVersion(now: Date = new Date()): string {
  return `v${now.toISOString().split('T')[0]}`
}

/**
 * The API versions the API version field lists: today's date, then the other dated ones newest
 * first, then `vX`, then `v1`, which is legacy and not recommended. `extra` adds versions such
 * as the tool's configured default or the tab's own, when they are valid dated versions not
 * listed already.
 */
export function getApiVersionOptions(
  extra: readonly string[] = [],
  now: Date = new Date(),
): ApiVersionOption[] {
  const today = getTodayApiVersion(now)
  const dated = new Set<string>()
  for (const version of [...API_VERSIONS, ...extra]) {
    if (!validateApiVersion(version)) continue
    const prefixed = prefixApiVersion(version)
    if (DATED.test(prefixed) && prefixed !== today) dated.add(prefixed)
  }
  const newestFirst = [...dated].toSorted((a, b) => b.localeCompare(a))
  return [
    {value: today, group: 'today'},
    ...newestFirst.map((value): ApiVersionOption => ({
      value,
      group: 'dated',
      note: value === VARIANTS_API_VERSION ? 'variants' : undefined,
    })),
    {value: 'vX', group: 'experimental', note: 'experimental'},
    {value: 'v1', group: 'legacy', note: 'legacy'},
  ]
}
