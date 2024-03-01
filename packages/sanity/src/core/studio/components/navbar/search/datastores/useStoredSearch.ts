import {useCallback, useEffect, useMemo, useState} from 'react'
import {map, startWith} from 'rxjs/operators'

import {useClient} from '../../../../../hooks'
import {useCurrentUser, useKeyValueStore} from '../../../../../store'

export const RECENT_SEARCH_VERSION = 2
const STORED_SEARCHES_NAMESPACE = 'search::recent'

interface StoredSearch {
  version: number
  recentSearches: any[]
}

const defaultValue: StoredSearch = {
  version: RECENT_SEARCH_VERSION,
  recentSearches: [],
}

export function useStoredSearch(): [StoredSearch, (_value: StoredSearch) => void] {
  const keyValueStore = useKeyValueStore()
  const client = useClient({apiVersion: '2023-12-01'})
  const currentUser = useCurrentUser()
  const {dataset, projectId} = client.config()

  const keyValueStoreKey = useMemo(
    () => `${STORED_SEARCHES_NAMESPACE}__${projectId}:${dataset}:${currentUser?.id}`,
    [currentUser, dataset, projectId],
  )

  const [value, setValue] = useState<StoredSearch>(defaultValue)

  const settings = useMemo(() => {
    return keyValueStore.getKey(keyValueStoreKey)
  }, [keyValueStore, keyValueStoreKey])

  useEffect(() => {
    const sub = settings
      .pipe(
        startWith(defaultValue as any),
        map((data: StoredSearch) => {
          // Check if the version matches RECENT_SEARCH_VERSION
          if (data?.version !== RECENT_SEARCH_VERSION) {
            // If not, return the default object and mutate the store (per original verifySearchVersionNumber logic)
            keyValueStore.setKey(keyValueStoreKey, defaultValue as any)
            return defaultValue
          }
          // Otherwise, return the data as is
          return data
        }),
      )
      .subscribe({
        next: setValue,
      })

    return () => sub?.unsubscribe()
  }, [settings, keyValueStore, keyValueStoreKey])

  const set = useCallback(
    (newValue: StoredSearch) => {
      setValue(newValue)
      keyValueStore.setKey(keyValueStoreKey, newValue as any)
    },
    [keyValueStore, keyValueStoreKey],
  )

  return useMemo(() => [value, set], [set, value])
}
