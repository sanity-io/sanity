import {useClient} from '../../../../../hooks/useClient'
import {useStudioPreference} from '../../../../../store/preferences/useStudioPreference'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'

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
  // Searches stored by an older version can't be read, and the next search replaces them
  const stored = value?.version === RECENT_SEARCH_VERSION ? value : defaultValue
  return [stored, set]
}
