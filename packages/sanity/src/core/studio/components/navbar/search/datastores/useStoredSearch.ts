import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, startWith} from 'rxjs/operators'

import {useClient} from '../../../../../hooks/useClient'
import {useKeyValueStore} from '../../../../../store/datastores'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'

export const RECENT_SEARCH_VERSION = 3
const STORED_SEARCHES_NAMESPACE = 'studio.search.recent'

export interface StoredSearch {
  version: number
  recentSearches: any[]
}

const defaultValue: StoredSearch = {
  version: RECENT_SEARCH_VERSION,
  recentSearches: [],
}

export function useStoredSearch(): [StoredSearch, (_value: StoredSearch) => void] {
  const keyValueStore = useKeyValueStore()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {dataset} = client.config()

  const keyValueStoreKey = useMemo(() => `${STORED_SEARCHES_NAMESPACE}.${dataset}`, [dataset])

  const value$ = useMemo(
    () =>
      keyValueStore.getKey(keyValueStoreKey).pipe(
        map((raw): StoredSearch => {
          const data = raw as StoredSearch | null
          if (!data) {
            return defaultValue
          }
          // Check if the version matches RECENT_SEARCH_VERSION
          if (data.version !== RECENT_SEARCH_VERSION) {
            // If not, return the default object and mutate the store (per original verifySearchVersionNumber logic)
            void keyValueStore.setKey(keyValueStoreKey, defaultValue as any)
            return defaultValue
          }
          // Otherwise, return the data as is
          return data
        }),
        startWith(defaultValue),
      ),
    [keyValueStore, keyValueStoreKey],
  )

  const value = useObservable(value$, defaultValue)

  const set = useCallback(
    (newValue: StoredSearch) => {
      void keyValueStore.setKey(keyValueStoreKey, newValue as any)
    },
    [keyValueStore, keyValueStoreKey],
  )

  return useMemo(() => [value, set], [set, value])
}
