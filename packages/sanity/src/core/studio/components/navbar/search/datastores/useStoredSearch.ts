import {useCallback, useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'
import {merge, Subject} from 'rxjs'
import {map, startWith, tap} from 'rxjs/operators'

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
          // Reset outdated stored versions (per original verifySearchVersionNumber
          // logic) — side effect kept in `tap` so the `map` below stays pure.
          tap((raw) => {
            const data = raw as StoredSearch | null
            if (data && data.version !== RECENT_SEARCH_VERSION) {
              void keyValueStore.setKey(keyValueStoreKey, defaultValue as any)
            }
          }),
          map((raw): StoredSearch => {
            const data = raw as StoredSearch | null
            // Fall back to the default when nothing is stored or the stored
            // version is outdated
            if (!data || data.version !== RECENT_SEARCH_VERSION) {
              return defaultValue
            }
            return data
          }),
        ),
        optimisticWrites$,
      ).pipe(startWith(defaultValue)),
    [keyValueStore, keyValueStoreKey, optimisticWrites$],
  )

  // Kept synchronous: callers (recentSearches) rebuild the stored list from
  // this value before writing it back, so a stale deferred snapshot could
  // clobber a concurrent write and drop a recent search.
  const value = useSyncObservable(value$, defaultValue)

  const set = useCallback(
    (newValue: StoredSearch) => {
      optimisticWrites$.next(newValue)
      void keyValueStore.setKey(keyValueStoreKey, newValue as any)
    },
    [keyValueStore, keyValueStoreKey, optimisticWrites$],
  )

  return useMemo(() => [value, set], [set, value])
}
