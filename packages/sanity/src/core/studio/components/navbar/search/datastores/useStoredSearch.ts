import {useClient} from '../../../../../hooks/useClient'
import {useStudioPreference} from '../../../../../store/preferences/useStudioPreference'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'

/**
 * Current recent search version.
 *
 * Users with recent searches containing mismatching versions don't see them, and their next search replaces them.
 * This value should only be incremented when search filter operator `value` data types are updated,
 * ensuring that users don't have stored recent searches containing invalid operator values.
 *
 * This is a bit of a blunt instrument: in future we could look to validate individual filter values and
 * remove outdated entries individually.
 */
export const RECENT_SEARCH_VERSION = 3

export type StoredSearch = {
  version: number
  recentSearches: any[]
}

const defaultValue: StoredSearch = {
  version: RECENT_SEARCH_VERSION,
  recentSearches: [],
}

export function useStoredSearch(): [StoredSearch, (_value: StoredSearch) => void] {
  const {dataset} = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS).config()
  const {value, set} = useStudioPreference(`studio.search.recent.${dataset}`)
  const stored = value?.version === RECENT_SEARCH_VERSION ? value : defaultValue
  return [stored, set]
}
