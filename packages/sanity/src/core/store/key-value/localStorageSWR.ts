import {isEqual} from 'lodash'
import {fromEvent, merge, NEVER} from 'rxjs'
import {distinctUntilChanged, filter, map, tap} from 'rxjs/operators'

import {localStoreStorage} from './storage/localStoreStorage'
import {type KeyValueStore, type KeyValueStoreValue} from './types'

// Whether or not to enable instant user sync between tabs
// if set to true, the setting will update instantly across all tabs
const ENABLE_CROSS_TAB_SYNC = false

/**
 * Wraps a KeyValueStore and adds Stale-While-Revalidate (SWR) behavior to it
 */
export function withLocalStorageSWR(wrappedStore: KeyValueStore): KeyValueStore {
  const storageEvent = ENABLE_CROSS_TAB_SYNC ? fromEvent<StorageEvent>(window, 'storage') : NEVER

  function getKey(key: string) {
    const lsUpdates = storageEvent.pipe(
      filter((event) => event.key === key),
      map(() => localStoreStorage.getKey(key)),
    )

    return merge(lsUpdates, wrappedStore.getKey(key)).pipe(
      distinctUntilChanged(isEqual),
      tap((value) => {
        localStoreStorage.setKey(key, value)
      }),
    )
  }
  function setKey(key: string, nextValue: KeyValueStoreValue) {
    localStoreStorage.setKey(key, nextValue)
    return wrappedStore.setKey(key, nextValue)
  }
  return {
    getKey,
    setKey,
  }
}
