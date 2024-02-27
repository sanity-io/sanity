import {useCallback, useEffect, useMemo, useState} from 'react'
import {startWith} from 'rxjs/operators'

import {useClient} from '../../../../../hooks'
import {useCurrentUser, useKeyValueStore} from '../../../../../store'

export const RECENT_SEARCH_VERSION = 2
const STORED_SEARCHES_NAMESPACE = 'search::recent'

interface StoredSearch {
  version: number
  recentSearches: any[]
}

export function useStoredSearch(): [StoredSearch, (_value: StoredSearch) => void] {
  const keyValueStore = useKeyValueStore()
  const client = useClient({apiVersion: '2023-12-01'})
  const currentUser = useCurrentUser()
  const {dataset, projectId} = client.config()
  const userId = currentUser?.id

  const keyValueStoreKey = `${STORED_SEARCHES_NAMESPACE}__${projectId}:${dataset}:${userId}`
  const [value, setValue] = useState<StoredSearch>({
    version: RECENT_SEARCH_VERSION,
    recentSearches: [],
  })

  const settings = useMemo(() => {
    return keyValueStore.getKey(keyValueStoreKey)
  }, [keyValueStore, keyValueStoreKey])

  useEffect(() => {
    const sub = settings
      .pipe(startWith({version: RECENT_SEARCH_VERSION, recentSearches: []}))
      .subscribe({
        next: setValue as any,
      })

    return () => sub?.unsubscribe()
  }, [keyValueStoreKey, settings])

  const set = useCallback(
    (newValue: StoredSearch) => {
      setValue(newValue)
      keyValueStore.setKey(keyValueStoreKey, newValue as any)
    },
    [keyValueStore, keyValueStoreKey],
  )

  return useMemo(() => [value, set], [set, value])
}
