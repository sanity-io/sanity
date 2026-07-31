import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {merge, Subject} from 'rxjs'
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

  // Local echo of writes: the store's change events are not delivered to
  // subscribers while getKey's initial fetch is in flight, so without this
  // the UI would wait for the server round-trip (or miss the write entirely)
  // instead of updating immediately.
  const optimisticWrites$ = useMemo(() => new Subject<StoredSearch>(), [])

  const value$ = useMemo(
    () =>
      merge(
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
        ),
        optimisticWrites$,
      ).pipe(startWith(defaultValue)),
    [keyValueStore, keyValueStoreKey, optimisticWrites$],
  )

  const value = useObservable(value$, defaultValue)

  const set = useCallback(
    (newValue: StoredSearch) => {
      optimisticWrites$.next(newValue)
      void keyValueStore.setKey(keyValueStoreKey, newValue as any)
    },
    [keyValueStore, keyValueStoreKey, optimisticWrites$],
  )

  return useMemo(() => [value, set], [set, value])
}
